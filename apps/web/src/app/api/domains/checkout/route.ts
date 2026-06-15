// POST /api/domains/checkout  { domain, projectId? }
//
// Creates a Stripe Checkout Session for a domain purchase. On payment, the
// webhook (checkout.session.completed, metadata.type='domain_purchase') marks
// the order paid and runs registerDomain + autoConfigureDns. A domain_orders
// row tracks the lifecycle. Stripe is the source of truth that money moved —
// registration only fires from the webhook, never from this endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { searchDomains, REGISTRAR_LIVE } from '@/lib/domains'
import { RENDER_DOMAINS_LIVE } from '@/lib/render-domains'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const domain = String(body?.domain || '').trim().toLowerCase()
  const projectId = body?.projectId ? String(body.projectId) : null
  if (!/^[a-z0-9-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: 'Enter a valid domain, e.g. mycafe.com' }, { status: 400 })
  }

  // NEVER take money when we can't actually deliver a WORKING domain. Two
  // independent capabilities are required and they're configured separately:
  //   - REGISTRAR_LIVE (Cloudflare): can register the domain + set DNS.
  //   - RENDER_DOMAINS_LIVE (Render): can attach the domain to the serving
  //     service so Render routes the Host to us and issues TLS.
  // With the registrar alone we'd register + point DNS but the site would never
  // serve (Render never forwards the Host) — i.e. charge for a dead domain.
  // Require BOTH before selling.
  if (!REGISTRAR_LIVE || !RENDER_DOMAINS_LIVE) {
    return NextResponse.json({
      error: "Buying domains isn't enabled yet. You can still connect a domain you already own.",
      code: 'registrar_unavailable',
    }, { status: 503 })
  }

  // Re-price + re-check availability server-side (never trust client price).
  const { results } = await searchDomains(domain)
  const match = results.find(r => r.domain === domain)
  if (!match) return NextResponse.json({ error: 'Could not price that domain.' }, { status: 400 })
  if (!match.available) return NextResponse.json({ error: 'That domain is no longer available.' }, { status: 409 })

  const stripe = await getStripe()
  if (!stripe) return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 })

  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: match.priceCents,
        product_data: {
          name: `Domain: ${domain}`,
          description: 'First-year registration + auto-DNS to your Webstew site',
        },
      },
    }],
    success_url: `${SITE_URL}/workspace?domain_purchased=${encodeURIComponent(domain)}`,
    cancel_url: `${SITE_URL}/workspace?domain_cancelled=1`,
    metadata: {
      type: 'domain_purchase',
      domain,
      projectId: projectId || '',
      userId: session.user.id,
    },
  })

  await db.collection('domain_orders').insertOne({
    domain,
    userId: session.user.id,
    projectId,
    priceCents: match.priceCents,
    status: 'pending',
    stripeSessionId: checkout.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({ url: checkout.url, sessionId: checkout.id })
}
