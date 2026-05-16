// Minimal MCP (Model Context Protocol) server implementation. JSON-RPC
// 2.0 over stdio, just the methods Claude Code calls:
//   • initialize           — handshake (return our serverInfo + capabilities)
//   • tools/list           — return our tool registry
//   • tools/call           — invoke a tool with arguments, return content
//   • notifications/*      — fire-and-forget; we ignore them
//   • shutdown / exit      — exit gracefully
//
// We hand-roll instead of pulling @modelcontextprotocol/sdk to keep the
// MCP server bundle tiny + dep-free. Spec we implement:
// https://spec.modelcontextprotocol.io/specification/2024-11-05/

import readline from 'node:readline'

export interface McpTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  /** Returns either plain text (will be wrapped) or a full content array. */
  handler: (args: Record<string, any>) => Promise<string | McpContentBlock[]>
}

export type McpContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: number | string | null
  method: string
  params?: any
}

const PROTOCOL_VERSION = '2024-11-05'

export function startMcpServer(opts: {
  name: string
  version: string
  tools: McpTool[]
}): void {
  const send = (msg: any) => {
    process.stdout.write(JSON.stringify(msg) + '\n')
  }
  const error = (id: any, code: number, message: string) =>
    send({ jsonrpc: '2.0', id, error: { code, message } })
  const result = (id: any, value: any) =>
    send({ jsonrpc: '2.0', id, result: value })

  const toolsByName = new Map(opts.tools.map((t) => [t.name, t]))

  const rl = readline.createInterface({ input: process.stdin })
  rl.on('line', async (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let req: JsonRpcRequest
    try {
      req = JSON.parse(trimmed)
    } catch {
      // Parse error — per JSON-RPC spec, id is unknown so use null.
      error(null, -32700, 'Parse error')
      return
    }

    const id = req.id

    // Notifications (no id) — ack silently, never respond.
    const isNotification = id === undefined || id === null
    const respond = (value: any) => { if (!isNotification) result(id, value) }
    const respondError = (code: number, message: string) => {
      if (!isNotification) error(id, code, message)
    }

    switch (req.method) {
      case 'initialize': {
        respond({
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: opts.name, version: opts.version },
        })
        return
      }
      case 'tools/list': {
        respond({
          tools: opts.tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        })
        return
      }
      case 'tools/call': {
        const name = req.params?.name as string
        const args = (req.params?.arguments || {}) as Record<string, any>
        const tool = toolsByName.get(name)
        if (!tool) {
          respondError(-32601, `Unknown tool: ${name}`)
          return
        }
        try {
          const out = await tool.handler(args)
          const content =
            typeof out === 'string'
              ? ([{ type: 'text', text: out }] as McpContentBlock[])
              : out
          respond({ content, isError: false })
        } catch (e: any) {
          respond({
            content: [{ type: 'text', text: e?.message || String(e) }],
            isError: true,
          })
        }
        return
      }
      case 'shutdown':
      case 'exit': {
        respond({})
        process.exit(0)
        return
      }
      case 'ping': {
        respond({})
        return
      }
      default: {
        // Unknown method — return -32601 only if it's a real request.
        if (req.method.startsWith('notifications/')) return
        respondError(-32601, `Method not found: ${req.method}`)
        return
      }
    }
  })

  // Clean exit when stdin closes (claude shuts us down by closing it).
  rl.on('close', () => process.exit(0))
}
