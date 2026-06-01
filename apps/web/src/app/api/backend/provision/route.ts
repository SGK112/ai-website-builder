// POST /api/backend/provision — one-click "Add a backend" for a generated app.
//
// Lovable's moat is that a generated app gets a real backend (auth + DB) with
// one click. Provisioning a *separate Supabase project per user* doesn't scale
// (org project caps + cost + a management token), so Webstew runs a managed,
// multi-tenant backend: each app gets an appId + apiKey, and a key-scoped data
// API (/api/backend/[appId]/[collection]) backed by Webstew's own store. The
// generated site talks to it via an injected WebstewDB client — zero setup,
// no accounts, works the instant you publish.
//
// If SUPABASE_ACCESS_TOKEN is set, a future "Pro backend" path can provision a
// dedicated Supabase project instead; this MVP is the managed tier.
//
//   POST { projectId?, name? } → { appId, apiKey, baseUrl }   (re-provision = same appId, rotates nothing)
//   GET  ?projectId=…          → existing backend for that project (no apiKey)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { randomUUID, randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

async function getDb() {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('DB not connected')
  return db
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required', requireAuth: true }, { status: 401 })
  }
  let body: any = {}
  try { body = await req.json() } catch { /* body optional */ }
  const projectId: string | null = body?.projectId ? String(body.projectId) : null
  const name: string = String(body?.name || 'App backend').slice(0, 80)

  const db = await getDb()
  const col = db.collection('app_backends')

  // Idempotent per project: re-provisioning returns the existing backend so the
  // app's apiKey stays stable across edits/redeploys.
  if (projectId) {
    const existing = await col.findOne({ userId: session.user.id, projectId })
    if (existing) {
      return NextResponse.json({
        appId: existing.appId,
        apiKey: existing.apiKey,
        baseUrl: `/api/backend/${existing.appId}`,
        existing: true,
      })
    }
  }

  const appId = randomUUID().replace(/-/g, '').slice(0, 20)
  const apiKey = `wsk_${randomBytes(24).toString('base64url')}`
  const now = new Date()
  await col.insertOne({
    appId,
    apiKey,
    userId: session.user.id,
    projectId: projectId || null,
    name,
    provider: 'managed',
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({
    appId,
    apiKey,
    baseUrl: `/api/backend/${appId}`,
    existing: false,
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const db = await getDb()
  const b = await db.collection('app_backends').findOne(
    { userId: session.user.id, projectId },
    { projection: { apiKey: 0 } }
  )
  return NextResponse.json({ backend: b || null })
}
