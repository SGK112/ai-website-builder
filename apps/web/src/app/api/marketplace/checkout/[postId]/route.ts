// POST /api/marketplace/checkout/[postId] — DISABLED.
//
// This was a real-money path: buyer's card → platform → destination charge to
// the seller's Stripe Connect account. That pays sellers CASH (money out), which
// we don't do. Marketplace purchases happen in CREDITS via api/marketplace/buy:
// the buyer spends credits, the seller earns 97% as spendable credits, the
// platform keeps 3%. Money only enters when users buy credits; it never leaves.
//
// Kept (disabled, not deleted) so any stale client call gets a clear answer.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct card checkout is disabled. Buy this listing with credits instead.',
      useCredits: true,
      disabled: true,
    },
    { status: 410 },
  )
}
