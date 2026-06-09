// POST /api/backend/[appId]/integrations/run  { toolkit, action, params }
// Runs a Composio action on behalf of the calling END-USER's connection. This
// is the passthrough: the app's frontend never sees the COMPOSIO_API_KEY — it
// asks Webstew's backend, which executes scoped to the user's entity.
// Auth: app key + end-user bearer token.

import { NextRequest, NextResponse } from 'next/server'
import { authAppRequest } from '@/lib/app-integrations'
import { executeAction } from '@/lib/composio'

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
  const action = String(body?.action || '').trim()
  const actionParams = (body?.params && typeof body.params === 'object') ? body.params : {}
  if (!toolkit || !action) return cors(NextResponse.json({ error: 'toolkit and action required' }, { status: 400 }))

  // Owner allowlist gate. The action slug must also belong to the toolkit
  // (Composio slugs are prefixed, e.g. STRIPE_CREATE_PAYMENT_LINK) so an
  // allowed toolkit can't be used to invoke a different one.
  if (!auth.allowedToolkits.includes(toolkit)) {
    return cors(NextResponse.json({ error: `This app hasn't enabled "${toolkit}".` }, { status: 403 }))
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!norm(action).startsWith(norm(toolkit))) {
    return cors(NextResponse.json({ error: `Action "${action}" does not belong to toolkit "${toolkit}".` }, { status: 400 }))
  }

  const result = await executeAction({ userId: auth.entity, actionSlug: action, args: actionParams })
  if (!result.successful) {
    // Most common: the user hasn't connected this toolkit yet.
    return cors(NextResponse.json({ ok: false, error: result.error || 'Action failed', needsConnect: /auth|connect|not connected|no connected/i.test(result.error || '') }, { status: 200 }))
  }
  return cors(NextResponse.json({ ok: true, data: result.data }))
}
