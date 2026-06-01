// GET /api/remix?slug=<published-slug> — returns a published site's files so
// it can be forked into the workspace as a new draft. Published sites are
// public (they're served at {slug}.webstew.app), so their source is remixable
// — this is the "fork this site and make it yours" primitive.
//
//   → { name, files: [{path, content}], html }
//
// `html` is the index.html convenience field the website workspace loads.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get('slug') || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const site = await db.collection('published_sites').findOne({ slug, published: true })
  if (!site || !Array.isArray(site.files)) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  const files: Array<{ path: string; content: string }> = site.files
  const index = files.find(f => f.path === 'index.html')
  return NextResponse.json({
    name: `${site.name || slug} (remix)`,
    files,
    html: index?.content || '',
  })
}
