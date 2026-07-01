// POST /api/ai/video/orchestrate — the "AI Director": turns the user's existing
// timeline + a one-line ORDER into a full production PLAN. It sequences the
// clips they already have, decides where B-roll helps (animate an existing
// still, or a new text-to-video bridge shot), writes a voiceover, and picks a
// music mood + TTS voice. Text/planning only — the client executes the plan
// (generates the B-roll, arranges the timeline, sets script/voice/music) and
// then renders, reusing the existing machinery. This is the "give the chef an
// order, she cooks" endpoint.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { XAI_FLAGSHIP, xaiClient } from '@/lib/xai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MOODS = ['Cinematic', 'Ambient', 'Upbeat', 'Dramatic', 'Corporate', 'Lo-fi']
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

interface ClipIn { id: string; prompt?: string; kind?: 'image' | 'video'; hasUrl?: boolean }
interface OrchestrateRequest {
  order?: string            // the one-line brief ("make a 30s upbeat product ad")
  clips?: ClipIn[]          // the timeline the user already has
  aspectRatio?: string
}
// A step in the final cut. Either reuse an existing clip, animate an existing
// still into B-roll, or generate a new text-to-video bridge shot.
type Step =
  | { use: string }
  | { broll: 'from-still'; ref: string; prompt: string }
  | { broll: 'text'; prompt: string; seconds?: number }
interface Overlay { text: string; position?: 'top' | 'center' | 'bottom'; size?: 'small' | 'medium' | 'large'; box?: boolean }
interface Plan {
  title: string
  theme: string
  musicMood: string
  voice: string
  look: string
  script: string
  steps: Step[]
  overlays: Overlay[]
}
const LOOKS = ['none', 'cinematic', 'vibrant', 'warm', 'cool', 'noir', 'vintage', 'dramatic']
const POSITIONS = ['top', 'center', 'bottom']
const SIZES = ['small', 'medium', 'large']

function systemPrompt(ids: string[], stillIds: string[]): string {
  return `You are a commercial video DIRECTOR assembling a finished cut from clips the user ALREADY has on their timeline, plus their one-line order. Your job: sequence those clips into a coherent ad/short, decide where B-roll improves the flow, write a voiceover, and choose the soundtrack mood + narrator voice.

The user's existing clips are referenced by these ids: ${ids.length ? ids.join(', ') : '(none — build entirely from B-roll)'}.
Of those, these are STILL IMAGES you may animate into motion B-roll: ${stillIds.length ? stillIds.join(', ') : '(none)'}.

Output a PLAN as ordered "steps". Each step is exactly one of:
- {"use":"<id>"}  — place an existing clip (use its id from the list above).
- {"broll":"from-still","ref":"<stillId>","prompt":"<motion prompt>"}  — animate one of the still images into a short motion clip (keeps the real content, adds life). Use a still's id from the stills list.
- {"broll":"text","prompt":"<shot prompt>","seconds":4}  — a NEW generated bridge/establishing shot to connect or open/close the cut.

Rules:
- Include EVERY existing clip at least once, in a sensible order (hook → build → payoff). You may interleave B-roll between them.
- Be economical with B-roll (each is a real, paid generation): at most ${Math.max(2, ids.length)} B-roll steps total. Prefer "from-still" (reuses the user's real content) over "text" when stills exist.
- Bridge/B-roll prompts MUST match the established look so they cut together (same palette, lighting, lens, mood).
- Write a voiceover "script" timed to roughly the whole cut — punchy, ad-style, no stage directions.
- "theme": one line describing the shared look. "musicMood": one of [${MOODS.join(', ')}]. "voice": one of [${VOICES.join(', ')}]. "look": a color grade — one of [${LOOKS.join(', ')}] that fits the vibe (e.g. cinematic for a premium ad, vibrant for social, noir for moody).
- "overlays": on-screen TEXT to burn in — ONLY when the order calls for it (a title card, a brand name, or CONTACT INFO like phone/website/address for an ad). Each: {"text": string, "position": "top"|"center"|"bottom", "size": "small"|"medium"|"large", "box": boolean}. A brand/title card → position "center", size "large", box false. Contact info → position "bottom", size "small", box true. Empty array [] when no on-screen text is wanted. Never invent contact details the user didn't give.

Respond with ONLY a JSON object, no markdown fences:
{"title":string,"theme":string,"musicMood":string,"voice":string,"look":string,"script":string,"steps":Step[],"overlays":Overlay[]}`
}

function parseJson(raw: string): any | null {
  let t = (raw || '').trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s === -1 || e === -1 || e < s) return null
  try { return JSON.parse(t.slice(s, e + 1)) } catch { return null }
}

