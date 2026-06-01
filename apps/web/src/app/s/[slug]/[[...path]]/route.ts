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

export const dynamic = 'force-dynamic'

const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  webmanifest: 'application/manifest+json',
}

function contentTypeFor(path: string): string {
  const ext = path.includes('.') ? path.split('.').pop()!.toLowerCase() : 'html'
  return CONTENT_TYPES[ext] || 'text/plain; charset=utf-8'
}

function notFound(): NextResponse {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Not found</title><body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0b0b0f;color:#e5e7eb"><div style="text-align:center"><h1 style="font-size:3rem;margin:0">404</h1><p style="opacity:.6">This page isn't published.</p><p style="opacity:.4;font-size:.85rem">Powered by <a href="https://webstew.net" style="color:#34d399">Webstew</a></p></div></body>`,
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

interface Ctx { params: { slug: string; path?: string[] } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const slug = (params.slug || '').toLowerCase()
  if (!slug) return notFound()

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return new NextResponse('Service unavailable', { status: 503 })

  const site = await db.collection('published_sites').findOne({ slug, published: true })
  if (!site || !Array.isArray(site.files)) return notFound()

  const files: Array<{ path: string; content: string }> = site.files
  const byPath = new Map(files.map(f => [f.path.replace(/^\/+/, ''), f.content]))

  const reqPath = (params.path || []).join('/').replace(/^\/+/, '')

  // Resolve the requested path against static-host conventions.
  const candidates = reqPath === ''
    ? ['index.html']
    : [
        reqPath,                       // exact (styles.css, about.html)
        `${reqPath}.html`,             // pretty URL: /about → about.html
        `${reqPath}/index.html`,       // dir index: /blog → blog/index.html
      ]

  let hit: string | undefined
  for (const c of candidates) {
    if (byPath.has(c)) { hit = c; break }
  }
  if (hit === undefined) return notFound()

  return new NextResponse(byPath.get(hit)!, {
    status: 200,
    headers: {
      'content-type': contentTypeFor(hit),
      // Short cache — sites can be re-published; don't pin stale content.
      'cache-control': 'public, max-age=60, s-maxage=60',
      'x-webstew-published': slug,
    },
  })
}
