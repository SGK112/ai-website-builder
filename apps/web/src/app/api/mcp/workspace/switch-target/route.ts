// POST /api/mcp/workspace/switch-target  body: { target, reason }
// Asks the user via the permission flow. BLOCKS until user clicks
// Approve / Deny in the workspace UI (or 60s timeout). On approve,
// also pushes workspace.switch_target so the UI actually flips.

import { mcpRoute } from '@/lib/mcp-auth'
import { broadcastToUser, requestPermission } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

const VALID_TARGETS = ['website', 'nextjs', 'react', 'astro', 'expo'] as const
const TARGET_LABEL: Record<string, string> = {
  website: 'Single-page HTML site',
  nextjs: 'Next.js app',
  react: 'Vite + React SPA',
  astro: 'Astro site',
  expo: 'Expo / React Native mobile app',
}

export const POST = mcpRoute(async (req, { userId }) => {
  const body = (await req.json()) as { target?: string; reason?: string }
  if (!body.target || !VALID_TARGETS.includes(body.target as any)) {
    throw new Error(`Invalid target. Valid: ${VALID_TARGETS.join(', ')}`)
  }
  const decision = await requestPermission(userId, {
    action: 'switch_target',
    title: `Switch the kitchen to ${TARGET_LABEL[body.target] || body.target}?`,
    description: body.reason || `Chef wants to switch your workspace target to ${body.target}.`,
    approveLabel: 'Switch',
    denyLabel: 'Stay here',
    meta: { target: body.target },
  })
  if (decision.timedOut) {
    return { approved: false, timedOut: true }
  }
  if (decision.approved) {
    broadcastToUser(userId, {
      requestId: '',
      kind: 'workspace.switch_target',
      data: { target: body.target, reason: body.reason || '' },
    })
  }
  return { approved: decision.approved, target: body.target }
})
