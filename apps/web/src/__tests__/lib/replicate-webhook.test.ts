import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'crypto'
import { verifyReplicateWebhook, __setReplicateSecretForTest } from '@/lib/replicate-webhook'

// Known test secret (whsec_<base64>). The base64 part decodes to the HMAC key.
const SECRET = 'whsec_' + Buffer.from('super-secret-signing-key-123456').toString('base64')

function sign(id: string, ts: number, body: string): string {
  const key = Buffer.from(SECRET.replace(/^whsec_/, ''), 'base64')
  return crypto.createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64')
}

function headers(h: Record<string, string>): Headers {
  const out = new Headers()
  for (const [k, v] of Object.entries(h)) out.set(k, v)
  return out
}

describe('verifyReplicateWebhook', () => {
  beforeEach(() => __setReplicateSecretForTest(SECRET))

  const body = JSON.stringify({ id: 'pred_123', status: 'failed' })
  const now = () => Math.floor(Date.now() / 1000)

  it('accepts a correctly-signed recent request', async () => {
    const ts = now()
    const sig = sign('msg_1', ts, body)
    const h = headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` })
    expect(await verifyReplicateWebhook(h, body)).toBe(true)
  })

  it('rejects a tampered body', async () => {
    const ts = now()
    const sig = sign('msg_1', ts, body)
    const h = headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` })
    expect(await verifyReplicateWebhook(h, body + 'tampered')).toBe(false)
  })

  it('rejects a wrong signature', async () => {
    const ts = now()
    const h = headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': 'v1,not-the-real-signature' })
    expect(await verifyReplicateWebhook(h, body)).toBe(false)
  })

  it('rejects a stale timestamp (replay)', async () => {
    const ts = now() - 600 // 10 min old
    const sig = sign('msg_1', ts, body)
    const h = headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` })
    expect(await verifyReplicateWebhook(h, body)).toBe(false)
  })

  it('rejects when headers are missing', async () => {
    expect(await verifyReplicateWebhook(headers({}), body)).toBe(false)
  })

  it('accepts when one of several space-separated signatures matches', async () => {
    const ts = now()
    const sig = sign('msg_1', ts, body)
    const h = headers({ 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': `v1,bogus v1,${sig}` })
    expect(await verifyReplicateWebhook(h, body)).toBe(true)
  })
})
