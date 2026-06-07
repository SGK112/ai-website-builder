// Shared serving logic for published sites — used by both:
//   • /s/[slug]            (the {slug}.webstew.app origin)
//   • /sites/by-host       (custom domains: acme.com → the mapped site)
//
// A published_sites doc holds { slug, published, customDomain?, files: [{path,
// content}] }. Resolution follows static-host conventions: "/" → index.html,
// "/about" → about.html (or about/index.html), exact match for assets.

import { NextResponse } from 'next/server'

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

export function publishedNotFound(): NextResponse {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Not found</title><body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0b0b0f;color:#e5e7eb"><div style="text-align:center"><h1 style="font-size:3rem;margin:0">404</h1><p style="opacity:.6">This page isn't published.</p><p style="opacity:.4;font-size:.85rem">Powered by <a href="https://webstew.net" style="color:#34d399">Webstew</a></p></div></body>`,
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

interface PublishedSite { slug?: string; files?: Array<{ path: string; content: string }> }

/**
 * Resolve a request path against a published site's files and return the
 * response. `pathParts` is the path after the host/slug (e.g. ['about']).
 */
export function servePublishedFile(site: PublishedSite | null, pathParts: string[], label?: string): NextResponse {
  if (!site || !Array.isArray(site.files)) return publishedNotFound()

  const byPath = new Map(site.files.map(f => [f.path.replace(/^\/+/, ''), f.content]))
  const reqPath = (pathParts || []).join('/').replace(/^\/+/, '')

  const candidates = reqPath === ''
    ? ['index.html']
    : [reqPath, `${reqPath}.html`, `${reqPath}/index.html`]

  let hit: string | undefined
  for (const c of candidates) {
    if (byPath.has(c)) { hit = c; break }
  }
  if (hit === undefined) return publishedNotFound()

  return new NextResponse(byPath.get(hit)!, {
    status: 200,
    headers: {
      'content-type': contentTypeFor(hit),
      'cache-control': 'public, max-age=60, s-maxage=60',
      ...(label ? { 'x-webstew-published': label } : {}),
    },
  })
}
