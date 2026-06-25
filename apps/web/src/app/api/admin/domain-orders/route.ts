// Admin resolution for domain purchases.
//
//   GET                       → list orders (?status=needs_attention&limit=N)
//   POST { action, orderId }  → 'retry'  re-run registration/attach/DNS,
//                               'refund' refund the Stripe charge.
//
// The webhook auto-resolves the happy path and auto-refunds terminal
// registration failures; this is the human backstop for orders that landed in
// needs_attention (registered but not yet serving) or register_failed (no
// auto-refund possible), which previously sat with only a console.log.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { connectDB } from '@/lib/db'
import { isAdminEmail } from '@ai-website-builder/database'
import { getStripe } from '@/lib/stripe'
import { registerDomain, autoConfigureDns } from '@/lib/domains'
import { attachDomainToSharedService, ensureCustomDomainIndex } from '@/lib/render-domains'

export const dynamic = 'force-dynamic'

// domain_orders lives in the marketplace DB...
async function getDb() {
  const client = await clientPromise
  return client.db('ai-website-builder')
}
// ...but published_sites lives in the DEFAULT DB (where the publisher + the
// /sites/by-host serving route read/write). Mapping a domain in the wrong DB
// means it never actually serves.
async function getSiteDb() {
  const mongoose = await connectDB()
  return mongoose.connection.db
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return null
  return session
}

async function audit(db: any, action: string, email: string, detail: Record<string, any>) {
  try {
    await db.collection('admin_audit').insertOne({ action, by: email, at: new Date(), ...detail })
  } catch { /* audit is best-effort */ }
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') || '').trim()
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

  const db = await getDb()
  // "stuck" = paid but still 'pending' after 10 min — a webhook that crashed
  // mid-fulfillment (the event-id dedupe then suppresses Stripe's retry), so
  // the customer is charged with nothing to show. Surface these explicitly;
  // they were previously invisible (only needs_attention/register_failed showed).
  const STUCK_MS = 10 * 60 * 1000
  const stuckFilter = { status: 'pending', createdAt: { $lt: new Date(Date.now() - STUCK_MS) } }
  const query: Record<string, any> = status === 'stuck' ? stuckFilter : (status ? { status } : {})
  const orders = await db.collection('domain_orders')
    .find(query, { projection: { stripeSessionId: 0 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()

  // Small counts strip so the admin sees what needs attention at a glance.
  const counts = await db.collection('domain_orders').aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
  ]).toArray()
  const stuckCount = await db.collection('domain_orders').countDocuments(stuckFilter)

  return NextResponse.json({
    orders,
    counts: { ...Object.fromEntries(counts.map((c: any) => [c._id || 'unknown', c.n])), stuck: stuckCount },
  })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const email = session.user!.email!

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const action = String(body?.action || '')
  const orderId = String(body?.orderId || '')
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  const db = await getDb()
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(orderId)) return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 })
  const order = await db.collection('domain_orders').findOne({ _id: new ObjectId(orderId) })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // ── RETRY: re-run fulfillment (register if needed → attach → DNS → map) ──
  if (action === 'retry') {
    if (order.status === 'refunded') {
      return NextResponse.json({ error: 'Order was refunded — nothing to retry.' }, { status: 409 })
    }
    const domain = String(order.domain)
    // Already registered (needs_attention) → don't re-register; just finish
    // attach + DNS. Otherwise (register_failed) attempt the full registration.
    const alreadyRegistered = order.status === 'needs_attention' && order.registrar?.ok && !order.registrar?.mock
    const reg = alreadyRegistered ? order.registrar : await registerDomain(domain)
    if (!reg.ok && !reg.mock) {
      await db.collection('domain_orders').updateOne(
        { _id: order._id },
        { $set: { status: 'register_failed', registrar: reg, updatedAt: new Date() } },
      )
      await audit(db, 'domain_order.retry_failed', email, { orderId, domain, reason: reg.message })
      return NextResponse.json({ ok: false, status: 'register_failed', message: reg.message })
    }
    const attach = await attachDomainToSharedService(domain)
    const dns = await autoConfigureDns(domain, attach.target)
    const fullyDone = reg.ok && !reg.mock && attach.ok && dns.ok
    const newStatus = fullyDone ? 'registered' : 'needs_attention'
    await db.collection('domain_orders').updateOne(
      { _id: order._id },
      { $set: { status: newStatus, registrar: reg, render: attach, dns, target: attach.target, updatedAt: new Date() } },
    )
    if (attach.ok) {
      // (Re)map the domain → the user's published site so it serves — in the
      // DEFAULT db (where by-host reads), not the marketplace db.
      const siteDb = await getSiteDb()
      if (siteDb) {
        await ensureCustomDomainIndex(siteDb)
        const pubFilter: Record<string, any> = order.projectId
          ? { userId: order.userId, projectId: order.projectId }
          : { userId: order.userId }
        try {
          await siteDb.collection('published_sites').findOneAndUpdate(
            pubFilter,
            { $set: { customDomain: domain, customDomainTarget: attach.target, updatedAt: new Date() } },
            { sort: { updatedAt: -1 } },
          )
        } catch (mapErr: any) {
          if (mapErr?.code === 11000) {
            await audit(db, 'domain_order.map_conflict', email, { orderId, domain })
            return NextResponse.json({ ok: false, status: newStatus, conflict: true, message: `${domain} is already mapped to another site.` }, { status: 409 })
          }
          throw mapErr
        }
      }
    }
    await audit(db, 'domain_order.retry', email, { orderId, domain, status: newStatus, attach: attach.ok, dns: dns.ok })
    return NextResponse.json({ ok: true, status: newStatus, attach: attach.ok, dns: dns.ok, message: attach.message })
  }

  // ── REFUND: refund the Stripe charge + mark refunded ──
  if (action === 'refund') {
    if (order.status === 'refunded') {
      return NextResponse.json({ error: 'Already refunded.' }, { status: 409 })
    }
    const stripe = await getStripe()
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
    if (!order.stripeSessionId) return NextResponse.json({ error: 'No Stripe session on this order.' }, { status: 400 })
    try {
      const sess = await stripe.checkout.sessions.retrieve(String(order.stripeSessionId))
      const piId = typeof sess.payment_intent === 'string' ? sess.payment_intent : (sess.payment_intent as any)?.id
      if (!piId) return NextResponse.json({ error: 'No payment to refund (unpaid session).' }, { status: 400 })
      await stripe.refunds.create({ payment_intent: piId, reason: 'requested_by_customer' })
      await db.collection('domain_orders').updateOne(
        { _id: order._id },
        { $set: { status: 'refunded', refundedAt: new Date(), refundReason: `manual admin refund by ${email}`, updatedAt: new Date() } },
      )
      await audit(db, 'domain_order.refund', email, { orderId, domain: order.domain })
      return NextResponse.json({ ok: true, status: 'refunded' })
    } catch (e: any) {
      return NextResponse.json({ error: `Refund failed: ${e?.message || 'unknown'}` }, { status: 502 })
    }
  }

  return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 })
}
