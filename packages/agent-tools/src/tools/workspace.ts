// Workspace-control tools — change the user's workspace settings from
// chat. Currently just switch_target. Future: change project name,
// add/remove pages, etc.
//
// IMPORTANT: switch_target requires user approval. The MCP server
// POSTs the request to /api/mcp/workspace/switch-target which emits
// a permission event on the active agent SSE stream. The workspace UI
// renders an inline "Approve / Deny" prompt. The HTTP call BLOCKS
// here until the user decides (or 60s timeout). So chef calling this
// tool synchronously waits for the user to click. Good UX: chef
// proposes, user confirms, target switches, next turn happens in the
// new context.

import type { McpTool } from '../mcp'
import { callWebstew, WebstewApiError } from '../api'
import type { BridgeAuth } from '../auth'

const VALID_TARGETS = ['website', 'nextjs', 'react', 'astro', 'expo'] as const

// Sidebar panels the workspace exposes — chef can request the user
// switch to one. Names match the workspace's `Panel` union exactly.
const VALID_PANELS = [
  'build',          // chat + AI build
  'templates',      // template gallery
  'projects',       // saved projects / Files
  'images',         // image library
  'video',          // video generation
  'integrations',   // APIs / Composio + bridge
  'env',            // env variables
  'console',        // logs
  'deploy',         // deployment + custom domains
  'webstew',        // Stew (chef tools / AI features)
] as const

export function workspaceTools(auth: BridgeAuth): McpTool[] {
  return [
    {
      name: 'webstew_open_panel',
      description:
        'Request that the workspace open a specific sidebar panel. Use when the user\'s ' +
        'task is better done in a panel than in chat (e.g. "open the deploy panel" to ' +
        'show their deploy options, "open integrations" to connect Gmail). User sees an ' +
        'Approve / Deny prompt. Valid panels: ' + VALID_PANELS.join(', ') + '.',
      inputSchema: {
        type: 'object',
        properties: {
          panel: {
            type: 'string',
            enum: [...VALID_PANELS],
            description: 'Panel id to open',
          },
          reason: { type: 'string', description: 'One-sentence reason shown to the user' },
        },
        required: ['panel', 'reason'],
      },
      handler: async (args) => {
        const panel = String(args.panel)
        if (!VALID_PANELS.includes(panel as any)) {
          return `Invalid panel "${panel}". Valid: ${VALID_PANELS.join(', ')}.`
        }
        const out = await callWebstew<{ approved: boolean; timedOut?: boolean }>(
          auth,
          'POST',
          '/api/mcp/workspace/open-panel',
          { panel, reason: String(args.reason || '') }
        )
        if (out.timedOut) return 'Timed out waiting for user — ask them again if needed.'
        return out.approved
          ? `User approved — workspace switched to the ${panel} panel.`
          : `User declined opening the ${panel} panel. Continuing in chat.`
      },
    },
    {
      name: 'webstew_switch_target',
      description:
        'Request that the workspace switch to a different build target. The user will see ' +
        'an Approve/Deny prompt and the call returns their decision. Valid targets: ' +
        'website, nextjs, react, astro, expo. Use this when the user\'s request implies a ' +
        'different runtime than the current workspace (e.g. asks for a mobile app while on ' +
        'website). After the user approves, the workspace switches and your NEXT turn ' +
        'will be in the new target — don\'t try to scaffold the new project in this turn.',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: [...VALID_TARGETS],
            description: 'The target to switch to',
          },
          reason: {
            type: 'string',
            description: 'One-sentence reason shown to the user in the approval prompt',
          },
        },
        required: ['target', 'reason'],
      },
      handler: async (args) => {
        const target = String(args.target)
        if (!VALID_TARGETS.includes(target as any)) {
          return `Invalid target "${target}". Valid: ${VALID_TARGETS.join(', ')}.`
        }
        try {
          const out = await callWebstew<{ approved: boolean; target?: string }>(
            auth,
            'POST',
            '/api/mcp/workspace/switch-target',
            { target, reason: String(args.reason || '') }
          )
          if (out.approved) {
            return `Switched to ${out.target || target}. The user is now in the new workspace — their next message will operate there.`
          }
          return `User declined the switch. Continuing in the current target.`
        } catch (e: any) {
          if (e instanceof WebstewApiError && e.status === 408) {
            return 'Timed out waiting for user approval. Ask them in chat to try again.'
          }
          throw e
        }
      },
    },
  ]
}
