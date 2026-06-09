import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require an authenticated session. /workspace and the website
// generate API are anon-accessible (with a 1-gen cookie cap enforced inside
// the route). Multi-target generate routes stay gated — that's the
// power-user surface, and signup makes sense there.
// Save/Deploy/CMS/profile/dashboard/admin all remain gated.
const GATED_PAGE_PREFIXES = ['/dashboard', '/profile', '/admin', '/integrations', '/workspace', '/library']
const GATED_API_PREFIXES = [
  '/api/builder/converse',
  '/api/builder/chat',
  // Multi-target builder routes — each makes a Claude call, must be gated.
  '/api/builder/nextjs',
  '/api/builder/react',
  '/api/builder/astro',
  '/api/builder/app',
  // AI feature endpoints that hit paid providers (Replicate, OpenAI, etc.) —
  // they cost real money per call. Authenticated users only.
  '/api/ai/image',
  '/api/ai/video',
  '/api/ai/chat',
  '/api/ai/free',
  // Tool endpoints — scraping. /api/tools/grade is intentionally open
  // (anon-accessible) so it can power the landing-page lead-gen widget.
  // The route handler enforces its own IP rate limit.
  '/api/tools/site-reference',
  // CMS — every read/write goes through the authenticated owner check inside
  // the route handlers, but we gate at the edge too so anonymous traffic
  // can't probe the endpoint shape.
  '/api/cms',
  // User credentials (BYO render/github keys) — gated; route handlers also
  // check ownership.
  '/api/user',
  // Admin endpoints — auth required (handler does the admin-email check).
  '/api/admin',
  // Integrations API — every action is per-user, route handlers also check
  // session, gate at the edge as defense-in-depth.
  '/api/integrations',
  // Stripe Connect (Express onboarding for sellers) — every action is
  // per-user. Route handlers verify session + ownership; edge gate is
  // defense-in-depth so anon traffic can't probe the surface.
  '/api/stripe/connect',
  // Marketplace purchase + community engagement endpoints — must be
  // authed for one-per-user semantics + accountability.
  '/api/marketplace',
  // User's owned listings + purchases. Inline auth in route too.
  '/api/library',
  // Legacy / unreferenced routes that nevertheless burn paid quotas or leak
  // data when hit anonymously. Gate at the edge so a random scanner can't
  // pull on them. If one of these gets wired back into the UI, swap to a
  // route-handler auth check so BYOK still works — same pattern as above.
  '/api/chat',           // edge runtime, calls Anthropic + OpenAI directly
  // NOTE: /api/forms intentionally NOT gated here — would also block
  // /api/forms/submit (anon submissions from generated sites). The
  // /api/forms/route.ts handler does its own auth check.
  '/api/builder-io',     // proxies Builder.io with a server-side API key
  '/api/pagespeed',      // arbitrary-URL fetch wrapper around Google PSI
  '/api/media/pexels',   // server-side PEXELS_API_KEY
  '/api/media/pixabay',  // server-side PIXABAY_API_KEY
  '/api/media/upload',   // server-side Cloudinary secret
  // Closes additional holes found in a gates audit (2026-05-14):
  '/api/ai/runpod',      // expensive GPU endpoints + RUNPOD_API_KEY
  // NOTE: /api/community intentionally NOT gated. The GET endpoints serve
  // public approved posts to anonymous visitors (the /community page lands
  // them on the showcase before signup). Each handler does inline auth on
  // its own mutations (POST/DELETE for posts, likes, saves, comments,
  // chat). Edge-gating broke the read flow — community page silently
  // showed an empty feed because the public GET was returning 401.
  '/api/images/search',  // proxies Unsplash/Pexels/Pixabay keys
]

