// Owner-authenticated integration allowlist for a managed-backend app.
// Controls which Composio toolkits the app may expose to ITS end-users.
//
//   GET  ?projectId= | ?appId=             → { allowedToolkits, available }
//   POST ?projectId= | ?appId=  { toolkits } → set the allowlist

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveOwnedBackend } from '@/lib/app-backend'
import { setAllowedToolkits } from '@/lib/app-integrations'
import { SUPPORTED_TOOLKITS, metaForToolkit } from '@/lib/composio'
import { connectDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function ownedApp(req: NextRequest): Promise<{ appId: string; userId: string } | { err: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { err: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  const projectId = req.nextUrl.searchParams.get('projectId')
  const appId = req.nextUrl.searchParams.get('appId')
  const backend = await resolveOwnedBackend(session.user.id, { projectId, appId })
  if (!backend) return { err: NextResponse.json({ error: 'Backend not found' }, { status: 404 }) }
  return { appId: backend.appId, userId: session.user.id }
}

export async function GET(req: NextRequest) {
  const r = await ownedApp(req)
  if ('err' in r) return r.err
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  const doc = await db?.collection('app_backends').findOne({ appId: r.appId }, { projection: { 'integrations.allowedToolkits': 1 } })
  return NextResponse.json({
    allowedToolkits: (doc as any)?.integrations?.allowedToolkits || [],
    available: SUPPORTED_TOOLKITS.map((t) => ({ slug: t.slug, label: t.label, category: t.category })),
  })
}

export async function POST(req: NextRequest) {
  const r = await ownedApp(req)
  if ('err' in r) return r.err
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const requested: string[] = Array.isArray(body?.toolkits) ? body.toolkits.map((s: any) => String(s).toLowerCase().trim()) : []
  // Only allow toolkits we actually surface (have metadata/auth_config for).
  const toolkits = Array.from(new Set(requested.filter((s) => !!metaForToolkit(s))))
  const ok = await setAllowedToolkits(r.appId, r.userId, toolkits)
  if (!ok) return NextResponse.json({ error: 'Could not update allowlist' }, { status: 500 })
  return NextResponse.json({ ok: true, allowedToolkits: toolkits })
}
