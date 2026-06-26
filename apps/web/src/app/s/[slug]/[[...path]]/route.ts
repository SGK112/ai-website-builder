// GET /s/[slug]/[...path] — serves a site published via /api/publish.
//
// This is the origin behind {slug}.webstew.app: the middleware rewrites that
// host to /s/{slug}/<path>, and this handler streams the stored file back with
// the right content-type. Pretty paths resolve like a static host would:
//   /s/foo            → index.html
//   /s/foo/about      → about.html  (or about/index.html)
//   /s/foo/styles.css → styles.css
//
// Public on purpose — published sites are meant to be shared.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { servePublishedFile, publishedNotFound } from '@/lib/published-serve'

export const dynamic = 'force-dynamic'

interface Ctx { params: { slug: string; path?: string[] } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const slug = (params.slug || '').toLowerCase()
  if (!slug) return publishedNotFound()

  const host = (_req.headers.get('host') || '').split(':')[0].toLowerCase()
  const publishDomain = (process.env.NEXT_PUBLIC_PUBLISH_DOMAIN || 'webstew.app').toLowerCase()
  // On the publish origin when the host IS the publish domain (the middleware
  // rewrites {slug}.webstew.app → here, keeping that host). Anything else
  // (www.webstew.net, *.onrender.com, localhost) is the APP origin.
  const onPublishOrigin = host === publishDomain || host.endsWith(`.${publishDomain}`)

  // ── Origin isolation ──────────────────────────────────────────────────────
  // Once the publish subdomain is live (PUBLISH_USE_SUBDOMAIN=1), a published
  // site must execute ONLY on *.webstew.app — a separate REGISTRABLE domain from
  // the app — so its JS can't ride a logged-in visitor's www.webstew.net session
  // cookies / read app-origin localStorage (the same-origin attack). When a
  // /s/<slug> request lands on the APP origin, 302 it to the canonical subdomain
  // instead of serving the HTML here: a redirect carries no page JS, so the
  // malicious content never runs same-origin with the app. Existing
  // www.webstew.net/s/<slug> share links keep working (they just bounce once).
  // While the flag is OFF (subdomain DNS/TLS not yet provisioned) we serve inline
  // as before, so nothing breaks until Josh points DNS and flips the flag.
  if (!onPublishOrigin && process.env.PUBLISH_USE_SUBDOMAIN === '1') {
    const rest = (params.path || []).map(encodeURIComponent).join('/')
    const target = `https://${slug}.${publishDomain}${rest ? `/${rest}` : ''}${_req.nextUrl.search}`
    return NextResponse.redirect(target, 302)
  }

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return new NextResponse('Service unavailable', { status: 503 })

  const site = await db.collection('published_sites').findOne({ slug, published: true })

  // Root-relative links in the site need a base prefix UNLESS the browser is
  // already at the site's root. A {slug}.webstew.app subdomain (rewritten here
  // by middleware) keeps the browser at the root → no prefix. A direct
  // www.webstew.net/s/<slug> link (flag off) lives under a sub-path → prefix it
  // so nav doesn't escape to the Webstew app and 404.
  const basePath = onPublishOrigin ? '' : `/s/${slug}`

  return servePublishedFile(site as any, params.path || [], slug, basePath)
}
