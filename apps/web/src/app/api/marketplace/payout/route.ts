// POST /api/marketplace/payout — DISABLED.
//
// Credits are money IN, never money OUT. They are bought with cash and SPENT on
// the platform; they are never cashed out to USD. Sellers earn 97% of a sale as
// spendable credits (see api/marketplace/buy) and use them on the platform.
//
// This route used to wire real platform funds to sellers' Stripe Connect
// accounts (1 credit = 1¢) — a money-out path we don't want. It is intentionally
// disabled rather than deleted so any stale client call gets a clear answer.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Cash-out is not available. Marketplace credits are spendable on the platform, not withdrawable.',
      disabled: true,
    },
    { status: 410 },
  )
}
