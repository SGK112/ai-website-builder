// Domain registrar abstraction for the in-app buy flow — Cloudflare Registrar.
//
// Cloudflare launched a programmatic Registrar API (beta, Apr 2026) that can
// check availability + pricing and register domains synchronously, billed to
// the account's payment method. We use it when CLOUDFLARE_API_TOKEN +
// CLOUDFLARE_ACCOUNT_ID are set; otherwise we run in MOCK mode (deterministic
// availability + a fixed wholesale table + no-op register/DNS that report
// success) so the search → buy → auto-DNS flow stays exercisable without creds.
//
// Money flow: the CUSTOMER pays Webstew via Stripe at the RETAIL price
// (Cloudflare cost + markup). On payment success the webhook calls
// registerDomain() here, which charges WEBSTEW's Cloudflare billing profile at
// cost — Webstew keeps the margin. Set DOMAIN_MARKUP_BPS=0 to pass through at
// cost (no markup). NB: Cloudflare sells at cost; confirm reselling-with-markup
// is acceptable under their terms before enabling a non-zero markup.
//
// Cloudflare account setup required before flipping live:
//   1. API token with **Registrar:Edit** + **Zone:Edit** + **DNS:Edit**.
//   2. A billing profile with a default payment method.
//   3. A default registrant contact configured on the account.
//   4. Accept the Domain Registration Agreement on the registrations page.

import { createHash } from 'crypto'

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_BASE = 'https://api.cloudflare.com/client/v4'

export const REGISTRAR_LIVE = !!(CF_TOKEN && CF_ACCOUNT)
const MARKUP_BPS = Math.max(0, parseInt(process.env.DOMAIN_MARKUP_BPS || '2000', 10) || 2000) // +20%

// Wholesale-ish first-year price (USD cents) by TLD — MOCK mode only. Live mode
// uses Cloudflare's quoted registration_cost.
const TLD_WHOLESALE_CENTS: Record<string, number> = {
  com: 1199, net: 1399, org: 1199, io: 3200, co: 2499, ai: 7000,
  app: 1399, dev: 1399, xyz: 299, site: 299, store: 599, shop: 599,
  tech: 999, online: 399, me: 1799,
}
const DEFAULT_WHOLESALE_CENTS = 1999
const SUGGEST_TLDS = ['com', 'io', 'co', 'app', 'dev', 'ai', 'net', 'xyz']

export interface DomainResult {
  domain: string
  tld: string
  available: boolean
  priceCents: number // retail (what we charge)
  premium: boolean
}

function applyMarkup(costCents: number): number {
  return Math.round(costCents * (1 + MARKUP_BPS / 10000))
}

function retailCentsMock(tld: string): number {
  return applyMarkup(TLD_WHOLESALE_CENTS[tld] ?? DEFAULT_WHOLESALE_CENTS)
}

// Deterministic mock availability so repeated searches are stable.
function mockAvailable(domain: string): boolean {
  const h = createHash('sha1').update(domain.toLowerCase()).digest()[0]
  return h % 3 !== 0
}

function normalizeRoot(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.[a-z]+$/, '') // strip any TLD the user typed
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
}

