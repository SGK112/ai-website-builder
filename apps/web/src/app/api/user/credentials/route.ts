// GET /api/user/credentials — list the credential SUMMARIES (no values).
// PUT /api/user/credentials — upsert one credential. Body: { type, value }.
//
// Credentials are encrypted at rest. We optionally validate against the
// provider's API on PUT so the user gets immediate feedback that their key
// actually works, not later at deploy time.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listUserCredentials, upsertUserCredential, validateCredential } from '@/lib/credentials-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const creds = await listUserCredentials(session.user.id)
  return NextResponse.json({ credentials: creds })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const type = body?.type
  const value = String(body?.value || '').trim()
  if (type !== 'render' && type !== 'github') {
    return NextResponse.json({ error: 'type must be "render" or "github"' }, { status: 400 })
  }
  if (!value || value.length < 8) {
    return NextResponse.json({ error: 'Value too short' }, { status: 400 })
  }

  // Validate before storing so the UI can say "yes it works" right away.
  const validated = await validateCredential(type, value)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  await upsertUserCredential(session.user.id, type, value, true)
  return NextResponse.json({ ok: true, type, meta: validated.meta })
}
