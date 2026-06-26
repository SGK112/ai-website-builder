// Owner-authenticated CRUD over a managed-backend app's data — powers the
// Data Studio table view. Unlike /api/backend/[appId]/[collection] (apiKey,
// CORS-open, for the generated app), this is session-gated to the app OWNER.
//
//   GET    ?projectId=&collection=&limit=  → rows (newest first)
//   PUT    ?projectId=&collection=&id=  {data}  → replace a row's data
//   DELETE ?projectId=&collection=&id=          → delete a row

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { resolveOwnedBackend } from '@/lib/app-backend'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

async function getDb() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

// Resolve the owner's appId for a (projectId|appId), or return an error response.
async function ownedAppId(req: NextRequest): Promise<{ appId: string } | { err: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { err: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  const projectId = req.nextUrl.searchParams.get('projectId')
  const appId = req.nextUrl.searchParams.get('appId')
  const backend = await resolveOwnedBackend(session.user.id, { projectId, appId })
  if (!backend) return { err: NextResponse.json({ error: 'Backend not found' }, { status: 404 }) }
  return { appId: backend.appId }
}

function collectionParam(req: NextRequest): string {
  return String(req.nextUrl.searchParams.get('collection') || '').trim()
}

export async function GET(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  const collection = collectionParam(req)
  if (!collection) return NextResponse.json({ error: 'collection required' }, { status: 400 })
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '200', 10) || 200, 1000)
  const db = await getDb()
  const rows = await db
    .collection('app_data')
    .find({ appId: r.appId, collection })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
  return NextResponse.json({
    items: rows.map((d) => ({ id: d.docId, data: d.data, createdAt: d.createdAt, updatedAt: d.updatedAt })),
    count: rows.length,
  })
}

// Owner-authenticated row CREATE. Unlike the public data API, the owner may
// write reserved/managed collections here — notably `products` (the store's
// trusted price catalog the public key cannot touch).
export async function POST(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  const collection = collectionParam(req)
  if (!collection) return NextResponse.json({ error: 'collection required' }, { status: 400 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const data = body && typeof body === 'object' && body.data && typeof body.data === 'object' ? body.data : body
  if (!data || typeof data !== 'object') return NextResponse.json({ error: 'data object required' }, { status: 400 })

  const db = await getDb()
  const docId = randomUUID()
  const now = new Date()
  await db.collection('app_data').insertOne({ appId: r.appId, collection, docId, data, createdAt: now, updatedAt: now })
  return NextResponse.json({ id: docId, data, createdAt: now, updatedAt: now }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  const collection = collectionParam(req)
  const id = String(req.nextUrl.searchParams.get('id') || '').trim()
  if (!collection || !id) return NextResponse.json({ error: 'collection and id required' }, { status: 400 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const data = body && typeof body === 'object' && body.data && typeof body.data === 'object' ? body.data : body
  if (!data || typeof data !== 'object') return NextResponse.json({ error: 'data object required' }, { status: 400 })

  const db = await getDb()
  const res = await db.collection('app_data').findOneAndUpdate(
    { appId: r.appId, collection, docId: id },
    { $set: { data, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  const doc = (res as any)?.value ?? res
  if (!doc) return NextResponse.json({ error: 'Row not found' }, { status: 404 })
  return NextResponse.json({ id: doc.docId, data: doc.data, updatedAt: doc.updatedAt })
}

export async function DELETE(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  const collection = collectionParam(req)
  const id = String(req.nextUrl.searchParams.get('id') || '').trim()
  if (!collection || !id) return NextResponse.json({ error: 'collection and id required' }, { status: 400 })
  const db = await getDb()
  const res = await db.collection('app_data').deleteOne({ appId: r.appId, collection, docId: id })
  return NextResponse.json({ ok: true, removed: res.deletedCount })
}
