// GET /api/mcp/cms/collections — list the active project's CMS
// collections + their schemas. Returns empty list if user has no saved
// project yet (the MCP tool layer handles the empty-list UX).

import { mcpRoute, activeProjectId } from '@/lib/mcp-auth'
import { loadProjectCms } from '@/lib/cms-store'

export const dynamic = 'force-dynamic'

export const GET = mcpRoute(async (_req, { userId }) => {
  const projectId = await activeProjectId(userId)
  if (!projectId) return { collections: [] }
  const loaded = await loadProjectCms(projectId, userId)
  if (!loaded.ok) throw new Error(`CMS load failed: ${loaded.error}`)
  const collections = Object.values(loaded.cms.schemas).map((s: any) => ({
    slug: s.slug,
    name: s.name,
    itemCount: (loaded.cms.items[s.slug] || []).length,
    fields: s.fields,
  }))
  return { collections, projectId }
})
