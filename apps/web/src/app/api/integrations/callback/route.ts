// GET /api/integrations/callback — Composio redirects the user here after
// they complete OAuth with the provider. We just bounce them back to
// /integrations with a flash param so the UI can show a confirmation.
// (Connection status is the source of truth, fetched on page load.)

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toolkit = req.nextUrl.searchParams.get('toolkit') || ''
  const error = req.nextUrl.searchParams.get('error') || ''
  // Same canonical-origin precedence as /api/integrations/connect — when
  // the request is proxied through Cloudflare without correct Host/
  // X-Forwarded-* headers, req.nextUrl.origin can resolve to the internal
  // Render hostname (localhost:5001), which then becomes the user's final
  // landing URL → "This site can't provide a secure connection".
  const canonicalOrigin =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin
  const origin = canonicalOrigin.replace(/\/+$/, '')
  const target = new URL('/integrations', origin)
  if (error) {
    target.searchParams.set('error', error)
  } else if (toolkit) {
    target.searchParams.set('connected', toolkit)
  }
  return NextResponse.redirect(target)
}
