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
import { initiateConnection, metaForToolkit } from '@/lib/composio'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
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
  const origin = req.nextUrl.origin
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
