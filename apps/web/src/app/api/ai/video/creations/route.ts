// /api/ai/video/creations — a user's saved video creations (clips + finished
// videos). The hub the rest hangs off: reuse in the builder, or list for sale
// in the community marketplace. Stored per-user (keyed by session id).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const MAX = 200
const ALLOWED_HOSTS = ['x.ai', 'replicate.delivery', 'replicate.com', 'res.cloudinary.com', 'cloudinary.com']
const urlOk = (s: string) => { try { const u = new URL(s); return u.protocol === 'https:' && ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`)) } catch { return false } }

async function col() {
  const conn = await connectDB()
  const db = conn.connection.db
  if (!db) throw new Error('DB unavailable')
  return db.collection('video_creations')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const c = await col()
  const items = await c.find({ userId: String(session.user.id) }).sort({ createdAt: -1 }).limit(MAX).toArray()
  return NextResponse.json({ creations: items.map(i => ({ id: String(i._id), kind: i.kind, url: i.url, title: i.title || '', createdAt: i.createdAt })) })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  let body: { kind?: string; url?: string; title?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const kind = body.kind === 'clip' ? 'clip' : body.kind === 'video' ? 'video' : null
  if (!kind) return NextResponse.json({ error: 'kind must be clip or video' }, { status: 400 })
  if (!body.url || !urlOk(body.url)) return NextResponse.json({ error: 'A valid media URL is required.' }, { status: 400 })

  const c = await col()
  const userId = String(session.user.id)
  // De-dupe: don't save the same URL twice for this user.
  const existing = await c.findOne({ userId, url: body.url })
  if (existing) return NextResponse.json({ id: String(existing._id), already: true })

  const count = await c.countDocuments({ userId })
  if (count >= MAX) return NextResponse.json({ error: `You've reached the ${MAX}-creation limit. Delete some first.` }, { status: 409 })

  const doc = { userId, kind, url: body.url, title: (body.title || '').slice(0, 120), createdAt: new Date() }
  const res = await c.insertOne(doc as any)
  return NextResponse.json({ id: String(res.insertedId), kind, url: doc.url, title: doc.title })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: 'Valid id required' }, { status: 400 })
  const c = await col()
  // Ownership-scoped delete.
  await c.deleteOne({ _id: new ObjectId(id), userId: String(session.user.id) })
  return NextResponse.json({ ok: true })
}
