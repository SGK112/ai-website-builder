// /api/user/profile
//
// GET  — returns the signed-in user's public profile fields (bio, tagline,
//        plus a derived username so the UI can show "Your page: /u/<x>").
// PATCH — updates bio + tagline. Length caps mirror the User schema.
//
// Username derivation matches /api/community/posts (email prefix). Users
// can't edit it yet — that's a separate change because it has to be
// unique across the collection and would invalidate existing listings'
// embedded author.username if changed.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const BIO_MAX = 600
const TAGLINE_MAX = 80

function deriveUsername(email: string | null | undefined): string {
  if (!email) return 'user'
  return email.split('@')[0] || 'user'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const user = ObjectId.isValid(userId)
    ? await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { name: 1, email: 1, avatar: 1, bio: 1, tagline: 1, skillLevel: 1, createdAt: 1 } }
      )
    : null

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    profile: {
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || session.user.image || '',
      bio: user.bio || '',
      tagline: user.tagline || '',
      // Experience tier (no-code | low-code | full-stack) so the workspace can
      // render the right complexity on any device — not just where it was set.
      skillLevel: user.skillLevel || null,
      username: deriveUsername(user.email || session.user.email),
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({})) as { name?: string; bio?: string; tagline?: string; skillLevel?: string }
  const name = typeof body.name === 'string' ? body.name.slice(0, 80).trim() : undefined
  const bio = typeof body.bio === 'string' ? body.bio.slice(0, BIO_MAX).trim() : undefined
  const tagline = typeof body.tagline === 'string' ? body.tagline.slice(0, TAGLINE_MAX).trim() : undefined
  const skillLevel = (['no-code', 'low-code', 'full-stack'] as const).includes(body.skillLevel as any)
    ? body.skillLevel : undefined

  if (name === undefined && bio === undefined && tagline === undefined && skillLevel === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }
  if (name !== undefined && !name) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
  }

  const set: Record<string, any> = { updatedAt: new Date() }
  if (name !== undefined) set.name = name
  if (bio !== undefined) set.bio = bio
  if (tagline !== undefined) set.tagline = tagline
  if (skillLevel !== undefined) set.skillLevel = skillLevel

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  // Raw driver write — bypasses Mongoose's schema-strip behavior on fields
  // that may not be on the registered model in this deploy. See the
  // bypass-mongoose-for-new-fields memory.
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: set }
  )

  return NextResponse.json({ ok: true, name: set.name ?? null, bio: set.bio ?? null, tagline: set.tagline ?? null })
}
