// POST /api/bridge/respond — bridge posts ONE response chunk per call.
// Body: BridgeResponse. Server looks up the live response stream by
// requestId and forwards the chunk to the agent route's SSE writer.
//
// Why one-chunk-per-POST instead of a single streamed POST: the bridge
// runs behind whatever's on the user's network (corporate proxies,
// captive portals, NAT timeouts). Per-chunk POSTs make each unit of
// progress survive flaky links — a partial response can be retried
// without restarting the whole agent turn.

import { NextRequest, NextResponse } from 'next/server'
import { authenticateBridge, pushBridgeResponse } from '@/lib/bridge-store'
import type { BridgeResponse } from '@webstew/bridge/src/protocol'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await authenticateBridge(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json(
      { error: `Bridge auth failed: ${auth.reason}` },
      { status: 401 }
    )
  }
  let chunk: BridgeResponse
  try {
    chunk = (await req.json()) as BridgeResponse
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!chunk?.requestId || !chunk?.kind) {
    return NextResponse.json({ error: 'requestId + kind required' }, { status: 400 })
  }
  console.log(`[bridge-respond] bridgeId=${auth.bridgeId} requestId=${chunk.requestId} kind=${chunk.kind}`)
  const matched = pushBridgeResponse(chunk)
  if (!matched) {
    // No matching open request — either the agent route already gave up
    // (timeout) or the user navigated away. Tell the bridge so it can
    // stop streaming further chunks for this requestId.
    console.log(`[bridge-respond] bridgeId=${auth.bridgeId} requestId=${chunk.requestId} NO MATCHING STREAM`)
    return NextResponse.json({ accepted: false, reason: 'no-open-request' }, { status: 410 })
  }
  return NextResponse.json({ accepted: true })
}
