// GET /api/cms/[projectId] — list this project's collections + item counts.
//
// Reads through cms-store (raw mongodb driver) — bypasses the mongoose Project
// model so newly-added schema fields work without a server restart.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { loadProjectCms } from '@/lib/cms-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const loaded = await loadProjectCms(params.projectId, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  const { cms } = loaded
  const summaries = Object.values(cms.schemas).map(schema => ({
    slug: schema.slug,
    name: schema.name,
    fieldCount: schema.fields?.length || 0,
    itemCount: Object.keys(cms.items[schema.slug] || {}).length,
  }))
  return NextResponse.json({ schemas: summaries })
}
