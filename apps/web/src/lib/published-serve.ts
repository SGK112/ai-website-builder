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
// Published pages use ROOT-RELATIVE links (href="/contractor-login",
// location.href = '/portal'). Those only resolve when the site is the origin
// root (a {slug}.webstew.app subdomain or a custom domain). When the SAME site
// is viewed at www.webstew.net/s/<slug>/…, a root-relative "/contractor-login"
// escapes to the Webstew app root and 404s. So when we're serving under a
// sub-path, prefix every internal nav/asset reference with that base. basePath
// is '' for root hosts (subdomain / custom domain) — then this is a no-op.
function rebaseHtml(html: string, basePath: string): string {
  const pfx = (basePath || '').replace(/\/+$/, '')
  if (!pfx) return html
  // Root-relative refs that point at a Webstew PLATFORM endpoint (/api/media for
  // images, /api/* in general) live at the app root, not under the site — they
  // must stay root-relative so they resolve to www.webstew.net/api/... . Only
  // the site's OWN pages/assets get the base prefix.
  const isPlatform = (rest: string) => /^api(\/|$)/i.test(rest)
  // Nav/asset attributes pointing at a root-relative path (not protocol-relative
  // //, not external, not #hash, not mailto:/data:).
  html = html.replace(
    /(?<![.\w-])(data-href|href|src|action)\s*=\s*(["'])\/(?!\/)([^"']*)\2/gi,
    (m, attr, q, rest) => (isPlatform(rest) ? m : `${attr}=${q}${pfx}/${rest}${q}`),
  )
  // srcset is a comma-separated list of "<url> <descriptor>" — the attr regex
  // above only catches a single src, so responsive images (<img srcset>,
  // <source srcset>) would 404 under /s/<slug>. Rebase each root-relative URL.
  html = html.replace(
    /(\bsrcset\s*=\s*)(["'])([^"']*)\2/gi,
    (m: string, attr: string, q: string, list: string) => {
      const rebased = list.split(',').map((part) => {
        const seg = part.trim()
        const sp = seg.match(/^\/(?!\/)([^\s]*)(\s+.+)?$/) // root-relative URL + optional descriptor
        if (!sp) return seg
        return isPlatform(sp[1]) ? seg : `${pfx}/${sp[1]}${sp[2] || ''}`
      }).join(', ')
      return `${attr}${q}${rebased}${q}`
    },
  )
  // CSS url(/asset) — background images in <style> blocks or inline style="".
  html = html.replace(
    /url\(\s*(['"]?)\/(?!\/)([^'")]+)\1\s*\)/gi,
    (m: string, q: string, rest: string) => (isPlatform(rest) ? m : `url(${q}${pfx}/${rest}${q})`),
  )
  // Programmatic navigation in inline scripts: location.href = '/x',
  // window.location = '/x'. Comparisons (===) and dynamic values are untouched
  // because the value must be a root-relative string literal.
  html = html.replace(
    /((?:window\s*\.\s*)?location\s*(?:\.\s*href)?\s*=\s*)(["'])\/(?!\/)([^"']*)\2/gi,
    (m, pre, q, rest) => (isPlatform(rest) ? m : `${pre}${q}${pfx}/${rest}${q}`),
  )
  html = html.replace(
    /((?:window\s*\.\s*)?location\s*\.\s*(?:assign|replace)\s*\(\s*)(["'])\/(?!\/)([^"']*)\2/gi,
    (m, pre, q, rest) => (isPlatform(rest) ? m : `${pre}${q}${pfx}/${rest}${q}`),
  )
  return html
}

function htmlResponse(html: string, label?: string, basePath = ''): NextResponse {
  return new NextResponse(rebaseHtml(html, basePath), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
      ...(label ? { 'x-webstew-published': label } : {}),
    },
  })
}

// Multi-page projects store ALL their pages inside this sidecar (id, name, slug,
// html, isHome) and only ship a single index.html file — the per-slug .html
// files are never emitted. Without this, every page except the home page 404s
// on a published site (e.g. a post-login redirect to /contractor-portal). We
// resolve page requests from the sidecar so each slug serves its real HTML, and
// "/" serves the isHome page (not whatever page happened to be active at save).
const PAGES_SIDECAR = '_webstew_pages.json'

function servePageFromSidecar(byPath: Map<string, string>, reqPath: string, label?: string, basePath = ''): NextResponse | null {
  const raw = byPath.get(PAGES_SIDECAR)
  if (!raw) return null
  // Only intercept page navigations — let assets (.css/.js/images) fall through.
  const isPageReq = reqPath === '' || /\.html?$/i.test(reqPath) || !reqPath.includes('.')
  if (!isPageReq) return null
  let pages: Array<{ slug?: string; html?: string; isHome?: boolean }> = []
  try {
    const parsed = JSON.parse(raw)
    pages = Array.isArray(parsed?.pages) ? parsed.pages : []
  } catch { return null }
  if (!pages.length) return null

  const want = reqPath.replace(/\.html?$/i, '').replace(/\/index$/i, '').replace(/^\/+|\/+$/g, '').toLowerCase()
  const page = want === '' || want === 'index'
    ? (pages.find(p => p.isHome) || pages[0])
    : pages.find(p => String(p.slug || '').toLowerCase() === want)
  if (!page || typeof page.html !== 'string') return null
  return htmlResponse(page.html, label, basePath)
}

export function servePublishedFile(site: PublishedSite | null, pathParts: string[], label?: string, basePath = ''): NextResponse {
  if (!site || !Array.isArray(site.files)) return publishedNotFound()

  const byPath = new Map(site.files.map(f => [f.path.replace(/^\/+/, ''), f.content]))
  const reqPath = (pathParts || []).join('/').replace(/^\/+/, '')

  // Sidecar pages take precedence for page requests (fixes multi-page routing +
  // the home page showing the wrong page). Assets fall through to static files.
  const fromSidecar = servePageFromSidecar(byPath, reqPath, label, basePath)
  if (fromSidecar) return fromSidecar

  const candidates = reqPath === ''
    ? ['index.html']
    : [reqPath, `${reqPath}.html`, `${reqPath}/index.html`]

  let hit: string | undefined
  for (const c of candidates) {
    if (byPath.has(c)) { hit = c; break }
  }
  if (hit === undefined) return publishedNotFound()

  // Rebase internal links in HTML files served under a sub-path; assets stream
  // unchanged.
  if (/\.html?$/i.test(hit)) return htmlResponse(byPath.get(hit)!, label, basePath)

  return new NextResponse(byPath.get(hit)!, {
    status: 200,
    headers: {
      'content-type': contentTypeFor(hit),
      'cache-control': 'public, max-age=60, s-maxage=60',
      ...(label ? { 'x-webstew-published': label } : {}),
    },
  })
}
