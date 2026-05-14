// GET /api/grader/share/[token] — fetch a previously-saved grader report
// by its share token. Public-by-default (this is a marketing surface,
// not user PII). Increments view count opportunistically.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const token = (params.token || '').trim()
  if (!token || !/^[A-Za-z0-9_-]{6,20}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })

  const doc = await db.collection('grader_reports').findOne({ token })
  if (!doc || doc.isPublic === false) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Fire-and-forget view increment — don't block the response on it.
  db.collection('grader_reports')
    .updateOne({ token }, { $inc: { views: 1 } })
    .catch(() => {})

  return NextResponse.json({
    token: doc.token,
    url: doc.url,
    result: doc.result,
    createdAt: doc.createdAt,
    views: (doc.views || 0) + 1,
  })
}
