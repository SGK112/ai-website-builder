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
import { connectDB } from '@/lib/db'

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

  // Two databases at play within the same Atlas project:
  //   - marketplace data (community_posts, marketplace_purchases) lives
  //     in the dedicated 'ai-website-builder' DB
  //   - users live in the Mongoose-default DB (connection-string default,
  //     currently voiceflow-crm; same Atlas project). Past versions of
  //     this route assumed both were in 'ai-website-builder', so the
  //     atomic credit debit always failed → user saw "doesn't charge me".
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const userConn = await connectDB()
  const userDb = userConn.connection.db
  if (!userDb) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

  const listing = await db.collection('community_posts').findOne({ _id: postId })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.status === 'rejected') {
    return NextResponse.json({ error: 'This listing is unavailable' }, { status: 410 })
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

  // Atomic credit debit — only succeeds if buyer has enough. Goes against
  // the userDb (Mongoose default), NOT the marketplace 'ai-website-builder'
  // DB where listings live. The earlier code looked in the wrong DB so
  // every debit silently failed.
  const debit = await userDb.collection('users').findOneAndUpdate(
    { _id: buyerId, credits: { $gte: price } },
    { $inc: { credits: -price }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after', projection: { credits: 1, email: 1, name: 1 } }
  )
  // mongodb driver v6: findOneAndUpdate returns the document DIRECTLY (no
  // {value} wrapper). The old `debit?.value` was always undefined, so every
  // purchase falsely returned "insufficient credits" — buyers couldn't buy.
  if (!debit) {
    const user = await userDb.collection('users').findOne({ _id: buyerId }, { projection: { credits: 1 } })
    if (!user) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    return NextResponse.json(
      {
        error: 'Insufficient credits',
        required: price,
        balance: user.credits || 0,
        upgradeUrl: '/upgrade',
      },
      { status: 402 }
    )
  }

  // Credit seller's earnings tally. Same userDb — sellers are users too.
  if (listing.author?.id && ObjectId.isValid(listing.author.id)) {
    await userDb.collection('users').updateOne(
      { _id: new ObjectId(listing.author.id) },
      {
        $inc: { marketplace_earnings_credits: price },
        $set: { updatedAt: new Date() },
      }
    )
  }

  // Record the purchase row (used for "Library" / "Owned listings" and as
  // the entitlement check for future re-downloads).
  await db.collection('marketplace_purchases').insertOne({
    buyerId: String(buyerId),
    sellerId: String(listing.author?.id || ''),
    listingId: String(postId),
    listingTitle: listing.title,
    listingType: listing.type,
    priceCredits: price,
    purchasedAt: new Date(),
  })

  // Bump listing downloads counter for the seller's analytics later.
  await db.collection('community_posts').updateOne(
    { _id: postId },
    { $inc: { downloads: 1 }, $set: { updatedAt: new Date() } }
  )

  return NextResponse.json({
    ok: true,
    purchased: true,
    creditsRemaining: debit.credits,
    html: listing.html || '',
    message: `Purchased "${listing.title}" for ${price} credits.`,
  })
}
