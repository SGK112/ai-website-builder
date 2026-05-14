import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { guardAnonAbuse } from '@/lib/abuse-guard'

export const dynamic = 'force-dynamic'

const COLLECTION = 'waitlist_signups'
const MAX_FEATURE_LEN = 60
const MAX_SOURCE_LEN = 80

// POST /api/waitlist — capture an email for a specific feature waitlist
// (e.g. "voice-builder"). Anon-accessible by design.
//
// Body: { email: string, feature: string, source?: string }
// Returns: { ok: true } or { error }
export async function POST(req: NextRequest) {
  const blocked = guardAnonAbuse(req, { rateLimit: 'waitlist' })
  if (blocked) return blocked

  let body: { email?: unknown; feature?: unknown; source?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const feature = typeof body.feature === 'string' ? body.feature.trim().slice(0, MAX_FEATURE_LEN) : ''
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, MAX_SOURCE_LEN) : undefined

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!feature) {
    return NextResponse.json({ error: 'Feature required' }, { status: 400 })
  }

  try {
    const mongoose = await connectDB()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const col = db.collection(COLLECTION)
    // Idempotent insert keyed on email+feature so we don't accumulate
    // duplicates if someone double-clicks Submit.
    await col.updateOne(
      { email, feature },
      {
        $setOnInsert: {
          email,
          feature,
          source: source || null,
          ip: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || null,
          userAgent: (req.headers.get('user-agent') || '').slice(0, 500) || null,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )
    // First-time insert: ensure index for lookups
    await col.createIndex({ email: 1, feature: 1 }, { unique: true }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[waitlist] error:', e?.message || e)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}
