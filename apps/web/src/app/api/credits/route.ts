import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { createCreditsCheckoutSession, CREDIT_PACKAGES, CREDIT_COSTS } from '@/lib/stripe'

// GET - Get user credits and usage info
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // For anonymous users, return demo credits
    if (!session?.user?.id) {
      return NextResponse.json({
        credits: 100, // Demo credits for anonymous users
        plan: 'demo',
        subscriptionStatus: 'active',
        isDemo: true,
        creditCosts: CREDIT_COSTS,
        packages: CREDIT_PACKAGES.map((p) => ({
          id: p.id,
          name: p.name,
          credits: p.credits,
          price: p.price / 100,
          popular: p.popular,
          savings: p.savings,
        })),
      })
    }

    await connectDB()
    const user = await User.findById(session.user.id)

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
        price: p.price / 100, // Convert to dollars
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

    const checkoutUrl = await createCreditsCheckoutSession(
      session.user.id,
      packageId,
      successUrl,
      cancelUrl
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
    const { userId, amount, operation } = await req.json()

    // Verify internal API key
    const apiKey = req.headers.get('x-internal-api-key')
    if (apiKey !== process.env.INTERNAL_API_KEY && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await getServerSession(authOptions)
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(targetUserId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has enough credits
    if (user.credits < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          credits: user.credits,
          required: amount,
        },
        { status: 402 }
      )
    }

    // Deduct credits
    user.credits -= amount
    await user.save()

    return NextResponse.json({
      success: true,
      credits: user.credits,
      deducted: amount,
      operation,
    })
  } catch (error: any) {
    console.error('Error using credits:', error)
    return NextResponse.json({ error: 'Failed to use credits' }, { status: 500 })
  }
}
