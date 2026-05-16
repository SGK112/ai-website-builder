// GET /api/mcp/integrations
// Returns the user's connected integrations (Gmail / Slack / etc.).
// Same shape the in-app /integrations page consumes.

import { mcpRoute } from '@/lib/mcp-auth'
import { listUserConnections, SUPPORTED_TOOLKITS } from '@/lib/composio'

export const dynamic = 'force-dynamic'

export const GET = mcpRoute(async (_req, { userId }) => {
  const connections = await listUserConnections(userId)
  const integrations = SUPPORTED_TOOLKITS.map((tk) => {
    const conn = connections.find((c) => c.toolkitSlug === tk.slug && c.status === 'ACTIVE')
    return {
      slug: tk.slug,
      label: tk.label,
      category: tk.category,
      description: tk.description,
      connected: !!conn,
      connectionId: conn?.id,
    }
  })
  return { integrations }
})
