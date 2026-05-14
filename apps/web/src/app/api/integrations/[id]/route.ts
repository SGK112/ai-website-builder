// DELETE /api/integrations/:id — disconnect a Composio connection. We don't
// verify ownership at the app layer because Composio scopes the token to our
// account; a malicious user can only attempt to delete IDs they discovered
// via /api/integrations (which only returns their own connections).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectAccount, listUserConnections } from '@/lib/composio'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Defense-in-depth: confirm the connection actually belongs to this user
  // before issuing the delete to Composio.
  const own = await listUserConnections(session.user.id)
  if (!own.some((c) => c.id === params.id)) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  try {
    await disconnectAccount(params.id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[integrations.disconnect] error:', e?.message || e)
    return NextResponse.json(
      { error: e?.message || 'Failed to disconnect' },
      { status: 500 }
    )
  }
}
