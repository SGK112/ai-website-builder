import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { createSnapshot, listSnapshotsByUser } from '@/lib/preview-store'

// POST /api/preview — mint a shareable preview link for a generated site.
// Anon-accessible (this is the "show your friend before signing up" surface).
// Rate-limited by IP so it can't be used as cheap blob storage.
export async function POST(req: NextRequest) {
  try {
    try {
      checkApiRateLimit(req, 'aiGeneration') // reuse the existing 20/min IP bucket
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const session = await getApiSession(req)
    const { html, name, type, ttlDays, ownerEmail, ownerPhone } = await req.json().catch(() => ({} as any))
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'html (string) is required' }, { status: 400 })
    }

    const { token, expiresAt } = await createSnapshot({
      html,
      name,
      userId: session?.user?.id || null,
      type: type === 'proposal' ? 'proposal' : 'preview',
      ttlDays: typeof ttlDays === 'number' ? Math.min(Math.max(ttlDays, 1), 365) : undefined,
      ownerEmail: ownerEmail || session?.user?.email || undefined,
      ownerPhone: ownerPhone || undefined,
    })

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get('origin') ||
      `https://${req.headers.get('host') || 'webstew.net'}`
    return NextResponse.json({
      token,
      url: `${origin.replace(/\/$/, '')}/preview/${token}`,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (e: any) {
    const msg = e?.message || 'Failed to create preview'
    const status = /exceeds .* limit/i.test(msg) ? 413 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// GET /api/preview — list the current user's preview snapshots. Signed-in
// only; anon previews are write-only (no ownership handle to list by).
export async function GET(req: NextRequest) {
  const session = await getApiSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  try {
    const snaps = await listSnapshotsByUser(session.user.id)
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get('origin') ||
      `https://${req.headers.get('host') || 'webstew.net'}`
    const cleanOrigin = origin.replace(/\/$/, '')
    return NextResponse.json({
      previews: snaps.map((s) => ({
        id: s._id?.toString(),
        token: s.token,
        url: `${cleanOrigin}/preview/${s.token}`,
        name: s.name || null,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list previews' }, { status: 500 })
  }
}
