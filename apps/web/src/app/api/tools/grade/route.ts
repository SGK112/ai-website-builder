// POST /api/tools/grade
// Body: { url: string } OR { html: string, contextUrl?: string }
// Returns: GraderResult  (see src/lib/grader.ts)
//
// Two modes:
//   • url   — fetch + grade an already-deployed site
//   • html  — grade a draft (the workspace's current preview, pre-deploy)
//
// Auth: requires session OR Bearer token, gated via middleware as well.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gradeWebsite, gradeHtml } from '@/lib/grader'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { guardAnonAbuse } from '@/lib/abuse-guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const MAX_HTML_CHARS = 1_500_000 // ~1.5 MB — well above realistic page size

export async function POST(req: NextRequest) {
  // Anon-accessible so the landing-page grader widget can drive lead-gen.
  // Each call hits an external URL and runs an LLM scoring pass, so at
  // scale it becomes a free scraping/AI proxy. Authed users get the
  // generous 'aiGeneration' bucket; anon gets a tight 'anonAi' bucket and
  // is also subject to bot-UA + CF-reputation checks.
  const session = await getServerSession(authOptions).catch(() => null)

  if (!session?.user?.id) {
    const blocked = guardAnonAbuse(req, { rateLimit: 'anonAi' })
    if (blocked) return blocked
  } else {
    try {
      checkApiRateLimit(req, 'aiGeneration')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }
  }

  let body: { url?: string; html?: string; contextUrl?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  try {
    if (body.html) {
      if (body.html.length > MAX_HTML_CHARS) {
        return NextResponse.json({ error: 'html too large' }, { status: 400 })
      }
      const result = await gradeHtml(body.html, body.contextUrl || 'https://draft.local')
      return NextResponse.json(result)
    }
    const url = (body.url || '').trim()
    if (!url) return NextResponse.json({ error: 'url or html required' }, { status: 400 })
    if (url.length > 2048) return NextResponse.json({ error: 'url too long' }, { status: 400 })
    const result = await gradeWebsite(url)
    return NextResponse.json(result)
  } catch (e: any) {
    const msg = e?.message || String(e)
    console.error('[grader] Failed:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
