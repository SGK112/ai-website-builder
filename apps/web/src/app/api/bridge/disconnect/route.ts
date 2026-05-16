// POST /api/bridge/disconnect — UI revokes a paired bridge.
// Body: { bridgeId }. Marks the session as revoked and clears any
// pending requests so a new bridge starts clean.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revokeBridge, getBridgeSessionForUser } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  let body: { bridgeId?: string } = {}
  try {
    body = await req.json()
  } catch {
    // Empty body = revoke whatever bridge this user has active.
  }
  let bridgeId = body.bridgeId
  if (!bridgeId) {
    const sess = await getBridgeSessionForUser(session.user.id)
    if (!sess) return NextResponse.json({ ok: true, revoked: false })
    bridgeId = sess._id
  }
  const ok = await revokeBridge(session.user.id, bridgeId)
  return NextResponse.json({ ok, revoked: ok })
}
