// GET /api/stripe/connect/status — return the current user's Connect
// account status so /profile can show "Onboarding in progress" /
// "Payouts enabled" / "Not set up" without round-tripping Stripe on
// every page load. Falls back gracefully if Stripe is unconfigured.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  // Use Mongoose so we hit the correct database — the previous raw-driver
  // client.db('ai-website-builder') looked in a different DB than where
  // users actually live, returning "not_started" for everyone.
  await connectDB()
  let user: any = await User.findById(session.user.id).select('stripe_account_id stripeAccountId email').lean()
  if (!user && session.user.email) {
    user = await User.findOne({ email: session.user.email.toLowerCase() }).select('stripe_account_id stripeAccountId').lean()
  }
  const accountId = user?.stripe_account_id || user?.stripeAccountId
  if (!accountId) {
    return NextResponse.json({ connected: false, status: 'not_started' })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ connected: false, status: 'stripe_unconfigured', accountId: accountId })
  }
  try {
    const account = await stripe.accounts.retrieve(accountId)
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
      accountId: accountId,
      chargesEnabled: charges,
      payoutsEnabled: payouts,
      pendingRequirement: needs,
    })
  } catch (e: any) {
    return NextResponse.json({ connected: false, status: 'error', error: e?.message }, { status: 200 })
  }
}
