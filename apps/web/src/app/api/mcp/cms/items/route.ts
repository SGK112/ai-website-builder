// GET  /api/mcp/cms/items?collection=<slug>  — list items in a collection
// POST /api/mcp/cms/items                      — create or update an item

import { mcpRoute, activeProjectId } from '@/lib/mcp-auth'
import { loadProjectCms, upsertItem } from '@/lib/cms-store'

export const dynamic = 'force-dynamic'

export const GET = mcpRoute(async (req, { userId }) => {
  const url = new URL(req.url)
  const collection = url.searchParams.get('collection')
  if (!collection) throw new Error('collection query param required')
  const projectId = await activeProjectId(userId)
  if (!projectId) return { items: [], projectId: null }
  const loaded = await loadProjectCms(projectId, userId)
  if (!loaded.ok) throw new Error(`CMS load failed: ${loaded.error}`)
  // items is Record<collection, Record<slug, item>>; convert the
  // per-collection map to an array.
  const items = Object.values(loaded.cms.items[collection] || {})
    .slice(0, 50)
    .map((i: any) => ({
      slug: i.slug,
      status: i.status || 'published',
      fields: i.fields,
      updatedAt: i.updatedAt,
    }))
  return { items, projectId }
})

export const POST = mcpRoute(async (req, { userId }) => {
  const body = await req.json() as {
    collection?: string
    slug?: string
    fields?: Record<string, unknown>
    status?: 'draft' | 'published'
  }
  if (!body.collection || !body.slug || !body.fields) {
    throw new Error('collection, slug, fields required')
  }
  const projectId = await activeProjectId(userId)
  if (!projectId) throw new Error('No active project — user needs to save one first.')
  const saved = await upsertItem(projectId, body.collection, {
    slug: body.slug,
    fields: body.fields,
    status: body.status || 'published',
  } as any)
  return { ok: true, itemId: saved.slug, projectId }
})
