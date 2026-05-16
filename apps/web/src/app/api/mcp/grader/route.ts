// POST /api/mcp/grader  body: { url }
// Thin proxy to the existing site grader at /api/tools/grade. Returns
// the same shape the in-app agent's grade_site tool returns.

import { mcpRoute } from '@/lib/mcp-auth'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export const POST = mcpRoute(async (req: NextRequest) => {
  const body = (await req.json()) as { url?: string }
  if (!body.url) throw new Error('url required')
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(req.url).origin
  const r = await fetch(`${origin}/api/tools/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: body.url }),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`grader failed: HTTP ${r.status} ${t.slice(0, 200)}`)
  }
  return (await r.json()) as Record<string, unknown>
})
