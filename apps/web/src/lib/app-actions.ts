// Backend server actions — the safe subset of "server functions".
//
// A generated app is static client code: it can't hold a Stripe/OpenAI/SendGrid
// secret without leaking it. A server action lets the OWNER predefine a named
// outbound HTTP call (method + url + headers) that runs SERVER-SIDE, with the
// app's stored secrets interpolated in. The app invokes it by name with its
// apiKey; the secret never touches the browser.
//
// We deliberately do NOT execute arbitrary user JS (node:vm is not a security
// boundary). This covers the dominant use case — "call a third-party API with
// my secret key" — without an unsafe code-exec sandbox.

import { connectDB } from '@/lib/db'
import dns from 'dns/promises'
import net from 'net'
import { getSecretMap } from '@/lib/app-secrets'

export interface AppAction {
  appId: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers: Record<string, string>
  // When true, the caller's JSON body is forwarded as the outbound body.
  forwardBody: boolean
  updatedAt?: Date
}

const NAME_RE = /^[a-z][a-z0-9_-]{0,48}$/
export function isValidActionName(name: string): boolean {
  return NAME_RE.test(name)
}

async function db() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

export async function listActions(appId: string): Promise<AppAction[]> {
  const rows = await (await db()).collection('app_actions').find({ appId }).sort({ name: 1 }).toArray()
  return rows.map((r) => ({
    appId: r.appId, name: r.name, method: r.method, url: r.url,
    headers: r.headers || {}, forwardBody: r.forwardBody !== false, updatedAt: r.updatedAt,
  }))
}

export async function getAction(appId: string, name: string): Promise<AppAction | null> {
  const r = await (await db()).collection('app_actions').findOne({ appId, name })
  if (!r) return null
  return { appId: r.appId, name: r.name, method: r.method, url: r.url, headers: r.headers || {}, forwardBody: r.forwardBody !== false }
}

export async function upsertAction(a: AppAction): Promise<void> {
  const now = new Date()
  await (await db()).collection('app_actions').updateOne(
    { appId: a.appId, name: a.name },
    { $set: { ...a, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
}

export async function deleteAction(appId: string, name: string): Promise<boolean> {
  const res = await (await db()).collection('app_actions').deleteOne({ appId, name })
  return res.deletedCount > 0
}

// Replace {{SECRET_NAME}} tokens with the decrypted secret value. Unknown
// tokens are left untouched (so a typo fails loudly upstream, not silently).
function interpolate(template: string, secrets: Record<string, string>): string {
  return template.replace(/\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(secrets, key) ? secrets[key] : m,
  )
}

// SSRF guard: block private/loopback/link-local/metadata targets. Resolves the
// hostname and checks every returned address, defeating DNS-name bypasses.
function isBlockedIp(addr: string): boolean {
  if (net.isIP(addr) === 4) {
    const p = addr.split('.').map(Number)
    if (p[0] === 127 || p[0] === 10 || p[0] === 0) return true
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true
    if (p[0] === 192 && p[1] === 168) return true
    if (p[0] === 169 && p[1] === 254) return true // link-local incl. cloud metadata
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true // CGNAT
    return false
  }
  const lc = addr.toLowerCase()
  if (lc === '::1' || lc === '::') return true
  if (lc.startsWith('fe80') || lc.startsWith('fc') || lc.startsWith('fd')) return true
  if (lc.startsWith('::ffff:')) return isBlockedIp(lc.slice(7))
  return false
}

async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let u: URL
  try { u = new URL(rawUrl) } catch { throw new Error('Action URL is not a valid URL') }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Action URL must be http(s)')
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('Action URL host is not allowed')
  }
  // If it's a literal IP, check directly; else resolve and check all addresses.
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error('Action URL points at a blocked address')
  } else {
    let addrs: string[] = []
    try { addrs = (await dns.lookup(host, { all: true })).map((a) => a.address) } catch { throw new Error('Action URL host did not resolve') }
    if (addrs.length === 0 || addrs.some(isBlockedIp)) throw new Error('Action URL points at a blocked address')
  }
  return u
}

export interface RunResult {
  ok: boolean
  status: number
  body: any
  error?: string
}

// Execute an action: interpolate secrets into url + headers, optionally forward
// the caller's body, perform the outbound request server-side, return the
// response. Caps body size + applies a timeout.
export async function runAction(action: AppAction, callerBody: any): Promise<RunResult> {
  // Validation (secret resolution, interpolation, SSRF guard) can throw — keep
  // it inside the result envelope so the caller gets a clean error, not a 500.
  let url: string
  const headers: Record<string, string> = {}
  try {
    const secrets = await getSecretMap(action.appId)
    url = interpolate(action.url, secrets)
    await assertSafeUrl(url)
    for (const [k, v] of Object.entries(action.headers || {})) headers[k] = interpolate(String(v), secrets)
  } catch (e: any) {
    return { ok: false, status: 400, body: null, error: e?.message || 'Action misconfigured' }
  }

  const init: RequestInit = { method: action.method, headers }
  if (action.method !== 'GET' && action.method !== 'DELETE' && action.forwardBody && callerBody != null) {
    if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json'
    init.body = typeof callerBody === 'string' ? callerBody : JSON.stringify(callerBody)
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal })
    const text = (await res.text()).slice(0, 256 * 1024) // cap at 256KB
    let body: any = text
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) { try { body = JSON.parse(text) } catch { /* keep text */ } }
    return { ok: res.ok, status: res.status, body }
  } catch (e: any) {
    return { ok: false, status: 502, body: null, error: e?.name === 'AbortError' ? 'Action timed out' : (e?.message || 'Action request failed') }
  } finally {
    clearTimeout(timer)
  }
}
