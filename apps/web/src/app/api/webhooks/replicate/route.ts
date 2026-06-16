// POST /api/webhooks/replicate — terminal-state callback for video predictions.
//
// Replicate calls this when a prediction completes. We only act on FAILED/
// CANCELED to refund the credits charged at start — covering the case where the
// user closed the tab before the failing job was polled. Idempotent with the
// poll-based refund (refundVideoJob's atomic refunded:false guard), so whichever
// fires first wins and the other no-ops.
//
// Ungated by middleware (sibling to /api/webhooks/stripe) — authenticated by the
// Replicate signature, not a session.

import { NextRequest, NextResponse } from 'next/server'
import { verifyReplicateWebhook } from '@/lib/replicate-webhook'
import { refundVideoJob } from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const valid = await verifyReplicateWebhook(req.headers, raw)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const id = String(body?.id || '')
  const status = String(body?.status || '')
  if (id && (status === 'failed' || status === 'canceled')) {
    await refundVideoJob(id)
  }
  return NextResponse.json({ received: true })
}
