// POST /api/bridge/heartbeat — idle keepalive.
// Bridge sends this on HEARTBEAT_INTERVAL_MS while not actively
// polling, so the server's BridgeStatus.lastSeenAt stays fresh and the
// UI doesn't flap to "offline" during quiet stretches. authenticate*
// already touches lastSeenAt, so the body is intentionally empty.

import { NextRequest, NextResponse } from 'next/server'
import { authenticateBridge } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await authenticateBridge(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json(
      { error: `Bridge auth failed: ${auth.reason}` },
      { status: 401 }
    )
  }
  return NextResponse.json({ ok: true })
}
