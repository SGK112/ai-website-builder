// GET /api/bridge/poll — bridge long-polls for work.
// Auth: Bearer <pairingToken>. Blocks up to POLL_TIMEOUT_MS for a new
// BridgeRequest; returns EmptyPoll on timeout so the bridge can re-poll
// immediately without ambiguity. The bridge re-polls in a tight loop
// (immediate on empty, after each response on busy).

import { NextRequest, NextResponse } from 'next/server'
import { authenticateBridge, waitForWork } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'
// Render's HTTP timeout is ~30s; our POLL_TIMEOUT_MS is 25s so we
// always return before the edge kills the connection. maxDuration 30 is
// the Next.js per-route safety cap; setting it explicit means a future
// bump to POLL_TIMEOUT_MS won't silently hit the platform ceiling.
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const auth = await authenticateBridge(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json(
      { error: `Bridge auth failed: ${auth.reason}` },
      { status: 401 }
    )
  }
  console.log(`[bridge-poll] bridgeId=${auth.bridgeId} userId=${auth.userId} waiting for work...`)
  const controller = new AbortController()
  // If the bridge disconnects mid-poll, abort the waiter so we don't
  // hold the request open uselessly.
  req.signal?.addEventListener('abort', () => controller.abort())
  const work = await waitForWork(auth.userId, controller.signal)
  if ('empty' in work && work.empty) {
    console.log(`[bridge-poll] bridgeId=${auth.bridgeId} timeout (empty)`)
  } else {
    console.log(`[bridge-poll] bridgeId=${auth.bridgeId} got work: ${(work as any).requestId}`)
  }
  return NextResponse.json(work)
}
