// Voice for "the chef" — the build assistant. Talk to the builder and hear it
// answer. Wraps /api/ai/voice (STT + TTS): hold-to-talk records the mic →
// transcribes → you send it as a normal chat message; when speak-replies is on,
// the chef's answers are read aloud in the user-picked voice.
//
// Self-contained + fail-soft: every path swallows errors so a denied mic or a
// provider blip can never crash the workspace.
import { useState, useRef, useCallback, useEffect } from 'react'

export interface VoiceOption {
  id: string
  label: string
  provider: 'openai' | 'deepgram'
}

// Curated, friendly-labeled subset of what /api/ai/voice exposes. Deepgram
// (Aura) first when available — lower latency, more natural for back-and-forth.
const DEEPGRAM_VOICES: VoiceOption[] = [
  { id: 'aura-asteria-en', label: 'Asteria — warm, friendly', provider: 'deepgram' },
  { id: 'aura-luna-en', label: 'Luna — soft, calm', provider: 'deepgram' },
  { id: 'aura-stella-en', label: 'Stella — bright, upbeat', provider: 'deepgram' },
  { id: 'aura-athena-en', label: 'Athena — measured', provider: 'deepgram' },
  { id: 'aura-orion-en', label: 'Orion — deep', provider: 'deepgram' },
  { id: 'aura-zeus-en', label: 'Zeus — bold', provider: 'deepgram' },
]
const OPENAI_VOICES: VoiceOption[] = [
  { id: 'nova', label: 'Nova — warm', provider: 'openai' },
  { id: 'shimmer', label: 'Shimmer — bright', provider: 'openai' },
  { id: 'alloy', label: 'Alloy — neutral', provider: 'openai' },
  { id: 'echo', label: 'Echo — calm', provider: 'openai' },
  { id: 'onyx', label: 'Onyx — deep', provider: 'openai' },
  { id: 'fable', label: 'Fable — storyteller', provider: 'openai' },
]

const VOICE_ID_KEY = 'webstew-chef-voice'
const VOICE_ON_KEY = 'webstew-chef-voice-on'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(String(r.result || ''))
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export function useVoiceChat() {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [voiceId, setVoiceId] = useState('')
  const [speakReplies, setSpeakReplies] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [available, setAvailable] = useState(false)

  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Discover which providers are live, build the voice menu, restore prefs.
  useEffect(() => {
    let alive = true
    fetch('/api/ai/voice')
      .then((r) => r.json())
      .then((caps) => {
        if (!alive) return
        const opts: VoiceOption[] = []
        if (caps?.tts?.deepgram) opts.push(...DEEPGRAM_VOICES)
        if (caps?.tts?.openai) opts.push(...OPENAI_VOICES)
        setVoices(opts)
        setAvailable(opts.length > 0 && !!(caps?.stt?.available))
        let saved = ''
        try { saved = localStorage.getItem(VOICE_ID_KEY) || '' } catch {}
        setVoiceId(opts.some((o) => o.id === saved) ? saved : opts[0]?.id || '')
        try { setSpeakReplies(localStorage.getItem(VOICE_ON_KEY) === '1') } catch {}
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const providerFor = useCallback(
    (id: string) => voices.find((v) => v.id === id)?.provider,
    [voices],
  )

  const selectVoice = useCallback((id: string) => {
    setVoiceId(id)
    try { localStorage.setItem(VOICE_ID_KEY, id) } catch {}
  }, [])

  const toggleSpeakReplies = useCallback(() => {
    setSpeakReplies((on) => {
      const next = !on
      try { localStorage.setItem(VOICE_ON_KEY, next ? '1' : '0') } catch {}
      if (!next && audioRef.current) { try { audioRef.current.pause() } catch {} }
      return next
    })
  }, [])

  // Speak text aloud in the picked voice. Strips markdown/code so the chef
  // doesn't read backticks and asterisks. No-op if no voice/text.
  const speak = useCallback(async (text: string) => {
    const clean = (text || '')
      .replace(/```[\s\S]*?```/g, ' (code) ')
      .replace(/[#*_`>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!clean || !voiceId) return
    try {
      if (audioRef.current) { try { audioRef.current.pause() } catch {} }
      setIsSpeaking(true)
      const res = await fetch('/api/ai/voice?json=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tts', text: clean.slice(0, 1500), voice: voiceId, provider: providerFor(voiceId) }),
      })
      if (!res.ok) { setIsSpeaking(false); return }
      const data = await res.json()
      if (!data?.audio) { setIsSpeaking(false); return }
      const a = new Audio(data.audio)
      audioRef.current = a
      a.onended = () => setIsSpeaking(false)
      a.onerror = () => setIsSpeaking(false)
      await a.play()
    } catch (e) {
      console.error('[voice] speak failed:', e)
      setIsSpeaking(false)
    }
  }, [voiceId, providerFor])

  // Returns {ok,error}. Previously this swallowed every failure silently, so a
  // blocked mic / insecure origin / unsupported browser looked like "the mic
  // button does nothing" — the #1 mobile complaint. The caller surfaces `error`.
  const startListening = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return {
          ok: false,
          error: (typeof window !== 'undefined' && !window.isSecureContext)
            ? 'Microphone needs a secure (https) connection — open the site over https, not a local IP.'
            : 'Voice input isn’t supported on this browser.',
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // No explicit mimeType: iOS Safari rejects audio/webm and picks audio/mp4
      // itself; we read mr.mimeType back when building the blob (see stopListening).
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.start()
      recRef.current = mr
      setIsListening(true)
      return { ok: true }
    } catch (e: any) {
      setIsListening(false)
      const name = e?.name || ''
      const error =
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone blocked — allow mic access for this site in your browser settings, then try again.'
          : name === 'NotFoundError'
            ? 'No microphone found on this device.'
            : 'Couldn’t start the microphone. Try again.'
      return { ok: false, error }
    }
  }, [])

  // Stop recording and resolve the transcript ('' on any failure).
  const stopListening = useCallback(async (): Promise<string> => {
    const mr = recRef.current
    recRef.current = null
    if (!mr) { setIsListening(false); return '' }
    setIsListening(false)
    const blob: Blob = await new Promise((resolve) => {
      mr.onstop = () => resolve(new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' }))
      try { mr.stop(); mr.stream.getTracks().forEach((t) => t.stop()) } catch { resolve(new Blob()) }
    })
    if (!blob.size) return ''
    try {
      const dataUri = await blobToBase64(blob)
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stt', audio: dataUri, mimeType: blob.type, provider: providerFor(voiceId) }),
      })
      if (!res.ok) return ''
      const data = await res.json()
      return String(data?.text || '').trim()
    } catch {
      return ''
    }
  }, [voiceId, providerFor])

  return {
    available,
    voices,
    voiceId,
    selectVoice,
    speakReplies,
    toggleSpeakReplies,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
  }
}
