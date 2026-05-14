// GET    /api/cms/[projectId]/[collection]/[itemSlug] — read one item
// PATCH  /api/cms/[projectId]/[collection]/[itemSlug] — partial update
// DELETE /api/cms/[projectId]/[collection]/[itemSlug] — hard delete

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSafeSlug, coerceItemFields, enforceRequiredFields, validateReferences } from '@/lib/cms'
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

  // After merge: re-enforce required fields and reference targets. The audit
  // turned up that PATCH could clear a required field (set it to null/empty)
  // because required-check only ran on create. Now it runs everywhere.
  const reqOk = enforceRequiredFields(r.schema as any, next.fields)
  if (!reqOk.ok) return NextResponse.json({ error: reqOk.error }, { status: 400 })

  // Reload project so we have all collections' items for the ref check.
  // Tiny re-read, worth it for data integrity.
  const fullLoad = await loadCtxAllItems(params.projectId, session.user.id)
  if (fullLoad) {
    const refOk = validateReferences(r.schema as any, next.fields, fullLoad)
    if (!refOk.ok) return NextResponse.json({ error: refOk.error }, { status: 400 })
  }

  const saved = await upsertItem(params.projectId, params.collection, next)
  return NextResponse.json({ item: saved })
}

// Helper — pulls all-items-by-collection for ref validation only.
async function loadCtxAllItems(projectId: string, userId: string): Promise<Record<string, Record<string, any>> | null> {
  const { loadProjectCms } = await import('@/lib/cms-store')
  const loaded = await loadProjectCms(projectId, userId)
  if (!loaded.ok) return null
  return loaded.cms.items as Record<string, Record<string, any>>
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const r = await loadCtx(params, session.user.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  await deleteItem(params.projectId, params.collection, params.itemSlug)
  return NextResponse.json({ ok: true })
}
