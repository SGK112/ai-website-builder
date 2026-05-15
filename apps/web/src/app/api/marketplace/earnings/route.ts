// GET /api/marketplace/earnings — the caller's seller dashboard data.
// Returns balance, recent payouts, and recent sales (purchases of
// listings they authored).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const CENTS_PER_CREDIT = Math.max(1, parseInt(process.env.MARKETPLACE_CREDIT_USD_CENTS || '1', 10) || 1)
const MIN_PAYOUT_CENTS = Math.max(100, parseInt(process.env.MARKETPLACE_PAYOUT_MIN_CENTS || '500', 10) || 500)

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }
  const userId = new ObjectId(session.user.id)

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const [user, recentPayouts, recentSales, lifetimeSales] = await Promise.all([
    db.collection('users').findOne(
      { _id: userId },
      {
        projection: {
          marketplace_earnings_credits: 1,
          stripe_account_id: 1,
          stripe_payouts_enabled: 1,
          stripe_charges_enabled: 1,
        },
      }
    ),
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
    payoutsReady: !!user?.stripe_account_id && !!user?.stripe_payouts_enabled,
    needsOnboarding: !user?.stripe_account_id || !user?.stripe_payouts_enabled,
    lifetime: {
      salesCount: lifetimeSales[0]?.count || 0,
      creditsEarned: lifetimeSales[0]?.credits || 0,
    },
    recentPayouts,
    recentSales,
  })
}
