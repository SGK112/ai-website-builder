// Attach a custom domain to the SHARED Render service that serves webstew.app /
// webstew.net (the instant-publish origin). This is what makes a bought/
// connected domain actually reachable: Render only routes a Host to us once
// that domain is added to the service, and it auto-issues a Let's Encrypt cert
// once DNS resolves to it. Pair with autoConfigureDns() pointing the domain at
// RENDER_APP_HOST, and a published_sites.customDomain marker so /sites/by-host
// can map the Host → the right site.
//
// Mock-safe: only live when RENDER_API_KEY + RENDER_SERVICE_ID are set.

const RENDER_API_KEY = process.env.RENDER_API_KEY
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID // srv-...
// The onrender host DNS should point at. Default to the known prod service host.
export const RENDER_APP_HOST = process.env.RENDER_APP_HOST || 'ai-website-builder-ntzg.onrender.com'

export const RENDER_DOMAINS_LIVE = !!(RENDER_API_KEY && RENDER_SERVICE_ID)

export interface RenderAttachResult {
  ok: boolean
  mock: boolean
  target: string                 // host the domain's DNS should point at
  attached: string[]             // domains successfully added
  renderDomainIds: Record<string, string>
  message: string
}

async function addOne(name: string): Promise<{ ok: boolean; id?: string; message: string }> {
  const res = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/custom-domains`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name }),
  })
  if (res.ok) {
    const j = await res.json().catch(() => ({} as any))
    return { ok: true, id: j?.id, message: 'added' }
  }
  const text = await res.text().catch(() => '')
  // 409/duplicate → already attached, treat as success (idempotent).
  if (res.status === 409 || /already|exists|duplicate/i.test(text)) {
    return { ok: true, message: 'already attached' }
  }
  return { ok: false, message: `Render ${res.status}: ${text.slice(0, 200)}` }
}

/**
 * Attach a domain (apex + www) to the shared Render service. Never throws.
 */
export async function attachDomainToSharedService(domain: string): Promise<RenderAttachResult> {
  const base: RenderAttachResult = {
    ok: true, mock: !RENDER_DOMAINS_LIVE, target: RENDER_APP_HOST,
    attached: [], renderDomainIds: {}, message: '',
  }
  if (!RENDER_DOMAINS_LIVE) {
    return { ...base, message: 'Mock attach (set RENDER_API_KEY + RENDER_SERVICE_ID to attach for real).' }
  }
  try {
    const names = [domain, `www.${domain}`]
    const failures: string[] = []
    for (const name of names) {
      const r = await addOne(name)
      if (r.ok) {
        base.attached.push(name)
        if (r.id) base.renderDomainIds[name] = r.id
      } else {
        failures.push(`${name}: ${r.message}`)
      }
    }
    base.ok = base.attached.length > 0
    base.message = failures.length ? `Partial: ${failures.join('; ')}` : 'Attached.'
    return base
  } catch (e: any) {
    return { ...base, ok: false, message: `Render attach error: ${e?.message || 'unknown'}` }
  }
}
