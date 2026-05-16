// POST /api/mcp/integrations/run  body: { action, args }
// Executes one Composio action for the bridge user. Returns the
// action's response payload verbatim so chef can summarize it.

import { mcpRoute } from '@/lib/mcp-auth'
import { executeAction } from '@/lib/composio'

export const dynamic = 'force-dynamic'

export const POST = mcpRoute(async (req, { userId }) => {
  const body = (await req.json()) as { action?: string; args?: Record<string, unknown> }
  if (!body.action) throw new Error('action required')
  try {
    const data = await executeAction({
      userId,
      action: body.action,
      args: body.args || {},
    } as any)
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'action failed' }
  }
})
