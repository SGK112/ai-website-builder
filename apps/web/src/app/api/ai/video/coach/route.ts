// POST /api/ai/video/coach — the "AI Director".
//
// A prompt-crafting layer that sits IN FRONT of /api/ai/video. Raw user
// prompts ("a video of a guy holding a sign") yield warped hands, garbled
// text and weird crowds because video models need cinematic, specific
// direction. This agent behaves like a film director / producer: when the
// idea is vague it asks ONE sharp question with one-tap suggestions; when it
// has enough, it writes a strong, model-tuned prompt the user can use as-is.
//
// It never generates a video and never spends video credits — it only returns
// text. The crafted prompt is handed back to the normal /api/ai/video path.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { XAI_FLAGSHIP, xaiClient } from '@/lib/xai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// One short reply + a crafted prompt + a few chips — small output, keep latency low.
const COACH_MAX_TOKENS = 800
// Don't interrogate forever; after a couple of exchanges, just write the prompt.
const MAX_TURNS = 4

interface CoachTurn { role: 'user' | 'assistant'; content: string }
interface CoachRequest {
  message?: string
  history?: CoachTurn[]
  mode?: 'text' | 'image'        // text-to-video vs animate-an-image
  model?: string                 // selected video model id (seedance, grok, …)
  modelLabel?: string
  imageCount?: number            // how many source images attached (image mode)
  style?: string
  aspectRatio?: string
  duration?: number
  theme?: string                 // the film's established look (continuity anchor)
  seriesPrompts?: string[]       // prompts of clips already on the timeline
}
interface CoachResponse {
  reply: string
  suggestions: string[]
  craftedPrompt: string | null
  ready: boolean
}

function buildSystemPrompt(ctx: CoachRequest): string {
  // Clamp interpolated fields — they're user-controlled and go into the prompt.
  const clamp = (v: string | undefined, n: number) => String(v || '').slice(0, n)
  const mode = ctx.mode === 'image' ? 'image-to-video' : 'text-to-video'
  const model = clamp(ctx.modelLabel || ctx.model, 80) || 'the selected model'
  const isGrok = (ctx.model || '').toLowerCase().includes('grok')
  const imgLine = ctx.mode === 'image'
    ? `The user has attached ${ctx.imageCount || 1} source image(s); the video must ANIMATE those image(s), not invent a new scene. Direct the camera move and the motion WITHIN the existing image (e.g. "slow push-in, hair drifting, steam rising"), and keep subjects/products consistent with what's already there.`
    : `This is text-to-video — you are describing a brand-new shot from scratch.`

  // Series continuity: when clips already exist, the new shot must live in the
  // SAME film — same world, subject, palette, lighting and film look — not a
  // disconnected scene. This is what keeps a multi-clip story coherent.
  const seriesShots = (ctx.seriesPrompts || []).filter(Boolean).slice(0, 8)
  const continuity = (ctx.theme || seriesShots.length)
    ? `

SERIES CONTINUITY — IMPORTANT
This shot is part of an existing film, not a standalone clip.${ctx.theme ? `
- Established theme / look to MATCH: "${clamp(ctx.theme, 400)}".` : ''}${seriesShots.length ? `
- Shots already in the film:
${seriesShots.map((p, i) => `   ${i + 1}. ${clamp(p, 160)}`).join('\n')}` : ''}
The new shot MUST stay in this same world: same recurring subject(s)/character(s) and their appearance, same setting/era, same color palette, same lighting and film look, same overall mood. Carry the look forward — do NOT invent an unrelated scene, restyle the world, or swap the subject. If the user's idea seems off-theme, gently steer it back so the cut stays coherent. Bake the shared look into craftedPrompt explicitly (palette, lighting, film grain, lens, etc.).`
    : ''

  return `You are the AI Director — a seasoned film director, cinematographer and video producer helping a non-expert get a great result from an AI video model. You are warm, fast and decisive, like a producer on set.

CONTEXT
- Generation mode: ${mode}.
- Target model: ${model}.${isGrok ? ' (Grok Imagine — strong with people, hands and on-screen text, and accepts multiple reference images.)' : ' (a fast diffusion video model — keep subjects simple; it struggles with complex hands, crowds and readable text.)'}
- Aspect ratio: ${clamp(ctx.aspectRatio, 20) || '16:9'}; duration: ${ctx.duration || 5}s; style: ${clamp(ctx.style, 80) || 'none specified'}.
- ${imgLine}${continuity}

YOUR JOB
Turn the user's rough idea into the STRONGEST possible video prompt using the FEWEST questions (ideally one, sometimes zero). Over-asking is failure — they want results, not a form.

HARD GATE: If the user has given fewer than TWO of {main subject & appearance, setting/location, camera movement, mood}, you MUST ask one question and return ready:false with craftedPrompt:null — do NOT craft a prompt yet. Only craft once you have enough, or once told to finalize.

WHEN THE IDEA IS VAGUE OR CONFUSING (e.g. "a guy holding a sign", "make it cool"):
- Ask ONE short, plain-English question about the single most important missing thing — usually: the main subject & what they look like, the setting, the action/motion, the camera move, or the mood. No jargon.
- ALWAYS offer 3–4 concrete one-tap suggestions that are real answers (e.g. "Slow push-in", "Wide crowd shot", "Golden-hour sunset", "Handheld documentary feel") — never "Yes/No/Not sure".
- Set ready:false and craftedPrompt:null while still gathering.

WHEN YOU HAVE ENOUGH (or after a couple of exchanges):
- Write craftedPrompt as ONE or TWO vivid sentences a video model loves, in this order: subject (with concrete appearance) → setting → action/motion → camera movement (push-in, pan, dolly, tracking, crane, static lock-off) → shot size (wide/medium/close) → lighting & mood → style/film look → pacing.
- Be specific where vagueness causes artifacts: name ONE clear primary subject, describe hands/props plainly ("both hands gripping a single sign"), avoid asking for crowds of detailed faces or lots of readable text (call distant people "softly out of focus").
- Keep it realistic for a ${ctx.duration || 5}s clip — one continuous action, not a montage.
- Set ready:true and put your final prompt in craftedPrompt. Keep "reply" to a short friendly sign-off like "Here's a director's cut of your prompt — tweak or use it."

ALWAYS respond with ONLY a JSON object, no markdown fences, shaped exactly:
{"reply": string, "suggestions": string[], "craftedPrompt": string|null, "ready": boolean}`
}

