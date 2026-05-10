import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require an authenticated session. Workspace UI + builder APIs
// are gated. Static landing, signup/login, and public APIs remain open.
const GATED_PAGE_PREFIXES = ['/workspace', '/dashboard', '/profile']
const GATED_API_PREFIXES = [
  '/api/builder/generate',
  '/api/builder/converse',
  '/api/builder/chat',
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
