import { NextRequest, NextResponse } from 'next/server'
import {
  rateLimit,
  getRateLimitHeaders,
  RateLimitError,
  rateLimitConfigs,
  type RateLimitType,
} from '@ai-website-builder/shared'
import { redisRateLimit } from './redis-ratelimit'

/**
 * Get client identifier from request
 * Uses IP address or user ID if authenticated
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session/token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // In a real app, decode the JWT to get user ID
    // For now, use a hash of the token
    return `user:${hashString(authHeader)}`
  }

  // Fall back to IP address. Cloudflare's cf-connecting-ip is authoritative
  // when present (CF edge sets it, clients can't spoof). XFF is what Render
  // gives us behind no-CF setups.
  const ip = request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'

  return `ip:${ip}`
}

/**
 * Simple string hash for consistent identification
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(error: RateLimitError): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: error.message,
      retryAfter: error.retryAfter,
    },
    {
      status: 429,
      headers: error.toHeaders(),
    }
  )
}

/**
 * Wrapper to apply rate limiting to API route handlers
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T,
  type: RateLimitType
): T {
  return (async (request: NextRequest, ...args: unknown[]) => {
    const identifier = getClientIdentifier(request)
    const result = rateLimit(identifier, type)

    if (!result.success) {
      const error = new RateLimitError(result)
      return rateLimitResponse(error)
    }

    // Call the original handler
    const response = await handler(request, ...args)

    // Add rate limit headers to successful responses
    const headers = getRateLimitHeaders(result)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }) as T
}

/**
 * Check rate limit and throw if exceeded. Use in API route handlers.
 *
 * Async because it prefers the shared Redis counter (correct across Render's
 * multi-instance fleet) when UPSTASH_REDIS_REST_* is configured, and falls back
 * to the per-process in-memory limiter otherwise (or if Redis errors). Still
 * throws RateLimitError on limit, so existing try/catch + handleRateLimitError
 * call sites are unchanged apart from awaiting.
 */
export async function checkApiRateLimit(
  request: NextRequest,
  type: RateLimitType
): Promise<{ remaining: number; limit: number; reset: number }> {
  const identifier = getClientIdentifier(request)
  const config = rateLimitConfigs[type]

  // Redis first (shared across instances); null = unconfigured or transient
  // error → fall back to in-memory so a Redis blip never 500s the request.
  const result = (await redisRateLimit(type, identifier, config)) ?? rateLimit(identifier, type)

  if (!result.success) {
    // Pass the preset's own message so the 429 explains which limit was
    // hit (e.g. "Too many listings…") instead of a generic line.
    throw new RateLimitError(result, config.message)
  }

  return {
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
  }
}

/**
 * Handle rate limit errors in catch blocks
 */
export function handleRateLimitError(error: unknown): NextResponse | null {
  if (error instanceof RateLimitError) {
    return rateLimitResponse(error)
  }
  return null
}
