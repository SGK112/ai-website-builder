import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { deleteSnapshotById } from '@/lib/preview-store'

// DELETE /api/preview/<id> — remove a preview snapshot. Auth required.
// Ownership is enforced inside deleteSnapshotById (deletes only if userId
// matches), so a logged-in user can't nuke someone else's snapshot.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  try {
    const ok = await deleteSnapshotById(params.id, session.user.id)
    if (!ok) {
      return NextResponse.json({ error: 'Preview not found or not yours' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete preview' }, { status: 500 })
  }
}
