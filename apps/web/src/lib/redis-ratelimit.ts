// Distributed (cross-instance) rate limiting via Upstash Redis REST.
//
// The in-memory limiter in @ai-website-builder/shared is per-process, so on
// Render's autoscaling fleet the effective limit multiplies by instance count.
// When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, this backs the
// limiter with a shared Redis counter so the limit holds across all instances.
//
// No SDK dependency — Upstash exposes a plain HTTPS REST API. If Redis is not
// configured OR a call fails, we return null so the caller transparently falls
// back to the in-memory limiter (fail-open: a Redis blip must not 500 requests).

const REST_URL = process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export interface RlResult {
  success: boolean
  limit: number
  remaining: number
  reset: number          // unix seconds
  retryAfter?: number    // seconds
}

export function isRedisRateLimitConfigured(): boolean {
  return !!(REST_URL && REST_TOKEN)
}

// Fixed-window counter (matches the in-memory limiter's semantics):
//   INCR key                  → current count in this window
//   PEXPIRE key windowMs NX   → set TTL only on the first hit of the window
//   PTTL key                  → ms left, for reset/retryAfter
export async function redisRateLimit(
  type: string,
  identifier: string,
  config: { maxRequests: number; windowMs: number },
): Promise<RlResult | null> {
  if (!REST_URL || !REST_TOKEN) return null
  const key = `rl:${type}:${identifier}`
  try {
    const res = await fetch(`${REST_URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, config.windowMs, 'NX'],
        ['PTTL', key],
      ]),
      // Keep the hot path fast — a slow/unreachable Redis falls back to memory.
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return null
    const data = await res.json() as Array<{ result?: unknown; error?: string }>
    if (!Array.isArray(data) || data.some(d => d?.error)) return null

    const count = Number(data[0]?.result ?? 0)
    if (!Number.isFinite(count) || count <= 0) return null
    let ttlMs = Number(data[2]?.result ?? config.windowMs)
    if (!Number.isFinite(ttlMs) || ttlMs < 0) ttlMs = config.windowMs // -1/-2 = no expiry/missing
    const reset = Math.floor((Date.now() + ttlMs) / 1000)

    if (count > config.maxRequests) {
      return { success: false, limit: config.maxRequests, remaining: 0, reset, retryAfter: Math.ceil(ttlMs / 1000) }
    }
    return { success: true, limit: config.maxRequests, remaining: Math.max(0, config.maxRequests - count), reset }
  } catch {
    return null // network/timeout → fall back to in-memory
  }
}
