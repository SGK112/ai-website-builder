// POST /api/mcp/workspace/open-panel  body: { panel, reason }
// Chef asks the user to open a sidebar panel. Same Approve/Deny flow
// as switch-target. On approve, pushes a workspace.open_panel event
// (relayed as a `workspace.switch_target`-shaped chunk? — no, a new
// kind to keep semantics clean). For now we re-use the existing
// workspace.switch_target chunk shape with action discriminator on
// the meta; cleaner is a separate kind but ship-now wins.

import { mcpRoute } from '@/lib/mcp-auth'
import { broadcastToUser, requestPermission } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

const VALID_PANELS = new Set([
  'build', 'templates', 'projects', 'images', 'video',
  'integrations', 'env', 'console', 'deploy', 'webstew',
])

const PANEL_LABEL: Record<string, string> = {
  build: 'AI Build (chat)',
  templates: 'Templates',
  projects: 'Files',
  images: 'Images',
  video: 'Video',
  integrations: 'APIs / Integrations',
  env: 'Env Variables',
  console: 'Console',
  deploy: 'Deploy',
  webstew: 'Stew',
}

export const POST = mcpRoute(async (req, { userId }) => {
  const body = (await req.json()) as { panel?: string; reason?: string }
  if (!body.panel || !VALID_PANELS.has(body.panel)) {
    throw new Error(`Invalid panel. Valid: ${Array.from(VALID_PANELS).join(', ')}`)
  }
  const decision = await requestPermission(userId, {
    action: 'open_panel',
    title: `Open the ${PANEL_LABEL[body.panel] || body.panel} panel?`,
    description: body.reason || `Chef wants to open the ${body.panel} panel.`,
    approveLabel: 'Open',
    denyLabel: 'Not now',
    meta: { panel: body.panel },
  })
  if (decision.timedOut) {
    return { approved: false, timedOut: true }
  }
  if (decision.approved) {
    broadcastToUser(userId, {
      requestId: '',
      kind: 'workspace.open_panel',
      data: { panel: body.panel, reason: body.reason || '' },
    })
  }
  return { approved: decision.approved, panel: body.panel }
})
