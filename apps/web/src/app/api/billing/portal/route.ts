// POST /api/billing/portal — create a Stripe billing portal session for the
// signed-in user. The portal lets them swap plans, update card, cancel.
//
// Requires the user to have a stripeCustomerId, which is set by the webhook
// on first successful subscription checkout. Returns 400 if missing so the
// UI can surface a useful message instead of a silent 500.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await connectDB()
    let user: any = null
    if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      user = await User.findById(session.user.id).select('stripeCustomerId').lean()
    }
    if (!user) {
      user = await User.findOne({ email: session.user.email.toLowerCase() }).select('stripeCustomerId').lean()
    }

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription. Pick a plan first.' },
        { status: 400 }
      )
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const returnUrl = `${origin}/upgrade`

    const url = await createPortalSession(user.stripeCustomerId, returnUrl)
    if (!url) {
      return NextResponse.json(
        { error: 'Stripe is not configured (STRIPE_SECRET_KEY missing).' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