async function callModel(system: string, user: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 2000, system,
      messages: [{ role: 'user', content: user }],
    })
    const b = res.content.find(x => x.type === 'text')
    return b && b.type === 'text' ? b.text : ''
  }
  if (process.env.XAI_API_KEY) {
    const res = await xaiClient().chat.completions.create({
      model: XAI_FLAGSHIP, max_tokens: 2000,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    })
    return res.choices[0]?.message?.content || ''
  }
  throw new Error('No AI API key configured for the director.')
}

// Keep only well-formed steps that reference real clip ids — the model can
// hallucinate an id or a malformed step, and a bad ref would silently drop
// content on the client. Bridge ("text") steps need no ref.
function sanitizeSteps(raw: any, validIds: Set<string>, stillIds: Set<string>): Step[] {
  if (!Array.isArray(raw)) return []
  const out: Step[] = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    if (typeof s.use === 'string' && validIds.has(s.use)) {
      out.push({ use: s.use })
    } else if (s.broll === 'from-still' && typeof s.ref === 'string' && stillIds.has(s.ref) && typeof s.prompt === 'string' && s.prompt.trim()) {
      out.push({ broll: 'from-still', ref: s.ref, prompt: s.prompt.trim().slice(0, 500) })
    } else if (s.broll === 'text' && typeof s.prompt === 'string' && s.prompt.trim()) {
      const secs = Math.max(2, Math.min(8, Math.floor(Number(s.seconds) || 4)))
      out.push({ broll: 'text', prompt: s.prompt.trim().slice(0, 500), seconds: secs })
    }
  }
  return out
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

    let body: OrchestrateRequest
    try { body = await request.json() as OrchestrateRequest } catch {
      return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 })
    }
    const order = (body.order || '').trim()
    if (!order) return NextResponse.json({ error: 'An order/brief is required (e.g. "make a 30s upbeat product ad").' }, { status: 400 })
    if (order.length > 1000) return NextResponse.json({ error: 'Order too long (max 1000 chars).' }, { status: 400 })

    const clips = Array.isArray(body.clips) ? body.clips.slice(0, 40) : []
    const ids = clips.filter(c => c?.id && c.hasUrl).map(c => String(c.id))
    const stillIds = clips.filter(c => c?.id && c.hasUrl && c.kind === 'image').map(c => String(c.id))
    const validIds = new Set(ids)
    const stillSet = new Set(stillIds)

    const userMsg = [
      `ORDER: ${order}`,
      `ASPECT: ${body.aspectRatio || '16:9'}`,
      'TIMELINE CLIPS:',
      ...(clips.length
        ? clips.filter(c => c?.id && c.hasUrl).map(c => `- id=${c.id} kind=${c.kind || 'video'} :: ${(c.prompt || 'clip').slice(0, 160)}`)
        : ['(none — generate the whole thing as B-roll from the order)']),
    ].join('\n')

    let parsed: any = null
    try {
      parsed = parseJson(await callModel(systemPrompt(ids, stillIds), userMsg))
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Director model call failed' }, { status: 502 })
    }
    if (!parsed) return NextResponse.json({ error: 'The director returned an unreadable response.' }, { status: 502 })

    const steps = sanitizeSteps(parsed.steps, validIds, stillSet)
    if (steps.length === 0) {
      return NextResponse.json({ error: 'The director could not build a usable plan from these clips.' }, { status: 502 })
    }
    // Safety: ensure every existing clip appears at least once (the model is told
    // to, but enforce it so nothing the user added gets silently dropped).
    const used = new Set(steps.filter((s): s is { use: string } => 'use' in s).map(s => s.use))
    for (const id of ids) if (!used.has(id)) steps.push({ use: id })

    const plan: Plan = {
      title: String(parsed.title || 'Untitled cut').slice(0, 120),
      theme: String(parsed.theme || '').slice(0, 400),
      musicMood: MOODS.includes(parsed.musicMood) ? parsed.musicMood : 'Upbeat',
      voice: VOICES.includes(parsed.voice) ? parsed.voice : 'onyx',
      look: LOOKS.includes(parsed.look) ? parsed.look : 'none',
      script: String(parsed.script || '').slice(0, 2000),
      steps,
      overlays: (Array.isArray(parsed.overlays) ? parsed.overlays : [])
        .filter((o: any) => o && typeof o.text === 'string' && o.text.trim())
        .slice(0, 4)
        .map((o: any) => ({
          text: String(o.text).trim().slice(0, 200),
          position: POSITIONS.includes(o.position) ? o.position : 'bottom',
          size: SIZES.includes(o.size) ? o.size : 'medium',
          box: !!o.box,
        })),
    }
    return NextResponse.json(plan)
  } catch (error: any) {
    console.error('[orchestrate] error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Director failed' }, { status: 500 })
  }
}
