// Owner-authenticated CRUD for a managed-backend app's server actions.
//
//   GET    ?projectId=                          → [{ name, method, url, headers, forwardBody }]
//   POST   ?projectId=  { name, method, url, headers?, forwardBody? } → upsert
//   DELETE ?projectId=&name=                    → remove

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveOwnedBackend } from '@/lib/app-backend'
import { listActions, upsertAction, deleteAction, isValidActionName, type AppAction } from '@/lib/app-actions'

export const dynamic = 'force-dynamic'

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

async function ownedAppId(req: NextRequest): Promise<{ appId: string } | { err: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { err: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  const projectId = req.nextUrl.searchParams.get('projectId')
  const appId = req.nextUrl.searchParams.get('appId')
  const backend = await resolveOwnedBackend(session.user.id, { projectId, appId })
  if (!backend) return { err: NextResponse.json({ error: 'Backend not found' }, { status: 404 }) }
  return { appId: backend.appId }
}

export async function GET(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  return NextResponse.json({ actions: await listActions(r.appId) })
}

export async function POST(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = String(body?.name || '').trim()
  const method = String(body?.method || 'POST').toUpperCase()
  const url = String(body?.url || '').trim()
  if (!isValidActionName(name)) return NextResponse.json({ error: 'name must be lowercase-kebab/snake (e.g. send-email)' }, { status: 400 })
  if (!METHODS.has(method)) return NextResponse.json({ error: 'method must be GET/POST/PUT/PATCH/DELETE' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ error: 'url must start with http(s)://' }, { status: 400 })

  const headers: Record<string, string> = {}
  if (body?.headers && typeof body.headers === 'object') {
    for (const [k, v] of Object.entries(body.headers)) {
      if (typeof v === 'string') headers[String(k).slice(0, 128)] = v.slice(0, 4096)
    }
  }
  const action: AppAction = {
    appId: r.appId, name, method: method as AppAction['method'], url, headers,
    forwardBody: body?.forwardBody !== false,
  }
  await upsertAction(action)
  return NextResponse.json({ ok: true, name })
}

export async function DELETE(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  const name = String(req.nextUrl.searchParams.get('name') || '').trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  return NextResponse.json({ ok: true, removed: await deleteAction(r.appId, name) })
}
