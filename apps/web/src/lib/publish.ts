// Shared instant-publish logic — the one-click, key-free "Go Live" path.
//
// Stores a generated static site's files in Mongo (`published_sites`) so they
// serve straight from Webstew at {slug}.webstew.app (middleware → /s/[slug]).
// No GitHub repo, no Render service, no third-party account.
//
// Used by:
//   • POST /api/publish              (the workspace "Go Live" button)
//   • publish_site agent tool        (the agent publishing from chat)
//
// Both need identical slug-minting, validation, and persistence — keeping the
// core here means the two call sites can't drift apart.

import { connectDB } from '@/lib/db'
import { inlineTailwind } from '@/lib/tailwind-compile'
import { injectPublishedCms } from '@/lib/cms-publish'

// The apex the published sites live under. Override per-env; defaults to the
// production domain. The serving path (/s/<slug>) always works regardless, so
// local dev (no wildcard DNS) still functions.
export const PUBLISH_DOMAIN = process.env.NEXT_PUBLIC_PUBLISH_DOMAIN || 'webstew.app'

// Subdomains we never hand out as site slugs — they collide with the app's
// own surfaces or look like phishing bait.
export const RESERVED_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'mail', 'ftp', 'webstew', 'dashboard',
  'login', 'signup', 'workspace', 'preview', 'cdn', 'assets', 'static',
  'blog', 'docs', 'support', 'help', 'status', 'billing', 's',
])

// 4MB ceiling on a published site's total bytes — keeps a single doc well
// under Mongo's 16MB limit and stops a runaway generation from bloating the DB.
export const MAX_SITE_BYTES = 4 * 1024 * 1024

export function slugify(input: string): string {
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

// A slug maps to exactly ONE site. Without a unique index the publish write
// (upsert on {slug}) could overwrite another user's doc when two users race the
// same candidate slug. The unique index turns that race into a duplicate-key
// error we re-mint around. Once per process; createIndex is idempotent.
let slugIndexEnsured = false
async function ensureSlugIndex(col: any) {
  if (slugIndexEnsured) return
  try {
    await col.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } })
    // Mark ensured only AFTER success — flipping it up front meant a failed
    // first attempt was never retried, leaving the unique race-guard absent for
    // the rest of the process's life.
    slugIndexEnsured = true
  } catch (e: any) {
    console.error('[publish] could not ensure unique slug index:', e?.message || e)
  }
}

export interface PublishInput {
  userId: string
  name: string
  files: Array<{ path: string; content: string }>
  requestedSlug?: string
  projectId?: string | null
  // Scheme for the returned production URL. Defaults to https (prod). The
  // route passes x-forwarded-proto so local dev shows http.
  proto?: string
}

export type PublishResult =
  | { ok: true; slug: string; url: string; path: string; pages: number }
  | { ok: false; error: string; status: number }

