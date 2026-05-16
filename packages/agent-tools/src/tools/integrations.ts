// Composio integrations — the user's connected accounts (Gmail, Slack,
// HubSpot, Stripe, Shopify, GitHub, etc.). Three-step flow:
//   1. webstew_list_integrations           — what's connected
//   2. webstew_list_integration_actions    — what verbs the connected
//                                            toolkit exposes (e.g. for
//                                            Gmail: SEND_EMAIL, etc.)
//   3. webstew_run_integration_action      — actually do the thing
//
// NEVER guess action slugs — always confirm with list_integration_actions.

import type { McpTool } from '../mcp'
import { callWebstew } from '../api'
import type { BridgeAuth } from '../auth'

export function integrationTools(auth: BridgeAuth): McpTool[] {
  return [
    {
      name: 'webstew_list_integrations',
      description:
        'List the user\'s connected third-party integrations (Gmail, Slack, HubSpot, ' +
        'Stripe, Shopify, GitHub, Salesforce, Google Sheets, etc.). Returns the toolkit ' +
        'slug, label, and connection status. If a toolkit the user asked for isn\'t in ' +
        'the result, tell them to connect it at /integrations and stop.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const out = await callWebstew<{ integrations: any[] }>(auth, 'GET', '/api/mcp/integrations')
        return JSON.stringify(out.integrations, null, 2)
      },
    },
    {
      name: 'webstew_list_integration_actions',
      description:
        'List the available actions/verbs for a connected toolkit. Pass the toolkit slug ' +
        '(e.g. "gmail", "slack", "hubspot"). Returns action slugs you pass to run_integration_action. ' +
        'Use this BEFORE run_integration_action — never guess action slugs.',
      inputSchema: {
        type: 'object',
        properties: {
          toolkit: { type: 'string', description: 'Toolkit slug, e.g. "gmail" or "slack"' },
        },
        required: ['toolkit'],
      },
      handler: async (args) => {
        const out = await callWebstew<{ actions: any[] }>(
          auth, 'GET', '/api/mcp/integrations/actions',
          undefined,
          { toolkit: String(args.toolkit) }
        )
        return JSON.stringify(out.actions, null, 2)
      },
    },
    {
      name: 'webstew_run_integration_action',
      description:
        'Execute one action against a connected integration. action must be a slug returned ' +
        'by list_integration_actions for the relevant toolkit. args shape depends on the action ' +
        '— inspect the action description first. Examples: send a Slack message, create a ' +
        'HubSpot contact, append a Google Sheets row, send a Gmail email.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Action slug, e.g. "GMAIL_SEND_EMAIL"' },
          args: { type: 'object', description: 'Action arguments — shape per the action schema' },
        },
        required: ['action', 'args'],
      },
      handler: async (args) => {
        const out = await callWebstew<{ ok: boolean; data?: any; error?: string }>(
          auth, 'POST', '/api/mcp/integrations/run',
          { action: args.action, args: args.args }
        )
        if (!out.ok) return `Action failed: ${out.error || 'unknown error'}`
        return typeof out.data === 'string'
          ? out.data
          : JSON.stringify(out.data, null, 2)
      },
    },
  ]
}
