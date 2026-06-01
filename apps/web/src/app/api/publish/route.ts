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
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// The apex the published sites live under. Override per-env; defaults to the
// production domain. The serving path (/s/<slug>) always works regardless, so
// local dev (no wildcard DNS) still functions.
const PUBLISH_DOMAIN = process.env.NEXT_PUBLIC_PUBLISH_DOMAIN || 'webstew.app'

// Subdomains we never hand out as site slugs — they collide with the app's
// own surfaces or look like phishing bait.
const RESERVED_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'mail', 'ftp', 'webstew', 'dashboard',
  'login', 'signup', 'workspace', 'preview', 'cdn', 'assets', 'static',
  'blog', 'docs', 'support', 'help', 'status', 'billing', 's',
])

// 4MB ceiling on a published site's total bytes — keeps a single doc well
// under Mongo's 16MB limit and stops a runaway generation from bloating the DB.
const MAX_SITE_BYTES = 4 * 1024 * 1024

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function randSuffix(): string {
  // Deterministic-free short token. Math.random is fine here — collisions are
  // re-checked against the DB below, this just seeds a candidate.
  return Math.random().toString(36).slice(2, 6)
}

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

  const name: string = String(body?.name || 'site').trim()
  const files: Array<{ path: string; content: string }> = Array.isArray(body?.files) ? body.files : []
  const requestedSlug: string = slugify(String(body?.slug || ''))
  const projectId: string | null = body?.projectId ? String(body.projectId) : null

  // Validate files: must have at least one, and an index.html entry point.
  const cleanFiles = files
    .filter(f => f && typeof f.path === 'string' && typeof f.content === 'string')
    .map(f => ({ path: f.path.replace(/^\/+/, ''), content: f.content }))
  if (cleanFiles.length === 0) {
    return NextResponse.json({ error: 'Nothing to publish — no files provided.' }, { status: 400 })
  }
  if (!cleanFiles.some(f => f.path === 'index.html')) {
    return NextResponse.json({ error: 'Site must include an index.html entry point.' }, { status: 400 })
  }
  const totalBytes = cleanFiles.reduce((n, f) => n + Buffer.byteLength(f.content, 'utf8'), 0)
  if (totalBytes > MAX_SITE_BYTES) {
    return NextResponse.json({ error: `Site is too large to instant-publish (${(totalBytes / 1024 / 1024).toFixed(1)}MB > 4MB). Use Export → host it yourself.` }, { status: 413 })
  }

  const db = await getDb()
  const col = db.collection('published_sites')

  // Re-publish of the same project keeps its existing slug (so the live URL is
  // stable across edits). Otherwise mint a fresh, globally-unique slug.
  let slug: string | null = null
  if (projectId) {
    const existing = await col.findOne({ userId: session.user.id, projectId })
    if (existing?.slug) slug = existing.slug as string
  }

  if (!slug) {
    let candidate = requestedSlug || slugify(name) || `site-${randSuffix()}`
    if (RESERVED_SLUGS.has(candidate)) candidate = `${candidate}-${randSuffix()}`
    // Resolve collisions against other users' sites.
    for (let i = 0; i < 6; i++) {
      const taken = await col.findOne({ slug: candidate }, { projection: { _id: 1, userId: 1 } })
      if (!taken || taken.userId === session.user.id) break
      candidate = `${slugify(name) || 'site'}-${randSuffix()}`
    }
    slug = candidate
  } else if (requestedSlug && requestedSlug !== slug && !RESERVED_SLUGS.has(requestedSlug)) {
    // User explicitly renamed the slug — honor it if free.
    const taken = await col.findOne({ slug: requestedSlug }, { projection: { _id: 1, userId: 1 } })
    if (!taken || taken.userId === session.user.id) slug = requestedSlug
  }

  const now = new Date()
  await col.updateOne(
    { slug },
    {
      $set: {
        slug,
        userId: session.user.id,
        projectId: projectId || null,
        name,
        files: cleanFiles,
        bytes: totalBytes,
        published: true,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  )

  const proto = (req.headers.get('x-forwarded-proto') || 'https')
  const url = `${proto}://${slug}.${PUBLISH_DOMAIN}`
  return NextResponse.json({
    ok: true,
    slug,
    url,                 // production subdomain URL (needs wildcard DNS live)
    path: `/s/${slug}`,  // always works, incl. local dev
    pages: cleanFiles.length,
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const db = await getDb()
  const col = db.collection('published_sites')

  const slug = slugify(req.nextUrl.searchParams.get('slug') || '')
  if (slug) {
    if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ available: false, reason: 'reserved' })
    const taken = await col.findOne({ slug }, { projection: { userId: 1 } })
    return NextResponse.json({ available: !taken || taken.userId === session.user.id })
  }

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