// Validate + persist a site, minting (or reusing) a stable slug. Pure data
// layer — no session/HTTP concerns, so both the route and the agent tool can
// call it. Caller is responsible for auth (resolving userId).
export async function publishSite(input: PublishInput): Promise<PublishResult> {
  const name = String(input.name || 'site').trim()
  const requestedSlug = slugify(String(input.requestedSlug || ''))
  const projectId = input.projectId ? String(input.projectId) : null

  // Validate files: must have at least one, and an index.html entry point.
  const cleanFiles = (Array.isArray(input.files) ? input.files : [])
    .filter((f) => f && typeof f.path === 'string' && typeof f.content === 'string')
    .map((f) => ({ path: f.path.replace(/^\/+/, ''), content: f.content }))
  if (cleanFiles.length === 0) {
    return { ok: false, error: 'Nothing to publish — no files provided.', status: 400 }
  }
  if (!cleanFiles.some((f) => f.path === 'index.html')) {
    return { ok: false, error: 'Site must include an index.html entry point.', status: 400 }
  }

  // Production handoff: compile each page's Tailwind to static CSS so the live
  // site drops the runtime cdn.tailwindcss.com (slow JIT, "not for production").
  // inlineTailwind falls back to the original HTML on any uncertainty, so this
  // never makes a page worse. The editor preview keeps the CDN for instant JIT.
  const builtFiles = await Promise.all(
    cleanFiles.map(async (f) =>
      /\.html?$/i.test(f.path) ? { ...f, content: await inlineTailwind(f.content) } : f,
    ),
  )

  // Bake published CMS items into cms/<collection>.json so the live site can
  // fetch them (the agent is told this file exists). Shared with the deploy path.
  const filesToStore = projectId
    ? (await injectPublishedCms(builtFiles, projectId, input.userId)).files
    : builtFiles

  const totalBytes = filesToStore.reduce((n, f) => n + Buffer.byteLength(f.content, 'utf8'), 0)
  if (totalBytes > MAX_SITE_BYTES) {
    return {
      ok: false,
      error: `Site is too large to instant-publish (${(totalBytes / 1024 / 1024).toFixed(1)}MB > 4MB). Use Export → host it yourself.`,
      status: 413,
    }
  }

  const db = await getDb()
  const col = db.collection('published_sites')

  // Re-publish of the same project keeps its existing slug (so the live URL is
  // stable across edits). Otherwise mint a fresh, globally-unique slug.
  let slug: string | null = null
  let previousSlug: string | null = null
  if (projectId) {
    const existing = await col.findOne({ userId: input.userId, projectId })
    if (existing?.slug) { slug = existing.slug as string; previousSlug = slug }
  }

  if (!slug) {
    let candidate = requestedSlug || slugify(name) || `site-${randSuffix()}`
    if (RESERVED_SLUGS.has(candidate)) candidate = `${candidate}-${randSuffix()}`
    // Resolve collisions against other users' sites.
    for (let i = 0; i < 6; i++) {
      const taken = await col.findOne({ slug: candidate }, { projection: { _id: 1, userId: 1 } })
      if (!taken || taken.userId === input.userId) break
      candidate = `${slugify(name) || 'site'}-${randSuffix()}`
    }
    slug = candidate
  } else if (requestedSlug && requestedSlug !== slug && !RESERVED_SLUGS.has(requestedSlug)) {
    // User explicitly renamed the slug — honor it if free.
    const taken = await col.findOne({ slug: requestedSlug }, { projection: { _id: 1, userId: 1 } })
    if (!taken || taken.userId === input.userId) slug = requestedSlug
  }

  const now = new Date()
  await ensureSlugIndex(col)
  // Owner-scoped upsert: filter on (slug, userId) so we can only ever update OUR
  // OWN doc. If the slug is owned by someone else, no doc matches → the upsert
  // attempts an insert → the unique slug index throws E11000 → we re-mint a
  // fresh slug and retry. This closes the publish-time slug-hijack race.
  const writeSlug = async (s: string) => {
    await col.updateOne(
      { slug: s, userId: input.userId },
      {
        $set: {
          slug: s,
          userId: input.userId,
          projectId: projectId || null,
          name,
          files: filesToStore,
          bytes: totalBytes,
          published: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    )
  }
  try {
    await writeSlug(slug)
  } catch (e: any) {
    if (e?.code === 11000) {
      slug = `${slugify(name) || 'site'}-${randSuffix()}`
      await writeSlug(slug)
    } else {
      throw e
    }
  }

  // If the project's slug was renamed, remove the old-slug doc so it stops
  // serving stale content and a later re-publish can't nondeterministically
  // match the orphan. Scoped to this user + project for safety.
  if (previousSlug && previousSlug !== slug) {
    await col.deleteOne({ slug: previousSlug, userId: input.userId, projectId: projectId || null })
  }

  const proto = input.proto || 'https'
  // The pretty {slug}.webstew.app subdomain needs DNS that isn't configured yet
  // (webstew.app has no records), so those Go-Live URLs are dead. Default the
  // canonical URL to the path on the live app domain — it works today and is
  // fully navigable (the serve layer rebases the site's root-relative links
  // under /s/<slug>). Flip PUBLISH_USE_SUBDOMAIN=1 once *.webstew.app DNS + TLS
  // are live to hand out the prettier subdomain URL again.
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://www.webstew.net').replace(/\/+$/, '')
  const url = process.env.PUBLISH_USE_SUBDOMAIN === '1'
    ? `${proto}://${slug}.${PUBLISH_DOMAIN}`
    : `${siteBase}/s/${slug}`
  return {
    ok: true,
    slug,
    url,
    path: `/s/${slug}`,
    pages: builtFiles.length,
  }
}

// Slug-availability check, shared with the route's GET handler.
export async function checkSlugAvailable(rawSlug: string, userId: string): Promise<{ available: boolean; reason?: string }> {
  const slug = slugify(rawSlug)
  if (!slug) return { available: false, reason: 'empty' }
  if (RESERVED_SLUGS.has(slug)) return { available: false, reason: 'reserved' }
  const db = await getDb()
  const taken = await db.collection('published_sites').findOne({ slug }, { projection: { userId: 1 } })
  return { available: !taken || taken.userId === userId }
}
