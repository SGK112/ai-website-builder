// GET /api/mcp/integrations/actions?toolkit=<slug>
// Lists available actions for a connected toolkit (e.g. GMAIL_SEND_EMAIL).

import { mcpRoute } from '@/lib/mcp-auth'
import { listToolkitActions } from '@/lib/composio'

export const dynamic = 'force-dynamic'

export const GET = mcpRoute(async (req) => {
  const toolkit = new URL(req.url).searchParams.get('toolkit')
  if (!toolkit) throw new Error('toolkit query param required')
  const actions = await listToolkitActions(toolkit)
  return {
    actions: actions.map((a) => ({
      slug: a.slug,
      description: a.description,
      // schema may exist on some toolkits; pass through if present
      ...(('input_parameters' in a) ? { input: (a as any).input_parameters } : {}),
    })),
  }
})
