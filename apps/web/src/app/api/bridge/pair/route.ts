// POST /api/bridge/pair — bridge side of pairing.
// Bridge sends { code, hostname, bridgeVersion, protocolVersion }.
// On success, returns { bridgeId, pairingToken } that the bridge stores
// locally and uses as Authorization: Bearer for all later calls.

import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { consumePairingCode, createBridgeSession } from '@/lib/bridge-store'
import {
  PROTOCOL_VERSION,
  type PairingExchangeRequest,
  type PairingExchangeResponse,
} from '@webstew/bridge/src/protocol'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Brute-force ceiling: a pairing code claims a bridge onto an account, so cap
  // guesses per IP (auth bucket = 10 / 15 min).
  try {
    await checkApiRateLimit(req, 'auth')
  } catch (err) {
    const limited = handleRateLimitError(err)
    if (limited) return limited
    throw err
  }

  let body: PairingExchangeRequest
  try {
    body = (await req.json()) as PairingExchangeRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.code || typeof body.code !== 'string') {
    return NextResponse.json({ error: 'Pairing code required' }, { status: 400 })
  }
  // Reject incompatible major versions outright — clearer error than
  // letting the bridge fail later at request time.
  const major = (v: string) => v.split('.')[0]
  if (body.protocolVersion && major(body.protocolVersion) !== major(PROTOCOL_VERSION)) {
    return NextResponse.json(
      {
        error:
          `Bridge protocol ${body.protocolVersion} incompatible with server ${PROTOCOL_VERSION}. ` +
          `Run: npm i -g @webstew/bridge@latest`,
      },
      { status: 426 }
    )
  }
  const userId = consumePairingCode(body.code)
  if (!userId) {
    return NextResponse.json(
      { error: 'Pairing code is invalid or expired. Generate a new one from /integrations.' },
      { status: 400 }
    )
  }
  const { bridgeId, pairingToken } = await createBridgeSession({
    userId,
    hostname: body.hostname || 'unknown',
    bridgeVersion: body.bridgeVersion || '0.0.0',
    protocolVersion: body.protocolVersion || PROTOCOL_VERSION,
  })
  const res: PairingExchangeResponse = { bridgeId, pairingToken }
  return NextResponse.json(res)
}
