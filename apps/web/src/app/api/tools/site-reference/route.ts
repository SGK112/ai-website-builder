// POST /api/tools/site-reference
// Body: { url: string }
// Returns: SiteReference  (see src/lib/site-reference.ts)
//
// Auth: requires session OR a Bearer token (BYOK). Same posture as the builder
// API routes — we don't want randoms hammering us into scraping arbitrary URLs.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scrapeReference } from '@/lib/site-reference'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const hasBearer = (req.headers.get('authorization') || '').startsWith('Bearer ')
  if (!session?.user?.id && !hasBearer) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const url = (body.url || '').trim()
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (url.length > 2048) return NextResponse.json({ error: 'url too long' }, { status: 400 })

  try {
    const ref = await scrapeReference(url)
    return NextResponse.json(ref)
  } catch (e: any) {
    const msg = e?.message || String(e)
    console.error('[site-reference] Failed:', msg)
    // Differentiate user error (bad URL / blocked) from server error.
    const status = /(refusing|invalid|too large|not html|required)/i.test(msg) ? 400 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}
