// /api/backend/[appId]/auth — auth-lite for generated apps.
//
//   POST { action: 'signup' | 'login', email, password }  → { token, user }
//
// Users are stored in `app_users` scoped by appId (so each generated app has
// its own user table). Passwords are bcrypt-hashed. The returned token is a
// stateless HMAC ( appId.userId.exp.sig ) the app can stash and re-present.
// Requires the app's apiKey (x-webstew-key / ?key=) like the data API.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createHmac, randomUUID } from 'crypto'
import { backendRateLimited } from '@/lib/backend-ratelimit'

export const dynamic = 'force-dynamic'

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const SECRET = process.env.NEXTAUTH_SECRET || 'webstew-backend-dev-secret'

function cors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key')
  return res
}
export async function OPTIONS() { return cors(new NextResponse(null, { status: 204 })) }

function mintToken(appId: string, userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = `${appId}.${userId}.${exp}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

async function authApp(appId: string, key: string | null) {
  if (!key) return null
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return null
  const b = await db.collection('app_backends').findOne({ appId }, { projection: { apiKey: 1 } })
  return b && b.apiKey === key ? db : null
}

interface Ctx { params: { appId: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { appId } = params
  // Tight per-(app, ip) cap — auth is the prime credential-stuffing / signup-spam target.
  const limited = backendRateLimited(req, appId, 'auth', 'auth')
  if (limited) return limited
  const key = req.headers.get('x-webstew-key') || req.nextUrl.searchParams.get('key')
  const db = await authApp(appId, key)
  if (!db) return cors(NextResponse.json({ error: 'Invalid or missing app key.' }, { status: 401 }))

  let body: any
  try { body = await req.json() } catch { return cors(NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })) }
  const action = String(body?.action || '').toLowerCase()
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')
  if (!email || !password) return cors(NextResponse.json({ error: 'email and password required' }, { status: 400 }))

  const users = db.collection('app_users')

  if (action === 'signup') {
    const exists = await users.findOne({ appId, email })
    if (exists) return cors(NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 }))
    const userId = randomUUID()
    const passwordHash = await bcrypt.hash(password, 10)
    await users.insertOne({ appId, userId, email, passwordHash, createdAt: new Date() })
    return cors(NextResponse.json({ token: mintToken(appId, userId), user: { id: userId, email } }, { status: 201 }))
  }

  if (action === 'login') {
    const u = await users.findOne({ appId, email })
    if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
      return cors(NextResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
    }
    return cors(NextResponse.json({ token: mintToken(appId, u.userId), user: { id: u.userId, email } }))
  }

  return cors(NextResponse.json({ error: "action must be 'signup' or 'login'" }, { status: 400 }))
}
