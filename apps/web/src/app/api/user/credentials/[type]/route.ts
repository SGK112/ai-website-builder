// DELETE /api/user/credentials/[type] — wipe one stored credential.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteUserCredential } from '@/lib/credentials-store'

export const dynamic = 'force-dynamic'

interface Ctx { params: { type: string } }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (params.type !== 'render' && params.type !== 'github') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  await deleteUserCredential(session.user.id, params.type)
  return NextResponse.json({ ok: true })
}
