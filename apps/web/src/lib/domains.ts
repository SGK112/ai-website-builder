// Domain registrar abstraction for the in-app buy flow.
//
// Real registration needs a registrar account + API key (Vercel Domains,
// Namecheap, Porkbun, Cloudflare…). Until DOMAIN_REGISTRAR_API_KEY is set we
// run in MOCK mode: deterministic availability + fixed wholesale pricing +
// no-op register/DNS that report success. This keeps the entire search → buy
// → auto-DNS flow exercised end-to-end now; flip to live by adding the key and
// implementing the one provider call marked below.
//
// Money: the price returned here is the *retail* price (wholesale + markup).
// Stripe charges it; the platform keeps the markup.

import { createHash } from 'crypto'

export const REGISTRAR_LIVE = !!process.env.DOMAIN_REGISTRAR_API_KEY
const MARKUP_BPS = Math.max(0, parseInt(process.env.DOMAIN_MARKUP_BPS || '2000', 10) || 2000) // +20%

// Wholesale-ish first-year price (USD cents) by TLD. Live mode replaces these
// with the registrar's quoted price.
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

function retailCents(tld: string): number {
  const wholesale = TLD_WHOLESALE_CENTS[tld] ?? DEFAULT_WHOLESALE_CENTS
  return Math.round(wholesale * (1 + MARKUP_BPS / 10000))
}

// Deterministic mock availability so repeated searches are stable. ~1 in 3 of
// the exact-match domains read as taken; suggestions skew available.
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

/**
 * Search availability + pricing for a query across the requested TLD (if the
 * user typed one) plus suggestions.
 */
export async function searchDomains(query: string): Promise<{ live: boolean; root: string; results: DomainResult[] }> {
  const root = normalizeRoot(query)
  if (!root) return { live: REGISTRAR_LIVE, root: '', results: [] }

  const typedTld = (query.toLowerCase().match(/\.([a-z]{2,})$/)?.[1]) || null
  const tlds = Array.from(new Set([typedTld, ...SUGGEST_TLDS].filter(Boolean) as string[]))

  // LIVE: replace this map with a single batched registrar availability call.
  // e.g. await registrarClient.checkAvailability(tlds.map(t => `${root}.${t}`))
  const results: DomainResult[] = tlds.map(tld => {
    const domain = `${root}.${tld}`
    const priceCents = retailCents(tld)
    return {
      domain,
      tld,
      available: REGISTRAR_LIVE ? false : mockAvailable(domain),
      priceCents,
      premium: priceCents >= 5000,
    }
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
 * mode, call the registrar's create-order endpoint here.
 */
export async function registerDomain(domain: string): Promise<RegisterResult> {
  if (!REGISTRAR_LIVE) {
    return { ok: true, domain, mock: true, message: 'Mock registration (set DOMAIN_REGISTRAR_API_KEY to register for real).' }
  }
  // LIVE: await registrarClient.register(domain, contact, years: 1)
  return { ok: true, domain, mock: false, message: 'Registered.' }
}

export interface DnsRecord { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string }

/**
 * Point a domain at the deployed site. `target` is the host the site is served
 * from (Render service host, or {slug}.webstew.app for managed publish).
 * Returns the records that were (or should be) created.
 */
export async function autoConfigureDns(domain: string, target: string): Promise<{ ok: boolean; mock: boolean; records: DnsRecord[] }> {
  const records: DnsRecord[] = [
    { type: 'CNAME', name: 'www', value: target },
    // Apex CNAME-flattening / ALIAS varies by registrar; live mode picks the
    // right record type. Mock just reports the intent.
    { type: 'A', name: '@', value: target },
  ]
  if (!REGISTRAR_LIVE) return { ok: true, mock: true, records }
  // LIVE: await registrarClient.setDns(domain, records)
  return { ok: true, mock: false, records }
}
