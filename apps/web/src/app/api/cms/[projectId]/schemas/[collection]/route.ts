// PUT    /api/cms/[projectId]/schemas/[collection] — upsert collection schema
// DELETE /api/cms/[projectId]/schemas/[collection] — drop schema + all items
//
// Writes go through cms-store (raw mongodb driver). See cms-store.ts for why.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSafeSlug, validateSchema } from '@/lib/cms'
import { loadProjectCms, upsertSchema, deleteSchema } from '@/lib/cms-store'

export const dynamic = 'force-dynamic'

interface Ctx { params: { projectId: string; collection: string } }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!isSafeSlug(params.collection)) {
    return NextResponse.json({ error: 'Invalid collection slug' }, { status: 400 })
  }

  const loaded = await loadProjectCms(params.projectId, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (body.slug && body.slug !== params.collection) {
    return NextResponse.json({ error: 'body.slug must match URL collection' }, { status: 400 })
  }
  const validated = validateSchema({ ...body, slug: params.collection })
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 })

  const existing = loaded.cms.schemas[params.collection]
  const result = await upsertSchema(
    params.projectId,
    { ...validated.schema, createdAt: existing?.createdAt } as any,
    existing as any
  )
  return NextResponse.json({
    schema: result.schema,
    removedFieldKeys: result.removedFieldKeys,
    itemsAffected: result.itemsAffected,
  })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!isSafeSlug(params.collection)) {
    return NextResponse.json({ error: 'Invalid collection slug' }, { status: 400 })
  }
  const loaded = await loadProjectCms(params.projectId, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  if (!loaded.cms.schemas[params.collection]) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }
  await deleteSchema(params.projectId, params.collection)
  return NextResponse.json({ ok: true })
}
