import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import type { RateLimitType } from '@ai-website-builder/shared'

// Composite anon-traffic guard. One call per public route covers the
// three vectors that get the most abuse:
//   1. brute-force / scripted hammering   → per-IP rate limit (existing lib)
//   2. headless scripts with no real UA  → bot heuristics
//   3. compromised IPs / VPS pools        → Cloudflare threat-score + manual blocklist
//
// All checks are no-ops if the relevant signal is absent (e.g. when the app
// is not behind Cloudflare), so the guard is safe to apply broadly.

const BOT_UA_PATTERNS: RegExp[] = [
  /^$/i,                                            // empty UA
  /^curl\b/i,
  /^wget\b/i,
  /python-requests/i,
  /python-urllib/i,
  /\bscrapy\b/i,
  /\bGo-http-client\b/i,
  /\blibwww-perl\b/i,
  /\bhttpclient\b/i,
  /\bokhttp\b/i,
  /\baxios\b/i,
  /\bnode-fetch\b/i,
  /\bgot\s*\(/i,
  /\bmasscan\b/i,
  /\bzgrab\b/i,
  /\bnikto\b/i,
  /\bnmap\b/i,
  /\bphantom\b/i,
  /headlesschrome/i,                                // most legit users don't ship this UA
]

// Cloudflare's threat score is 0–100; >= 14 is "Medium" threat or above.
// CF only sets this header when the app is behind CF — absent = no signal.
const CF_THREAT_BLOCK_AT = 14

export function getClientIp(req: NextRequest): string {
  // Cloudflare authoritative header — set by CF edge, can't be spoofed by clients.
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  // X-Forwarded-For: leftmost is the original client. Render passes this.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

function looksLikeBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') || ''
  return BOT_UA_PATTERNS.some(re => re.test(ua))
}

function isCloudflareHighThreat(req: NextRequest): boolean {
  const raw = req.headers.get('cf-threat-score')
  if (!raw) return false
  const score = parseInt(raw, 10)
  return Number.isFinite(score) && score >= CF_THREAT_BLOCK_AT
}

// Comma-separated env-var blocklists for ops: rotate without a deploy.
function parseList(value: string | undefined): Set<string> {
  if (!value) return new Set()
  return new Set(value.split(',').map(s => s.trim()).filter(Boolean))
}

function isBlockedIp(ip: string): boolean {
  const list = parseList(process.env.BLOCKED_IPS)
  return list.has(ip)
}

function isBlockedAsn(req: NextRequest): boolean {
  // Cloudflare Enterprise (or some workers configs) sets cf-asn. Free plan
  // does not. Cheap defense-in-depth — if/when we enable it, this picks up.
  const asn = req.headers.get('cf-asn')
  if (!asn) return false
  const list = parseList(process.env.BLOCKED_ASNS)
  return list.has(asn)
}

export interface AnonGuardOptions {
  // Apply a rate-limit preset (see packages/shared/src/rate-limiter.ts).
  // Omit to skip rate limiting (e.g. if the caller is already doing it).
  rateLimit?: RateLimitType
  // Allow common bot UAs through (default: false). Set true on endpoints
  // that legitimately get hit by scripts (RSS, webhooks).
  allowBotUa?: boolean
}

// Returns a NextResponse if the request should be rejected; null otherwise.
// Callers do: `const blocked = await guardAnonAbuse(req, {...}); if (blocked) return blocked;`
export async function guardAnonAbuse(
  req: NextRequest,
  opts: AnonGuardOptions = {}
): Promise<NextResponse | null> {
  const ip = getClientIp(req)

  if (isBlockedIp(ip) || isBlockedAsn(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (isCloudflareHighThreat(req)) {
    return NextResponse.json({ error: 'Request blocked by reputation check.' }, { status: 403 })
  }

  if (!opts.allowBotUa && looksLikeBot(req)) {
    return NextResponse.json(
      { error: 'Automated clients are not permitted on this endpoint.' },
      { status: 403 }
    )
  }

  if (opts.rateLimit) {
    try {
      await checkApiRateLimit(req, opts.rateLimit)
    } catch (err) {
      const limited = handleRateLimitError(err)
      if (limited) return limited
      throw err
    }
  }

  return null
}
