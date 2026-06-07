// GET /sites/by-host/[...path] — serves a published site by its CUSTOM DOMAIN.
//
// The middleware rewrites any non-Webstew host (a bought/connected custom
// domain) to this route, preserving the original Host header and path. We look
// the site up by published_sites.customDomain === <host> and serve it exactly
// like /s/[slug] does. Render only forwards a host to us once that domain has
// been attached to the service, so reaching here means it's a real, verified
// custom domain.
//
// Public on purpose — published sites are meant to be shared.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { servePublishedFile, publishedNotFound } from '@/lib/published-serve'

export const dynamic = 'force-dynamic'

interface Ctx { params: { path?: string[] } }

export async function GET(req: NextRequest, { params }: Ctx) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase()
  if (!host) return publishedNotFound()

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return new NextResponse('Service unavailable', { status: 503 })

  // Match either the apex (acme.com) or www. variant the customer may resolve.
  const bareHost = host.replace(/^www\./, '')
  const site = await db.collection('published_sites').findOne({
    published: true,
    customDomain: { $in: [host, bareHost, `www.${bareHost}`] },
  })
  return servePublishedFile(site as any, params.path || [], `host:${host}`)
}
