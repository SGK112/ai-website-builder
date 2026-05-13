// GET /api/admin/users/[id] — fetch one user (full profile)
// PATCH /api/admin/users/[id] — update plan / credits / subscriptionStatus
// Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ObjectId } from 'mongodb'
import { authOptions } from '@/lib/auth'
import { connectDB, isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

const ALLOWED_PLANS = new Set(['free', 'starter', 'pro', 'scale', 'enterprise', 'custom'])
const ALLOWED_SUB_STATUS = new Set(['active', 'canceled', 'past_due', 'trialing', 'incomplete'])

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true as const, email: session.user.email }
}

function parseId(id: string): ObjectId | null {
  try { return new ObjectId(id) } catch { return null }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const oid = parseId(params.id)
  if (!oid) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

  const user = await db.collection('users').findOne({ _id: oid }, { projection: { password: 0 } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Augment with recent projects + generation count for the detail view
  const [recentProjects, generationCount] = await Promise.all([
    db.collection('projects').find({ userId: String(oid) }).sort({ createdAt: -1 }).limit(10).project({ name: 1, slug: 1, createdAt: 1, updatedAt: 1 }).toArray(),
    db.collection('activitylogs').countDocuments({ userId: String(oid), type: { $in: ['generate_website', 'generation', 'build', 'generate'] } }),
  ])

  return NextResponse.json({
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      plan: user.plan || 'free',
      credits: user.credits ?? null,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      stripeCustomerId: user.stripeCustomerId,
      image: user.image,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    },
    recentProjects,
    generationCount,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const oid = parseId(params.id)
  if (!oid) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: { plan?: string; credits?: number; subscriptionStatus?: string; note?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const update: any = {}
  if (typeof body.plan === 'string') {
    if (!ALLOWED_PLANS.has(body.plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    update.plan = body.plan
  }
  if (typeof body.credits === 'number' && Number.isFinite(body.credits) && body.credits >= 0) {
    update.credits = Math.floor(body.credits)
  }
  if (typeof body.subscriptionStatus === 'string') {
    if (!ALLOWED_SUB_STATUS.has(body.subscriptionStatus)) return NextResponse.json({ error: 'Invalid subscriptionStatus' }, { status: 400 })
    update.subscriptionStatus = body.subscriptionStatus
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  update.updatedAt = new Date()

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

  const result = await db.collection('users').updateOne({ _id: oid }, { $set: update })
  if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Audit log
  await db.collection('admin_audit').insertOne({
    actorEmail: auth.email,
    action: 'user_update',
    targetUserId: String(oid),
    changes: update,
    note: body.note || null,
    createdAt: new Date(),
  }).catch(() => {})

  console.log(`[admin] ${auth.email} updated user ${oid}:`, update)
  return NextResponse.json({ ok: true, applied: update })
}
