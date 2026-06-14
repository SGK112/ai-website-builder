// POST /api/backend/[appId]/actions/[name] — the generated app invokes a
// predefined server action by name, authenticated with the app's apiKey. The
// owner's stored secrets are interpolated into the outbound request SERVER-SIDE
// and never returned to the caller. CORS-open like the data API.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAction, runAction } from '@/lib/app-actions'
import { backendRateLimited } from '@/lib/backend-ratelimit'

export const dynamic = 'force-dynamic'

function cors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

async function authApp(appId: string, key: string | null): Promise<boolean> {
  if (!key) return false
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return false
  const b = await db.collection('app_backends').findOne({ appId }, { projection: { apiKey: 1 } })
  return !!b && b.apiKey === key
}

interface Ctx { params: { appId: string; name: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { appId, name } = params
  const limited = backendRateLimited(req, appId, 'action', 'communityAction')
  if (limited) return limited
  const key = req.headers.get('x-webstew-key') || req.nextUrl.searchParams.get('key')
  if (!(await authApp(appId, key))) {
    return cors(NextResponse.json({ error: 'Invalid or missing app key.' }, { status: 401 }))
  }
  const action = await getAction(appId, name)
  if (!action) return cors(NextResponse.json({ error: `No action named "${name}".` }, { status: 404 }))

  let callerBody: any = null
  try { callerBody = await req.json() } catch { /* body optional */ }

  const result = await runAction(action, callerBody)
  // Surface the upstream status + body, but never the secrets used.
  return cors(NextResponse.json(
    result.ok ? { ok: true, status: result.status, data: result.body } : { ok: false, status: result.status, error: result.error, data: result.body },
    { status: result.ok ? 200 : (result.status >= 400 && result.status < 600 ? result.status : 502) },
  ))
}
