// POST /api/grader/share
// Persist a grader result and mint a short share token. Anon-friendly:
// the grader itself is anon-accessible (lead-gen widget), so the share
// API has to be too. Light abuse guard (bot UA + threat-score + per-IP
// rate) so people can't bulk-create reports.
//
// Body: { url: string, result: GraderResult }
// Returns: { token, shareUrl }

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function makeToken(): string {
  // 9-char base64url — ~54 bits of entropy, short enough for share URLs.
  return crypto.randomBytes(7).toString('base64url').slice(0, 9)
}

export async function POST(req: NextRequest) {
  // Share is signed-in-only — viewing reports is public but minting them
  // requires an account. Per the auth model: anon can grade (3 free) but
  // sharing/downloading/printing is signup-walled.
  const session = await getServerSession(authOptions).catch(() => null)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Sign up free to share your report cards.', signupWall: true },
      { status: 401 }
    )
  }
  // Bot/reputation guard still applies (defense-in-depth).
  const blocked = await guardAnonAbuse(req)
  if (blocked) return blocked

  let body: { url?: string; result?: any }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url || url.length > 2048) {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }
  if (!body.result || typeof body.result !== 'object') {
    return NextResponse.json({ error: 'result required' }, { status: 400 })
  }

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })

  // Collision-avoidant token mint. Retry up to 3 times — the keyspace is
  // huge but cheap to be safe.
  let token = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = makeToken()
    const existing = await db.collection('grader_reports').findOne({ token: candidate }, { projection: { _id: 1 } })
    if (!existing) {
      token = candidate
      break
    }
  }
  if (!token) {
    return NextResponse.json({ error: 'Could not mint share token' }, { status: 500 })
  }

  await db.collection('grader_reports').insertOne({
    token,
    url,
    result: body.result,
    by: session?.user?.id || null,
    createdAt: new Date(),
    views: 0,
    isPublic: true,
  })

  // Canonical share URLs MUST point at the production origin, not whatever
  // hostname/port the request happened to land on (localhost:5001 in dev,
  // ai-website-builder-ntzg.onrender.com if someone bypasses CF, etc).
  // NEXT_PUBLIC_SITE_URL is set in env to https://www.webstew.net.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://www.webstew.net'
  return NextResponse.json({
    token,
    shareUrl: `${origin}/grader/r/${token}`,
  })
}
