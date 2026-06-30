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
}
interface DirectorChatResponse {
  reply: string
  assemble: boolean
  order: string | null
}

function systemPrompt(clipLines: string[]): string {
  return `You are a friendly, decisive video DIRECTOR — the "chef" of a video studio. The user TALKS to you (their messages may be voice transcripts) about the short video they want to make from the clips already on their timeline. Keep replies SHORT and warm — one or two sentences, like a real conversation, no lists or stage directions.

Their timeline clips:
${clipLines.length ? clipLines.join('\n') : '(none yet — encourage them to add a clip or two first)'}

Your job each turn:
- If you have a clear sense of what they want (a vibe + rough length, or they say "make it"/"go"/"assemble"/"do it"/"build it"/"that's it"), set "assemble": true and write a single clear "order" line capturing the brief (e.g. "A punchy 20s upbeat product ad from these clips, with a quick voiceover."). Default to assembling rather than over-asking — one good clarifying question max across the whole chat.
- Otherwise set "assemble": false, "order": null, and reply conversationally — react to what they said, optionally ask ONE quick question (length? mood? for social or a website?).
- Never invent clips that aren't on the timeline. If the timeline is empty, don't assemble — tell them to add a clip first.

Respond with ONLY a JSON object, no markdown fences:
{"reply": string, "assemble": boolean, "order": string|null}`
}

function parseJson(raw: string): Partial<DirectorChatResponse> | null {
  let t = (raw || '').trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s === -1 || e === -1 || e < s) return null
  try { return JSON.parse(t.slice(s, e + 1)) } catch { return null }
}

async function callModel(system: string, turns: Turn[]): Promise<string> {
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

    const history = Array.isArray(body.history) ? body.history.slice(-10).filter(t => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string') : []
    const turns: Turn[] = [...history, { role: 'user', content: message }]

    let parsed: Partial<DirectorChatResponse> | null = null
    try {
      parsed = parseJson(await callModel(systemPrompt(clipLines), turns))
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Director model call failed' }, { status: 502 })
    }
    if (!parsed || typeof parsed.reply !== 'string') {
      return NextResponse.json({ error: 'The director returned an unreadable response.' }, { status: 502 })
    }

    // Never assemble with an empty timeline, regardless of what the model said.
    const assemble = !!parsed.assemble && hasClips && !!(parsed.order && parsed.order.trim())
    const response: DirectorChatResponse = {
      reply: parsed.reply.slice(0, 1000),
      assemble,
      order: assemble ? String(parsed.order).trim().slice(0, 500) : null,
    }
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[director-chat] error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Director chat failed' }, { status: 500 })
  }
}
