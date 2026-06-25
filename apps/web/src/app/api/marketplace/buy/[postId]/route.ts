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

// Ensure the (buyerId, listingId) uniqueness guard once per process. If legacy
// duplicate rows exist from before this guard, createIndex will fail — logged,
// not fatal (the compensating refund below still protects the buyer).
let purchaseIndexEnsured = false
async function ensurePurchaseIndex(db: any) {
  if (purchaseIndexEnsured) return
  purchaseIndexEnsured = true
  try {
    await db.collection('marketplace_purchases').createIndex({ buyerId: 1, listingId: 1 }, { unique: true })
  } catch (e: any) {
    console.error('[buy] could not create unique purchase index (dedupe legacy rows?):', e?.message || e)
  }
}

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

  // The buyer is now debited. The seller-credit and entitlement writes that
  // follow are NOT in the same atomic unit (they span two clients/DBs), so any
  // failure here must COMPENSATE — re-credit the buyer (and reverse the seller
  // credit if it landed) — otherwise the buyer pays for nothing.
  const sellerValid = listing.author?.id && ObjectId.isValid(listing.author.id)
  const sellerObjId = sellerValid ? new ObjectId(listing.author.id) : null
  // Platform keeps a 3% fee; the seller receives 97% as SPENDABLE credits
  // (money in, never out — earned credits are used on the platform, not cashed
  // out to USD). The 3% difference is platform margin (the cash already came in
  // when those credits were originally purchased).
  const sellerShare = Math.max(0, price - Math.ceil(price * 0.03))
  const refundBuyer = async () => {
    try { await userDb.collection('users').updateOne({ _id: buyerId }, { $inc: { credits: price }, $set: { updatedAt: new Date() } }) }
    catch (e) { console.error('[buy] CRITICAL: buyer refund failed for', String(buyerId), e) }
  }
  const reverseSeller = async () => {
    if (!sellerObjId || sellerShare <= 0) return
    try {
      await userDb.collection('users').updateOne(
        { _id: sellerObjId },
        [{ $set: { credits: { $max: [{ $subtract: [{ $ifNull: ['$credits', 0] }, sellerShare] }, 0] } } }],
      )
    } catch (e) { console.error('[buy] seller-credit reversal failed for', String(sellerObjId), e) }
  }

  await ensurePurchaseIndex(db)

  let sellerCredited = false
  try {
    if (sellerObjId && sellerShare > 0) {
      await userDb.collection('users').updateOne(
        { _id: sellerObjId },
        { $inc: { credits: sellerShare }, $set: { updatedAt: new Date() } },
      )
      sellerCredited = true
    }
    // Entitlement row. Unique index makes a concurrent double-buy throw E11000
    // here instead of double-charging — we refund this request's debit.
    await db.collection('marketplace_purchases').insertOne({
      buyerId: String(buyerId),
      sellerId: String(listing.author?.id || ''),
      listingId: String(postId),
      listingTitle: listing.title,
      listingType: listing.type,
      priceCredits: price,
      sellerCredits: sellerShare,
      platformFeeCredits: price - sellerShare,
      purchasedAt: new Date(),
    })
  } catch (e: any) {
    await refundBuyer()
    if (sellerCredited) await reverseSeller()
    if (e?.code === 11000) {
      // Another concurrent request already recorded this purchase — the buyer
      // wasn't meant to pay twice, so the refund above makes them whole.
      return NextResponse.json({ ok: true, alreadyOwned: true, html: listing.html || '', message: 'You already own this listing.' })
    }
    console.error('[buy] post-debit write failed — refunded buyer:', e?.message || e)
    return NextResponse.json({ error: 'Purchase could not be completed. Your credits were not charged.' }, { status: 500 })
  }

  // Purchase is committed. Downloads bump is cosmetic — best-effort only, never
  // worth refunding a completed purchase over.
  try {
    await db.collection('community_posts').updateOne(
      { _id: postId },
      { $inc: { downloads: 1 }, $set: { updatedAt: new Date() } },
    )
  } catch (e: any) {
    console.warn('[buy] downloads bump failed (non-fatal):', e?.message || e)
  }

  return NextResponse.json({
    ok: true,
    purchased: true,
    creditsRemaining: debit.credits,
    html: listing.html || '',
    message: `Purchased "${listing.title}" for ${price} credits.`,
  })
}
