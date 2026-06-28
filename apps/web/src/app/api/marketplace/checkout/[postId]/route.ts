// POST /api/marketplace/checkout/[postId]
//
// Real-money purchase via Stripe Checkout Session + destination charge.
// The seller must have a fully-onboarded Stripe Connect (Express) account.
//
// Money path (platform NEVER pays out of its own funds):
//   buyer card → platform Stripe balance
//                ↓ application_fee_amount (3%) stays on the platform
//   transfer →   seller's connected account  (seller gets 97%, in THEIR account)
//
// Knobs (env):
//   MARKETPLACE_CREDIT_USD_CENTS  default 1   (1 credit = $0.01 list price)
//   MARKETPLACE_PLATFORM_FEE_BPS  default 300 (3.00% platform fee)
//
// The marketplace_purchase row is minted from the webhook on
// checkout.session.completed — Stripe is the source of truth that money moved.

import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import clientPromise from '@/lib/mongodb'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const CENTS_PER_CREDIT = Math.max(1, parseInt(process.env.MARKETPLACE_CREDIT_USD_CENTS || '1', 10) || 1)
// 3% platform fee. (Was defaulting to 3000 BPS = 30%.)
const PLATFORM_FEE_BPS = Math.max(0, parseInt(process.env.MARKETPLACE_PLATFORM_FEE_BPS || '300', 10) || 300)
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net').replace(/\/$/, '')

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const blocked = await guardAnonAbuse(req, { rateLimit: 'marketplaceBuy' })
  if (blocked) return blocked
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!ObjectId.isValid(params.postId)) return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 })
  if (!ObjectId.isValid(session.user.id)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })

  const stripe = await getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })

  // Listings live in the marketplace DB; users (+ their Connect account ids)
  // live in the DEFAULT DB (voiceflow-crm via Mongoose). Reading the seller from
  // the marketplace DB was the "seller hasn't finished Stripe setup" bug.
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const userConn = await connectDB()
  const userDb = userConn.connection.db
  if (!userDb) return NextResponse.json({ error: 'DB not connected' }, { status: 503 })
  const buyerId = new ObjectId(session.user.id)
  const postId = new ObjectId(params.postId)

  const listing = await db.collection('community_posts').findOne({ _id: postId })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.status === 'rejected') return NextResponse.json({ error: 'Listing unavailable' }, { status: 410 })

  const credits = Number(listing.price_credits) || 0
  if (!listing.isPremium || credits <= 0) {
    return NextResponse.json({ error: 'This listing is free — no purchase needed.', free: true }, { status: 400 })
  }
  if (String(listing.author?.id || '') === String(buyerId)) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 })
  }

  // Idempotency — already bought it?
  const owned = await db
    .collection('marketplace_purchases')
    .findOne({ buyerId: String(buyerId), listingId: String(postId) }, { projection: { _id: 1 } })
  if (owned) {
    return NextResponse.json({ alreadyOwned: true, redirect: `/library?owned=${postId}` })
  }

  // Pull the seller (DEFAULT DB) to verify Stripe Connect is fully set up.
  const sellerId = listing.author?.id
  if (!sellerId || !ObjectId.isValid(sellerId)) {
    return NextResponse.json({ error: 'Listing has no payable seller.' }, { status: 422 })
  }
  const seller = await userDb.collection('users').findOne(
    { _id: new ObjectId(sellerId) },
    { projection: { stripe_account_id: 1, stripe_payouts_enabled: 1, stripe_charges_enabled: 1, email: 1 } }
  )
  if (!seller?.stripe_account_id || !seller.stripe_charges_enabled) {
    return NextResponse.json(
      { error: "This seller hasn't finished Stripe payout setup yet. We've nudged them — please try again later." },
      { status: 422 }
    )
  }

  const amountCents = credits * CENTS_PER_CREDIT
  if (amountCents < 50) {
    // Stripe's minimum charge is 50¢ USD.
    return NextResponse.json({ error: 'Listing price is below the $0.50 minimum.' }, { status: 422 })
  }
  // Platform fee in basis points: 3% = 300 BPS.
  const applicationFeeCents = Math.floor((amountCents * PLATFORM_FEE_BPS) / 10000)

  try {
    // Single-payable-session guard: expire any prior open session for this
    // (buyer, listing) so a double-submit can't complete two charges.
    const prev = await db
      .collection('marketplace_checkout_sessions')
      .findOne({ buyerId: String(buyerId), listingId: String(postId) })
    if (prev?.sessionId) {
      await stripe.checkout.sessions.expire(prev.sessionId).catch(() => {})
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Card only — delayed-settlement methods (ACH/bank debit) would let
      // checkout.session.completed fire BEFORE the money actually settles, so we
      // could fulfill (transfer to the seller) on a payment that later fails.
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: listing.title,
              description: (listing.description || '').slice(0, 500),
              images: listing.thumbnail ? [listing.thumbnail] : undefined,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: seller.stripe_account_id,
        },
        metadata: {
          app: 'webstew', // isolates from VoiceNow on the shared Stripe account
          listing_id: String(postId),
          buyer_user_id: String(buyerId),
          seller_user_id: String(sellerId),
          credits: String(credits),
          source: 'webstew-marketplace',
        },
      },
      // Surface the same metadata on the session so the webhook can read it
      // without descending into payment_intent.
      metadata: {
        app: 'webstew',
        listing_id: String(postId),
        buyer_user_id: String(buyerId),
        seller_user_id: String(sellerId),
        credits: String(credits),
        source: 'webstew-marketplace',
      },
      customer_email: session.user.email || undefined,
      success_url: `${SITE_URL}/library?purchase=success&listingId=${postId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE_URL}/listings/${postId}?canceled=1`,
    })

    await db.collection('marketplace_checkout_sessions').updateOne(
      { buyerId: String(buyerId), listingId: String(postId) },
      { $set: { sessionId: checkout.id, createdAt: new Date() } },
      { upsert: true },
    )

    return NextResponse.json({ url: checkout.url, sessionId: checkout.id })
  } catch (e: any) {
    console.error('[marketplace/checkout] failed:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Checkout failed' }, { status: 500 })
  }
}
