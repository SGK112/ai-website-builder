// POST /api/feedback/[id]/vote — toggle upvote. Auth required.
// Returns the new vote count + whether the viewer is now upvoting.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const _id = new ObjectId(params.id)

  const doc = await db.collection('site_feedback').findOne({ _id }, { projection: { upvotedBy: 1 } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const already = Array.isArray(doc.upvotedBy) && doc.upvotedBy.includes(userId)

  if (already) {
    await db.collection('site_feedback').updateOne(
      { _id },
      {
        $pull: { upvotedBy: userId } as any,
        $inc: { upvotes: -1 },
        $set: { updatedAt: new Date() },
      }
    )
  } else {
    await db.collection('site_feedback').updateOne(
      { _id },
      {
        $addToSet: { upvotedBy: userId } as any,
        $inc: { upvotes: 1 },
        $set: { updatedAt: new Date() },
      }
    )
  }

  const updated = await db.collection('site_feedback').findOne({ _id }, { projection: { upvotes: 1 } })
  return NextResponse.json({
    viewerUpvoted: !already,
    upvotes: updated?.upvotes || 0,
  })
}
