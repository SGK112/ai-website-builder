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

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const MAX_HTML_CHARS = 1_500_000 // ~1.5 MB — well above realistic page size

export async function POST(req: NextRequest) {
  // Anon-accessible so the landing-page grader widget can drive lead-gen.
  // Per-IP rate limit prevents abuse — grading a URL is cheap (one HTTP
  // fetch + HTML parsing) but at scale could be used as a free scraping
  // proxy. 20/min/IP matches our other AI-cost endpoints.
  try {
    checkApiRateLimit(req, 'aiGeneration')
  } catch (error) {
    const rateLimitResponse = handleRateLimitError(error)
    if (rateLimitResponse) return rateLimitResponse
    throw error
  }

  // Session is OPTIONAL — only used for logging / future per-user history.
  // Anon callers get the same grader output as signed-in callers.
  await getServerSession(authOptions).catch(() => null)

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
