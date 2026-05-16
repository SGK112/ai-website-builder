// Thin HTTP client to Webstew's /api/mcp/* endpoints. All requests use
// the bridge's pairing token (Bearer auth) so the server can resolve
// the user. No state — just a callable.

import type { BridgeAuth } from './auth'

export class WebstewApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function callWebstew<T = unknown>(
  auth: BridgeAuth,
  method: 'GET' | 'POST' | 'DELETE',
  pathStr: string,
  body?: unknown,
  query?: Record<string, string>
): Promise<T> {
  const url = new URL(auth.serverUrl.replace(/\/$/, '') + pathStr)
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${auth.pairingToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let detail: any = ''
    try {
      const j = (await res.json()) as { error?: string }
      detail = j?.error || ''
    } catch {}
    throw new WebstewApiError(
      res.status,
      detail || `${method} ${pathStr} → HTTP ${res.status}`
    )
  }
  // Some endpoints return text or empty; handle JSON-or-not gracefully.
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    return (await res.json()) as T
  }
  return (await res.text()) as unknown as T
}
