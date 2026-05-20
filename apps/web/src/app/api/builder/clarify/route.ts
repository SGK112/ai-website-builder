// POST /api/builder/clarify — the Stew Planner brain.
//
// A lightweight clarifying agent. Given the conversation so far + a partial
// StewPlan, it decides whether to ask one more short question or declare it
// has enough to build, and returns an updated plan patch. Non-streaming:
// each turn is a single question (~a few hundred tokens), fast enough that
// SSE buys nothing.
//
// This route never generates a site and never deducts generation credits —
// the assembled prompt is handed back to the existing /api/builder/generate
// path, which does the metering. Rate-limited to curb abuse.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import type { ClarifyRequest, ClarifyResponse, StewPlan } from '@/lib/types/stew-planner'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// One question per turn, a small plan patch, a couple of quick replies — this
// is tiny output. Cap low so latency stays well under proxy timeouts.
const CLARIFY_MAX_TOKENS = 700

// After this many turns, stop interviewing and build with what we have — a
// planner that won't converge is worse than a slightly-thin prompt.
const MAX_PLANNER_TURNS = 4

const SYSTEM_PROMPT = `You are the Stew Planner — a warm, fast site-planning assistant for Webstew, an AI website builder. A "stew" is a finished build prompt.

Your job: ask SHORT, friendly questions, ONE at a time (two only if closely related), to fill these 5 slots:
  1. audience — who visits this site and what they want
  2. pages — which pages/sections to build
  3. visualStyle — reference brands, color mood, dark vs light
  4. contentMode — does the user have real copy/images, or should we use professional AI placeholders?
  5. integrations — payments, maps, booking, forms, analytics?

Rules:
- Ask the MOST IMPORTANT missing slot first. Be conversational, never a form.
- Infer aggressively from what the user already said — don't ask what you can reasonably assume; just record it in updatedPlan.
- Keep each question to one or two sentences. No preamble.
- Offer 2–3 concrete one-tap suggestedReplies for every question.
- When all 5 slots are reasonably filled, OR turnCount >= ${MAX_PLANNER_TURNS}, set done:true and write assembledPrompt: a single rich paragraph the builder will use directly (business, audience, pages, sections, visual style + colors, content mode, integrations, tone).
- Track completeness 0–100 in updatedPlan; reach >=70 before done unless you hit the turn cap.

ALWAYS respond with ONLY a JSON object, no markdown fences, shaped exactly:
{"question": string|null, "updatedPlan": object, "done": boolean, "assembledPrompt": string|null, "suggestedReplies": string[]}`

// Strip markdown fences / prose and parse the first JSON object found.
function parseClarifyJson(raw: string): Partial<ClarifyResponse> | null {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

async function callModel(
  messages: { role: 'user' | 'assistant'; content: string }[],
  model: string,
  apiKey?: string,
): Promise<string> {
  const lc = (model || '').toLowerCase()
  const isOpenAI = lc.startsWith('gpt') || lc.startsWith('o1') || lc.startsWith('o3')

  // The planner needs reliable JSON. OpenAI when explicitly selected (and a
  // key is available); Anthropic Haiku otherwise — fast, cheap, dependable.
  if (isOpenAI) {
    const openaiKey = apiKey || process.env.OPENAI_API_KEY
    if (openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey })
      const res = await client.chat.completions.create({
        model: lc.includes('mini') ? 'gpt-4o-mini' : 'gpt-4o',
        max_tokens: CLARIFY_MAX_TOKENS,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
      })
      return res.choices[0]?.message?.content || ''
    }
  }

  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('No AI API key configured')
  const claudeModel = lc.includes('opus')
    ? 'claude-opus-4-7'
    : lc.includes('sonnet')
      ? 'claude-sonnet-4-6'
      : 'claude-haiku-4-5-20251001'
  const client = new Anthropic({ apiKey: anthropicKey })
  const res = await client.messages.create({
    model: claudeModel,
    max_tokens: CLARIFY_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })
  const textBlock = res.content.find(b => b.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : ''
}

