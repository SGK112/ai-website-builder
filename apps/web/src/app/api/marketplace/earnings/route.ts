// GET /api/marketplace/earnings — the caller's seller dashboard data.
// Returns balance, recent payouts, and recent sales (purchases of
// listings they authored).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

const CENTS_PER_CREDIT = Math.max(1, parseInt(process.env.MARKETPLACE_CREDIT_USD_CENTS || '1', 10) || 1)
const MIN_PAYOUT_CENTS = Math.max(100, parseInt(process.env.MARKETPLACE_PAYOUT_MIN_CENTS || '500', 10) || 500)

// Lazy index init — fires once per process. Mirrors the pattern in
// lib/pending-builds.ts so earnings queries don't full-scan the
// marketplace_purchases / payouts_log collections.
let indicesEnsured = false
async function ensureMarketplaceIndices(db: import('mongodb').Db) {
  if (indicesEnsured) return
  indicesEnsured = true // set first so a concurrent request doesn't re-enter
  try {
    await Promise.all([
      db.collection('marketplace_purchases').createIndex({ sellerId: 1, purchasedAt: -1 }),
      db.collection('marketplace_purchases').createIndex({ buyerId: 1, purchasedAt: -1 }),
      db.collection('payouts_log').createIndex({ userId: 1, createdAt: -1 }),
    ])
  } catch {
    // Duplicate index creates are no-ops; this catch is for the cold-path
    // permission edge case where the DB user can't create indexes.
    indicesEnsured = true
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }
  const userId = new ObjectId(session.user.id)

  // User lookup goes through Mongoose so we hit the correct database
  // (the Mongoose connection-string default DB). Marketplace collections
  // (payouts_log, marketplace_purchases) live in 'ai-website-builder' —
  // that lookup stays on the raw client.
  await connectDB()
  const client = await clientPromise
  const db = client.db('ai-website-builder')

  void ensureMarketplaceIndices(db)

  const [userDoc, recentPayouts, recentSales, lifetimeSales] = await Promise.all([
    (async () => {
      let u: any = await User.findById(session.user.id).select('marketplace_earnings_credits stripe_account_id stripe_payouts_enabled stripe_charges_enabled stripeAccountId email').lean()
      if (!u && session.user.email) {
        u = await User.findOne({ email: session.user.email.toLowerCase() }).select('marketplace_earnings_credits stripe_account_id stripe_payouts_enabled stripeAccountId').lean()
      }
      return u
    })(),
    db
      .collection('payouts_log')
      .find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray(),
    db
      .collection('marketplace_purchases')
      .find({ sellerId: String(userId) })
      .sort({ purchasedAt: -1 })
      .limit(20)
      .toArray(),
    db
      .collection('marketplace_purchases')
      .aggregate([
        { $match: { sellerId: String(userId) } },
        { $group: { _id: null, count: { $sum: 1 }, credits: { $sum: '$priceCredits' } } },
      ])
      .toArray(),
  ])
  const user = userDoc

  return NextResponse.json({
    balance: {
      credits: user?.marketplace_earnings_credits || 0,
      usdCents: (user?.marketplace_earnings_credits || 0) * CENTS_PER_CREDIT,
    },
    config: {
      centsPerCredit: CENTS_PER_CREDIT,
      minPayoutCents: MIN_PAYOUT_CENTS,
      minPayoutCredits: Math.ceil(MIN_PAYOUT_CENTS / CENTS_PER_CREDIT),
    },
    // Accept either snake_case (raw driver writes) or camelCase (Mongoose-
    // managed fields) — different write paths used different conventions.
    payoutsReady: !!(user?.stripe_account_id || user?.stripeAccountId) && !!user?.stripe_payouts_enabled,
    needsOnboarding: !(user?.stripe_account_id || user?.stripeAccountId) || !user?.stripe_payouts_enabled,
    lifetime: {
      salesCount: lifetimeSales[0]?.count || 0,
      creditsEarned: lifetimeSales[0]?.credits || 0,
    },
    recentPayouts,
    recentSales,
  })
}
