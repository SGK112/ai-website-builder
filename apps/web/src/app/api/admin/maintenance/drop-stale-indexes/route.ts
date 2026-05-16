// POST /api/admin/maintenance/drop-stale-indexes
//
// One-shot fix. The `usages` collection has a stale unique index from an
// old schema version (`userId_1_month_1`) that's blocking every write
// after the first per-user (because the current Usage schema has no
// `month` field, so every insert dupes on `{userId, null}`).
//
// Admin-only. Lists current indexes on key collections, drops the known
// stale ones, returns a report. Safe to call repeatedly — drop is a
// no-op if the index doesn't exist.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

// Indexes confirmed stale from production error logs. Each entry is
// (collection, indexName) — add more here when we find them.
const STALE = [
  { collection: 'usages', index: 'userId_1_month_1' },
] as const

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const client = await clientPromise
  // Use the DB the rest of the app writes to so we hit the right collection.
  // MONGODB_URI default DB is `voiceflow-crm` per the marketplace memory.
  const db = client.db()

  const report: Array<{
    collection: string
    index: string
    existed: boolean
    dropped: boolean
    error?: string
  }> = []

  for (const target of STALE) {
    try {
      const indexes = await db.collection(target.collection).indexes()
      const existed = indexes.some((i: any) => i.name === target.index)
      if (!existed) {
        report.push({ ...target, existed: false, dropped: false })
        continue
      }
      await db.collection(target.collection).dropIndex(target.index)
      report.push({ ...target, existed: true, dropped: true })
    } catch (e: any) {
      report.push({
        ...target,
        existed: true,
        dropped: false,
        error: e?.message || String(e),
      })
    }
  }

  return NextResponse.json({
    ok: true,
    by: session.user.email,
    db: db.databaseName,
    report,
  })
}

// GET for a dry-run — lists current indexes on the affected collections
// without changing anything. Useful for verifying state before/after.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const client = await clientPromise
  const db = client.db()
  const collections = Array.from(new Set(STALE.map((s) => s.collection)))
  const out: Record<string, any[]> = {}
  for (const name of collections) {
    try {
      out[name] = (await db.collection(name).indexes()).map((i: any) => ({
        name: i.name,
        key: i.key,
        unique: !!i.unique,
      }))
    } catch (e: any) {
      out[name] = [{ error: e?.message || String(e) }]
    }
  }
  return NextResponse.json({ db: db.databaseName, indexes: out })
}
