// POST /api/mcp/permission/resolve  body: { permissionId, approved }
// User-side endpoint — the workspace modal calls this when the user
// clicks Approve / Deny. Uses NextAuth session auth (NOT bridge token)
// because the click happens in the browser, not the MCP server.
//
// Once called, the MCP tool's awaiting requestPermission Promise
// resolves and the MCP server returns the decision to chef.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolvePermission } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
    permissionId?: string
    approved?: boolean
  }
  if (!body.permissionId || typeof body.approved !== 'boolean') {
    return NextResponse.json(
      { error: 'permissionId + approved required' },
      { status: 400 }
    )
  }
  const ok = resolvePermission(body.permissionId, session.user.id, body.approved)
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: 'No pending permission with that id (already resolved or expired)' },
      { status: 410 }
    )
  }
  return NextResponse.json({ ok: true })
}
