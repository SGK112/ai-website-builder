// GET /api/admin/marketplace — aggregated marketplace state for /admin/marketplace.
// Returns:
//   • top sellers by lifetime earnings (from users.marketplace_earnings_credits)
//   • recent purchases (last 30, from marketplace_purchases)
//   • top listings by purchase count
//   • headline stats: total listings, total purchases, total credits transacted

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const [topSellers, recentPurchases, topListings, totalListings, totalApproved, purchaseAgg] = await Promise.all([
    db
      .collection('users')
      .find(
        { marketplace_earnings_credits: { $gt: 0 } },
        { projection: { email: 1, name: 1, username: 1, marketplace_earnings_credits: 1, plan: 1 } }
      )
      .sort({ marketplace_earnings_credits: -1 })
      .limit(20)
      .toArray(),
    db
      .collection('marketplace_purchases')
      .find({})
      .sort({ purchasedAt: -1 })
      .limit(30)
      .toArray(),
    db
      .collection('marketplace_purchases')
      .aggregate([
        { $group: { _id: '$listingId', count: { $sum: 1 }, title: { $first: '$listingTitle' }, type: { $first: '$listingType' }, credits: { $sum: '$priceCredits' } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ])
      .toArray(),
    db.collection('community_posts').countDocuments({}),
    db.collection('community_posts').countDocuments({ status: 'approved' }),
    db
      .collection('marketplace_purchases')
      .aggregate([{ $group: { _id: null, count: { $sum: 1 }, totalCredits: { $sum: '$priceCredits' } } }])
      .toArray(),
  ])

  const stats = {
    listings: { total: totalListings, approved: totalApproved },
    purchases: purchaseAgg[0]?.count || 0,
    creditsTransacted: purchaseAgg[0]?.totalCredits || 0,
  }

  return NextResponse.json({ stats, topSellers, recentPurchases, topListings })
}
