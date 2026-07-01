// POST /api/ai/video/director-chat — the Studio's conversational voice CHEF.
//
// A back-and-forth director you talk to (voice or text) about the cut you want
// from the clips on your timeline. It chats, asks at most a quick question, and
// when you signal you're ready ("make it", "go", "assemble it") it returns
// assemble:true plus a one-line ORDER — which the client feeds straight into the
// orchestrator (/api/ai/video/orchestrate) to build the whole production. This
// is the same brain as the workspace chef, but here it can put it all together.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { XAI_FLAGSHIP, xaiClient } from '@/lib/xai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface Turn { role: 'user' | 'assistant'; content: string }
interface ClipIn { id: string; prompt?: string; kind?: 'image' | 'video'; hasUrl?: boolean }
interface DirectorChatRequest {
  message?: string
  history?: Turn[]
  clips?: ClipIn[]
  mediaUrls?: string[]   // image URLs on the timeline — the chef can SEE these
}
interface DirectorChatResponse {
  reply: string
  action: 'none' | 'generate' | 'assemble' | 'render'
  shots: string[]        // for 'generate' — 1..4 vivid text-to-video shot prompts
  order: string | null   // for 'assemble' — the one-line brief
}

function systemPrompt(clipLines: string[], hasVision: boolean): string {
  return `You are the CHEF — a friendly video director and creative PARTNER who both game-plans WITH the user and drives the studio for them. They TALK to you (messages may be voice transcripts). Keep replies SHORT and warm — one or two conversational sentences. No lists or stage directions in the reply.

You COLLABORATE like a good creative director: when they ask "what can we do with these?", "help me organize these for a documentary", "how would you set this up?", or "make an ad from these" — react to their ACTUAL material, suggest a concrete direction (order, pacing, vibe, what overlays/contact info to add), and offer to run with it. Advise first when they're exploring; act when they're ready.
${hasVision ? 'You can SEE the photos/clips they have on the timeline (attached as images) — describe what you actually see and tailor your advice to it (subjects, mood, quality, best order).' : ''}

Their timeline right now:
${clipLines.length ? clipLines.join('\n') : '(empty — nothing generated yet)'}

Each turn, choose EXACTLY ONE action:
- "generate": they want footage that doesn't exist yet (timeline empty, or they ask for more/different shots). Put 1–4 vivid shot prompts in "shots" (each: subject + setting + one motion + camera move + look; consistent style). Never more than 4 at once — each is a real paid render.
- "assemble": there ARE clips and they're ready (they say make it/go/put it together, or you've agreed on a direction). Put the brief in "order" (e.g. "A punchy 20s upbeat product ad from these clips with a quick voiceover.").
- "render": the cut is already assembled/staged and they want the final file (render/export/finish/done).
- "none": you're advising, game-planning, or asking ONE quick question — the collaborative part.

Rules: never "assemble" or "render" an empty timeline — "generate" first. When they're clearly exploring ("what can we do…", "how would you…"), use "none" and give real, specific creative direction. When they're ready, DO it. Don't over-ask; don't repeat a big generate they already have.

Respond with ONLY a JSON object, no markdown fences:
{"reply": string, "action": "none"|"generate"|"assemble"|"render", "shots": string[], "order": string|null}`
}

function parseJson(raw: string): Partial<DirectorChatResponse> | null {
  let t = (raw || '').trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s === -1 || e === -1 || e < s) return null
  try { return JSON.parse(t.slice(s, e + 1)) } catch { return null }
}

async function callModel(system: string, turns: Turn[], imageUrls: string[]): Promise<string> {
  // With images, use Grok (multimodal, OpenAI-compatible image_url) so the chef
  // can actually SEE the user's photos/clips and advise on them. The images
  // ride on the latest user turn.
  if (imageUrls.length && process.env.XAI_API_KEY) {
    const msgs: any[] = turns.map(m => ({ role: m.role, content: m.content }))
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        msgs[i] = {
          role: 'user',
          content: [
            { type: 'text', text: String(msgs[i].content || '') },
            ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } })),
          ],
        }
        break
      }
    }
    const res = await xaiClient().chat.completions.create({
      model: XAI_FLAGSHIP, max_tokens: 700,
      messages: [{ role: 'system', content: system }, ...msgs],
    } as any)
    return res.choices[0]?.message?.content || ''
  }
  // Text-only: Claude primary (best at this), Grok fallback.
  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 600, system,
      messages: turns.map(m => ({ role: m.role, content: m.content })),
    })
    const b = res.content.find(x => x.type === 'text')
    return b && b.type === 'text' ? b.text : ''
  }
  if (process.env.XAI_API_KEY) {
    const res = await xaiClient().chat.completions.create({
      model: XAI_FLAGSHIP, max_tokens: 600,
      messages: [{ role: 'system', content: system }, ...turns.map(m => ({ role: m.role, content: m.content }))],
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

    let body: DirectorChatRequest
    try { body = await request.json() as DirectorChatRequest } catch {
      return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 })
    }
    const message = (body.message || '').trim()
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })
    if (message.length > 2000) return NextResponse.json({ error: 'Message too long.' }, { status: 400 })

    const clips = Array.isArray(body.clips) ? body.clips.filter(c => c?.id && c.hasUrl).slice(0, 40) : []
    const clipLines = clips.map(c => `- ${c.kind || 'video'} :: ${(c.prompt || 'clip').slice(0, 120)}`)
    const hasClips = clips.length > 0

    // Images the chef can actually see (capped so the vision call stays cheap/fast).
    const mediaUrls = (Array.isArray(body.mediaUrls) ? body.mediaUrls : [])
      .filter(u => typeof u === 'string' && /^https:\/\//.test(u))
      .slice(0, 6)

    const history = Array.isArray(body.history) ? body.history.slice(-10).filter(t => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string') : []
    const turns: Turn[] = [...history, { role: 'user', content: message }]

    let parsed: Partial<DirectorChatResponse> | null = null
    try {
      parsed = parseJson(await callModel(systemPrompt(clipLines, mediaUrls.length > 0), turns, mediaUrls))
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Director model call failed' }, { status: 502 })
    }
    if (!parsed || typeof parsed.reply !== 'string') {
      return NextResponse.json({ error: 'The director returned an unreadable response.' }, { status: 502 })
    }

    // Validate the action. assemble/render require clips; generate caps at 4.
    let action: DirectorChatResponse['action'] = ['none', 'generate', 'assemble', 'render'].includes(parsed.action as string) ? parsed.action as DirectorChatResponse['action'] : 'none'
    const shots = Array.isArray(parsed.shots) ? parsed.shots.filter(s => typeof s === 'string' && s.trim()).map(s => String(s).trim().slice(0, 500)).slice(0, 4) : []
    const order = parsed.order && String(parsed.order).trim() ? String(parsed.order).trim().slice(0, 500) : null

    if (action === 'generate' && shots.length === 0) action = 'none'
    if ((action === 'assemble' || action === 'render') && !hasClips) action = 'none'
    if (action === 'assemble' && !order) action = 'none'

    const response: DirectorChatResponse = {
      reply: parsed.reply.slice(0, 1000),
      action,
      shots: action === 'generate' ? shots : [],
      order: action === 'assemble' ? order : null,
    }
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[director-chat] error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Director chat failed' }, { status: 500 })
  }
}
