// POST /api/builder/plan  { goal, apiKey?, model? }
//
// The planning step for Manus-style autonomy: decompose a high-level goal into
// an ordered list of concrete build steps the agent can execute one-by-one,
// verifying (owl + preview) between each. This route only PLANS — execution is
// driven client-side by feeding each step's `prompt` into the existing agent
// loop, with /api/builder/owl-fix as the between-step verifier. Keeping plan
// and execute separate means the user can review/edit the plan before it runs
// (the autonomy is transparent, not a black box).
//
//   → { steps: [{ title, prompt, verify }] }

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are a build planner for an AI website/app builder. Given a goal, output a SHORT ordered plan of concrete build steps — each one a single, self-contained instruction the builder can execute and then verify before moving on.

Rules:
- 3 to 7 steps. Fewer is better. Each step must be independently buildable.
- Step 1 is always the foundational build (layout + hero + core sections).
- Later steps ADD or REFINE (sections, interactivity, content, polish) — never restart.
- Output ONLY valid JSON, no prose, no markdown fences:
{"steps":[{"title":"<=6 words","prompt":"imperative instruction for the builder","verify":"what 'done' looks like for this step"}]}`

function resolveModel(model?: string): string {
  if (/^claude-(fable|haiku|sonnet|opus)-/.test(model || '')) return model!
  if (model === 'claude-fable') return 'claude-fable-5'
  if (model === 'claude-opus') return 'claude-opus-4-8'
  if (model === 'claude-haiku') return 'claude-haiku-4-5-20251001'
  return 'claude-sonnet-4-6'
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const goal = String(body?.goal || '').trim()
  if (goal.length < 3) return NextResponse.json({ error: 'Describe what you want to build.' }, { status: 400 })

  const apiKey = body?.apiKey || process.env.ANTHROPIC_API_KEY
  if (!session?.user?.id && !body?.apiKey) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured.' }, { status: 503 })

  const anthropic = new Anthropic({ apiKey })
  try {
    const msg = await anthropic.messages.create({
      model: resolveModel(body?.model),
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Goal: ${goal}` }],
    })
    const block = msg.content.find(b => b.type === 'text')
    let text = block && block.type === 'text' ? block.text.trim() : ''
    if (text.startsWith('```')) text = text.replace(/^```(json)?/, '').replace(/```$/, '').trim()

    let parsed: any
    try { parsed = JSON.parse(text) } catch {
      // Salvage the JSON object if the model wrapped it in stray prose.
      const m = text.match(/\{[\s\S]*\}/)
      parsed = m ? JSON.parse(m[0]) : null
    }
    const steps = Array.isArray(parsed?.steps) ? parsed.steps : []
    if (steps.length === 0) {
      return NextResponse.json({ error: 'Could not produce a plan — try rephrasing the goal.' }, { status: 422 })
    }
    // Normalize + cap.
    const clean = steps.slice(0, 7).map((s: any, i: number) => ({
      title: String(s?.title || `Step ${i + 1}`).slice(0, 60),
      prompt: String(s?.prompt || '').slice(0, 600),
      verify: String(s?.verify || '').slice(0, 200),
    })).filter((s: any) => s.prompt)

    return NextResponse.json({ steps: clean })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Planning failed' }, { status: 500 })
  }
}
