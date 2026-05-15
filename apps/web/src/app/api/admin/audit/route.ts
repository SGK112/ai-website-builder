// GET /api/admin/audit — recent admin actions from the admin_audit
// collection. Supports ?action=<prefix>&limit=N.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const action = (searchParams.get('action') || '').trim()
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const query: any = {}
  if (action) query.action = { $regex: `^${action.replace(/[^a-zA-Z0-9_.\-]/g, '')}` }

  const entries = await db
    .collection('admin_audit')
    .find(query)
    .sort({ at: -1 })
    .limit(limit)
    .toArray()
  return NextResponse.json({ entries })
}
