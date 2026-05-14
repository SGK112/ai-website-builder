// GET /api/integrations/callback — Composio redirects the user here after
// they complete OAuth with the provider. We just bounce them back to
// /integrations with a flash param so the UI can show a confirmation.
// (Connection status is the source of truth, fetched on page load.)

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toolkit = req.nextUrl.searchParams.get('toolkit') || ''
  const error = req.nextUrl.searchParams.get('error') || ''
  const target = new URL('/integrations', req.nextUrl.origin)
  if (error) {
    target.searchParams.set('error', error)
  } else if (toolkit) {
    target.searchParams.set('connected', toolkit)
  }
  return NextResponse.redirect(target)
}
