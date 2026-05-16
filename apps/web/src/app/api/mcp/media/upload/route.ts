// POST /api/mcp/media/upload  body: { sourceUrl }
// Proxies to the existing media-upload pipeline. Returns the permanent
// URL chef can use in HTML edits.

import { mcpRoute } from '@/lib/mcp-auth'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export const POST = mcpRoute(async (req: NextRequest) => {
  const body = (await req.json()) as { sourceUrl?: string }
  if (!body.sourceUrl) throw new Error('sourceUrl required')

  // Reuse the existing /api/media/upload handler. We POST internally
  // with the same auth — but that endpoint expects session auth, not
  // bridge auth. Forward the source URL to Cloudinary via the API
  // route used by the in-app upload_image agent tool.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(req.url).origin
  const upRes = await fetch(`${origin}/api/media/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Bypass session auth — pass a service token. For v1, simply
      // forward; the upload route handles unauth uploads by saving
      // under an anonymous folder. Tighten when we wire per-user
      // Cloudinary folders.
    },
    body: JSON.stringify({ sourceUrl: body.sourceUrl }),
  })
  if (!upRes.ok) {
    const t = await upRes.text().catch(() => '')
    throw new Error(`upload failed: HTTP ${upRes.status} ${t.slice(0, 200)}`)
  }
  const out = (await upRes.json()) as { url?: string }
  if (!out.url) throw new Error('upload returned no URL')
  return { url: out.url }
})
