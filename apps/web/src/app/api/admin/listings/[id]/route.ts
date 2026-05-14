// PATCH  /api/admin/listings/[id] — approve / reject a listing.
// DELETE /api/admin/listings/[id] — hard-delete (escape hatch for
//                                    spam/copyright that shouldn't sit in
//                                    'rejected' forever).
// Admin-only. Records who did what in admin_audit for traceability.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return null
  return session
}

async function audit(action: string, listingId: string, by: string, note?: string) {
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  await db.collection('admin_audit').insertOne({
    action,
    target: 'community_post',
    listingId,
    by,
    note: note || null,
    at: new Date(),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: { status?: string; note?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const status = body.status
  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    return NextResponse.json({ error: 'status must be approved | rejected | pending' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const r = await db.collection('community_posts').findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    {
      $set: {
        status,
        moderatedAt: new Date(),
        moderatedBy: session.user!.email,
        moderationNote: body.note || null,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after', projection: { html: 0 } }
  )
  if (!r?.value) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await audit(`listing.${status}`, params.id, session.user!.email!, body.note)
  return NextResponse.json({ post: r.value })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const r = await db.collection('community_posts').deleteOne({ _id: new ObjectId(params.id) })
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await audit('listing.delete', params.id, session.user!.email!)
  return NextResponse.json({ ok: true })
}
