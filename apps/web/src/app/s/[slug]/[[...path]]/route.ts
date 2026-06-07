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

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return new NextResponse('Service unavailable', { status: 503 })

  const site = await db.collection('published_sites').findOne({ slug, published: true })
  return servePublishedFile(site as any, params.path || [], slug)
}
