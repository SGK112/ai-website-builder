// POST /api/templates/checkout/[id] — start a Stripe Checkout for a
// platform-owned template (the BUILTIN_TEMPLATES list on /templates).
//
// Unlike the marketplace flow (which uses Connect destination charges
// to pay third-party sellers), platform templates are owned by Webstew
// LLC — the full payment lands in the platform's Stripe account.
//
// Entitlement is granted by the webhook handler at /api/webhooks/stripe
// when checkout.session.completed fires with metadata.source =
// 'webstew-template'. See template_purchases collection.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// Per-template USD pricing. Keep here (not in lib/templates/index.ts)
// so the user-facing price never depends on metadata that an AI-edited
// template file might overwrite. To add a new paid template: add an
// entry here + flip is_premium: true on its /templates/page.tsx row +
// ENSURE the template id exists in lib/templates/index.ts (real HTML
// behind it). Charging for an ID with no HTML = paying users land on
// "Template not found" — a previously-shipped bug. Don't repeat.
const TEMPLATE_USD_CENTS: Record<string, number> = {
  // ONLY templates with real HTML in lib/templates/index.ts. Each id
  // here is verified to load successfully via getTemplateById().
  'saas-multipage':          2900,  // SAAS_MULTIPAGE_TEMPLATE — $29
  // Future paid templates: add HTML to lib/templates/<id>.ts first,
  // wire it into lib/templates/index.ts, THEN add a price here.
}

const TEMPLATE_NAMES: Record<string, string> = {
  'saas-multipage':          'SaaS Complete',
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net').replace(/\/$/, '')

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const templateId = params.id
  const priceCents = TEMPLATE_USD_CENTS[templateId]
  if (!priceCents) {
    return NextResponse.json({
      error: 'This template is not available for individual purchase.',
      reason: 'not_for_sale',
    }, { status: 404 })
  }

  // Already owned? Skip Checkout and return a direct workspace link.
  // template_purchases lives in the marketplace DB ('ai-website-builder'),
  // not the users DB — same split documented in the baseline doc.
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  // Ensure idempotency index once per process.
  await db.collection('template_purchases').createIndex(
    { buyerId: 1, templateId: 1 },
    { unique: true, partialFilterExpression: { status: { $ne: 'refunded' } } },
  ).catch(() => { /* no-op on duplicate */ })

  const existing = await db.collection('template_purchases').findOne({
    buyerId: session.user.id,
    templateId,
    status: { $ne: 'refunded' },
  })
  if (existing) {
    return NextResponse.json({
      alreadyOwned: true,
      redirect: `/workspace?templateId=${encodeURIComponent(templateId)}`,
    })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({
      error: 'Stripe is not configured on this instance.',
      feature: 'stripe',
      reason: 'stripe_unconfigured',
    }, { status: 503 })
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: session.user.email || undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: priceCents,
          product_data: {
            name: `Webstew template — ${TEMPLATE_NAMES[templateId] || templateId}`,
            description: 'One-time purchase. Lifetime access to use this template in your projects.',
          },
        },
      }],
      // Webhook ID's the session via these so it can grant entitlement.
      metadata: {
        source: 'webstew-template',
        template_id: templateId,
        buyer_user_id: session.user.id,
      },
      // Note: workspace/page.tsx reads `templateId` (camelCase) from the
      // query, not `template`. Bug here was a silent no-op landing — the
      // user paid but didn't get the template loaded.
      success_url: `${SITE_URL}/workspace?templateId=${encodeURIComponent(templateId)}&purchased=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE_URL}/templates?cancelled=${encodeURIComponent(templateId)}`,
    })

    return NextResponse.json({ url: checkout.url, sessionId: checkout.id })
  } catch (e: any) {
    console.error('[templates.checkout]', e?.message || e)
    return NextResponse.json({
      error: e?.message || 'Could not start checkout',
      feature: 'stripe',
      reason: 'session_create_failed',
    }, { status: 500 })
  }
}
