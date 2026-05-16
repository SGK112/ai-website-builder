// Grader tool — runs Webstew's SEO + AI-visibility scoring against a
// URL. Returns overall score (0-100), category breakdowns, and a list
// of actionable issues with severity. Use when the user asks "how's
// my site doing?", "what's missing?", or before/after a major refactor.

import type { McpTool } from '../mcp'
import { callWebstew } from '../api'
import type { BridgeAuth } from '../auth'

export function graderTools(auth: BridgeAuth): McpTool[] {
  return [
    {
      name: 'webstew_grade_site',
      description:
        'Grade a public URL for SEO + technical health + AI-visibility (how easily ' +
        'LLM-powered search like Perplexity / ChatGPT-search can answer questions about ' +
        'the site). Returns scores 0-100 plus an itemized issue list. After grading, ' +
        'fix the top 2-3 actionable issues yourself (add missing meta description, fix ' +
        'heading structure, add schema.org JSON-LD) instead of pasting the report back.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Public URL to grade. Required to be reachable.' },
        },
        required: ['url'],
      },
      handler: async (args) => {
        const out = await callWebstew<{ scores: any; issues: any[] }>(
          auth, 'POST', '/api/mcp/grader',
          { url: args.url }
        )
        return JSON.stringify(out, null, 2)
      },
    },
  ]
}
