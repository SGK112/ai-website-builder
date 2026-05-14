import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require an authenticated session. /workspace and the website
// generate API are anon-accessible (with a 1-gen cookie cap enforced inside
// the route). /app-builder + multi-target generate routes stay gated — those
// are the iteration / power-user surfaces, and signup makes sense there.
// Save/Deploy/CMS/profile/dashboard/admin all remain gated.
const GATED_PAGE_PREFIXES = ['/app-builder', '/dashboard', '/profile', '/admin', '/integrations', '/workspace']
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
  '/api/community',      // user content (posts already inline-auth; gate at edge for chat too)
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

  const isGatedPage = GATED_PAGE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
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
