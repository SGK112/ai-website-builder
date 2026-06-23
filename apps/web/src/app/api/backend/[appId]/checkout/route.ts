// /api/backend/[appId]/checkout — Stripe Checkout for generated stores.
//
//   POST { items:[{ name, amount, quantity?, image? }], currency?,
//          successUrl?, cancelUrl?, customerEmail? }  → { url, sessionId }
//
// Zero-config for the app builder: products are passed as inline price_data
// (cents), so the generated store defines its own catalog with no preconfigured
// Stripe price IDs. The platform Stripe key (STRIPE_SECRET_KEY) processes the
// charge; an `orders` row is recorded in the app's own database (status
// 'pending'; the Stripe webhook can later flip it to 'paid'). Authenticated with
// the app's apiKey and CORS-open, exactly like the data + auth APIs.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { randomUUID } from 'crypto'
import { ObjectId } from 'mongodb'
import { backendRateLimited } from '@/lib/backend-ratelimit'

export const dynamic = 'force-dynamic'

function cors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key')
  return res
}

export async function OPTIONS() { return cors(new NextResponse(null, { status: 204 })) }

// Storefront platform fee (basis points). Separate from the marketplace's 30%
// — physical-goods storefronts run a thin fee. Default 5%. Tune via env.
const STORE_PLATFORM_FEE_BPS = Math.min(Math.max(parseInt(process.env.STORE_PLATFORM_FEE_BPS || '500', 10) || 500, 0), 5000)

async function authApp(appId: string, key: string | null) {
  if (!key) return null
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return null
  const b = await db.collection('app_backends').findOne({ appId }, { projection: { apiKey: 1, userId: 1 } })
  return b && b.apiKey === key ? { db, ownerId: b.userId as string } : null
}

// The store owner's Stripe Connect account, if they've finished payout setup.
// When present, store payments are routed to THEM (destination charge) and
// Webstew keeps only the platform fee; otherwise the charge falls back to the
// platform balance and the order is flagged so the owner is nudged to connect.
async function ownerConnect(db: any, ownerId: string): Promise<{ accountId: string | null; ready: boolean }> {
  if (!ownerId) return { accountId: null, ready: false }
  const _id = ObjectId.isValid(ownerId) ? new ObjectId(ownerId) : ownerId
  const u = await db.collection('users').findOne({ _id }, { projection: { stripe_account_id: 1, stripeAccountId: 1, stripe_charges_enabled: 1 } })
  const accountId = u?.stripe_account_id || u?.stripeAccountId || null
  return { accountId, ready: !!accountId && !!u?.stripe_charges_enabled }
}

// Default the redirect targets to the page that initiated checkout so the app
// builder never has to hardcode an absolute URL.
function originOf(req: NextRequest): string {
  const ref = req.headers.get('origin') || req.headers.get('referer') || ''
  try { return ref ? new URL(ref).origin : '' } catch { return '' }
}

interface Ctx { params: { appId: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { appId } = params
  const limited = backendRateLimited(req, appId, 'checkout', 'marketplaceBuy')
  if (limited) return limited
  const key = req.headers.get('x-webstew-key') || req.nextUrl.searchParams.get('key')
  const auth = await authApp(appId, key)
  if (!auth) return cors(NextResponse.json({ error: 'Invalid or missing app key.' }, { status: 401 }))
  const { db, ownerId } = auth

  const stripe = await getStripe()
  if (!stripe) return cors(NextResponse.json({ error: 'Payments are not configured for this platform.' }, { status: 503 }))

