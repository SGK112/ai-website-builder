// GET /api/library — the caller's owned listings. Three sources, merged:
//   1. Their own published listings (community_posts where author.id =
//      userId) — they own what they made
//   2. Their purchased listings (marketplace_purchases where buyerId =
//      userId)
//   3. Free listings they've saved (community_posts where savedBy
//      contains userId) — bookmarked, not "owned" per se but want to find again

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const userId = session.user.id

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const [authored, purchases, saved] = await Promise.all([
    db.collection('community_posts')
      .find(
        { 'author.id': userId },
        { projection: { html: 0, likedBy: 0, savedBy: 0 } }
      )
      .sort({ createdAt: -1 })
      .toArray(),
    db.collection('marketplace_purchases')
      .find({ buyerId: userId })
      .sort({ purchasedAt: -1 })
      .toArray(),
    db.collection('community_posts')
      .find(
        { savedBy: userId },
        { projection: { html: 0, likedBy: 0, savedBy: 0 } }
      )
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray(),
  ])

  // For purchases — resolve to current listing details. (Listing might
  // have been deleted after purchase; surface a minimal stub if so.)
  const purchaseIds = purchases
    .map((p) => (ObjectId.isValid(p.listingId) ? new ObjectId(p.listingId) : null))
    .filter(Boolean) as ObjectId[]
  const purchasedDetails = purchaseIds.length
    ? await db.collection('community_posts')
        .find(
          { _id: { $in: purchaseIds } },
          { projection: { html: 0, likedBy: 0, savedBy: 0 } }
        )
        .toArray()
    : []
  const purchasedById = new Map(purchasedDetails.map((d) => [String(d._id), d]))

  return NextResponse.json({
    authored: authored.map(slim),
    purchased: purchases.map((p) => ({
      _id: String(p._id),
      listingId: p.listingId,
      listing: purchasedById.get(p.listingId) ? slim(purchasedById.get(p.listingId)) : null,
      title: p.listingTitle,
      type: p.listingType,
      priceCredits: p.priceCredits,
      purchasedAt: p.purchasedAt,
    })),
    saved: saved.map(slim),
  })
}

function slim(p: any) {
  return {
    _id: String(p._id),
    type: p.type,
    title: p.title,
    description: p.description,
    thumbnail: p.thumbnail,
    author: p.author,
    category: p.category,
    likes: p.likes || 0,
    views: p.views || 0,
    isPremium: !!p.isPremium,
    priceCredits: Number(p.price_credits) || 0,
    status: p.status,
    createdAt: p.createdAt,
  }
}
