// GET /api/stripe/connect/status — return the current user's Connect
// account status so /profile can show "Onboarding in progress" /
// "Payouts enabled" / "Not set up" without round-tripping Stripe on
// every page load. Falls back gracefully if Stripe is unconfigured.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(session.user.id) },
    { projection: { stripe_account_id: 1 } }
  )
  if (!user?.stripe_account_id) {
    return NextResponse.json({ connected: false, status: 'not_started' })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ connected: false, status: 'stripe_unconfigured', accountId: user.stripe_account_id })
  }
  try {
    const account = await stripe.accounts.retrieve(user.stripe_account_id)
    // Express accounts report charges_enabled / payouts_enabled once Stripe
    // has verified the seller's identity + bank details. requirements.currently_due
    // lists anything blocking them — surface the first item so the UI can show
    // "you still need to add X."
    const charges = !!account.charges_enabled
    const payouts = !!account.payouts_enabled
    const needs = (account.requirements?.currently_due || [])[0] || null
    let status: 'not_started' | 'pending' | 'restricted' | 'enabled' = 'pending'
    if (charges && payouts) status = 'enabled'
    else if (account.requirements?.disabled_reason) status = 'restricted'
    return NextResponse.json({
      connected: true,
      status,
      accountId: user.stripe_account_id,
      chargesEnabled: charges,
      payoutsEnabled: payouts,
      pendingRequirement: needs,
    })
  } catch (e: any) {
    return NextResponse.json({ connected: false, status: 'error', error: e?.message }, { status: 200 })
  }
}
