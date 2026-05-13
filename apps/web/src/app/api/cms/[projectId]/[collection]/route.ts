// GET  /api/cms/[projectId]/[collection] — list items + the collection schema
// POST /api/cms/[projectId]/[collection] — create one item

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSafeSlug, coerceItemFields } from '@/lib/cms'
import { loadProjectCms, upsertItem } from '@/lib/cms-store'

export const dynamic = 'force-dynamic'

interface Ctx { params: { projectId: string; collection: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!isSafeSlug(params.collection)) return NextResponse.json({ error: 'Invalid collection slug' }, { status: 400 })

  const loaded = await loadProjectCms(params.projectId, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })

  const schema = loaded.cms.schemas[params.collection]
  if (!schema) {
    return NextResponse.json({ error: `Collection "${params.collection}" not found on this project` }, { status: 404 })
  }

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get('status')
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500)

  const all = Object.values(loaded.cms.items[params.collection] || {})
  const filtered = statusFilter ? all.filter(i => i.status === statusFilter) : all
  filtered.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
  return NextResponse.json({ schema, items: filtered.slice(0, limit), total: filtered.length })
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!isSafeSlug(params.collection)) return NextResponse.json({ error: 'Invalid collection slug' }, { status: 400 })

  const loaded = await loadProjectCms(params.projectId, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })

  const schema = loaded.cms.schemas[params.collection]
  if (!schema) {
    return NextResponse.json({ error: `Collection "${params.collection}" not found on this project` }, { status: 404 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!isSafeSlug(body.slug)) return NextResponse.json({ error: 'slug required (lowercase-hyphenated)' }, { status: 400 })

  const items = loaded.cms.items[params.collection] || {}
  if (items[body.slug]) return NextResponse.json({ error: `Item "${body.slug}" already exists` }, { status: 409 })

  const coerced = coerceItemFields(schema as any, body.fields || {})
  if (!coerced.ok) return NextResponse.json({ error: coerced.error }, { status: 400 })

  for (const f of schema.fields) {
    if (f.required && (coerced.fields[f.key] === undefined || coerced.fields[f.key] === null || coerced.fields[f.key] === '')) {
      return NextResponse.json({ error: `Required field "${f.key}" missing` }, { status: 400 })
    }
  }

  const saved = await upsertItem(params.projectId, params.collection, {
    slug: body.slug,
    fields: coerced.fields,
    status: body.status === 'published' ? 'published' : 'draft',
  })
  return NextResponse.json({ item: saved }, { status: 201 })
}