// Last-resort assembler — used if the model declares done without writing an
// assembledPrompt, so the build never dead-ends on a missing string.
function fallbackAssemble(plan: Partial<StewPlan>, firstMessage: string): string {
  const parts: string[] = []
  parts.push(
    plan.businessName
      ? `Build a website for ${plan.businessName}${plan.industry ? ` (${plan.industry})` : ''}.`
      : `Build a website. ${firstMessage}`.trim(),
  )
  if (plan.audience) parts.push(`Target audience: ${plan.audience}.`)
  if (plan.pages?.length) parts.push(`Pages: ${plan.pages.join(', ')}.`)
  if (plan.sections?.length) parts.push(`Key sections: ${plan.sections.join(', ')}.`)
  if (plan.visualStyle) {
    parts.push(`Visual style: ${plan.visualStyle}${plan.colorScheme ? ` — ${plan.colorScheme}` : ''}.`)
  }
  parts.push(
    plan.contentMode === 'real'
      ? 'Use the real content the user will provide.'
      : 'Use professional placeholder content and imagery.',
  )
  if (plan.integrations?.length) parts.push(`Integrations: ${plan.integrations.join(', ')}.`)
  if (plan.tone) parts.push(`Tone: ${plan.tone}.`)
  return parts.join(' ')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    try {
      checkApiRateLimit(request, 'aiGeneration')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const body = (await request.json()) as ClarifyRequest
    const { userMessage, history = [], plan = {}, model = 'auto', apiKey } = body

    // Auth is enforced by middleware for browser requests; defensive check
    // here for direct API hits — accept a session OR a BYOK key.
    if (!session?.user?.id && !apiKey) {
      return NextResponse.json(
        { error: 'Authentication required', requireAuth: true },
        { status: 401 },
      )
    }
    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'userMessage required' }, { status: 400 })
    }

    const turnCount = (plan.turnCount ?? 0) + 1

    // Hand the model the running plan as context, then the conversation.
    const planContext =
      `Current partial plan (JSON): ${JSON.stringify(plan)}\n` +
      `turnCount is now ${turnCount} (cap ${MAX_PLANNER_TURNS}).`
    const messages = [
      { role: 'user' as const, content: planContext },
      ...history.map(t => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: userMessage },
    ]

    let parsed: Partial<ClarifyResponse> | null = null
    try {
      const raw = await callModel(messages, model, apiKey)
      parsed = parseClarifyJson(raw)
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || 'Planner model call failed' },
        { status: 502 },
      )
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'Planner returned an unreadable response' },
        { status: 502 },
      )
    }

    const updatedPlan: Partial<StewPlan> = {
      ...plan,
      ...(parsed.updatedPlan || {}),
      turnCount,
    }

    // Force completion at the turn cap even if the model wants to keep going,
    // so a non-converging interview can't trap the user.
    const done = !!parsed.done || turnCount >= MAX_PLANNER_TURNS

    let assembledPrompt = parsed.assembledPrompt || undefined
    if (done && !assembledPrompt) {
      const firstUserMsg = history.find(t => t.role === 'user')?.content || userMessage
      assembledPrompt = fallbackAssemble(updatedPlan, firstUserMsg)
    }
    if (assembledPrompt) updatedPlan.assembledPrompt = assembledPrompt

    const response: ClarifyResponse = {
      question: done ? undefined : parsed.question || 'Anything else you want me to know before I build it?',
      updatedPlan,
      done,
      assembledPrompt,
      suggestedReplies: Array.isArray(parsed.suggestedReplies)
        ? parsed.suggestedReplies.slice(0, 3)
        : [],
    }
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Clarify] error:', error?.message || error)
    return NextResponse.json(
      { error: error?.message || 'Planner failed' },
      { status: 500 },
    )
  }
}
