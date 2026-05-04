import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe, getPlanCredits, type PlanId } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'

// Track processed event IDs to prevent duplicate processing (in production, use Redis/DB)
const processedEvents = new Set<string>()
const MAX_PROCESSED_EVENTS = 1000

export async function POST(req: NextRequest) {
  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  // Validate webhook secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEvent>>

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check - prevent duplicate event processing
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Add to processed events (cleanup if too many)
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const iterator = processedEvents.values()
    for (let i = 0; i < 100; i++) {
      const result = iterator.next()
      if (result.done || !result.value) break
      processedEvents.delete(result.value)
    }
  }
  processedEvents.add(event.id)

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
          user.plan = metadata.planId as PlanId
          user.stripeCustomerId = session.customer as string
          user.subscriptionStatus = 'active'

          const grant = getPlanCredits(metadata.planId)
          if (grant > 0) {
            user.credits = (user.credits || 0) + grant
          }

          await user.save()
          console.log(`Updated user ${user._id} to ${metadata.planId} plan (+${grant} credits)`)
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
            const grant = getPlanCredits(user.plan)
            if (grant > 0) {
              user.credits = (user.credits || 0) + grant
              await user.save()
              console.log(`Added ${grant} monthly credits to user ${user._id} (${user.plan})`)
            }
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
