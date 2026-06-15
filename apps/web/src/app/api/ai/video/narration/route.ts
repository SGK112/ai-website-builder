// POST /api/ai/video/narration — narration scriptwriter + text-to-speech.
//
// mode 'write': takes the user's rough notes + the storyboard context and crafts
//   a polished, paced voiceover script (returns JSON { script }).
// mode 'speak': turns a finalized script into spoken audio via OpenAI TTS
//   (returns audio/mpeg bytes; the client muxes it over the stitched video).
//
// Narration is text-to-SPEECH. OpenAI TTS is used because OPENAI_API_KEY is
// already configured; Deepgram Aura could be swapped in later behind a key.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { XAI_FLAGSHIP, xaiClient } from '@/lib/xai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
type Voice = typeof VOICES[number]

// Natural ad voiceover lands around ~2.4 words/second.
const WORDS_PER_SEC = 2.4

interface NarrationRequest {
  mode?: 'write' | 'speak'
  text?: string            // write: the user's rough notes
  topic?: string           // write: storyboard topic for context
  totalSeconds?: number    // write: length to pace the script to
  tone?: string            // write: optional tone hint (energetic, calm, …)
  script?: string          // speak: the finalized script
  voice?: string           // speak: voice id
}

function writeSystemPrompt(words: number, secs: number, tone?: string): string {
  return `You are an award-winning advertising copywriter writing VOICEOVER narration for a short AI-generated video. The voiceover is spoken aloud over the footage, so write for the EAR, not the page: short punchy sentences, natural rhythm, a strong hook, and a clear closing call-to-action.

Hard constraints:
- The video is about ${secs} seconds long, so the script MUST be ~${words} words (a hair under is better than over). Spoken pace is ~${WORDS_PER_SEC} words/sec.
- Plain spoken language. No stage directions, no "[music]", no speaker labels, no markdown — ONLY the words to be spoken.
- ${tone ? `Tone: ${tone}.` : 'Match the energy of the topic.'}

Respond with ONLY a JSON object, no fences: {"script": string}`
}

function parseJson(raw: string): { script?: string } | null {
  let t = (raw || '').trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s === -1 || e === -1 || e < s) return null
  try { return JSON.parse(t.slice(s, e + 1)) } catch { return null }
}

async function callWriter(system: string, user: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 700, system, messages: [{ role: 'user', content: user }] })
    const b = res.content.find(x => x.type === 'text')
    return b && b.type === 'text' ? b.text : ''
  }
  if (process.env.XAI_API_KEY) {
    const res = await xaiClient().chat.completions.create({ model: XAI_FLAGSHIP, max_tokens: 700, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
    return res.choices[0]?.message?.content || ''
  }
  throw new Error('No AI API key configured for the scriptwriter.')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required', requireAuth: true }, { status: 401 })
    }
    try {
      await checkApiRateLimit(request, 'aiGeneration')
    } catch (error) {
      const limited = handleRateLimitError(error)
      if (limited) return limited
      throw error
    }

    let body: NarrationRequest
    try { body = await request.json() as NarrationRequest } catch {
      return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 })
    }

    // ── Scriptwriter ──
    if (body.mode !== 'speak') {
      // Cap inputs forwarded to the LLM (write mode has no script cap otherwise).
      if ((body.topic || '').length > 500) return NextResponse.json({ error: 'Topic too long (max 500 chars).' }, { status: 400 })
      if ((body.text || '').length > 4000) return NextResponse.json({ error: 'Notes too long (max 4000 chars).' }, { status: 400 })
      const secs = Math.max(3, Math.min(60, Math.floor(body.totalSeconds || 15)))
      const words = Math.round(secs * WORDS_PER_SEC)
      const user = [
        body.topic ? `Video topic: ${body.topic}` : '',
        body.text?.trim() ? `The user's rough notes / what they want said:\n${body.text.trim()}` : 'The user gave no notes — write a strong script from the topic alone.',
      ].filter(Boolean).join('\n\n')
      let parsed: { script?: string } | null = null
      try {
        parsed = parseJson(await callWriter(writeSystemPrompt(words, secs, body.tone), user))
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Scriptwriter call failed' }, { status: 502 })
      }
      if (!parsed?.script?.trim()) {
        return NextResponse.json({ error: 'Scriptwriter returned an unreadable response' }, { status: 502 })
      }
      const script = parsed.script.trim()
      const wordCount = script.split(/\s+/).filter(Boolean).length
      return NextResponse.json({ script, words: wordCount, estimatedSeconds: Math.round(wordCount / WORDS_PER_SEC) })
    }

    // ── Text-to-speech ──
    const script = (body.script || '').trim()
    if (!script) return NextResponse.json({ error: 'script required' }, { status: 400 })
    if (script.length > 4000) return NextResponse.json({ error: 'Script too long (max ~4000 chars).' }, { status: 400 })
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Voice narration is not available on this instance — OPENAI_API_KEY is not configured.', reason: 'tts_unconfigured' }, { status: 503 })
    }
    const voice: Voice = (VOICES as readonly string[]).includes(body.voice || '') ? (body.voice as Voice) : 'onyx'
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const speech = await openai.audio.speech.create({ model: 'tts-1', voice, input: script })
    const buf = Buffer.from(await speech.arrayBuffer())
    return new NextResponse(buf, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  } catch (error: any) {
    console.error('[narration] error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Narration failed' }, { status: 500 })
  }
}
