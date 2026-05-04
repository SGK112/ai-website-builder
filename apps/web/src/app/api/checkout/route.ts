import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSubscriptionCheckoutSession, createCreditsCheckoutSession, SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { planId, packageId, billingPeriod } = body

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${origin}/workspace?upgraded=true`
    const cancelUrl = `${origin}/upgrade?canceled=true`

    // Handle subscription checkout
    if (planId) {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

      if (!plan) {
        return NextResponse.json(
          { error: 'Invalid plan' },
          { status: 400 }
        )
      }

      if (planId === 'free') {
        return NextResponse.json(
          { error: 'Cannot checkout for free plan' },
          { status: 400 }
        )
      }

      const period = billingPeriod === 'annual' || billingPeriod === 'yearly' ? 'annual' : 'monthly'

      const checkoutUrl = await createSubscriptionCheckoutSession(
        session.user.id,
        session.user.email,
        planId,
        successUrl,
        cancelUrl,
        period
      )

      if (!checkoutUrl) {
        return NextResponse.json(
          { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY and price IDs.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ url: checkoutUrl })
    }

    // Handle credits checkout
    if (packageId) {
      const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId)

      if (!creditPackage) {
        return NextResponse.json(
          { error: 'Invalid credit package' },
          { status: 400 }
        )
      }

      const checkoutUrl = await createCreditsCheckoutSession(
        session.user.id,
        packageId,
        successUrl,
        cancelUrl
      )

      if (!checkoutUrl) {
        return NextResponse.json(
          { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY and price IDs.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ url: checkoutUrl })
    }

    return NextResponse.json(
      { error: 'Either planId or packageId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