// Render gives every service a stable `<slug>.onrender.com` hostname. If a
// user lands there directly (bookmark, OAuth redirect when NEXTAUTH_URL was
// misconfigured, link-share before the custom domain existed), they bypass
// Cloudflare entirely — no rate limits, no WAF, and cookies set on
// www.webstew.net never reach this host (so sign-in silently fails with
// OAuthCallback errors). 301 every such request to the canonical CF-proxied
// origin so the bypass closes itself in-code, no Render dashboard flip needed.
const RENDER_HOSTS_TO_CANONICALIZE: Record<string, string> = {
  'ai-website-builder-ntzg.onrender.com': 'https://www.webstew.net',
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host') || ''
  const canonicalBase = RENDER_HOSTS_TO_CANONICALIZE[host]
  if (canonicalBase) {
    return NextResponse.redirect(`${canonicalBase}${pathname}${search}`, 301)
  }

  // ── Published-site hosting ────────────────────────────────────────────────
  // {slug}.webstew.app → serve the static site stored by /api/publish, via the
  // /s/[slug] origin. This makes Webstew its own static host: instant Go Live
  // with no GitHub repo, no Render service, no user keys. The /s/ path is
  // public, so no auth gating applies to a visitor's site.
  const PUBLISH_DOMAIN = process.env.NEXT_PUBLIC_PUBLISH_DOMAIN || 'webstew.app'
  const bareHost = host.split(':')[0]
  if (bareHost.endsWith('.' + PUBLISH_DOMAIN)) {
    const slug = bareHost.slice(0, -(PUBLISH_DOMAIN.length + 1))
    const RESERVED = new Set(['www', 'app', 'api', 'admin', 'mail', 'cdn', 'assets', 'static'])
    const isInternal = pathname.startsWith('/s/') || pathname.startsWith('/_next') || pathname.startsWith('/api/')
    if (slug && !slug.includes('.') && !RESERVED.has(slug) && !isInternal) {
      const url = request.nextUrl.clone()
      url.pathname = pathname === '/' ? `/s/${slug}` : `/s/${slug}${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // ── Custom-domain hosting ─────────────────────────────────────────────────
  // A bought/connected custom domain (acme.com) is attached to the Render
  // service and its DNS points here. Render only forwards a host to us once
  // it's been added to the service, so any host that isn't one of ours is a
  // real custom domain → serve its mapped published site via /sites/by-host
  // (which looks up published_sites.customDomain === host). The whole domain
  // shows ONLY the published site — never the Webstew app chrome.
  const isWebstewHost =
    bareHost === 'localhost' || bareHost === '127.0.0.1' ||
    bareHost === 'webstew.net' || bareHost.endsWith('.webstew.net') ||
    bareHost.endsWith('.' + PUBLISH_DOMAIN) || bareHost.endsWith('.onrender.com')
  // Require a letter so bare IPs (Render health checks / direct-IP hits) are
  // never rewritten — only real hostnames map to a custom-domain site.
  if (!isWebstewHost && bareHost.includes('.') && /[a-z]/i.test(bareHost) &&
      !pathname.startsWith('/_next') && !pathname.startsWith('/api/') &&
      !pathname.startsWith('/s/') && !pathname.startsWith('/sites/by-host')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/sites/by-host' : `/sites/by-host${pathname}`
    return NextResponse.rewrite(url)
  }

  // ── Bot/scanner probe short-circuit ───────────────────────────────────────
  // Vulnerability scanners constantly hammer WordPress / PHP / dotfile paths
  // (e.g. /wp-admin/install.php, /xmlrpc.php, /.env, /.git/config). This is a
  // Next.js app — none of these exist, but the default 404 renders the full
  // ~41KB app shell, so every bot probe burns real bandwidth. Return a bare
  // 404 instead. Reached only AFTER the published-site rewrite above, so a
  // user's *.webstew.app site is never affected. High-confidence patterns only.
  if (/^\/(wp-admin|wp-login|wp-includes|wp-content|wordpress|xmlrpc\.php|\.env|\.git\b)/i.test(pathname)
      || /\.php$/i.test(pathname)) {
    return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=86400' } })
  }

  // Public exceptions under otherwise-gated prefixes. /integrations/connected is
  // the post-OAuth landing for a PUBLISHED APP's end-users (Composio passthrough)
  // — they're not Webstew users, so bouncing them to signup would break the flow.
  const PUBLIC_PAGE_EXCEPTIONS = ['/integrations/connected']
  const isGatedPage = !PUBLIC_PAGE_EXCEPTIONS.includes(pathname)
    && GATED_PAGE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isGatedApi = GATED_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!isGatedPage && !isGatedApi) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  // Allow API key BYOK on gated APIs without a session — let the route itself
  // decide. Keeps the integration / Aria escape hatch alive while still
  // gating the workspace UI for browsers.
  if (isGatedApi) {
    const auth = request.headers.get('authorization') || ''
    if (auth.startsWith('Bearer ')) {
      return NextResponse.next({ request: { headers: request.headers } })
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token?.email || token?.sub) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  if (isGatedApi) {
    return NextResponse.json(
      { error: 'Authentication required', requireAuth: true },
      { status: 401 }
    )
  }

  // Gated page → redirect to signup, preserve where they were going so they
  // land back there after auth.
  const next = encodeURIComponent(pathname + (search || ''))
  const signupUrl = new URL(`/signup?next=${next}`, request.url)
  return NextResponse.redirect(signupUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
