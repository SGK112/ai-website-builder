// GET /api/feedback — public list of site feedback. Filter + sort.
// POST /api/feedback — create a new piece of feedback. Auth required.
//
// Collection layout (`site_feedback`):
//   _id, authorId, authorName, authorAvatar, authorUsername
//   category: 'bug' | 'feature' | 'question' | 'compliment'
//   title (120), body (2000)
//   status: 'open' | 'in_progress' | 'shipped' | 'wontfix'
//   upvotes (number), upvotedBy (array of userId strings)
//   replyCount (number, denormalized from site_feedback_replies)
//   createdAt, updatedAt
//
// Replies live in `site_feedback_replies` keyed on feedbackId — separate
// collection so heavy threads don't bloat the parent doc.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

const TITLE_MAX = 120
const BODY_MAX = 2000

const VALID_CATEGORIES = ['bug', 'feature', 'question', 'compliment'] as const
const VALID_STATUSES = ['open', 'in_progress', 'shipped', 'wontfix'] as const
type Category = (typeof VALID_CATEGORIES)[number]
type Status = (typeof VALID_STATUSES)[number]

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const category = sp.get('category') as Category | null
  const status = sp.get('status') as Status | null
  const sort = sp.get('sort') === 'recent' ? 'recent' : 'top'
  const limit = Math.min(60, Math.max(5, parseInt(sp.get('limit') || '40', 10) || 40))

  const filter: Record<string, any> = {}
  if (category && VALID_CATEGORIES.includes(category)) filter.category = category
  if (status && VALID_STATUSES.includes(status)) filter.status = status

  const session = await getServerSession(authOptions).catch(() => null)
  const viewerId = session?.user?.id || ''

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const sortSpec = sort === 'recent' ? { createdAt: -1 } : { upvotes: -1, createdAt: -1 }

  const rows = await db
    .collection('site_feedback')
    .find(filter)
    .sort(sortSpec as any)
    .limit(limit)
    .toArray()

  const items = rows.map((r) => ({
    _id: String(r._id),
    author: {
      id: r.authorId,
      name: r.authorName,
      username: r.authorUsername,
      avatar: r.authorAvatar,
    },
    category: r.category,
    title: r.title,
    body: r.body,
    status: r.status || 'open',
    upvotes: r.upvotes || 0,
    replyCount: r.replyCount || 0,
    viewerUpvoted: !!viewerId && Array.isArray(r.upvotedBy) && r.upvotedBy.includes(viewerId),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    category?: string
    title?: string
    body?: string
  }

  const category = (body.category || '').toLowerCase()
  if (!VALID_CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  const title = (body.title || '').trim().slice(0, TITLE_MAX)
  const text = (body.body || '').trim().slice(0, BODY_MAX)
  if (title.length < 3) {
    return NextResponse.json({ error: 'Title too short (min 3 chars)' }, { status: 400 })
  }
  if (text.length < 5) {
    return NextResponse.json({ error: 'Body too short (min 5 chars)' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  // Derived username (matches /api/community/posts pattern).
  const username = (session.user.email || '').split('@')[0] || 'user'

  const doc = {
    authorId: session.user.id,
    authorName: session.user.name || username,
    authorUsername: username,
    authorAvatar: session.user.image || '',
    category,
    title,
    body: text,
    status: 'open' as const,
    upvotes: 0,
    upvotedBy: [] as string[],
    replyCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const ins = await db.collection('site_feedback').insertOne(doc)

  return NextResponse.json({
    _id: String(ins.insertedId),
    ...doc,
  })
}
