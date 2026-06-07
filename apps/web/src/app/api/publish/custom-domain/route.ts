// POST /api/publish/custom-domain — connect a domain you ALREADY own to your
// published (instant-publish) site. One-click: attach the domain to the shared
// Render service (Render issues TLS once DNS resolves), stamp the published
// site with customDomain so /sites/by-host serves it, and return the DNS
// records to set at the user's registrar.
//
// For domains BOUGHT in-app, the Stripe webhook does this automatically (and
// also registers + auto-configures DNS via Cloudflare). This route is the
// bring-your-own-domain counterpart.
//
// DELETE removes the mapping.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { attachDomainToSharedService, RENDER_APP_HOST } from '@/lib/render-domains'

export const dynamic = 'force-dynamic'

function normalizeDomain(raw: string): string {
  return String(raw || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
}

async function findSite(db: any, userId: string, projectId: string | null) {
  const filter: any = projectId ? { userId, projectId } : { userId }
  return db.collection('published_sites').findOne(filter, { sort: { updatedAt: -1 } })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const domain = normalizeDomain(body?.domain)
  const projectId = body?.projectId ? String(body.projectId) : null
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: 'Domain looks invalid' }, { status: 400 })
  }

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 503 })

  const site = await findSite(db, session.user.id, projectId)
  if (!site) {
    return NextResponse.json({
      error: 'No published site to connect a domain to. Hit Publish first, then connect your domain.',
      needsPublish: true,
    }, { status: 400 })
  }

  // Ensure the domain isn't already mapped to someone else's site.
  const taken = await db.collection('published_sites').findOne({
    customDomain: { $in: [domain, `www.${domain}`] },
    slug: { $ne: site.slug },
  })
  if (taken) return NextResponse.json({ error: 'That domain is already connected to another site.' }, { status: 409 })

  const attach = await attachDomainToSharedService(domain)

  await db.collection('published_sites').updateOne(
    { _id: site._id },
    { $set: { customDomain: domain, customDomainTarget: attach.target, customDomainAttachedAt: new Date(), updatedAt: new Date() } },
  )

  // DNS the user must set at their registrar (apex via CNAME-flattening/ALIAS,
  // plus www). Render verifies + issues the cert once these resolve.
  const dnsRecords = [
    { type: 'CNAME', name: '@', value: RENDER_APP_HOST, note: 'or ALIAS/ANAME if your registrar lacks apex CNAME' },
    { type: 'CNAME', name: 'www', value: RENDER_APP_HOST },
  ]

  return NextResponse.json({
    ok: attach.ok,
    domain,
    target: attach.target,
    mock: attach.mock,
    attached: attach.attached,
    dnsRecords,
    message: attach.mock
      ? 'Domain mapped. (Render attach is in mock mode until RENDER_SERVICE_ID is set.) Add the DNS records, then it goes live once they resolve.'
      : 'Domain attached. Add the DNS records below at your registrar — your site goes live (with HTTPS) once they resolve, usually within minutes.',
  })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { body = {} }
  const projectId = body?.projectId ? String(body.projectId) : null

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 503 })
  const site = await findSite(db, session.user.id, projectId)
  if (site) {
    await db.collection('published_sites').updateOne(
      { _id: site._id },
      { $unset: { customDomain: '', customDomainTarget: '', customDomainAttachedAt: '' }, $set: { updatedAt: new Date() } },
    )
  }
  return NextResponse.json({ ok: true })
}
