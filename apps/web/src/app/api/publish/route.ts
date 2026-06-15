// POST /api/publish — instant, key-free "Go Live" for static sites.
//
// Unlike /api/deploy (which creates a GitHub repo + a Render service per
// site and needs the user's — or the platform's — GH/Render keys), this
// stores the generated static files in Mongo (`published_sites`) and serves
// them straight from Webstew at  {slug}.webstew.app  (see middleware rewrite
// → /s/[slug]). No third-party account, no repo, no cold start. This is the
// one-click managed deploy: type → Go Live → shareable URL in ~1s.
//
//   POST   { projectId?, name, files:[{path,content}], slug? }  → publish/update
//   GET    ?slug=foo                                            → { available }
//   GET    (no slug)                                            → user's sites
//   DELETE ?slug=foo                                            → unpublish (owner)
//
// Only directly-servable static files are accepted here (HTML/CSS/JS/assets).
// React/Astro/Next projects need a build step first — those keep the export
// path until the managed builder lands.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { publishSite, checkSlugAvailable, slugify } from '@/lib/publish'

export const dynamic = 'force-dynamic'

async function getDb() {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('DB not connected')
  return db
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required', requireAuth: true }, { status: 401 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // publishSite can throw on DB connectivity (getDb / Mongo). Without this
  // catch the route returns Next's default HTML 500, and the client's
  // res.json() then throws → a confusing generic failure. Return JSON instead.
  let result
  try {
    result = await publishSite({
      userId: session.user.id,
      name: String(body?.name || 'site'),
      files: Array.isArray(body?.files) ? body.files : [],
      requestedSlug: String(body?.slug || ''),
      projectId: body?.projectId ? String(body.projectId) : null,
      proto: req.headers.get('x-forwarded-proto') || 'https',
    })
  } catch (e: any) {
    console.error('[publish] failed:', e?.message || e)
    return NextResponse.json({ error: 'Publish failed — please try again in a moment.' }, { status: 500 })
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json({
    ok: true,
    slug: result.slug,
    url: result.url,     // canonical published URL (www.webstew.net/s/<slug>)
    path: result.path,   // always works, incl. local dev
    pages: result.pages,
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const rawSlug = req.nextUrl.searchParams.get('slug') || ''
  if (slugify(rawSlug)) {
    const { available, reason } = await checkSlugAvailable(rawSlug, session.user.id)
    return NextResponse.json(reason === 'reserved' ? { available, reason } : { available })
  }

  const db = await getDb()
  const col = db.collection('published_sites')
  const sites = await col
    .find({ userId: session.user.id }, { projection: { files: 0 } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray()
  return NextResponse.json({ sites })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const slug = slugify(req.nextUrl.searchParams.get('slug') || '')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const db = await getDb()
  const res = await db.collection('published_sites').deleteOne({ slug, userId: session.user.id })
  return NextResponse.json({ ok: true, removed: res.deletedCount })
}
