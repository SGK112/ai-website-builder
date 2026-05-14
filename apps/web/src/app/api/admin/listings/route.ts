// GET /api/admin/listings — list community posts for moderation.
// Admin-only. Default returns pending posts (the review queue); pass
// ?status=approved or ?status=rejected to see others.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
  const skip = Math.max(0, Number(searchParams.get('skip')) || 0)

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const col = db.collection('community_posts')

  // 'pending' matches new submissions. 'legacy' is a convenience filter for
  // posts that pre-date the moderation field (status missing) so we can do a
  // one-time backfill review.
  const query: any =
    status === 'legacy'
      ? { status: { $exists: false } }
      : { status }

  const [posts, total, counts] = await Promise.all([
    col
      .find(query, { projection: { html: 0 } }) // omit html to keep the queue list light
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    col.countDocuments(query),
    col
      .aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray(),
  ])

  const countsByStatus: Record<string, number> = {}
  for (const c of counts) countsByStatus[String(c._id ?? 'legacy')] = c.count

  return NextResponse.json({
    posts,
    total,
    counts: countsByStatus,
    pagination: { limit, skip },
  })
}
