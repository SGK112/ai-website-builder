// POST /api/backend/[appId]/integrations/connect  { toolkit, returnUrl? }
// Starts an OAuth connection for the calling END-USER (not the app owner),
// scoped to their isolated Composio entity. Returns { redirectUrl } — the app
// sends the user there; Composio finalizes the connection and returns them to
// returnUrl. Auth: app key + end-user bearer token.

import { NextRequest, NextResponse } from 'next/server'
import { authAppRequest } from '@/lib/app-integrations'
import { initiateConnection } from '@/lib/composio'

export const dynamic = 'force-dynamic'

function cors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key, Authorization')
  return res
}
export async function OPTIONS() { return cors(new NextResponse(null, { status: 204 })) }

function bearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || ''
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : (req.headers.get('x-webstew-user-token') || null)
}

export async function POST(req: NextRequest, { params }: { params: { appId: string } }) {
  const key = req.headers.get('x-webstew-key') || req.nextUrl.searchParams.get('key')
  const auth = await authAppRequest(params.appId, key, bearer(req))
  if (!auth.ok) return cors(NextResponse.json({ error: auth.error }, { status: auth.status }))

  let body: any
  try { body = await req.json() } catch { return cors(NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })) }
  const toolkit = String(body?.toolkit || '').toLowerCase().trim()
  if (!toolkit) return cors(NextResponse.json({ error: 'toolkit required' }, { status: 400 }))

  // Owner must have allowed this toolkit for the app.
  if (!auth.allowedToolkits.includes(toolkit)) {
    return cors(NextResponse.json({ error: `This app hasn't enabled "${toolkit}".` }, { status: 403 }))
  }

  // Where Composio sends the user after OAuth. Restrict to a sane URL; default
  // to a generic Webstew "connected" confirmation.
  const origin = req.nextUrl.origin
  let returnUrl = `${origin}/integrations/connected`
  const raw = String(body?.returnUrl || '')
  if (raw && /^https?:\/\//i.test(raw)) returnUrl = raw.slice(0, 500)

  try {
    const { redirectUrl, id } = await initiateConnection({
      userId: auth.entity,
      toolkitSlug: toolkit,
      callbackUrl: returnUrl,
    })
    return cors(NextResponse.json({ redirectUrl, connectionId: id }))
  } catch (e: any) {
    return cors(NextResponse.json({ error: e?.message || 'Could not start connection' }, { status: 502 }))
  }
}
