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
    const byToolkit = new Map(connected.map((c) => [c.toolkitSlug, c]))
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
    console.error('[integrations] list error:', e?.message || e)
    return NextResponse.json({ error: 'Failed to list integrations' }, { status: 500 })
  }
}
