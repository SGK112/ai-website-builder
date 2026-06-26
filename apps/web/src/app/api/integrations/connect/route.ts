// POST /api/integrations/connect — start an OAuth flow for the caller.
// Body: { toolkit: string }
// Returns: { redirectUrl: string, connectionId: string }
//
// The user opens `redirectUrl` in a new tab, completes OAuth with the
// provider, and lands on /api/integrations/callback which marks the
// connection ACTIVE in Composio's store.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { initiateConnection, metaForToolkit } from '@/lib/composio'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Each connect is a billed Composio call — cap initiations per caller.
  try {
    await checkApiRateLimit(req, 'auth')
  } catch (err) {
    const limited = handleRateLimitError(err)
    if (limited) return limited
    throw err
  }

  let body: { toolkit?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = typeof body.toolkit === 'string' ? body.toolkit.toLowerCase() : ''
  if (!slug || !metaForToolkit(slug)) {
    return NextResponse.json({ error: 'Unsupported toolkit' }, { status: 400 })
  }

  // Compute the absolute callback URL the user's browser will be sent to after
  // they complete OAuth at the provider. Composio appends connectedAccountId.
  //
  // Prefer NEXTAUTH_URL / NEXT_PUBLIC_SITE_URL over req.nextUrl.origin so we
  // never hand Composio an internal Render hostname (e.g. localhost:5001) when
  // the request is proxied through Cloudflare without rewriting Host/
  // X-Forwarded-* headers. req.nextUrl.origin is a last-resort fallback only
  // for local dev where neither env is set.
  const canonicalOrigin =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin
  // Strip any trailing slash so the joined URL is well-formed.
  const origin = canonicalOrigin.replace(/\/+$/, '')
  const callbackUrl = `${origin}/api/integrations/callback?toolkit=${encodeURIComponent(slug)}`

  try {
    const { redirectUrl, id } = await initiateConnection({
      userId: session.user.id,
      toolkitSlug: slug,
      callbackUrl,
    })
    return NextResponse.json({ redirectUrl, connectionId: id })
  } catch (e: any) {
    console.error('[integrations.connect] error:', e?.message || e)
    return NextResponse.json(
      { error: e?.message || 'Failed to initiate connection' },
      { status: 500 }
    )
  }
}
