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
import { isGrokModel, XAI_FLAGSHIP, xaiClient } from '@/lib/xai'
import type { ClarifyRequest, ClarifyResponse, StewPlan } from '@/lib/types/stew-planner'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// One question per turn, a small plan patch, a couple of quick replies — this
// is tiny output. Cap low so latency stays well under proxy timeouts.
const CLARIFY_MAX_TOKENS = 700

// After this many turns, stop interviewing and build with what we have — a
// planner that won't converge is worse than a slightly-thin prompt. Kept low
// on purpose: the user wants to SEE something, not answer a form. 1–2 sharp
// questions, then build.
const MAX_PLANNER_TURNS = 3

const SYSTEM_PROMPT = `You are the Stew Planner — a warm, sharp site-planning assistant for Webstew, an AI website builder. A "stew" is a finished build prompt the generator uses as-is.

Your goal: turn a vague request into the STRONGEST possible build prompt using the FEWEST questions. Most great first builds need only ONE or TWO answers. Over-asking is a failure — the user wants to see a real draft fast, not fill out a form.

Only ever ask about, in priority order, and ONLY when you genuinely can't infer it:
  1. What it's for & who it's for — the business/project, and the visitor's #1 goal (book, buy, contact, read, sign up). Highest-value answer; lead here when it's unclear.
  2. The look & feel — the vibe, a brand or site whose style they like, light vs dark.
Everything else — which pages/sections, real-vs-placeholder content, payments/booking/maps/forms — you INFER and record silently in updatedPlan. Ask about one of those ONLY if it's the heart of this specific site and truly unknowable (e.g. a shop: "what do you sell?").

How to ask:
- ONE question per turn (two only if they're one natural breath). Plain words a non-technical owner gets — never say "pages", "sections", "content mode", "integrations", "CMS".
- One sentence. No preamble, no "Great!", no recap.
- ALWAYS give 2–3 CONCRETE one-tap suggestedReplies that are real answers (e.g. "Take bookings", "Sell products", "Show off my work", "Clean & modern", "Bold & colorful") — never "Yes/No/Not sure".
- Infer hard and write it to updatedPlan; never ask what the user already said or what's obvious for this kind of site.

Finishing:
- Set done:true the MOMENT you can write a strong prompt — usually after 1–2 questions, and ALWAYS once turnCount reaches ${MAX_PLANNER_TURNS}.
- Fill every remaining gap with confident professional defaults (modern responsive design, sensible pages for the site type, placeholder copy + imagery) rather than asking. Default contentMode to "placeholder" unless the user mentions having their own copy/photos.
- assembledPrompt: one vivid paragraph the builder uses directly — what the site is, who it's for and their goal, the pages/sections you chose, visual style + colors, content mode, any integrations, and tone.
- completeness (0–100) is informational only; do NOT keep asking just to raise it.

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

  // xAI Grok — OpenAI-compatible, so the same chat.completions call works.
  if (isGrokModel(model)) {
    const client = xaiClient(apiKey)
    const res = await client.chat.completions.create({
      model: XAI_FLAGSHIP,
      max_tokens: CLARIFY_MAX_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })
    return res.choices[0]?.message?.content || ''
  }

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
  const claudeModel = lc.includes('fable')
    ? 'claude-fable-5'
    : lc.includes('opus')
    ? 'claude-opus-4-8'
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
