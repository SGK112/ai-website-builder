// GET   /api/feedback/[id] — feedback detail + replies (ordered oldest first).
// PATCH /api/feedback/[id] — admin-only status change.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['open', 'in_progress', 'shipped', 'wontfix'] as const
type Status = (typeof VALID_STATUSES)[number]

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const session = await getServerSession(authOptions).catch(() => null)
  const viewerId = session?.user?.id || ''

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const row = await db.collection('site_feedback').findOne({ _id: new ObjectId(params.id) })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const replies = await db
    .collection('site_feedback_replies')
    .find({ feedbackId: String(row._id) })
    .sort({ createdAt: 1 })
    .toArray()

  return NextResponse.json({
    feedback: {
      _id: String(row._id),
      author: {
        id: row.authorId,
        name: row.authorName,
        username: row.authorUsername,
        avatar: row.authorAvatar,
      },
      category: row.category,
      title: row.title,
      body: row.body,
      status: row.status || 'open',
      upvotes: row.upvotes || 0,
      replyCount: row.replyCount || 0,
      viewerUpvoted: !!viewerId && Array.isArray(row.upvotedBy) && row.upvotedBy.includes(viewerId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    replies: replies.map((r) => ({
      _id: String(r._id),
      author: {
        id: r.authorId,
        name: r.authorName,
        username: r.authorUsername,
        avatar: r.authorAvatar,
      },
      isStaff: !!r.isStaff,
      body: r.body,
      createdAt: r.createdAt,
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as { status?: string }
  const status = body.status as Status
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const res = await db.collection('site_feedback').updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { status, updatedAt: new Date() } }
  )

  if (!res.matchedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, status })
}
