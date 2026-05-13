// GET /api/admin/users?q=email&plan=pro&limit=50&offset=0
// Returns paginated, filterable user list. Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() || ''
  const plan = url.searchParams.get('plan')?.trim() || ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

  try {
    const mongoose = await connectDB()
    const db = mongoose.connection.db
    if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

    const filter: any = {}
    if (q) filter.email = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    if (plan) filter.plan = plan

    const [rows, total] = await Promise.all([
      db.collection('users')
        .find(filter, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments(filter),
    ])

    return NextResponse.json({
      users: rows.map((u: any) => ({
        id: String(u._id),
        email: u.email,
        name: u.name,
        plan: u.plan || 'free',
        credits: u.credits ?? null,
        subscriptionStatus: u.subscriptionStatus,
        image: u.image,
        provider: u.provider,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastLoginAt: u.lastLoginAt,
      })),
      total,
      limit,
      offset,
    })
  } catch (e: any) {
    console.error('[admin/users] Failed:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
