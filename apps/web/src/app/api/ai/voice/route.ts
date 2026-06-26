// POST /api/ai/voice — the builder's shared voice endpoint.
//
//   { action: 'tts', text, voice?, provider? }
//     → audio/mpeg bytes (or { audio: <dataURI>, provider, voice } with ?json=1)
//   { action: 'stt', audio: <base64>, mimeType?, provider? }
//     → { text, provider }
//
// Foundation for: voice IN generated builds (an app that speaks — the run-buddy),
// and (future) talking to Aria to drive the builder. Providers: openai (default,
// proven) + deepgram (realtime-grade; DEEPGRAM_API_KEY in prod). See lib/voice.ts.
//
// GET /api/ai/voice → capabilities (which providers + voices are available).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { spendCredits } from '@/lib/credits'
import {
  synthesizeSpeech,
  transcribeSpeech,
  voiceCapabilities,
  type VoiceProvider,
} from '@/lib/voice'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  return NextResponse.json(voiceCapabilities())
}

export async function POST(req: NextRequest) {
  // Rate limit (shared aiGeneration bucket).
  try {
    await checkApiRateLimit(req, 'aiGeneration')
  } catch (error) {
    const limited = handleRateLimitError(error)
    if (limited) return limited
  }

  // Voice INPUT (stt) is part of the anon-first build funnel: talking to the
  // builder works exactly like typing, for signed-in AND anonymous users
  // (metered when signed in; anon is allowed — STT is cheap and the request is
  // IP-rate-limited above). Spoken-reply OUTPUT (tts) still needs an account.
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  // No-op meter for the anon path so the spend/refund flow below is uniform.
  const noMeter = { ok: true as const, charged: 0, status: 200, error: undefined as string | undefined, refund: async () => {} }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const action = body?.action
  const provider = body?.provider as VoiceProvider | undefined

  // ── TTS: text → speech ───────────────────────────────────────────────────
  if (action === 'tts') {
    if (!userId) return NextResponse.json({ error: 'Sign in to hear spoken replies.' }, { status: 401 })
    const text = String(body?.text || '').trim()
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

    // Metered like other audio generation. Quality-gated: refund if synth fails.
    const spend = await spendCredits(session, 'audio_generation')
    if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: spend.status || 402 })

    try {
      const out = await synthesizeSpeech({ text, voice: body?.voice, provider })
      // ?json=1 → base64 data URI (easy to embed in a generated app). Default →
      // raw audio bytes, usable directly as an <audio> src.
      if (req.nextUrl.searchParams.get('json') === '1') {
        return NextResponse.json({
          audio: `data:${out.contentType};base64,${out.audio.toString('base64')}`,
          provider: out.provider,
          voice: out.voice,
          creditsUsed: spend.charged,
        })
      }
      return new NextResponse(out.audio as any, {
        status: 200,
        headers: {
          'Content-Type': out.contentType,
          'Cache-Control': 'no-store',
          'X-Voice-Provider': out.provider,
          'X-Voice-Name': out.voice,
        },
      })
    } catch (e: any) {
      await spend.refund()
      console.error('[voice] tts failed:', e?.message || e)
      return NextResponse.json({ error: e?.message || 'Speech synthesis failed' }, { status: 502 })
    }
  }

  // ── STT: speech → text ───────────────────────────────────────────────────
  if (action === 'stt') {
    const b64 = String(body?.audio || '')
    if (!b64) return NextResponse.json({ error: 'audio (base64) is required' }, { status: 400 })
    // Strip a data: URI prefix if the client sent one.
    const comma = b64.indexOf(',')
    const raw = b64.startsWith('data:') && comma !== -1 ? b64.slice(comma + 1) : b64
    let audio: Buffer
    try { audio = Buffer.from(raw, 'base64') } catch { return NextResponse.json({ error: 'audio must be base64' }, { status: 400 }) }
    if (!audio.length) return NextResponse.json({ error: 'audio is empty' }, { status: 400 })

    // Transcription is cheap — metered at chat_message rate when signed in;
    // anonymous voice input is allowed (the build funnel meters at generate).
    const spend = userId ? await spendCredits(session, 'chat_message') : noMeter
    if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: spend.status || 402 })

    try {
      const out = await transcribeSpeech({ audio, mimeType: body?.mimeType, provider })
      return NextResponse.json({ text: out.text, provider: out.provider, creditsUsed: spend.charged })
    } catch (e: any) {
      await spend.refund()
      console.error('[voice] stt failed:', e?.message || e)
      return NextResponse.json({ error: e?.message || 'Transcription failed' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: "action must be 'tts' or 'stt'" }, { status: 400 })
}
