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
import { attachDomainToSharedService, ensureCustomDomainIndex, RENDER_APP_HOST, RENDER_DOMAINS_LIVE } from '@/lib/render-domains'

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

  // Custom domains only actually serve once the domain is attached to the
  // Render service (so Render routes the Host to us + issues TLS). Without
  // Render creds the attach is a no-op, so a domain "connected" here would set
  // DNS and never load. Don't promise what we can't deliver — fail honestly.
  if (!RENDER_DOMAINS_LIVE) {
    return NextResponse.json({
      error: "Connecting custom domains isn't enabled on this deployment yet (serving infra not configured). Your site is live at its webstew.net address in the meantime.",
      code: 'custom_domains_unavailable',
    }, { status: 503 })
  }

  // Ensure the domain isn't already mapped to someone else's site. The fast
  // pre-check below is racy on its own (two concurrent connects both pass), so
  // the real guard is the unique index on customDomain — the stamp below catches
  // its duplicate-key error. Together they stop a domain being claimed twice or
  // squatted onto another user's site.
  await ensureCustomDomainIndex(db)
  const taken = await db.collection('published_sites').findOne({
    customDomain: { $in: [domain, `www.${domain}`] },
    slug: { $ne: site.slug },
  })
  if (taken) return NextResponse.json({ error: 'That domain is already connected to another site.' }, { status: 409 })

  const attach = await attachDomainToSharedService(domain)

  // Only stamp the mapping (and report success) if the domain was actually
  // attached. A failed attach previously still returned 200 + stamped the
  // site, so the UI showed "Connected" for a domain that could never serve.
  if (!attach.ok) {
    return NextResponse.json({
      error: `Couldn't attach ${domain} to the serving service${attach.message ? ` (${attach.message})` : ''}. Nothing was changed — try again, or contact support if it persists.`,
      code: 'attach_failed',
    }, { status: 502 })
  }

  try {
    await db.collection('published_sites').updateOne(
      { _id: site._id },
      { $set: { customDomain: domain, customDomainTarget: attach.target, customDomainAttachedAt: new Date(), updatedAt: new Date() } },
    )
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: 'That domain was just connected to another site.' }, { status: 409 })
    }
    throw e
  }

  // DNS the user must set at their registrar. Apex: prefer an A record to
  // Render's anycast IP (works on every registrar); CNAME @ only works where
  // the registrar supports CNAME-flattening/ALIAS/ANAME. www is a plain CNAME.
  const dnsRecords = [
    { type: 'A', name: '@', value: '216.24.57.1', note: "Render's apex IP — use this on registrars without ALIAS/ANAME (GoDaddy, Namecheap, etc.)" },
    { type: 'CNAME', name: '@', value: RENDER_APP_HOST, note: 'alternative to the A record IF your registrar supports apex CNAME/ALIAS/ANAME' },
    { type: 'CNAME', name: 'www', value: RENDER_APP_HOST },
  ]

  return NextResponse.json({
    ok: true,
    domain,
    target: attach.target,
    mock: false,
    attached: attach.attached,
    dnsRecords,
    message: 'Domain attached. Add the DNS records below at your registrar — your site goes live (with HTTPS) once they resolve, usually within minutes.',
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
