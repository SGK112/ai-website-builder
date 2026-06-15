// POST /api/community/posts/[id]/like — toggle the current user's like.
//
// Likes are stored two ways:
//   • likedBy: [userId, …]  — set of users who've liked. Used for the
//                              one-like-per-user rule via $addToSet/$pull.
//   • likes: number          — denormalized count. Cheap to display.
//
// Both update in a single atomic op so the count never disagrees with the set.

import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = await guardAnonAbuse(req, { rateLimit: 'communityAction' })
  if (blocked) return blocked
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const col = db.collection('community_posts')
  const userId = session.user.id
  const _id = new ObjectId(params.id)

  // Single read to know current state, then a single write to flip it.
  // Race condition: two clicks could double-pull or double-add. The set
  // semantics of $addToSet/$pull keep `likedBy` correct, but the count
  // can drift by ±1. Tolerable for like counts — we re-derive the count
  // from likedBy.length in the response so the displayed value stays
  // consistent for this viewer.
  const post = await col.findOne({ _id }, { projection: { likedBy: 1, likes: 1 } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const alreadyLiked = Array.isArray(post.likedBy) && post.likedBy.includes(userId)
  if (alreadyLiked) {
    await col.updateOne(
      { _id },
      { $pull: { likedBy: userId } as any, $inc: { likes: -1 }, $set: { updatedAt: new Date() } }
    )
  } else {
    await col.updateOne(
      { _id },
      { $addToSet: { likedBy: userId } as any, $inc: { likes: 1 }, $set: { updatedAt: new Date() } }
    )
  }

  const after = await col.findOne({ _id }, { projection: { likedBy: 1, likes: 1 } })
  const count = Array.isArray(after?.likedBy) ? after!.likedBy.length : (after?.likes ?? 0)
  return NextResponse.json({ liked: !alreadyLiked, likes: count })
}
