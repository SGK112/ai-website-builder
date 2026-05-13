import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require an authenticated session. /workspace and the website
// generate API are anon-accessible (with a 1-gen cookie cap enforced inside
// the route). /app-builder + multi-target generate routes stay gated — those
// are the iteration / power-user surfaces, and signup makes sense there.
// Save/Deploy/CMS/profile/dashboard/admin all remain gated.
const GATED_PAGE_PREFIXES = ['/app-builder', '/dashboard', '/profile', '/admin']
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
  // Tool endpoints — scraping, grading. Cheap but DoS-friendly if exposed.
  '/api/tools/site-reference',
  '/api/tools/grade',
  // CMS — every read/write goes through the authenticated owner check inside
  // the route handlers, but we gate at the edge too so anonymous traffic
  // can't probe the endpoint shape.
  '/api/cms',
  // User credentials (BYO render/github keys) — gated; route handlers also
  // check ownership.
  '/api/user',
  // Admin endpoints — auth required (handler does the admin-email check).
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

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
