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

export function useRealtimeVoice(opts: {
  onBuild: (prompt: string, mode: 'build' | 'edit', title?: string) => 'started' | 'queued'
  // Live status the model can CHECK (so it never guesses "still cooking" /
  // "done"). e.g. "still building", "finished — on screen", "no site yet".
  getStatus: () => string
  // Generate a short video from a spoken description (Grok Imagine). Fire-and-
  // forget — the video overlay shows progress + result; the chef just kicks it off.
  onVideo: (prompt: string) => void
}) {
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
    setTranscript((prev) => {
      // De-dupe: the GA API can emit two transcript-done events for one turn.
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.text === text) return prev
      return [...prev, { id: turnIdRef.current++, role, text }]
    })
  }, [])

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const greetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Grace timer for a 'disconnected' ICE state (which often self-heals) before
  // we declare the link dead.
  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onBuildRef = useRef(opts.onBuild)
  onBuildRef.current = opts.onBuild
  const getStatusRef = useRef(opts.getStatus)
  getStatusRef.current = opts.getStatus
  const onVideoRef = useRef(opts.onVideo)
  onVideoRef.current = opts.onVideo

  const send = (obj: unknown) => {
    const dc = dcRef.current
    if (dc && dc.readyState === 'open') dc.send(JSON.stringify(obj))
  }

  const stop = useCallback(() => {
    if (greetTimerRef.current) { clearTimeout(greetTimerRef.current); greetTimerRef.current = null }
    if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null }
    try { dcRef.current?.close() } catch {}
    try { pcRef.current?.getSenders().forEach((s) => s.track?.stop()) } catch {}
    try { pcRef.current?.close() } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
    if (audioRef.current) { try { audioRef.current.srcObject = null } catch {} }
    pcRef.current = null; dcRef.current = null; streamRef.current = null
    setStatus('idle'); setUserText(''); setAssistantText(''); setTranscript([])
  }, [])

  // Tell the model (mid-conversation) that the build/edit just landed, so it can
  // truthfully say it's ready and offer changes — instead of claiming "done"
  // the instant the tool was called (it ran ~30-60s ago, async).
  const notifyComplete = useCallback(() => {
    send({
      type: 'response.create',
      response: { instructions: 'The site just finished and is on screen now. In ONE short sentence, tell the user it’s ready and ask if they’d like any changes.' },
    })
  }, [])

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
          // Status check — answer from the LIVE workspace, never from memory.
          if (msg.name === 'check_status') {
            const statusText = (() => { try { return getStatusRef.current() } catch { return 'unknown' } })()
            send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: msg.call_id, output: JSON.stringify({ status: statusText }) } })
            send({ type: 'response.create' })
            break
          }
          const args = JSON.parse(msg.arguments || '{}')
          // Video generation — kick off the async clip and ack immediately.
          if (msg.name === 'make_video') {
            const desc = String(args?.description ?? args?.prompt ?? '').trim()
            if (desc.length >= 3 && desc.length <= 500) {
              try { onVideoRef.current(desc) } catch (e) { console.error('[realtime] onVideo failed', e) }
              send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: msg.call_id, output: JSON.stringify({ status: 'making the video now — it appears on screen in ~30 seconds' }) } })
              send({ type: 'response.create' })
            }
            break
          }
          // build_site uses `prompt`, edit_site uses `change` — accept either.
          const prompt = String(args?.prompt ?? args?.change ?? '').trim()
          // Validate before kicking off a real build: must be a non-trivial,
          // bounded string (guards against malformed/empty/runaway tool calls).
          const isBuild = msg.name === 'build_site'
          const isEdit = msg.name === 'edit_site'
          if ((isBuild || isEdit) && prompt.length >= 3 && prompt.length <= 4000) {
            // The page either starts it now or queues it behind an in-flight
            // build. Ack the ACTUAL outcome so the chef doesn't claim it's done
            // when it was queued (or dropped).
            const title = isBuild ? String(args?.title ?? '').trim().slice(0, 60) || undefined : undefined
            const outcome = onBuildRef.current(prompt, isEdit ? 'edit' : 'build', title)
            const statusMsg = outcome === 'queued'
              ? 'queued — finishing the current change first, then this one. Tell the user you’ll do it right after.'
              : (isEdit ? 'editing now' : 'building now')
            send({
              type: 'conversation.item.create',
              item: { type: 'function_call_output', call_id: msg.call_id, output: JSON.stringify({ status: statusMsg }) },
            })
            send({ type: 'response.create' })
          } else if (isBuild || isEdit) {
            console.warn('[realtime] tool ignored — invalid prompt', { name: msg.name, len: prompt.length })
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

      // The WebRTC link can silently die — a network change, the phone sleeping,
      // or a long session drifting until OpenAI drops it. Audio just goes quiet
      // while the orb still looks live ("I lost audio, not sure what I did").
      // Watch the connection: surface a clean "reconnect" prompt on a real drop
      // so a FRESH session restores audio (and clears any gradual degradation a
      // very long session accumulates). 'disconnected' often self-heals, so give
      // it a grace window; 'failed' is terminal.
      const declareDropped = () => {
        if (pcRef.current !== pc) return
        stop()
        setStatus('error')
        setError('Voice connection dropped — tap the mic to reconnect.')
      }
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc) return
        const st = pc.connectionState
        if (st === 'failed') { declareDropped() }
        else if (st === 'disconnected') {
          if (!dropTimerRef.current) dropTimerRef.current = setTimeout(() => {
            dropTimerRef.current = null
            if (pcRef.current === pc && pc.connectionState !== 'connected') declareDropped()
          }, 6000)
        } else if (st === 'connected') {
          if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null }
          // Re-nudge playback — iOS can suspend the audio element across a blip.
          audioRef.current?.play().catch(() => {})
        }
      }

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc
      dc.onopen = () => {
        setStatus('listening')
        // Intro: the builder greets FIRST and opens the consultation, so it's a
        // conversation from the start instead of dead air. Small delay so the
        // session is fully settled before we ask for a response (firing on the
        // same tick can be dropped). The consultative behaviour itself lives in
        // the session instructions on the token route.
        greetTimerRef.current = setTimeout(() => {
          send({
            type: 'response.create',
            response: {
              instructions:
                "Greet the user and welcome them to Webstew, then ask what they want to build — with a light, clever cooking/stew touch (Webstew 'cooks up' sites). ONE short, warm sentence, under 18 words. E.g. \"Hey, welcome to Webstew — what should we cook up today?\" Don't list features.",
            },
          })
        }, 250)
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
      if (!sdpRes.ok) { stop(); setStatus('error'); setError('Voice connection failed. Try again.'); return }
      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      // status flips to 'listening' when the data channel opens
    } catch (e: any) {
      const name = e?.name || ''
      // Tear down FIRST, then set the error — stop() resets status to 'idle',
      // so doing it last would clobber 'error' and leave a dead, message-less orb.
      stop()
      setStatus('error')
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone blocked — allow mic access for this site, then try again.'
          : name === 'NotFoundError'
            ? 'No microphone found on this device.'
            : 'Couldn’t start voice. Try again.',
      )
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
    notifyComplete,
    isActive: status === 'connecting' || status === 'listening' || status === 'speaking',
  }
}
