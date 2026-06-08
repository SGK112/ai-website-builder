// POST /api/marketplace/payout
//
// Cashout the caller's marketplace earnings (credits) to USD via Stripe
// Connect. Atomic: only debits the ledger if the Stripe transfer succeeds.
//
// Knobs (env, tweak without redeploy):
//   MARKETPLACE_CREDIT_USD_CENTS  default 1   (1 credit = $0.01)
//   MARKETPLACE_PAYOUT_MIN_CENTS  default 500 ($5 min — below this Stripe
//                                              transfer fees eat the seller's pay)
//
// Body: { amount?: number }
//   amount = credits to cash out. Defaults to full balance.

import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

const CENTS_PER_CREDIT = Math.max(1, parseInt(process.env.MARKETPLACE_CREDIT_USD_CENTS || '1', 10) || 1)
const MIN_PAYOUT_CENTS = Math.max(100, parseInt(process.env.MARKETPLACE_PAYOUT_MIN_CENTS || '500', 10) || 500)

export async function POST(req: NextRequest) {
  const blocked = guardAnonAbuse(req, { rateLimit: 'marketplacePayout' })
  if (blocked) return blocked
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const stripe = await getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const userId = new ObjectId(session.user.id)

  const user = await db.collection('users').findOne(
    { _id: userId },
    {
      projection: {
        marketplace_earnings_credits: 1,
        stripe_account_id: 1,
        stripe_charges_enabled: 1,
        stripe_payouts_enabled: 1,
      },
    }
  )
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!user.stripe_account_id) {
    return NextResponse.json(
      { error: 'Set up your Stripe payout account first.', needsOnboarding: true },
      { status: 412 }
    )
  }
  if (!user.stripe_payouts_enabled) {
    return NextResponse.json(
      { error: 'Your Stripe account is not yet enabled for payouts. Finish Stripe onboarding.', needsOnboarding: true },
      { status: 412 }
    )
  }

  let body: { amount?: number } = {}
  try { body = await req.json() } catch {}
  const available: number = user.marketplace_earnings_credits || 0
  const requested = Math.floor(Number(body.amount) || available)
  if (requested <= 0) return NextResponse.json({ error: 'Nothing to cash out.' }, { status: 400 })
  if (requested > available) {
    return NextResponse.json({ error: `Only ${available} credits available.` }, { status: 400 })
  }

  const cents = requested * CENTS_PER_CREDIT
  if (cents < MIN_PAYOUT_CENTS) {
    return NextResponse.json(
      { error: `Minimum cashout is ${MIN_PAYOUT_CENTS / 100} USD (${Math.ceil(MIN_PAYOUT_CENTS / CENTS_PER_CREDIT)} credits).`, minCredits: Math.ceil(MIN_PAYOUT_CENTS / CENTS_PER_CREDIT) },
      { status: 400 }
    )
  }

  // Atomic debit FIRST — refund on transfer failure. Using $inc with $gte
  // gate so concurrent payout calls can't double-spend.
  const debit = await db.collection('users').findOneAndUpdate(
    { _id: userId, marketplace_earnings_credits: { $gte: requested } },
    {
      $inc: { marketplace_earnings_credits: -requested },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  )
  // mongodb driver v6: findOneAndUpdate returns the document DIRECTLY (no
  // {value} wrapper). The old `debit?.value` was always undefined, so every
  // payout failed with 409 — AFTER the earnings were already decremented,
  // meaning sellers could lose credits without getting paid.
  if (!debit) {
    return NextResponse.json({ error: 'Balance changed mid-flight, please retry.' }, { status: 409 })
  }

  // Idempotency key — Stripe transfers MUST be idempotent on retry. The key
  // is unique per (user, credits, timestamp-minute) so a double-click
  // doesn't double-pay but a deliberate retry an hour later does.
  const idempotencyKey = `payout_${userId.toString()}_${requested}_${Math.floor(Date.now() / 60000)}`

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: cents,
        currency: 'usd',
        destination: user.stripe_account_id,
        description: `Webstew marketplace payout · ${requested} credits`,
        metadata: {
          user_id: String(userId),
          credits: String(requested),
          source: 'webstew-marketplace-payout',
        },
      },
      { idempotencyKey }
    )

    // Record the payout for the audit trail. status will get updated by the
    // webhook when Stripe finishes routing the money.
    await db.collection('payouts_log').insertOne({
      userId: String(userId),
      stripeTransferId: transfer.id,
      stripeAccountId: user.stripe_account_id,
      credits: requested,
      amountCents: cents,
      currency: 'usd',
      status: 'created',
      createdAt: new Date(),
    })

    return NextResponse.json({
      ok: true,
      transferId: transfer.id,
      credits: requested,
      amountUsd: cents / 100,
      balanceRemaining: (debit.marketplace_earnings_credits || 0),
    })
  } catch (e: any) {
    // Roll back the credit debit — transfer didn't go.
    await db.collection('users').updateOne(
      { _id: userId },
      { $inc: { marketplace_earnings_credits: requested }, $set: { updatedAt: new Date() } }
    )
    console.error('[marketplace/payout] transfer failed:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Transfer failed' }, { status: 500 })
  }
}
