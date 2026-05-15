// POST /api/feedback/[id]/replies — add a reply. Auth required.
// isStaff flag is set automatically when the author email matches admin list.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'
const BODY_MAX = 2000

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const payload = (await req.json().catch(() => ({}))) as { body?: string }
  const text = (payload.body || '').trim().slice(0, BODY_MAX)
  if (text.length < 2) {
    return NextResponse.json({ error: 'Reply too short' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const parent = await db
    .collection('site_feedback')
    .findOne({ _id: new ObjectId(params.id) }, { projection: { _id: 1 } })
  if (!parent) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })

  const username = (session.user.email || '').split('@')[0] || 'user'
  const isStaff = !!session.user.email && isAdminEmail(session.user.email)

  const doc = {
    feedbackId: String(parent._id),
    authorId: session.user.id,
    authorName: session.user.name || username,
    authorUsername: username,
    authorAvatar: session.user.image || '',
    isStaff,
    body: text,
    createdAt: new Date(),
  }

  const ins = await db.collection('site_feedback_replies').insertOne(doc)

  // Bump parent's replyCount + touch updatedAt so sort-by-active works.
  await db.collection('site_feedback').updateOne(
    { _id: parent._id },
    { $inc: { replyCount: 1 }, $set: { updatedAt: new Date() } }
  )

  return NextResponse.json({
    _id: String(ins.insertedId),
    ...doc,
  })
}
