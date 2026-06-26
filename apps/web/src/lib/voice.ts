// Shared voice layer — TTS (text→speech) + STT (speech→text).
//
// One home for voice so every surface can reuse it: the /api/ai/voice endpoint,
// voice IN generated builds (a site/app that speaks — e.g. a run-buddy), the
// Video Studio voice-over, and (future) talking to Aria to drive the builder.
//
// Two providers, both live in prod:
//   - openai   — tts-1 (TTS) + whisper-1 (STT). Proven; the Studio uses it.
//   - deepgram — Aura (TTS) + Nova (STT). Lower latency, the better fit for a
//                realtime back-and-forth with Aria. DEEPGRAM_API_KEY in prod.
import OpenAI from 'openai'

export type VoiceProvider = 'openai' | 'deepgram'

// OpenAI tts-1 voices (also what the Studio voice-over exposes).
export const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
// Deepgram Aura voices (subset; en).
export const DEEPGRAM_VOICES = [
  'aura-asteria-en', 'aura-luna-en', 'aura-stella-en', 'aura-athena-en',
  'aura-hera-en', 'aura-orion-en', 'aura-arcas-en', 'aura-perseus-en',
  'aura-angus-en', 'aura-orpheus-en', 'aura-helios-en', 'aura-zeus-en',
] as const

export function voiceCapabilities() {
  const openai = !!process.env.OPENAI_API_KEY
  const deepgram = !!process.env.DEEPGRAM_API_KEY
  return {
    tts: { openai, deepgram, available: openai || deepgram },
    stt: { openai, deepgram, available: openai || deepgram },
    voices: { openai: OPENAI_VOICES, deepgram: DEEPGRAM_VOICES },
  }
}

// Pick a provider: honor the requested one if its key is set, else fall back to
// whatever IS configured (prefer the requested family's sibling, then openai).
function resolveProvider(requested: VoiceProvider | undefined): VoiceProvider {
  const has = { openai: !!process.env.OPENAI_API_KEY, deepgram: !!process.env.DEEPGRAM_API_KEY }
  if (requested && has[requested]) return requested
  if (has.openai) return 'openai'
  if (has.deepgram) return 'deepgram'
  throw new Error('No voice provider configured (set OPENAI_API_KEY or DEEPGRAM_API_KEY)')
}

export interface SpeechResult { audio: Buffer; contentType: string; provider: VoiceProvider; voice: string }

// text → spoken audio (mp3). Throws on provider/network error.
export async function synthesizeSpeech(opts: {
  text: string
  voice?: string
  provider?: VoiceProvider
}): Promise<SpeechResult> {
  const text = (opts.text || '').trim()
  if (!text) throw new Error('text is required')
  if (text.length > 5000) throw new Error('text too long (max 5000 chars)')
  const provider = resolveProvider(opts.provider)

  if (provider === 'deepgram') {
    const voice = (opts.voice && (DEEPGRAM_VOICES as readonly string[]).includes(opts.voice))
      ? opts.voice : 'aura-asteria-en'
    const res = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}&encoding=mp3`, {
      method: 'POST',
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`Deepgram TTS ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return { audio: Buffer.from(await res.arrayBuffer()), contentType: 'audio/mpeg', provider, voice }
  }

  // openai
  const voice = (opts.voice && (OPENAI_VOICES as readonly string[]).includes(opts.voice)) ? opts.voice : 'alloy'
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const speech = await openai.audio.speech.create({ model: 'tts-1', voice: voice as any, input: text })
  return { audio: Buffer.from(await speech.arrayBuffer()), contentType: 'audio/mpeg', provider, voice }
}

export interface TranscriptResult { text: string; provider: VoiceProvider }

// spoken audio → text. Throws on provider/network error.
export async function transcribeSpeech(opts: {
  audio: Buffer
  mimeType?: string
  provider?: VoiceProvider
}): Promise<TranscriptResult> {
  if (!opts.audio?.length) throw new Error('audio is required')
  const provider = resolveProvider(opts.provider)
  const mimeType = opts.mimeType || 'audio/webm'

  if (provider === 'deepgram') {
    const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': mimeType },
      body: new Uint8Array(opts.audio),
    })
    if (!res.ok) throw new Error(`Deepgram STT ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data: any = await res.json()
    const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
    return { text, provider }
  }

  // openai whisper — it infers the format from the FILENAME extension, so a
  // wrong ext = "could not decode" / 400. iOS Safari's MediaRecorder emits
  // audio/mp4; mapping that to 'webm' (the old fallback) silently broke voice on
  // every iPhone. Map each real container to its own ext.
  const m = mimeType.toLowerCase()
  const ext =
    m.includes('wav') ? 'wav'
    : m.includes('mp3') || m.includes('mpeg') ? 'mp3'
    : m.includes('m4a') || m.includes('x-m4a') ? 'm4a'
    : m.includes('mp4') ? 'mp4'   // iOS Safari
    : m.includes('ogg') ? 'ogg'
    : m.includes('flac') ? 'flac'
    : 'webm'                       // Chrome/Firefox default
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(opts.audio)], { type: mimeType }), `audio.${ext}`)
  form.append('model', 'whisper-1')
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  })
  if (!res.ok) throw new Error(`OpenAI STT ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data: any = await res.json()
  return { text: data?.text ?? '', provider }
}
