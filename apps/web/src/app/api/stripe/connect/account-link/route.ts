// POST /api/stripe/connect/account-link
//
// Creates a Stripe Express account for the current user if they don't have
// one, then returns a one-time onboarding URL the client redirects to.
// After the user completes (or refreshes) onboarding at Stripe, they
// land back on /profile?stripe=<status>.
//
// Persists stripe_account_id on the User doc. Payouts are NOT created
// here — that happens at purchase time via stripe.transfers.create with
// destination = the seller's account id.
//
// Prereqs (one-time, by Joshua, in Stripe dashboard):
//   - Connect enabled on the platform account
//   - Express accounts allowed
//   - Branding + business URL configured

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net').replace(/\/$/, '')

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  // Use Mongoose's User model — same path NextAuth uses to log the user in,
  // which means we hit the correct database. The previous client.db('ai-website-builder')
  // looked in a different DB than where the user actually exists (Mongoose
  // default DB from the connection-string path component), so every
  // sign-in flow saw "User not found" here.
  await connectDB()
  const userId = session.user.id
  let user: any = await User.findById(userId).lean()
  // Fallback by email — covers cases where session.user.id and the user
  // doc _id drifted (provider-linked OAuth migrations).
  if (!user && session.user.email) {
    user = await User.findOne({ email: session.user.email.toLowerCase() }).lean()
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    let accountId: string | undefined = user.stripe_account_id || user.stripeAccountId

    // Step 1 — create the Express account if we don't have one. capabilities
    // requested: transfers (the platform sends funds out to this seller)
    // and card_payments (so they can take direct card payments too in v2).
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || undefined,
        metadata: {
          user_id: String(userId),
          username: user.username || '',
          source: 'webstew-marketplace',
        },
        capabilities: {
          transfers:     { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: { schedule: { interval: 'manual' } },
        },
      })
      accountId = account.id
      // Update via Mongoose's User model. Use $set on the raw driver
      // because adding new fields outside the registered schema gets
      // stripped by doc.save() — same gotcha as the marketplace v1 cms
      // field bug noted in project memory.
      const conn = await connectDB()
      const rawDb = conn.connection.db
      if (rawDb) {
        await rawDb.collection('users').updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $set: { stripe_account_id: accountId, stripe_account_created_at: new Date(), updatedAt: new Date() } }
        )
      }
    }

    // Step 2 — Stripe-hosted onboarding link. One-time use, short TTL.
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SITE_URL}/profile?stripe=refresh`,
      return_url:  `${SITE_URL}/profile?stripe=connected`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: link.url, accountId })
  } catch (e: any) {
    console.error('[stripe.connect] error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed to create onboarding link' }, { status: 500 })
  }
}