function parseJson(raw: string): Partial<CoachResponse> | null {
  let text = (raw || '').trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try { return JSON.parse(text.slice(start, end + 1)) } catch { return null }
}

async function callDirector(system: string, messages: CoachTurn[]): Promise<string> {
  // Prefer Claude (excellent at this + reliable JSON); fall back to Grok.
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: COACH_MAX_TOKENS,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    const block = res.content.find(b => b.type === 'text')
    return block && block.type === 'text' ? block.text : ''
  }
  if (process.env.XAI_API_KEY) {
    const client = xaiClient()
    const res = await client.chat.completions.create({
      model: XAI_FLAGSHIP,
      max_tokens: COACH_MAX_TOKENS,
      messages: [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))],
    })
    return res.choices[0]?.message?.content || ''
  }
  throw new Error('No AI API key configured for the director.')
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

    let body: CoachRequest
    try { body = await request.json() as CoachRequest } catch {
      return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 })
    }
    const { message, history = [] } = body
    if (!message?.trim()) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 chars).' }, { status: 400 })
    }

    const turnCount = history.filter(t => t.role === 'user').length + 1
    // Cap each prior turn's content (uncapped history × 8 turns could be MBs of
    // tokens to the LLM). The finalize nudge is APPENDED to the user message —
    // pushing a second consecutive role:'user' turn violates Anthropic's strict
    // role alternation and 400s the whole call.
    const safeHistory = history.slice(-8).map(t => ({ role: t.role, content: String(t.content || '').slice(0, 4000) }))
    const finalize = turnCount >= MAX_TURNS
      ? '\n\n(Please finalize now — write the strongest craftedPrompt you can from what we have and set ready:true.)'
      : ''
    const messages: CoachTurn[] = [
      ...safeHistory,
      { role: 'user', content: message.slice(0, 2000) + finalize },
    ]

    let parsed: Partial<CoachResponse> | null = null
    try {
      const raw = await callDirector(buildSystemPrompt(body), messages)
      parsed = parseJson(raw)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Director model call failed' }, { status: 502 })
    }
    if (!parsed) {
      return NextResponse.json({ error: 'Director returned an unreadable response' }, { status: 502 })
    }

    const ready = !!parsed.ready && !!parsed.craftedPrompt
    const response: CoachResponse = {
      reply: parsed.reply || (ready ? "Here's a director's cut of your prompt." : 'Tell me a bit more and I\'ll craft it.'),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [],
      craftedPrompt: ready ? (parsed.craftedPrompt as string) : null,
      ready,
    }
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[video coach] error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Director failed' }, { status: 500 })
  }
}
