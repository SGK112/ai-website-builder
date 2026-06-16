// Verify Replicate webhook signatures (Svix-compatible scheme).
//
// Replicate signs with a per-account secret fetched once from
// GET /v1/webhooks/default/secret → { key: "whsec_<base64>" }. Each request
// carries webhook-id / webhook-timestamp / webhook-signature headers; the
// signed payload is `${id}.${timestamp}.${rawBody}`, HMAC-SHA256'd with the
// (base64-decoded) secret, base64-encoded.

import crypto from 'crypto'

let cachedSecret: string | null = null

async function getSigningSecret(): Promise<string | null> {
  if (cachedSecret) return cachedSecret
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null
  try {
    const res = await fetch('https://api.replicate.com/v1/webhooks/default/secret', {
      headers: { Authorization: `Token ${token}` },
    })
    if (!res.ok) return null
    const j = await res.json()
    cachedSecret = typeof j?.key === 'string' ? j.key : null
    return cachedSecret
  } catch {
    return null
  }
}

export async function verifyReplicateWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const sigHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !sigHeader) return false

  // Replay guard: reject timestamps more than 5 minutes off.
  const ts = parseInt(timestamp, 10)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const secret = await getSigningSecret()
  if (!secret) return false
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')

  const signedContent = `${id}.${timestamp}.${rawBody}`
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  // Header is space-separated "v1,<base64sig>" entries; any match (constant-time) passes.
  const candidates = sigHeader.split(' ').map(part => (part.includes(',') ? part.split(',')[1] : part))
  const expectedBuf = Buffer.from(expected)
  return candidates.some(sig => {
    try {
      const sigBuf = Buffer.from(sig)
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)
    } catch {
      return false
    }
  })
}

// Test-only seam so we can unit-test verification without hitting Replicate.
export function __setReplicateSecretForTest(secret: string | null) {
  cachedSecret = secret
}
