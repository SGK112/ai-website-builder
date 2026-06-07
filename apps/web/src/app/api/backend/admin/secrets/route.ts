// Owner-authenticated secrets management for a managed-backend app.
// Values are write-only from the UI's perspective: you can SET and DELETE, and
// LIST returns masked previews — the plaintext never leaves the server except
// into the server-actions runner.
//
//   GET    ?projectId=                 → [{ key, masked, updatedAt }]
//   POST   ?projectId=  { key, value } → upsert
//   DELETE ?projectId=&key=            → remove

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveOwnedBackend } from '@/lib/app-backend'
import { listSecrets, setSecret, deleteSecret, isValidSecretKey } from '@/lib/app-secrets'

export const dynamic = 'force-dynamic'

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
  return NextResponse.json({ secrets: await listSecrets(r.appId) })
}

export async function POST(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const key = String(body?.key || '').trim()
  const value = String(body?.value ?? '')
  if (!isValidSecretKey(key)) {
    return NextResponse.json({ error: 'Key must be UPPER_SNAKE_CASE (e.g. STRIPE_SECRET_KEY).' }, { status: 400 })
  }
  if (!value) return NextResponse.json({ error: 'value required' }, { status: 400 })
  if (value.length > 8192) return NextResponse.json({ error: 'Secret too long (max 8KB).' }, { status: 413 })
  await setSecret(r.appId, key, value)
  return NextResponse.json({ ok: true, key })
}

export async function DELETE(req: NextRequest) {
  const r = await ownedAppId(req)
  if ('err' in r) return r.err
  const key = String(req.nextUrl.searchParams.get('key') || '').trim()
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
  const removed = await deleteSecret(r.appId, key)
  return NextResponse.json({ ok: true, removed })
}
