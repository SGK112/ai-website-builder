// POST /api/bridge/pair-init — user side of pairing.
// Authenticated via NextAuth session. Returns a short-lived pairing
// code the user pastes into `webstew-bridge connect <code>` locally.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { issuePairingCode } from '@/lib/bridge-store'
import type { PairingCodeResponse } from '@webstew/bridge/src/protocol'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const { code, expiresInSec } = issuePairingCode(session.user.id)
  const serverUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(req.url).origin
  const body: PairingCodeResponse = { code, expiresInSec, serverUrl }
  return NextResponse.json(body)
}
