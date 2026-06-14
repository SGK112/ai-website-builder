// Velocity guard for the PUBLIC, CORS-open generated-app backend API
// (/api/backend/[appId]/*). The app key is embedded in the published site and
// the exported zip — it's a public anon key, so anyone can call these endpoints.
// This caps abuse (spam writes, signup / credential stuffing, checkout probing)
// per (app, client-ip, purpose). In-memory + single Render instance, matching
// the shared limiter's store; swap for Redis if we scale horizontally.

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, type RateLimitType } from '@ai-website-builder/shared'

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Returns a CORS-tagged 429 response when the caller is over the limit, else
// null (proceed). The identifier includes `purpose` so each route+method gets
// its own bucket instead of sharing one (the store keys by identifier alone).
export function backendRateLimited(
  req: NextRequest,
  appId: string,
  purpose: string,
  type: RateLimitType,
): NextResponse | null {
  const result = rateLimit(`bk:${purpose}:${appId}:${clientIp(req)}`, type)
  if (result.success) return null
  const res = NextResponse.json(
    { error: 'Too many requests — slow down and try again shortly.', code: 'rate_limited', retryAfter: result.retryAfter },
    { status: 429 },
  )
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key')
  if (result.retryAfter) res.headers.set('Retry-After', String(result.retryAfter))
  return res
}
