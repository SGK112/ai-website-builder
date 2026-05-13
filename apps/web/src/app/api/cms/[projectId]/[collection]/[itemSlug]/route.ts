// GET    /api/cms/[projectId]/[collection]/[itemSlug] — read one item
// PATCH  /api/cms/[projectId]/[collection]/[itemSlug] — partial update
// DELETE /api/cms/[projectId]/[collection]/[itemSlug] — hard delete

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSafeSlug, coerceItemFields } from '@/lib/cms'
import { loadProjectCms, upsertItem, deleteItem } from '@/lib/cms-store'

export const dynamic = 'force-dynamic'

interface Ctx { params: { projectId: string; collection: string; itemSlug: string } }

async function loadCtx(p: Ctx['params'], userId: string) {
  if (!isSafeSlug(p.collection)) return { ok: false, status: 400 as const, error: 'Invalid collection slug' }
  if (!isSafeSlug(p.itemSlug)) return { ok: false, status: 400 as const, error: 'Invalid item slug' }
  const loaded = await loadProjectCms(p.projectId, userId)
  if (!loaded.ok) return loaded
  const schema = loaded.cms.schemas[p.collection]
  if (!schema) return { ok: false as const, status: 404 as const, error: 'Collection not found' }
  const item = loaded.cms.items[p.collection]?.[p.itemSlug]
  if (!item) return { ok: false as const, status: 404 as const, error: 'Item not found' }
  return { ok: true as const, schema, item }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const r = await loadCtx(params, session.user.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ item: r.item, schema: r.schema })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const r = await loadCtx(params, session.user.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // loadCtx returns item only on the ok branch (guarded above), so the
  // non-null assertion is safe — TS's narrowing can't propagate through
  // the discriminated-union return shape on its own.
  const item = r.item!
  const next: typeof item = { ...item }
  if (body.fields) {
    const coerced = coerceItemFields(r.schema as any, body.fields)
    if (!coerced.ok) return NextResponse.json({ error: coerced.error }, { status: 400 })
    next.fields = { ...item.fields, ...coerced.fields }
  }
  if (body.status === 'draft' || body.status === 'published') next.status = body.status

  const saved = await upsertItem(params.projectId, params.collection, next)
  return NextResponse.json({ item: saved })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const r = await loadCtx(params, session.user.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  await deleteItem(params.projectId, params.collection, params.itemSlug)
  return NextResponse.json({ ok: true })
}
