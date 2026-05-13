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

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const MAX_HTML_CHARS = 1_500_000 // ~1.5 MB — well above realistic page size

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const hasBearer = (req.headers.get('authorization') || '').startsWith('Bearer ')
  if (!session?.user?.id && !hasBearer) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
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
