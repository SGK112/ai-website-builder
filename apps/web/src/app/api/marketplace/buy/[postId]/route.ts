// POST /api/marketplace/buy/[postId]
//
// Credit-based purchase. v1 doesn't move real money — sellers accumulate
// earnings on a server-side ledger; cashout to Stripe Connect is a
// follow-up (POST /api/stripe/connect/payout, which calls
// stripe.transfers.create with destination = seller's stripe_account_id).
//
// Flow:
//   1. Verify listing is premium + price_credits > 0
//   2. Idempotency: if buyer already owns this listing, return the html
//      without charging again
//   3. Atomic credit-debit on buyer (findOneAndUpdate with a credits-gte
//      guard so concurrent buys can't overdraw)
//   4. Credit seller's marketplace_earnings tally
//   5. Insert marketplace_purchases row for audit + entitlement check
//   6. Return { ok: true, html } so the buyer's workspace can hydrate

import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const blocked = await guardAnonAbuse(req, { rateLimit: 'marketplaceBuy' })
  if (blocked) return blocked
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!ObjectId.isValid(params.postId)) {
    return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 })
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }
  const buyerId = new ObjectId(session.user.id)
  const postId = new ObjectId(params.postId)

  // Listings live in the dedicated 'ai-website-builder' DB. (Premium purchases
  // are real-money via Stripe Connect — no user-credit debit here anymore.)
  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const listing = await db.collection('community_posts').findOne({ _id: postId })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.status === 'rejected') {
    return NextResponse.json({ error: 'This listing is unavailable' }, { status: 410 })
  }

  // A listing with no deliverable content must NEVER be sold or handed back —
  // the buyer would pay and receive a blank site. (Empty `index.html: 0` saves
  // produced exactly such rows.) This guard runs before every path below —
  // free, owner, already-owned, and paid — so no path can deliver/charge empty.
  const listingHtml = typeof listing.html === 'string' ? listing.html.trim() : ''
  const hasDeliverable =
    listingHtml.length >= 50 ||
    (Array.isArray(listing.files) &&
      listing.files.some((f: any) => typeof f?.content === 'string' && f.content.trim().length > 0))
  if (!hasDeliverable) {
    return NextResponse.json(
      { error: 'This listing has no content to deliver, so it can’t be purchased.' },
      { status: 409 }
    )
  }

  const price: number = Number(listing.price_credits) || 0
  if (!listing.isPremium || price <= 0) {
    return NextResponse.json({
      ok: true,
      free: true,
      html: listing.html || '',
      message: 'This listing is free — no purchase needed.',
    })
  }

  // Self-purchase: free for the owner.
  if (String(listing.author?.id || '') === String(buyerId)) {
    return NextResponse.json({
      ok: true,
      ownerAccess: true,
      html: listing.html || '',
      message: 'You own this listing.',
    })
  }

  // Idempotency — already bought it?
  const existing = await db
    .collection('marketplace_purchases')
    .findOne({ buyerId: String(buyerId), listingId: String(postId) })
  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyOwned: true,
      html: listing.html || '',
      message: 'You already own this listing.',
    })
  }

  // Premium listing, not yet owned → REAL-MONEY purchase via Stripe Connect.
  // Buying with credits is intentionally NOT supported: the seller is paid in
  // real money straight to their own Connect (Express) account (platform takes
  // 3%, never pays out). The client opens the card checkout; the html
  // deliverable arrives after payment (the webhook mints marketplace_purchases,
  // and the listing detail route returns html once owned).
  return NextResponse.json({
    requiresPayment: true,
    useCheckout: `/api/marketplace/checkout/${String(postId)}`,
    priceCredits: price,
    message: 'This is a paid listing — complete checkout to buy it.',
  }, { status: 402 })
}
