// GET /api/backend/[appId]/integrations
// Lists the toolkits this app may expose (owner allowlist) and whether the
// calling end-user has connected each. Auth: app key (x-webstew-key) + the
// end-user's bearer token.

import { NextRequest, NextResponse } from 'next/server'
import { authAppRequest } from '@/lib/app-integrations'
import { listUserConnections, metaForToolkit } from '@/lib/composio'

export const dynamic = 'force-dynamic'

function cors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-webstew-key, Authorization')
  return res
}
export async function OPTIONS() { return cors(new NextResponse(null, { status: 204 })) }

function bearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || ''
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : (req.headers.get('x-webstew-user-token') || null)
}

export async function GET(req: NextRequest, { params }: { params: { appId: string } }) {
  const key = req.headers.get('x-webstew-key') || req.nextUrl.searchParams.get('key')
  const auth = await authAppRequest(params.appId, key, bearer(req))
  if (!auth.ok) return cors(NextResponse.json({ error: auth.error }, { status: auth.status }))

  let connectedSlugs = new Set<string>()
  try {
    const conns = await listUserConnections(auth.entity)
    connectedSlugs = new Set(conns.filter((c) => c.status === 'ACTIVE').map((c) => c.toolkitSlug))
  } catch (e: any) {
    // Composio outage / not configured — return the catalog as all-disconnected
    // rather than failing the whole app.
    console.warn('[app-integrations] list connections failed:', e?.message)
  }

  const toolkits = auth.allowedToolkits.map((slug) => {
    const meta = metaForToolkit(slug)
    return {
      slug,
      label: meta?.label || slug,
      category: meta?.category || 'data',
      description: meta?.description || '',
      connected: connectedSlugs.has(slug),
    }
  })
  return cors(NextResponse.json({ toolkits }))
}
