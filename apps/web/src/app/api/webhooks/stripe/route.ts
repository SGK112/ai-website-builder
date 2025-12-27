import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'

export async function POST(req: NextRequest) {
  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEvent>>

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  await connectDB()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata

        if (!metadata?.userId) {
          console.error('No userId in session metadata')
          break
        }

        const user = await User.findById(metadata.userId)
        if (!user) {
          console.error('User not found:', metadata.userId)
          break
        }

        // Handle credit purchase
        if (metadata.type === 'credits' && metadata.credits) {
          const creditsToAdd = parseInt(metadata.credits, 10)
          user.credits = (user.credits || 0) + creditsToAdd
          await user.save()
          console.log(`Added ${creditsToAdd} credits to user ${user._id}`)
        }

        // Handle subscription
        if (metadata.type === 'subscription' && metadata.planId) {
          user.plan = metadata.planId as 'free' | 'pro' | 'enterprise'
          user.stripeCustomerId = session.customer as string
          user.subscriptionStatus = 'active'

          // Add monthly credits based on plan
          if (metadata.planId === 'pro') {
            user.credits = (user.credits || 0) + 500
          } else if (metadata.planId === 'team') {
            user.credits = (user.credits || 0) + 2000
          }

          await user.save()
          console.log(`Updated user ${user._id} to ${metadata.planId} plan`)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await User.findOne({ stripeCustomerId: customerId })
        if (user) {
          user.subscriptionStatus = subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
          await user.save()
          console.log(`Updated subscription status for user ${user._id}: ${subscription.status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await User.findOne({ stripeCustomerId: customerId })
        if (user) {
          user.plan = 'free'
          user.subscriptionStatus = 'canceled'
          await user.save()
          console.log(`Subscription canceled for user ${user._id}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Only process for recurring payments (not first payment)
        if (invoice.billing_reason === 'subscription_cycle') {
          const user = await User.findOne({ stripeCustomerId: customerId })
          if (user) {
            // Add monthly credits based on plan
            if (user.plan === 'pro') {
              user.credits = (user.credits || 0) + 500
            } else if (user.plan === 'team' || user.plan === 'enterprise') {
              user.credits = (user.credits || 0) + 2000
            }
            await user.save()
            console.log(`Added monthly credits to user ${user._id}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await User.findOne({ stripeCustomerId: customerId })
        if (user) {
          user.subscriptionStatus = 'past_due'
          await user.save()
          console.log(`Payment failed for user ${user._id}`)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
