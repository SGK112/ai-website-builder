import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'
import Stripe from 'stripe'
import { getStripe, getPlanCredits, type PlanId } from '@/lib/stripe'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import clientPromise from '@/lib/mongodb'

// Marketplace collections (template_purchases, marketplace_purchases,
// community_posts, payouts_log) live in the dedicated 'ai-website-builder'
// database. Mongoose's connection.db points at voiceflow-crm (users DB).
// Webhook writes MUST use this client.db('ai-website-builder') or
// earnings/library will never see the purchase. Pre-2026-05-19 the
// webhook wrote to voiceflow-crm — Stripe-paid template/listing sales
// were invisible to the seller dashboard.
async function getMarketplaceDb() {
  const c = await clientPromise
  return c.db('ai-website-builder')
}

// session.user.id from NextAuth can be a provider account id (legacy OAuth)
// rather than a Mongo _id, so findById fails silently. Resolve by trying _id
// first, then customer email from the Stripe session as a fallback.
async function resolveUser(metadataUserId: string | undefined, email: string | undefined) {
  if (metadataUserId && mongoose.Types.ObjectId.isValid(metadataUserId)) {
    const byId = await User.findById(metadataUserId)
    if (byId) return byId
  }
  if (email) {
    const byEmail = await User.findOne({ email: email.toLowerCase() })
    if (byEmail) return byEmail
  }
  return null
}

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
        const sess: any = event.data.object

        // Platform-owned template purchase (BUILTIN_TEMPLATES on /templates).
        // Different from marketplace listings — no Connect destination, the
        // platform receives 100% of the payment. Entitlement is granted by
        // inserting into template_purchases keyed on (buyerId, templateId).
        if (sess?.metadata?.source === 'webstew-template') {
          try {
            const templateId = String(sess.metadata.template_id || '')
            const buyerId = String(sess.metadata.buyer_user_id || '')
            if (templateId && buyerId) {
              const db = await getMarketplaceDb()
              if (db) {
                // Idempotent — upsert keyed on (buyerId, templateId). A
                // retried webhook delivery won't create a second row.
                await db.collection('template_purchases').updateOne(
                  { buyerId, templateId, status: { $ne: 'refunded' } },
                  {
                    $setOnInsert: {
                      buyerId,
                      templateId,
                      stripeSessionId: sess.id,
                      stripePaymentIntentId: sess.payment_intent,
                      amountTotalCents: sess.amount_total,
                      amountCurrency: sess.currency,
                      source: 'stripe-checkout',
                      status: 'active',
                      purchasedAt: new Date(),
                    },
                  },
                  { upsert: true },
                )
                console.log(`[templates] checkout completed → entitled ${buyerId} for ${templateId}`)
              }
            }
          } catch (e: any) {
            console.error('[templates] checkout.completed handler:', e?.message || e)
          }
          break
        }

        // Marketplace direct-USD purchase path. Identified by metadata.source.
        // (Plan/credit Checkout sessions go through the legacy branch below.)
        if (sess?.metadata?.source === 'webstew-marketplace') {
          try {
            const listingId = sess.metadata.listing_id
            const buyerId = sess.metadata.buyer_user_id
            const sellerId = sess.metadata.seller_user_id
            const creditsValue = parseInt(sess.metadata.credits || '0', 10) || 0
            if (listingId && buyerId && ObjectId.isValid(listingId)) {
              // Two-database write: marketplace_purchases + community_posts
              // live in ai-website-builder; users (for the seller-earnings
              // ledger) lives in the Mongoose-default DB (voiceflow-crm).
              const mkt = await getMarketplaceDb()
              const usersDb = mongoose.connection.db
              if (mkt) {
                // Idempotent: marketplace_purchases keyed on (buyerId, listingId)
                // so retried webhook deliveries don't double-record. We
                // explicitly ignore refunded rows here so a buyer who got
                // refunded and re-purchases gets a fresh active row.
                const already = await mkt.collection('marketplace_purchases').findOne({
                  buyerId,
                  listingId,
                  status: { $ne: 'refunded' },
                })
                if (!already) {
                  const listing = await mkt
                    .collection('community_posts')
                    .findOne({ _id: new ObjectId(listingId) }, { projection: { title: 1, type: 1 } })
                  await mkt.collection('marketplace_purchases').insertOne({
                    buyerId,
                    sellerId,
                    listingId,
                    listingTitle: listing?.title || sess.metadata.listing_title || '',
                    listingType: listing?.type || 'website',
                    priceCredits: creditsValue,
                    stripeSessionId: sess.id,
                    stripePaymentIntentId: sess.payment_intent,
                    amountTotalCents: sess.amount_total,
                    amountCurrency: sess.currency,
                    source: 'stripe-checkout',
                    purchasedAt: new Date(),
                  })
                  // Bump downloads in the same DB.
                  await mkt
                    .collection('community_posts')
                    .updateOne({ _id: new ObjectId(listingId) }, { $inc: { downloads: 1 } })
                  // Seller earnings ledger is on the USER doc — different DB.
                  if (sellerId && ObjectId.isValid(sellerId) && creditsValue > 0 && usersDb) {
                    await usersDb.collection('users').updateOne(
                      { _id: new ObjectId(sellerId) },
                      { $inc: { marketplace_earnings_credits: creditsValue } }
                    )
                  }
                  console.log(`[marketplace] checkout completed → minted purchase for ${buyerId} on ${listingId}`)
                }
              }
            }
          } catch (e: any) {
            console.error('[marketplace] checkout.completed handler:', e?.message || e)
          }
          break
        }
        // Fall-through to legacy plan-checkout path below.
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata

        if (!metadata?.userId) {
          console.error('No userId in session metadata')
          break
        }

        const email = session.customer_details?.email || session.customer_email || undefined
        const user = await resolveUser(metadata.userId, email)
        if (!user) {
          console.error('User not found for session', session.id, 'metadata.userId=', metadata.userId, 'email=', email)
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

      case 'charge.refunded': {
        // Marketplace refund. Buyer (or admin via Dashboard) issued a full
        // or partial refund on a destination charge. We observe the event,
        // revoke entitlement on full refund, and write an audit row.
        // Stripe handles the application-fee reversal + transfer reversal
        // when the refund is created with reverse_transfer:true, so we
        // don't touch transfers here.
        const charge: any = event.data.object
        try {
          const paymentIntentId =
            typeof charge.payment_intent === 'string'
              ? charge.payment_intent
              : charge.payment_intent?.id
          if (!paymentIntentId) {
            console.log('[marketplace] charge.refunded: no payment_intent on charge, ignoring')
            break
          }
          // marketplace_purchases + community_posts + audit_log live in
          // ai-website-builder; user-ledger (marketplace_earnings_credits)
          // lives in voiceflow-crm via Mongoose's default connection.
          const mkt = await getMarketplaceDb()
          const usersDb = mongoose.connection.db
          if (!mkt) break
          const purchase = await mkt
            .collection('marketplace_purchases')
            .findOne({ stripePaymentIntentId: paymentIntentId })
          if (!purchase) {
            console.log(`[marketplace] charge.refunded: no purchase row for PI ${paymentIntentId}`)
            break
          }
          if (purchase.status === 'refunded') {
            console.log(`[marketplace] charge.refunded: ${purchase._id} already refunded, skipping`)
            break
          }
          const amountRefunded = Number(charge.amount_refunded) || 0
          const amountTotal = Number(charge.amount) || 0
          const isFullRefund = amountRefunded >= amountTotal && amountTotal > 0
          if (!isFullRefund) {
            // Partial refund — log it but leave entitlement intact. The
            // buyer still gets the asset they paid (most of) for.
            await mkt.collection('marketplace_purchases').updateOne(
              { _id: purchase._id },
              {
                $set: {
                  partialRefundCents: amountRefunded,
                  partialRefundedAt: new Date(),
                },
              }
            )
            console.log(
              `[marketplace] partial refund logged: ${amountRefunded}/${amountTotal} on ${purchase._id}`
            )
            break
          }
          // Full refund — revoke entitlement, reverse counters.
          await mkt.collection('marketplace_purchases').updateOne(
            { _id: purchase._id },
            {
              $set: {
                status: 'refunded',
                refundedAt: new Date(),
                refundAmountCents: amountRefunded,
                stripeChargeId: charge.id,
              },
            }
          )
          if (purchase.listingId && ObjectId.isValid(purchase.listingId)) {
            await mkt
              .collection('community_posts')
              .updateOne({ _id: new ObjectId(purchase.listingId) }, { $inc: { downloads: -1 } })
          }
          const priceCredits = Number(purchase.priceCredits) || 0
          if (
            purchase.sellerId &&
            ObjectId.isValid(purchase.sellerId) &&
            priceCredits > 0 &&
            usersDb
          ) {
            await usersDb
              .collection('users')
              .updateOne(
                { _id: new ObjectId(purchase.sellerId) },
                { $inc: { marketplace_earnings_credits: -priceCredits } }
              )
          }
          await mkt.collection('audit_log').insertOne({
            type: 'marketplace_refund',
            listingId: purchase.listingId,
            buyerId: purchase.buyerId,
            sellerId: purchase.sellerId,
            stripePaymentIntentId: paymentIntentId,
            stripeChargeId: charge.id,
            amountRefundedCents: amountRefunded,
            priceCredits,
            at: new Date(),
          })
          console.log(
            `[marketplace] refund processed for ${purchase._id} buyer=${purchase.buyerId} listing=${purchase.listingId}`
          )
        } catch (e: any) {
          console.error('[marketplace] charge.refunded handler:', e?.message || e)
        }
        break
      }

      // ────────── Stripe Connect (marketplace) events ──────────
      // These fire on Connect platform events. `event.account` is set when
      // the event is on a connected account (Express seller). For platform-
      // level events (transfer succeeded/failed) `event.account` is absent.
      case 'account.updated': {
        // A seller's onboarding state changed (e.g., charges_enabled flipped).
        // Cache the latest flags on the user doc so the PayoutsCard reflects
        // status without hitting Stripe on every page load. users lives in
        // the Mongoose-default DB (voiceflow-crm).
        const acct: any = event.data.object
        if (acct?.id) {
          const usersDb = mongoose.connection.db
          if (usersDb) {
            await usersDb.collection('users').updateOne(
              { stripe_account_id: acct.id },
              {
                $set: {
                  stripe_charges_enabled: !!acct.charges_enabled,
                  stripe_payouts_enabled: !!acct.payouts_enabled,
                  stripe_details_submitted: !!acct.details_submitted,
                  stripe_account_status_updated_at: new Date(),
                },
              }
            )
          }
        }
        break
      }
      case 'transfer.created':
      case 'transfer.updated':
      case 'transfer.reversed': {
        // Record the transfer state on our payouts_log row.
        // payouts_log lives in the marketplace DB (ai-website-builder).
        const tr: any = event.data.object
        const mkt = await getMarketplaceDb()
        if (mkt && tr?.id) {
          await mkt.collection('payouts_log').updateOne(
            { stripeTransferId: tr.id },
            {
              $set: {
                status: event.type.split('.')[1],
                stripeStatus: tr.status,
                stripeAmount: tr.amount,
                stripeCurrency: tr.currency,
                updatedAt: new Date(),
              },
              $setOnInsert: { stripeTransferId: tr.id, createdAt: new Date() },
            },
            { upsert: true }
          )
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
