'use client'

// Realtime voice for the Video Studio CHEF — the SAME OpenAI Realtime (WebRTC)
// experience as the workspace voice, but pointed at the video-director tools.
// Deliberately a separate hook from the workspace's useRealtimeVoice so this can
// NEVER affect that (well-loved) build voice. Token comes from
// /api/ai/voice/realtime-token with { mode: 'video' } → a video-director session
// with generate_clips / assemble_cut / render_film tools. Audio never touches
// our server (browser ↔ OpenAI directly via an ephemeral token).

import { useCallback, useRef, useState } from 'react'

export type DirectorVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'
export interface VoiceTurn { id: number; role: 'user' | 'assistant'; text: string }

export function useDirectorVoice(opts: {
  onGenerate: (shots: string[]) => void
  onAssemble: (order: string) => void
  onRender: () => void
  getStatus: () => string          // live status the model can check ("2 clips, staged", etc.)
}) {
  const [status, setStatus] = useState<DirectorVoiceStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<VoiceTurn[]>([])
  const turnIdRef = useRef(0)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const greetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep callbacks fresh without re-creating start/stop.
  const cb = useRef(opts); cb.current = opts

  const addTurn = useCallback((role: 'user' | 'assistant', raw: unknown) => {
    const text = String(raw || '').trim()
    if (!text) return
    setTranscript(prev => {
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.text === text) return prev
      return [...prev, { id: turnIdRef.current++, role, text }]
    })
  }, [])

  const send = (obj: unknown) => {
    const dc = dcRef.current
    if (dc && dc.readyState === 'open') dc.send(JSON.stringify(obj))
  }

  const stop = useCallback(() => {
    if (greetTimerRef.current) { clearTimeout(greetTimerRef.current); greetTimerRef.current = null }
    try { dcRef.current?.close() } catch { /* noop */ }
    try { pcRef.current?.getSenders().forEach(s => s.track?.stop()) } catch { /* noop */ }
    try { pcRef.current?.close() } catch { /* noop */ }
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch { /* noop */ }
    if (audioRef.current) { try { audioRef.current.srcObject = null } catch { /* noop */ } }
    pcRef.current = null; dcRef.current = null; streamRef.current = null
    setStatus('idle')
  }, [])

  const ackTool = (callId: string, statusMsg: string) => {
    send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify({ status: statusMsg }) } })
    send({ type: 'response.create' })
  }

  const handleEvent = useCallback((msg: any) => {
    switch (msg?.type) {
      case 'input_audio_buffer.speech_started': setStatus('listening'); break
      case 'output_audio_buffer.started':
      case 'response.output_audio.delta': setStatus('speaking'); break
      case 'output_audio_buffer.stopped':
      case 'response.done': setStatus(s => (s === 'speaking' ? 'listening' : s)); break
      case 'conversation.item.input_audio_transcription.completed':
        if (msg.transcript) addTurn('user', msg.transcript); break
      case 'response.audio_transcript.done':
      case 'response.output_audio_transcript.done':
        if (msg.transcript) addTurn('assistant', msg.transcript); break
      case 'response.function_call_arguments.done': {
        try {
          const name = msg.name
          const args = JSON.parse(msg.arguments || '{}')
          if (name === 'generate_clips') {
            const shots = Array.isArray(args?.shots) ? args.shots.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 4) : []
            if (shots.length) { try { cb.current.onGenerate(shots) } catch (e) { console.error('[dirvoice] onGenerate', e) } }
            ackTool(msg.call_id, shots.length ? `generating ${shots.length} shot(s) now — they appear on the timeline` : 'no valid shots given')
          } else if (name === 'assemble_cut') {
            const order = String(args?.order || '').trim().slice(0, 500)
            if (order) { try { cb.current.onAssemble(order) } catch (e) { console.error('[dirvoice] onAssemble', e) } }
            ackTool(msg.call_id, order ? 'assembling the cut now — sequencing, B-roll, voiceover, music' : 'need a brief to assemble')
          } else if (name === 'render_film') {
            try { cb.current.onRender() } catch (e) { console.error('[dirvoice] onRender', e) }
            ackTool(msg.call_id, 'rendering the final film now — it saves to your creations when done')
          }
        } catch (e) { console.error('[dirvoice] tool parse failed', e) }
        break
      }
      case 'error': setError(msg.error?.message || 'Voice error'); break
    }
  }, [addTurn])

  const start = useCallback(async () => {
    if (status === 'connecting' || status === 'listening' || status === 'speaking') return
    setError(null); setStatus('connecting'); setTranscript([])
    try {
      const r = await fetch('/api/ai/voice/realtime-token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'video' }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data?.token) { setStatus('error'); setError(data?.error || 'Could not start voice.'); return }
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('error')
        setError(typeof window !== 'undefined' && !window.isSecureContext ? 'Voice needs a secure (https) connection.' : 'Voice input isn’t supported on this browser.')
        return
      }
      // Anti-room-noise capture, same shape as the builder chef: acquire
      // permissively, then tune. The Studio is used with music and other
      // people around, so AGC off matters here too.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      // Tune AFTER acquisition, never as a constraint: Safari rejects
      // channelCount (and is unreliable on autoGainControl) rather than
      // treating them as advisory, which would fail the whole getUserMedia
      // call and take voice out entirely on iPhone.
      for (const track of stream.getAudioTracks()) {
        try {
          await track.applyConstraints({ autoGainControl: false, channelCount: 1 })
        } catch {
          try { await track.applyConstraints({ autoGainControl: false }) } catch { /* keep the mic */ }
        }
      }

      streamRef.current = stream
      const pc = new RTCPeerConnection()
      pcRef.current = pc
      let audio = audioRef.current
      if (!audio) { audio = new Audio(); audio.autoplay = true; audioRef.current = audio }
      pc.ontrack = (e) => { if (audioRef.current) { audioRef.current.srcObject = e.streams[0]; audioRef.current.play().catch(() => {}) } }
      const track = stream.getAudioTracks()[0]
      if (track) pc.addTrack(track, stream)
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc) return
        const st = pc.connectionState
        if (st === 'failed') { stop(); setStatus('error'); setError('Voice connection dropped — tap to reconnect.') }
        else if (st === 'connected') audioRef.current?.play().catch(() => {})
      }
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc
      dc.onopen = () => {
        setStatus('listening')
        greetTimerRef.current = setTimeout(() => {
          send({ type: 'response.create', response: { instructions: 'Greet the user warmly and ask what video they want to make — one short sentence, with a light cooking touch. Under 16 words.' } })
        }, 250)
      }
      dc.onmessage = (e) => { try { handleEvent(JSON.parse(e.data)) } catch (err) { console.error('[dirvoice] parse', err) } }
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      const sdpRes = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(data.model || 'gpt-realtime')}`, {
        method: 'POST', body: offer.sdp, headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/sdp' },
      })
      if (!sdpRes.ok) { stop(); setStatus('error'); setError('Voice connection failed. Try again.'); return }
      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (e: any) {
      const name = e?.name || ''
      stop(); setStatus('error')
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'Microphone blocked — allow mic access, then try again.'
        : name === 'NotFoundError' ? 'No microphone found on this device.' : 'Couldn’t start voice. Try again.')
    }
  }, [status, handleEvent, stop])

  const active = status === 'listening' || status === 'speaking' || status === 'connecting'
  const toggle = useCallback(() => { if (active) stop(); else void start() }, [active, start, stop])

  return { status, error, transcript, active, start, stop, toggle }
}