// ── Cloudflare client ──────────────────────────────────────────────────────
async function cf(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json: any }> {
  const res = await fetch(`${CF_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  let json: any = {}
  try { json = await res.json() } catch {}
  // Cloudflare wraps everything in { success, errors, result }
  return { ok: res.ok && json?.success !== false, status: res.status, json }
}

// Parse Cloudflare's pricing.registration_cost (USD, dollars as number|string) → cents.
function costToCents(cost: unknown): number | null {
  const n = typeof cost === 'number' ? cost : parseFloat(String(cost ?? ''))
  if (!isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

/**
 * Search availability + pricing for a query across the requested TLD (if the
 * user typed one) plus suggestions.
 */
export async function searchDomains(query: string): Promise<{ live: boolean; root: string; results: DomainResult[] }> {
  const root = normalizeRoot(query)
  if (!root) return { live: REGISTRAR_LIVE, root: '', results: [] }

  const typedTld = (query.toLowerCase().match(/\.([a-z]{2,})$/)?.[1]) || null
  const tlds = Array.from(new Set([typedTld, ...SUGGEST_TLDS].filter(Boolean) as string[]))
  const domains = tlds.map(t => `${root}.${t}`)

  if (REGISTRAR_LIVE) {
    try {
      // Cloudflare domain-check: real registry availability + pricing, ≤20/call.
      const { ok, json } = await cf(`/accounts/${CF_ACCOUNT}/registrar/domain-check`, {
        method: 'POST',
        body: JSON.stringify({ domains }),
      })
      if (ok && Array.isArray(json?.result?.domains)) {
        const results: DomainResult[] = json.result.domains.map((d: any) => {
          const tld = String(d.name || '').split('.').slice(1).join('.')
          const costCents = costToCents(d?.pricing?.registration_cost)
          const priceCents = costCents != null ? applyMarkup(costCents) : retailCentsMock(tld)
          return {
            domain: d.name,
            tld,
            available: d.registrable === true,
            priceCents,
            premium: !!d.tier && /premium/i.test(String(d.tier)) || priceCents >= 5000,
          }
        })
        return { live: true, root, results }
      }
      // Fall through to mock on a soft failure rather than show an empty page.
      console.warn('[domains] Cloudflare domain-check failed, falling back to mock pricing')
    } catch (e: any) {
      console.warn('[domains] Cloudflare domain-check error (mock fallback):', e?.message)
    }
  }

  const results: DomainResult[] = tlds.map(tld => {
    const domain = `${root}.${tld}`
    const priceCents = retailCentsMock(tld)
    return { domain, tld, available: REGISTRAR_LIVE ? false : mockAvailable(domain), priceCents, premium: priceCents >= 5000 }
  })
  return { live: REGISTRAR_LIVE, root, results }
}

export interface RegisterResult {
  ok: boolean
  domain: string
  mock: boolean
  message: string
}

/**
 * Register a purchased domain. In mock mode this is a no-op success. In live
 * mode this charges Webstew's Cloudflare billing profile and registers for real.
 * Never throws — returns ok:false with a message so the webhook can mark the
 * order register_failed (and a human can refund / retry) instead of losing it.
 */
export async function registerDomain(domain: string): Promise<RegisterResult> {
  if (!REGISTRAR_LIVE) {
    return { ok: true, domain, mock: true, message: 'Mock registration (set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID to register for real).' }
  }
  try {
    const { ok, status, json } = await cf(`/accounts/${CF_ACCOUNT}/registrar/registrations`, {
      method: 'POST',
      body: JSON.stringify({ domain_name: domain }),
    })
    const state = json?.result?.state
    const completed = json?.result?.completed === true || json?.result?.context?.registration?.status === 'active'
    if (ok && (completed || state === 'succeeded')) {
      return { ok: true, domain, mock: false, message: 'Registered.' }
    }
    if (ok && (state === 'in_progress' || status === 202)) {
      // Async registration — poll the status endpoint briefly.
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 2500))
        const poll = await cf(`/accounts/${CF_ACCOUNT}/registrar/registrations/${encodeURIComponent(domain)}/registration-status`)
        const s = poll.json?.result?.state
        if (s === 'succeeded') return { ok: true, domain, mock: false, message: 'Registered.' }
        if (s === 'failed' || s === 'blocked') break
        if (s === 'action_required') return { ok: false, domain, mock: false, message: 'Registration needs manual action in the Cloudflare dashboard.' }
      }
      return { ok: false, domain, mock: false, message: 'Registration still in progress — check the Cloudflare dashboard.' }
    }
    const err = json?.errors?.[0]?.message || `Cloudflare returned ${status} (state=${state || 'unknown'})`
    return { ok: false, domain, mock: false, message: err }
  } catch (e: any) {
    return { ok: false, domain, mock: false, message: `Registrar error: ${e?.message || 'unknown'}` }
  }
}

export interface DnsRecord { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string }

/**
 * Point a registered domain at the deployed site. `target` is the host the site
 * is served from ({slug}.webstew.app for managed publish, or a Render host).
 * Cloudflare flattens the apex CNAME automatically. Records are proxied off
 * (DNS-only) so the origin sees the real Host header for slug routing.
 */
export async function autoConfigureDns(domain: string, target: string): Promise<{ ok: boolean; mock: boolean; records: DnsRecord[]; message?: string }> {
  const records: DnsRecord[] = [
    { type: 'CNAME', name: '@', value: target },   // apex (Cloudflare CNAME-flattens)
    { type: 'CNAME', name: 'www', value: target },
  ]
  if (!REGISTRAR_LIVE) return { ok: true, mock: true, records }

  try {
    // A freshly-registered Cloudflare domain is a zone in the account. Find it.
    const zoneResp = await cf(`/zones?name=${encodeURIComponent(domain)}&account.id=${CF_ACCOUNT}`)
    const zoneId = zoneResp.json?.result?.[0]?.id
    if (!zoneId) return { ok: false, mock: false, records, message: 'Zone not found yet (registration may still be propagating).' }

    for (const rec of records) {
      const r = await cf(`/zones/${zoneId}/dns_records`, {
        method: 'POST',
        body: JSON.stringify({
          type: rec.type,
          name: rec.name === '@' ? domain : `${rec.name}.${domain}`,
          content: rec.value,
          proxied: false,
          ttl: 1, // automatic
        }),
      })
      // 81057 = record already exists; treat as non-fatal so retries are idempotent.
      if (!r.ok && r.json?.errors?.[0]?.code !== 81057) {
        return { ok: false, mock: false, records, message: r.json?.errors?.[0]?.message || 'DNS record create failed' }
      }
    }
    return { ok: true, mock: false, records }
  } catch (e: any) {
    return { ok: false, mock: false, records, message: `DNS error: ${e?.message || 'unknown'}` }
  }
}
