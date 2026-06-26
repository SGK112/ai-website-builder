// /api/backend/[appId]/[collection] — the key-scoped data API a generated app
// talks to via the injected WebstewDB client. Backed by Webstew's own store
// (Mongo `app_data`), every row scoped by appId + collection so tenants never
// see each other's data.
//
//   GET    /api/backend/:app/:col            → list (newest first, ?limit, ?id)
//   POST   /api/backend/:app/:col   {…}      → create  → { id, ...data }
//   PUT    /api/backend/:app/:col?id=…  {…}  → replace  → { id, ...data }
//   DELETE /api/backend/:app/:col?id=…       → delete   → { ok }
//
// Auth: the app's apiKey (header `x-webstew-key` or `?key=`). It's embedded in
// the generated site like a Supabase anon key — fine for the managed tier; the
// reserved `_users` collection (auth) is written only by the auth route.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { randomUUID } from 'crypto'
import { backendRateLimited } from '@/lib/backend-ratelimit'
import { verifyAppUserToken } from '@/lib/app-integrations'

export const dynamic = 'force-dynamic'

// Collections the PUBLIC data API must never touch. `_users` is auth-only.
// `orders`/`payments` are written only by the Stripe checkout + webhook
// (server-verified money) — exposing them here let anyone forge a paid order
// (status:'paid', total:0) or read every customer's order PII with the public key.
const RESERVED_COLLECTIONS = new Set(['_users', 'orders', '_orders', 'payments', '_payments'])

// Cap a single document so the public (key-in-page) write API can't be used to
// exhaust the shared store with giant payloads.
const MAX_DOC_BYTES = 256 * 1024
function tooLarge(payload: any): boolean {
  try { return Buffer.byteLength(JSON.stringify(payload ?? {}), 'utf8') > MAX_DOC_BYTES } catch { return true }
}

function cors(res: NextResponse): NextResponse {
  // Generated sites live on other origins ({slug}.webstew.app, custom domains),
  // so the data API must be CORS-open. Auth is the apiKey, not the origin.
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

async function authApp(appId: string, key: string | null): Promise<boolean> {
  if (!key) return false
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return false
  const b = await db.collection('app_backends').findOne({ appId }, { projection: { apiKey: 1 } })
  return !!b && b.apiKey === key
}

function getKey(req: NextRequest): string | null {
  return req.headers.get('x-webstew-key') || req.nextUrl.searchParams.get('key')
}

// The end-user identity, if the app logged this visitor in. The SDK client
// already sends the token as `Authorization: Bearer <token>`; we just honor it.
function getEndUser(appId: string, req: NextRequest): string | null {
  const h = req.headers.get('authorization') || ''
  const token = h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : null
  return verifyAppUserToken(appId, token)
}

// Row-level scope. A request may touch PUBLIC docs (no ownerId — this is all
// existing/legacy data + anything an anonymous visitor creates) PLUS the
// authenticated end-user's OWN docs. A doc an end-user creates while logged in
// is private to them — this is what stops one visitor from reading/overwriting/
// deleting another end-user's data. Apps that never log users in keep the
// previous all-public behavior, so nothing currently working breaks.
function ownerScope(me: string | null): Record<string, any> {
  const pub = [{ ownerId: { $exists: false } }, { ownerId: null }]
  return me ? { $or: [...pub, { ownerId: me }] } : { $or: pub }
}

interface Ctx { params: { appId: string; collection: string } }

async function guard(req: NextRequest, params: Ctx['params']) {
  const { appId, collection } = params
  if (RESERVED_COLLECTIONS.has(collection)) {
    return { err: cors(NextResponse.json({ error: 'Reserved collection — use the auth endpoint.' }, { status: 403 })) }
  }
  if (!(await authApp(appId, getKey(req)))) {
    return { err: cors(NextResponse.json({ error: 'Invalid or missing app key.' }, { status: 401 })) }
  }
  const mongoose = await connectDB()
  return { db: mongoose.connection.db! }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const limited = backendRateLimited(req, params.appId, 'read', 'api')
  if (limited) return limited
  const g = await guard(req, params)
  if ('err' in g) return g.err
  const { appId, collection } = params
  const me = getEndUser(appId, req)
  const id = req.nextUrl.searchParams.get('id')
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '100', 10) || 100, 500)
  const data = g.db.collection('app_data')

  if (id) {
    const doc = await data.findOne({ appId, collection, docId: id, ...ownerScope(me) })
    if (!doc) return cors(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    return cors(NextResponse.json({ id: doc.docId, ...doc.data, createdAt: doc.createdAt, updatedAt: doc.updatedAt }))
  }
  const rows = await data.find({ appId, collection, ...ownerScope(me) }).sort({ createdAt: -1 }).limit(limit).toArray()
  return cors(NextResponse.json({
    items: rows.map(d => ({ id: d.docId, ...d.data, createdAt: d.createdAt, updatedAt: d.updatedAt })),
    count: rows.length,
  }))
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const limited = backendRateLimited(req, params.appId, 'write', 'communityAction')
  if (limited) return limited
  const g = await guard(req, params)
  if ('err' in g) return g.err
  const { appId, collection } = params
  let payload: any
  try { payload = await req.json() } catch { return cors(NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })) }
  if (tooLarge(payload)) return cors(NextResponse.json({ error: 'Document too large (max 256KB).' }, { status: 413 }))
  const me = getEndUser(appId, req)
  const docId = randomUUID()
  const now = new Date()
  // Logged-in writes are owned (private to that end-user); anonymous writes are
  // public (ownerId omitted), preserving the old behavior for apps without auth.
  const doc: any = { appId, collection, docId, data: payload ?? {}, createdAt: now, updatedAt: now }
  if (me) doc.ownerId = me
  await g.db.collection('app_data').insertOne(doc)
  return cors(NextResponse.json({ id: docId, ...payload, createdAt: now, updatedAt: now }, { status: 201 }))
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const limited = backendRateLimited(req, params.appId, 'write', 'communityAction')
  if (limited) return limited
  const g = await guard(req, params)
  if ('err' in g) return g.err
  const { appId, collection } = params
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return cors(NextResponse.json({ error: 'id required' }, { status: 400 }))
  let payload: any
  try { payload = await req.json() } catch { return cors(NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })) }
  if (tooLarge(payload)) return cors(NextResponse.json({ error: 'Document too large (max 256KB).' }, { status: 413 }))
  const me = getEndUser(appId, req)
  const now = new Date()
  // Owner scope: you can only update a public doc or your own.
  const res = await g.db.collection('app_data').updateOne(
    { appId, collection, docId: id, ...ownerScope(me) },
    { $set: { data: payload ?? {}, updatedAt: now } }
  )
  if (!res.matchedCount) return cors(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  return cors(NextResponse.json({ id, ...payload, updatedAt: now }))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const limited = backendRateLimited(req, params.appId, 'write', 'communityAction')
  if (limited) return limited
  const g = await guard(req, params)
  if ('err' in g) return g.err
  const { appId, collection } = params
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return cors(NextResponse.json({ error: 'id required' }, { status: 400 }))
  const me = getEndUser(appId, req)
  // Owner scope: you can only delete a public doc or your own.
  const res = await g.db.collection('app_data').deleteOne({ appId, collection, docId: id, ...ownerScope(me) })
  return cors(NextResponse.json({ ok: true, removed: res.deletedCount }))
}
