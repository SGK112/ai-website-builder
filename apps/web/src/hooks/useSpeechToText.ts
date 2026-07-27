'use client'

// Mic → text, the simple way: record with MediaRecorder, POST the audio to the
// shared voice endpoint (/api/ai/voice, action 'stt'), hand back the transcript.
// Self-contained and reusable — the Studio's AI Director uses it so you can
// SPEAK your order instead of typing. (The workspace chef has its own realtime
// WebRTC path; this is the lightweight push-to-talk version.)

import { useCallback, useRef, useState } from 'react'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(String(r.result)) // data: URI — the server strips the prefix
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export function useSpeechToText(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  // Keep the latest callback without re-creating start/stop each render.
  const cbRef = useRef(onResult)
  cbRef.current = onResult

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window !== 'undefined' && 'MediaRecorder' in window

  const stop = useCallback(() => {
    try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop() } catch { /* noop */ }
    setListening(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    if (!(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia)) {
      setError('Microphone not available in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // `audio: true` takes the UA defaults, which on most stacks means auto
        // gain ON — it lifts room noise in the gaps and lands as transcribed
        // junk. Ask for the same clean capture the realtime chef uses.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false, channelCount: 1 },
      })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        if (!blob.size) return
        setTranscribing(true)
        try {
          const audio = await blobToDataUrl(blob)
          const res = await fetch('/api/ai/voice', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stt', audio, mimeType: blob.type }),
          })
          const data = await res.json().catch(() => ({} as any))
          if (!res.ok) throw new Error(data.error || 'Transcription failed')
          const text = String(data.text || '').trim()
          if (text) cbRef.current(text)
          else setError('Didn\'t catch that — try again.')
        } catch (e: any) {
          setError(e?.message || 'Transcription failed')
        } finally {
          setTranscribing(false)
        }
      }
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch (e: any) {
      setError(e?.name === 'NotAllowedError' ? 'Microphone permission denied.' : (e?.message || 'Could not start the mic.'))
      setListening(false)
    }
  }, [])

  const toggle = useCallback(() => { if (listening) stop(); else void start() }, [listening, start, stop])

  return { listening, transcribing, error, supported, toggle, start, stop }
}
