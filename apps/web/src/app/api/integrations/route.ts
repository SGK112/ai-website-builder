// GET /api/integrations — list available toolkits + which the caller has
// connected. The "available" list is curated in lib/composio.ts; the
// "connected" list is fetched live from Composio so a revoke on the
// provider side surfaces immediately.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  SUPPORTED_TOOLKITS,
  listUserConnections,
} from '@/lib/composio'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const connected = await listUserConnections(session.user.id)
    // Composio returns one row per (user, auth_config) attempt — a user
    // who reconnected after a revoke has multiple rows for the same
    // toolkit. The original `new Map(connected.map(...))` kept whichever
    // row came LAST from the API which was often a stale REVOKED entry
    // and clobbered the active connection. Prefer ACTIVE > INITIATED >
    // anything else; ties broken by most-recent createdAt.
    const STATUS_RANK: Record<string, number> = {
      ACTIVE: 4,
      INITIATED: 3,
      INACTIVE: 2,
      EXPIRED: 1,
      REVOKED: 0,
      FAILED: 0,
    }
    const rank = (s: string | undefined) => STATUS_RANK[s || ''] ?? 0
    const byToolkit = new Map<string, typeof connected[number]>()
    for (const c of connected) {
      const cur = byToolkit.get(c.toolkitSlug)
      if (!cur) { byToolkit.set(c.toolkitSlug, c); continue }
      const a = rank(c.status), b = rank(cur.status)
      if (a > b) { byToolkit.set(c.toolkitSlug, c); continue }
      if (a === b) {
        // Same status — pick the newer one so a fresh re-auth wins.
        const ca = c.createdAt ? new Date(c.createdAt).getTime() : 0
        const cb = cur.createdAt ? new Date(cur.createdAt).getTime() : 0
        if (ca > cb) byToolkit.set(c.toolkitSlug, c)
      }
    }
    const items = SUPPORTED_TOOLKITS.map((t) => {
      const conn = byToolkit.get(t.slug)
      return {
        ...t,
        connected: !!conn && conn.status === 'ACTIVE',
        connectionId: conn?.id,
        status: conn?.status || null,
      }
    })
    return NextResponse.json({ items })
  } catch (e: any) {
    const msg = e?.message || ''
    console.error('[integrations] list error:', msg)
    // Either Composio's API rejected the key (401 / HTTP_Unauthorized) or
    // the key isn't configured in this environment (local dev without a
    // .env.local entry). Either way, return the catalog with everything
    // marked disconnected so the UI renders the toolkit list and the user
    // sees a soft warning instead of a hard 500.
    const isAuthOrMissing = /Invalid API key|HTTP_Unauthorized|401|not configured/i.test(msg)
    if (isAuthOrMissing) {
      const items = SUPPORTED_TOOLKITS.map((t) => ({ ...t, connected: false, connectionId: undefined, status: null }))
      const warning = /not configured/i.test(msg)
        ? 'Integrations service is not configured in this environment.'
        : 'Integrations service is temporarily unavailable — try again in a moment.'
      return NextResponse.json({ items, warning }, { status: 200 })
    }
    return NextResponse.json({ error: 'Failed to list integrations' }, { status: 500 })
  }
}
