// GET /api/bridge/status — UI polls this (e.g. every 5s on the
// /integrations panel) to show "Bridge connected ✓ / offline".
// Cheap: one Mongo findOne + a peek at in-memory counters.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBridgeStatus } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const status = await getBridgeStatus(session.user.id)
  return NextResponse.json(status)
}
