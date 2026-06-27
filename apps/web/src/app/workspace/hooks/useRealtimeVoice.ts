'use client'

// Real-time, full-duplex voice for the builder — talk and it builds. Adapted
// from remodely.ai's streaming voice (PCM duplex) but using OpenAI Realtime
// over WebRTC: the browser connects DIRECTLY to OpenAI with a short-lived
// ephemeral token (minted by /api/ai/voice/realtime-token), so audio never
// touches our server and the real key never leaves it. When the user describes
// a site, the model calls the `build_site` tool → we run the normal build.

import { useCallback, useRef, useState } from 'react'

export type RealtimeStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'
export interface VoiceTurn { id: number; role: 'user' | 'assistant'; text: string }

export function useRealtimeVoice(opts: { onBuild: (prompt: string) => void }) {
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [userText, setUserText] = useState('')
  const [assistantText, setAssistantText] = useState('')
  // Full conversation thread (not just the latest line) so the orb reads like a
  // real back-and-forth, the way Aria's does.
  const [transcript, setTranscript] = useState<VoiceTurn[]>([])
  const turnIdRef = useRef(0)
  const addTurn = useCallback((role: 'user' | 'assistant', raw: unknown) => {
    const text = String(raw || '').trim()
    if (!text) return
    setTranscript((prev) => [...prev, { id: turnIdRef.current++, role, text }])
  }, [])

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onBuildRef = useRef(opts.onBuild)
  onBuildRef.current = opts.onBuild

  const stop = useCallback(() => {
    try { dcRef.current?.close() } catch {}
    try { pcRef.current?.getSenders().forEach((s) => s.track?.stop()) } catch {}
    try { pcRef.current?.close() } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
    if (audioRef.current) { try { audioRef.current.srcObject = null } catch {} }
    pcRef.current = null; dcRef.current = null; streamRef.current = null
    setStatus('idle'); setUserText(''); setAssistantText(''); setTranscript([])
  }, [])

  const send = (obj: unknown) => {
    const dc = dcRef.current
    if (dc && dc.readyState === 'open') dc.send(JSON.stringify(obj))
  }

  const handleEvent = useCallback((msg: any) => {
    switch (msg?.type) {
      case 'input_audio_buffer.speech_started':
        setStatus('listening'); break
      case 'output_audio_buffer.started':
      case 'response.output_audio.delta':
        setStatus('speaking'); break
      case 'output_audio_buffer.stopped':
      case 'response.done':
        setStatus((s) => (s === 'speaking' ? 'listening' : s)); break
      case 'conversation.item.input_audio_transcription.completed':
        if (msg.transcript) { setUserText(String(msg.transcript)); addTurn('user', msg.transcript) }
        break
      case 'response.audio_transcript.done':
      case 'response.output_audio_transcript.done':
        if (msg.transcript) { setAssistantText(String(msg.transcript)); addTurn('assistant', msg.transcript) }
        break
      case 'response.function_call_arguments.done': {
        try {
          const args = JSON.parse(msg.arguments || '{}')
          const prompt = typeof args?.prompt === 'string' ? args.prompt.trim() : ''
          // Validate before kicking off a real build: must be a non-trivial,
          // bounded string (guards against malformed/empty/runaway tool calls).
          if (msg.name === 'build_site' && prompt.length >= 3 && prompt.length <= 4000) {
            onBuildRef.current(prompt)
            // Tell the model the build started so it can speak a confirmation.
            send({
              type: 'conversation.item.create',
              item: { type: 'function_call_output', call_id: msg.call_id, output: JSON.stringify({ status: 'building' }) },
            })
            send({ type: 'response.create' })
          } else if (msg.name === 'build_site') {
            console.warn('[realtime] build_site ignored — invalid prompt', { len: prompt.length })
          }
        } catch (e) {
          console.error('[realtime] build_site args parse failed:', e, msg?.arguments)
        }
        break
      }
      case 'error':
        setError(msg.error?.message || 'Voice error'); break
    }
  }, [addTurn])

  const start = useCallback(async () => {
    if (status === 'connecting' || status === 'listening' || status === 'speaking') return
    setError(null); setStatus('connecting')
    try {
      // 1) ephemeral token (server-side; real key stays on the server)
      const r = await fetch('/api/ai/voice/realtime-token', { method: 'POST' })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data?.token) {
        setStatus('error'); setError(data?.error || 'Could not start voice.'); return
      }
      // 2) mic
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('error')
        setError(typeof window !== 'undefined' && !window.isSecureContext
          ? 'Voice needs a secure (https) connection.'
          : 'Voice input isn’t supported on this browser.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream

      // 3) peer connection + remote audio playback
      const pc = new RTCPeerConnection()
      pcRef.current = pc
      let audio = audioRef.current
      if (!audio) { audio = new Audio(); audio.autoplay = true; audioRef.current = audio }
      pc.ontrack = (e) => {
        if (!audioRef.current) return
        audioRef.current.srcObject = e.streams[0]
        // iOS Safari can ignore autoplay; nudge it (the open was a user gesture).
        audioRef.current.play().catch(() => {})
      }
      const track = stream.getAudioTracks()[0]
      if (track) pc.addTrack(track, stream)

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc
      dc.onopen = () => {
        setStatus('listening')
        // Intro: the builder greets FIRST and opens the consultation, so it's a
        // conversation from the start instead of dead air. Small delay so the
        // session is fully settled before we ask for a response (firing on the
        // same tick can be dropped). The consultative behaviour itself lives in
        // the session instructions on the token route.
        setTimeout(() => {
          send({
            type: 'response.create',
            response: {
              instructions: "Greet the user warmly in ONE short sentence, then ask what they'd like to build today. Under 18 words. Don't list features.",
            },
          })
        }, 350)
      }
      dc.onmessage = (e) => {
        try { handleEvent(JSON.parse(e.data)) }
        catch (err) { console.error('[realtime] event parse failed:', err) }
      }

      // 4) SDP offer → OpenAI GA realtime WebRTC endpoint
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(data.model || 'gpt-realtime')}`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/sdp' },
        },
      )
      if (!sdpRes.ok) { setStatus('error'); setError('Voice connection failed. Try again.'); stop(); return }
      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      // status flips to 'listening' when the data channel opens
    } catch (e: any) {
      const name = e?.name || ''
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone blocked — allow mic access for this site, then try again.'
          : name === 'NotFoundError'
            ? 'No microphone found on this device.'
            : 'Couldn’t start voice. Try again.',
      )
      setStatus('error'); stop()
    }
  }, [status, handleEvent, stop])

  return {
    status,
    error,
    userText,
    assistantText,
    transcript,
    start,
    stop,
    isActive: status === 'connecting' || status === 'listening' || status === 'speaking',
  }
}
