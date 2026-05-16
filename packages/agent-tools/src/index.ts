#!/usr/bin/env -S npx --yes tsx

// @webstew/agent-tools — MCP server entry. Spawned as a subprocess by
// Claude Code via `--mcp-config`. Communicates over stdio (JSON-RPC).
//
// Tool surface: webstew_* tools that proxy to Webstew's /api/mcp/*
// endpoints. Auth is the bridge's pairing token at ~/.webstew/bridge.json
// (so installing this package alone is useless — it relies on the
// bridge being paired first).

import { startMcpServer } from './mcp'
import { loadAuthOrThrow } from './auth'
import { cmsTools } from './tools/cms'
import { mediaTools } from './tools/media'
import { graderTools } from './tools/grader'
import { workspaceTools } from './tools/workspace'
import { integrationTools } from './tools/integrations'

const VERSION = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../package.json').version as string
  } catch {
    return '0.0.0-dev'
  }
})()

function main(): void {
  // Resolve auth FIRST. If the bridge isn't paired, fail with a clear
  // message claude can surface — better than tools that error per-call.
  let auth
  try {
    auth = loadAuthOrThrow()
  } catch (e: any) {
    process.stderr.write(`[webstew-agent-tools] ${e?.message || e}\n`)
    process.exit(1)
  }

  const tools = [
    ...workspaceTools(auth),
    ...cmsTools(auth),
    ...mediaTools(auth),
    ...graderTools(auth),
    ...integrationTools(auth),
  ]

  startMcpServer({
    name: 'webstew-agent-tools',
    version: VERSION,
    tools,
  })
}

main()
