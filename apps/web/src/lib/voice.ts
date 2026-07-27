// Shared voice layer — TTS (text→speech) + STT (speech→text).
//
// One home for voice so every surface can reuse it: the /api/ai/voice endpoint,
// voice IN generated builds (a site/app that speaks — e.g. a run-buddy), the
// Video Studio voice-over, and (future) talking to Aria to drive the builder.
//
// Providers:
//   - openai   — tts-1 (TTS) + whisper-1 (STT). Proven; the Studio uses it.
//   - deepgram — Aura (TTS) + Nova (STT). Lower latency, the better fit for a
//                realtime back-and-forth with Aria. DEEPGRAM_API_KEY in prod.
//   - cartesia — Sonic (TTS ONLY). The provider VoiceNow/Aria moved to, so a
//                spoken reply here can match the voice customers hear on the
//                phone. Mirrors voiceNow-crm/backend/services/ttsStream.js.
//
// Cartesia needs TWO things, not one: CARTESIA_API_KEY *and* a voice — its
// voices are cloned UUIDs, not named presets, so there's no safe default to
// fall back on (a wrong id is a 400). Half-configured = treated as absent.
import OpenAI from 'openai'

export type VoiceProvider = 'openai' | 'deepgram' | 'cartesia'

// OpenAI tts-1 voices (also what the Studio voice-over exposes).
export const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
// Deepgram Aura voices (subset; en).
export const DEEPGRAM_VOICES = [
  'aura-asteria-en', 'aura-luna-en', 'aura-stella-en', 'aura-athena-en',
  'aura-hera-en', 'aura-orion-en', 'aura-arcas-en', 'aura-perseus-en',
  'aura-angus-en', 'aura-orpheus-en', 'aura-helios-en', 'aura-zeus-en',
] as const

// A Cartesia voice is a cloned-voice UUID (same shape VoiceNow matches on).
const CARTESIA_VOICE_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const cartesiaVoiceId = () => (process.env.CARTESIA_VOICE_ID || '').trim()
// Both halves required — see the header note.
const hasCartesia = () => !!process.env.CARTESIA_API_KEY && CARTESIA_VOICE_RX.test(cartesiaVoiceId())

export function voiceCapabilities() {
  const openai = !!process.env.OPENAI_API_KEY
  const deepgram = !!process.env.DEEPGRAM_API_KEY
  const cartesia = hasCartesia()
  return {
    // Cartesia is TTS-only here. Its STT (Ink) isn't wired — speech-in stays on
    // whisper/nova, which are already proven on this path.
    tts: { openai, deepgram, cartesia, available: openai || deepgram || cartesia },
    stt: { openai, deepgram, available: openai || deepgram },
    voices: { openai: OPENAI_VOICES, deepgram: DEEPGRAM_VOICES, cartesia: cartesia ? [cartesiaVoiceId()] : [] },
  }
}

// Pick a provider: honor the request if that provider is usable, else fall back
// to whatever IS configured.
//
// `kind` matters because the provider sets differ — asking for Cartesia on an
// STT call must fall through rather than 500. For TTS, Cartesia wins when it's
// fully configured: it's the voice Aria uses on the phone, so a spoken reply
// here sounds like the same product. Nothing changes until the key + voice id
// are actually set, which keeps this inert on any env that hasn't switched.
function resolveProvider(requested: VoiceProvider | undefined, kind: 'tts' | 'stt'): VoiceProvider {
  const has: Record<VoiceProvider, boolean> = {
    openai: !!process.env.OPENAI_API_KEY,
    deepgram: !!process.env.DEEPGRAM_API_KEY,
    cartesia: kind === 'tts' && hasCartesia(),
  }
  if (requested && has[requested]) return requested
  if (kind === 'tts' && has.cartesia) return 'cartesia'
  if (has.openai) return 'openai'
  if (has.deepgram) return 'deepgram'
  throw new Error(
    kind === 'tts'
      ? 'No TTS provider configured (set CARTESIA_API_KEY + CARTESIA_VOICE_ID, OPENAI_API_KEY, or DEEPGRAM_API_KEY)'
      : 'No STT provider configured (set OPENAI_API_KEY or DEEPGRAM_API_KEY)',
  )
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
  const provider = resolveProvider(opts.provider, 'tts')

  if (provider === 'cartesia') {
    // Accept a per-request voice only if it's a real Cartesia UUID; anything
    // else (e.g. a leftover 'alloy' from an OpenAI-era caller) falls back to
    // the configured voice rather than 400ing at Cartesia.
    const voice = opts.voice && CARTESIA_VOICE_RX.test(opts.voice) ? opts.voice : cartesiaVoiceId()
    const res = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.CARTESIA_API_KEY as string,
        'Cartesia-Version': process.env.CARTESIA_VERSION || '2026-03-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: process.env.CARTESIA_MODEL || 'sonic-3.5',
        transcript: text,
        voice: { mode: 'id', id: voice },
        language: 'en',
        // WAV, not the raw PCM VoiceNow uses: this audio goes straight into an
        // <audio> element, so it needs a self-describing container. Same
        // encoding/sample_rate fields as the proven phone path — only the
        // container differs.
        output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 44100 },
      }),
    })
    if (!res.ok) throw new Error(`Cartesia TTS ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return { audio: Buffer.from(await res.arrayBuffer()), contentType: 'audio/wav', provider, voice }
  }

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
  const provider = resolveProvider(opts.provider, 'stt')
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
