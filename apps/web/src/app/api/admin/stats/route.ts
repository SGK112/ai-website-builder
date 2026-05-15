// GET /api/admin/stats
// Returns top-line KPIs for the admin dashboard.
// Admin-only — checks isAdminEmail() against session.user.email.

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

  try {
    const mongoose = await connectDB()
    const db = mongoose.connection.db
    if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const users = db.collection('users')
    const projects = db.collection('projects')
    const activity = db.collection('activitylogs')

    // Tenant filter — Webstew users only. See /api/admin/users for the
    // long form. Set ?all=1 to count all rows in the shared collection.
    const all = new URL(req.url).searchParams.get('all') === '1'
    const tenantFilter: any = all ? {} : { app: 'webstew' }

    const [
      userCount,
      planBreakdown,
      newUsersWeek,
      newUsersMonth,
      projectCount,
      projectsWeek,
      generationsDay,
      generationsWeek,
    ] = await Promise.all([
      users.countDocuments(tenantFilter),
      users.aggregate([
        { $match: tenantFilter },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      users.countDocuments({ ...tenantFilter, createdAt: { $gte: weekAgo } }),
      users.countDocuments({ ...tenantFilter, createdAt: { $gte: monthAgo } }),
      projects.countDocuments(),
      projects.countDocuments({ createdAt: { $gte: weekAgo } }),
      activity.countDocuments({
        type: { $in: ['generate_website', 'generation', 'build', 'generate'] },
        createdAt: { $gte: dayAgo },
      }),
      activity.countDocuments({
        type: { $in: ['generate_website', 'generation', 'build', 'generate'] },
        createdAt: { $gte: weekAgo },
      }),
    ])

    return NextResponse.json({
      users: {
        total: userCount,
        new_7d: newUsersWeek,
        new_30d: newUsersMonth,
        by_plan: planBreakdown.reduce((acc, row: any) => ({ ...acc, [row._id || 'unknown']: row.count }), {} as Record<string, number>),
      },
      projects: { total: projectCount, new_7d: projectsWeek },
      generations: { last_24h: generationsDay, last_7d: generationsWeek },
      generated_at: now.toISOString(),
    })
  } catch (e: any) {
    console.error('[admin/stats] Failed:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Stats failed' }, { status: 500 })
  }
}
