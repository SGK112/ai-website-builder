// POST /api/community/posts/[id]/save — toggle the current user's save
// (bookmark) on a listing. Mirrors the like endpoint pattern. Saves are
// stored two ways:
//   • savedBy: [userId, …]   — set semantics, one save per user
//   • savedCount: number     — denormalized count for display
//
// The user's "My saved" list is the inverse lookup: find posts where
// savedBy contains the user. We'll add /api/community/saved when the
// dashboard surface lands; for now this is the write side.

import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = guardAnonAbuse(req, { rateLimit: 'communityAction' })
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

  const post = await col.findOne({ _id }, { projection: { savedBy: 1, savedCount: 1 } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const alreadySaved = Array.isArray(post.savedBy) && post.savedBy.includes(userId)
  if (alreadySaved) {
    await col.updateOne(
      { _id },
      { $pull: { savedBy: userId } as any, $inc: { savedCount: -1 }, $set: { updatedAt: new Date() } }
    )
  } else {
    await col.updateOne(
      { _id },
      { $addToSet: { savedBy: userId } as any, $inc: { savedCount: 1 }, $set: { updatedAt: new Date() } }
    )
  }

  const after = await col.findOne({ _id }, { projection: { savedBy: 1, savedCount: 1 } })
  const count = Array.isArray(after?.savedBy) ? after!.savedBy.length : (after?.savedCount ?? 0)
  return NextResponse.json({ saved: !alreadySaved, savedCount: count })
}