  let body: any
  try { body = await req.json() } catch { return cors(NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })) }

  const rawItems = Array.isArray(body?.items) ? body.items : []
  if (!rawItems.length) return cors(NextResponse.json({ error: 'items required: [{ name, amount, quantity? }]' }, { status: 400 }))
  if (rawItems.length > 50) return cors(NextResponse.json({ error: 'Too many line items (max 50).' }, { status: 400 }))

  const currency = String(body?.currency || 'usd').toLowerCase().slice(0, 3)
  const lineItems: any[] = []
  let total = 0
  for (const it of rawItems) {
    const name = String(it?.name || '').trim().slice(0, 200)
    const amount = Math.round(Number(it?.amount)) // cents
    const quantity = Math.min(Math.max(parseInt(String(it?.quantity ?? 1), 10) || 1, 1), 999)
    if (!name) return cors(NextResponse.json({ error: 'Each item needs a name.' }, { status: 400 }))
    if (!Number.isFinite(amount) || amount < 50 || amount > 100_000_00) {
      return cors(NextResponse.json({ error: `Invalid amount for "${name}" (cents, 50–10,000,000).` }, { status: 400 }))
    }
    const image = typeof it?.image === 'string' && /^https?:\/\//.test(it.image) ? it.image : undefined
    lineItems.push({
      quantity,
      price_data: {
        currency,
        unit_amount: amount,
        product_data: { name, ...(image ? { images: [image] } : {}) },
      },
    })
    total += amount * quantity
  }

  const docId = randomUUID()
  const origin = originOf(req)
  const successUrl = (typeof body?.successUrl === 'string' && body.successUrl) || (origin ? `${origin}/?paid=1` : '')
  const cancelUrl = (typeof body?.cancelUrl === 'string' && body.cancelUrl) || (origin ? `${origin}/?canceled=1` : '')
  if (!successUrl || !cancelUrl) {
    return cors(NextResponse.json({ error: 'successUrl and cancelUrl required (could not infer from request origin).' }, { status: 400 }))
  }
  const sep = (u: string) => (u.includes('?') ? '&' : '?')

  // Money is routed to the STORE OWNER's Stripe Connect account via a destination
  // charge: the sale goes to THEM minus Webstew's platform fee. We never take a
  // payment we can't route, so checkout is BLOCKED until the owner finishes payout
  // setup — the storefront returns a clear "payments aren't enabled yet" instead
  // of silently banking the money on the platform. Tune the fee via STORE_PLATFORM_FEE_BPS.
  const connect = await ownerConnect(db, ownerId)
  if (!connect.ready || !connect.accountId) {
    return cors(NextResponse.json({
      error: 'This store is not accepting payments yet — the owner needs to connect their payouts.',
      code: 'payouts_not_connected',
    }, { status: 422 }))
  }
  const feeCents = Math.floor((total * STORE_PLATFORM_FEE_BPS) / 10000)
  // `app: 'webstew'` marker isolates this from VoiceNow on the shared Stripe
  // account — the webhook skips checkout events whose marker isn't 'webstew'.
  const orderMeta = { app: 'webstew', type: 'app_order', appId, orderId: docId }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: typeof body?.customerEmail === 'string' ? body.customerEmail.slice(0, 200) : undefined,
      line_items: lineItems,
      success_url: `${successUrl}${sep(successUrl)}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: orderMeta,
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: connect.accountId },
        metadata: orderMeta,
      },
    })
  } catch (e: any) {
    console.error('[backend checkout] stripe error', e?.message)
    return cors(NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 }))
  }

  // Record the order in the app's OWN database so the owner sees it in Data
  // Studio (collection "orders") and the app can show order history.
  const now = new Date()
  await db.collection('app_data').insertOne({
    appId, collection: 'orders', docId,
    data: {
      status: 'pending',
      currency,
      total,
      items: lineItems.map((l) => ({ name: l.price_data.product_data.name, amount: l.price_data.unit_amount, quantity: l.quantity })),
      stripeSessionId: session.id,
      customerEmail: typeof body?.customerEmail === 'string' ? body.customerEmail : null,
      // Payout routing for this order (always owner-routed — blocked otherwise).
      paidTo: 'owner',
      destinationAccount: connect.accountId,
      platformFeeCents: feeCents,
    },
    createdAt: now, updatedAt: now,
  })

  return cors(NextResponse.json({ url: session.url, sessionId: session.id, orderId: docId }))
}
