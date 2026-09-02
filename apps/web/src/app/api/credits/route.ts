import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { createCreditsCheckoutSession, CREDIT_PACKAGES, CREDIT_COSTS } from '@/lib/stripe'
import { ANON_COOKIE, startingCreditsFor, anonCreditsSpent, NEW_ACCOUNT_CREDITS } from '@/lib/anon-credits'

// session.user.id may be a provider account id (legacy OAuth) — try _id first
// then fall back to email so we don't 404 on real, signed-in users.
async function findSessionUser(sessionUserId: string | undefined, email: string | undefined) {
  if (sessionUserId && mongoose.Types.ObjectId.isValid(sessionUserId)) {
    const u = await User.findById(sessionUserId)
    if (u) return u
  }
  if (email) {
    const u = await User.findOne({ email: email.toLowerCase() })
    if (u) return u
  }
  return null
}

// GET - Get user credits and usage info
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Anonymous users. This used to answer a flat 100 no matter how much the
    // visitor had already built — so the counter never moved, nothing ever
    // looked spent, and there was no visible reason to sign up. The meter has
    // existed all along in the `wsanon` cookie that /api/builder/generate
    // increments; this endpoint just wasn't reading it.
    if (!session?.user?.id) {
      const cookie = req.cookies.get(ANON_COOKIE)?.value
      return NextResponse.json({
        credits: startingCreditsFor(cookie),
        creditsUsed: anonCreditsSpent(cookie),
        creditsTotal: NEW_ACCOUNT_CREDITS,
        plan: 'demo',
        subscriptionStatus: 'active',
        isDemo: true,
        creditCosts: CREDIT_COSTS,
        packages: CREDIT_PACKAGES.map((p) => ({
          id: p.id,
          name: p.name,
          credits: p.credits,
          price: p.priceUsd / 100,
          popular: p.popular,
          savings: p.savings,
        })),
      })
    }

    await connectDB()
    const user = await findSessionUser(session.user.id, session.user.email || undefined)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      credits: user.credits,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      creditCosts: CREDIT_COSTS,
      packages: CREDIT_PACKAGES.map((p) => ({
        id: p.id,
        name: p.name,
        credits: p.credits,
        price: p.priceUsd / 100,
        popular: p.popular,
        savings: p.savings,
      })),
    })
  } catch (error: any) {
    console.error('Error getting credits:', error)
    return NextResponse.json({ error: 'Failed to get credits' }, { status: 500 })
  }
}

// POST - Purchase credits
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await req.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${origin}/dashboard?credits_success=true`
    const cancelUrl = `${origin}/upgrade?canceled=true`

    await connectDB()
    const dbUser = await findSessionUser(session.user.id, session.user.email || undefined)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const checkoutUrl = await createCreditsCheckoutSession(
      dbUser._id.toString(),
      packageId,
      successUrl,
      cancelUrl,
      session.user.email || undefined
    )

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create checkout session. Stripe may not be configured.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    console.error('Error creating checkout:', error)
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 })
  }
}

// PATCH - Use credits (internal use by other APIs)
export async function PATCH(req: NextRequest) {
  try {
    const { amount, operation } = await req.json()
    const session = await getServerSession(authOptions)

    // Anonymous (no session) → demo usage, nothing to deduct. The builder is
    // anon-first and bounds anon usage client-side (cookie). We NEVER trust a
    // client-supplied userId here — that let an UNAUTHENTICATED caller deduct
    // from any user's balance (drain attack).
    if (!session?.user?.id) {
      // Anon spend is metered server-side by the `wsanon` cookie on the build
      // route itself, not here — deducting again would double-count. But the
      // balance we report back has to be the REAL remaining one, or the client
      // shows a full bar to someone who has spent most of their allowance.
      const cookie = req.cookies.get(ANON_COOKIE)?.value
      return NextResponse.json({
        success: true,
        credits: startingCreditsFor(cookie),
        creditsUsed: anonCreditsSpent(cookie),
        deducted: 0,
        operation,
        isDemo: true,
      })
    }

    const amt = Math.max(0, Math.floor(Number(amount) || 0))
    await connectDB()

    // Resolve the real user from the SESSION ONLY (findSessionUser also handles
    // the legacy provider-id case where session.user.id != the Mongo _id).
    const user = await findSessionUser(session.user.id, session.user.email || undefined)
    if (!user) {
      console.error('[Credits PATCH] User not found — sessionId=', session.user.id, 'email=', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (amt === 0) {
      return NextResponse.json({ success: true, credits: typeof user.credits === 'number' ? user.credits : 0, deducted: 0, operation })
    }

    // Atomic conditional deduction — the credits>=amt guard lives in the filter
    // so two concurrent deducts can't drive the balance negative or lose an
    // update (the old read-modify-save raced with itself and every other grant).
    const updated = await User.findOneAndUpdate(
      { _id: user._id, credits: { $gte: amt } },
      { $inc: { credits: -amt }, $set: { updatedAt: new Date() } },
      { new: true },
    )
    if (!updated) {
      const cur = typeof user.credits === 'number' ? user.credits : 0
      return NextResponse.json({ error: 'Insufficient credits', credits: cur, required: amt }, { status: 402 })
    }

    console.log(`[Credits PATCH] User ${updated._id} ${operation}: -${amt} = ${updated.credits}`)
    return NextResponse.json({ success: true, credits: updated.credits, deducted: amt, operation })
  } catch (error: any) {
    console.error('Error using credits:', error)
    return NextResponse.json({ error: 'Failed to use credits' }, { status: 500 })
  }
}
