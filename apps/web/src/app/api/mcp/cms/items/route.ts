// GET  /api/mcp/cms/items?collection=<slug>  — list items in a collection
// POST /api/mcp/cms/items                      — create or update an item

import { mcpRoute, activeProjectId } from '@/lib/mcp-auth'
import { loadProjectCms, upsertItem } from '@/lib/cms-store'
import { isSafeSlug, coerceItemFields, enforceRequiredFields, validateReferences } from '@/lib/cms'

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
  // Same validation the in-app POST enforces — the MCP path previously stored
  // raw `collection`/`slug`/`fields` straight into the project doc (dotted-key
  // injection, unbounded payloads, schema bypass) and auto-published.
  if (!isSafeSlug(body.collection)) throw new Error('collection required (lowercase-hyphenated)')
  if (!isSafeSlug(body.slug)) throw new Error('slug required (lowercase-hyphenated)')
  if (!body.fields || typeof body.fields !== 'object') throw new Error('fields object required')

  const projectId = await activeProjectId(userId)
  if (!projectId) throw new Error('No active project — user needs to save one first.')

  const loaded = await loadProjectCms(projectId, userId)
  if (!loaded.ok) throw new Error(`CMS load failed: ${loaded.error}`)
  const schema = loaded.cms.schemas[body.collection]
  if (!schema) throw new Error(`Collection "${body.collection}" not found on this project`)

  const coerced = coerceItemFields(schema as any, body.fields)
  if (!coerced.ok) throw new Error(coerced.error)
  const required = enforceRequiredFields(schema as any, coerced.fields)
  if (!required.ok) throw new Error(required.error)
  const refOk = validateReferences(schema as any, coerced.fields, loaded.cms.items as Record<string, Record<string, any>>)
  if (!refOk.ok) throw new Error(refOk.error)

  const saved = await upsertItem(projectId, body.collection, {
    slug: body.slug,
    fields: coerced.fields,
    status: body.status === 'published' ? 'published' : 'draft',
  })
  return { ok: true, itemId: saved.slug, projectId }
})
