// POST /api/builder/owl-fix  { html, model?, apiKey? }
//
// The owl self-heal, extracted so the INTERACTIVE build/edit path can use it
// too — not just the one-shot /api/builder/generate. After an agent edit the
// workspace calls this with the current index.html; if the owl flags issues
// (broken JS syntax, unclosed tags, truncation) we run a single targeted
// repair pass and return the fixed HTML — but only if it strictly reduced the
// problem count (a truncated "repair" re-flags and is rejected).
//
//   → { ok, fixed, html, issues, remaining }
//
// Auth-gated so it doesn't burn the platform Anthropic key anonymously; BYOK
// (apiKey in body) is honored like the other builder routes.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { validateGeneratedHtml, summarizeIssues } from '@/lib/html-validator'

export const dynamic = 'force-dynamic'

function resolveModel(model?: string): { model: string; maxTokens: number } {
  const m = /^claude-(haiku|sonnet|opus)-/.test(model || '')
    ? model!
    : model === 'claude-opus' ? 'claude-opus-4-7'
    : model === 'claude-haiku' ? 'claude-haiku-4-5-20251001'
    : 'claude-sonnet-4-6'
  const maxTokens = m.includes('opus') ? 32000 : 16384
  return { model: m, maxTokens }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const html = String(body?.html || '')
  if (html.length < 50) {
    return NextResponse.json({ error: 'No HTML to check.' }, { status: 400 })
  }
  const apiKey = body?.apiKey || process.env.ANTHROPIC_API_KEY
  // Authed OR bringing your own key.
  if (!session?.user?.id && !body?.apiKey) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const owl = validateGeneratedHtml(html)
  if (owl.ok) {
    return NextResponse.json({ ok: true, fixed: false, html, issues: [], remaining: [] })
  }

  if (!apiKey) {
    // Can flag but not fix — still useful (surface the issues).
    return NextResponse.json({ ok: false, fixed: false, html, issues: owl.issues, remaining: owl.issues })
  }

  const { model, maxTokens } = resolveModel(body?.model)
  const anthropic = new Anthropic({ apiKey })

  try {
    const stream = anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      system: 'You fix bugs in a single HTML document. Output ONLY the corrected, complete HTML — from <!DOCTYPE html> through </html>. No markdown fences, no commentary.',
      messages: [{
        role: 'user',
        content: `Fix exactly these issues in the HTML below and change nothing else:\n${owl.issues.map(i => `- ${i.message}${i.line ? ` (near line ${i.line})` : ''}`).join('\n')}\n\nHTML:\n${html}`,
      }],
    })
    const msg = await stream.finalMessage()
    const block = msg.content.find(b => b.type === 'text')
    let repaired = block && block.type === 'text' ? block.text.trim() : ''
    if (repaired.startsWith('```html')) repaired = repaired.slice(7).trim()
    else if (repaired.startsWith('```')) repaired = repaired.slice(3).trim()
    if (repaired.endsWith('```')) repaired = repaired.slice(0, -3).trim()

    if (repaired.length > 300) {
      const reOwl = validateGeneratedHtml(repaired)
      // Accept only if it strictly reduced the problems.
      if (reOwl.issues.length < owl.issues.length) {
        console.log(`[owl-fix] ${owl.issues.length} → ${reOwl.issues.length} issue(s): ${summarizeIssues(owl.issues)}`)
        return NextResponse.json({ ok: reOwl.ok, fixed: true, html: repaired, issues: owl.issues, remaining: reOwl.issues })
      }
    }
    // Repair didn't help — return original + the issues so the UI can warn.
    return NextResponse.json({ ok: false, fixed: false, html, issues: owl.issues, remaining: owl.issues })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Owl repair failed', issues: owl.issues }, { status: 500 })
  }
}
