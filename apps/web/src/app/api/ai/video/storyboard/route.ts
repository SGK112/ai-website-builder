// POST /api/ai/video/storyboard — drafts a themed multi-shot storyboard.
//
// Given a topic/goal (e.g. "a 15s social ad for Webstew, an AI website
// builder"), returns N short, cinematic shot prompts that share one visual
// theme so the generated clips cut together as one coherent video. Text only —
// generation + stitching happen client-side.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { XAI_FLAGSHIP, xaiClient } from '@/lib/xai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface StoryboardRequest {
  topic?: string
  shots?: number          // desired clip count (clamped 2–6)
  durationPerShot?: number
}
interface StoryboardResponse {
  title: string
  theme: string           // one-line shared look/style applied to every shot
  shots: string[]         // per-clip prompts
}

function systemPrompt(shots: number, dur: number): string {
  return `You are a commercial director storyboarding a short AI-generated video (e.g. a social/Google ad, product teaser, or tutorial intro). Output is a sequence of ${shots} clips, each ~${dur}s, that will be generated separately and then stitched into ONE continuous video — so they MUST share one consistent visual theme (same style, palette, lighting, subject) and flow shot-to-shot like a real ad.

Write ${shots} shot prompts. Each prompt: ONE clear subject + setting + a single continuous action + camera move (push-in, pan, tracking, static) + shot size, in the SAME look across all shots. Keep distant people/text soft to avoid artifacts. Open with a hook, build, end on the payoff/CTA moment. Vivid but concrete — no abstract fluff.

Respond with ONLY a JSON object, no markdown fences:
{"title": string, "theme": string, "shots": string[]}  // shots.length === ${shots}`
}

function parseJson(raw: string): Partial<StoryboardResponse> | null {
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
      model: 'claude-sonnet-4-6', max_tokens: 1200, system,
      messages: [{ role: 'user', content: user }],
    })
    const b = res.content.find(x => x.type === 'text')
    return b && b.type === 'text' ? b.text : ''
  }
  if (process.env.XAI_API_KEY) {
    const res = await xaiClient().chat.completions.create({
      model: XAI_FLAGSHIP, max_tokens: 1200,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    })
    return res.choices[0]?.message?.content || ''
  }
  throw new Error('No AI API key configured for storyboarding.')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required', requireAuth: true }, { status: 401 })
    }
    try {
      checkApiRateLimit(request, 'aiGeneration')
    } catch (error) {
      const limited = handleRateLimitError(error)
      if (limited) return limited
      throw error
    }

    let body: StoryboardRequest
    try { body = await request.json() as StoryboardRequest } catch {
      return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 })
    }
    if (!body.topic?.trim()) return NextResponse.json({ error: 'topic required' }, { status: 400 })

    const shots = Math.max(2, Math.min(6, Math.floor(body.shots || 3)))
    const dur = Math.max(3, Math.min(8, Math.floor(body.durationPerShot || 5)))

    let parsed: Partial<StoryboardResponse> | null = null
    try {
      parsed = parseJson(await callModel(systemPrompt(shots, dur), `Topic: ${body.topic.trim()}`))
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Storyboard model call failed' }, { status: 502 })
    }
    if (!parsed || !Array.isArray(parsed.shots) || parsed.shots.length === 0) {
      return NextResponse.json({ error: 'Storyboard returned an unreadable response' }, { status: 502 })
    }

    const response: StoryboardResponse = {
      title: parsed.title || 'Untitled storyboard',
      theme: parsed.theme || '',
      shots: parsed.shots.slice(0, shots).map(s => String(s)),
    }
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[storyboard] error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Storyboard failed' }, { status: 500 })
  }
}
