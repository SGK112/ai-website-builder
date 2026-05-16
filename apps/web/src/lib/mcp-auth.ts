// Shared auth + helpers for /api/mcp/* routes. Reuses the bridge's
// Bearer-token authentication (every @webstew/agent-tools call uses
// the same token the bridge stores at ~/.webstew/bridge.json).

import { NextRequest, NextResponse } from 'next/server'
import { authenticateBridge } from '@/lib/bridge-store'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export interface McpRouteContext {
  userId: string
  bridgeId: string
}

/**
 * Wrap an MCP route handler with bridge-token auth. Calls the handler
 * with { userId, bridgeId } when auth passes; returns 401 otherwise.
 * Catches exceptions and wraps as { error } 500 JSON.
 */
export function mcpRoute<T = unknown>(
  handler: (req: NextRequest, ctx: McpRouteContext) => Promise<T>
) {
  return async (req: NextRequest) => {
    const auth = await authenticateBridge(req.headers.get('authorization'))
    if (!auth.ok) {
      return NextResponse.json(
        { error: `MCP auth failed: ${auth.reason}` },
        { status: 401 }
      )
    }
    try {
      const out = await handler(req, { userId: auth.userId, bridgeId: auth.bridgeId })
      return NextResponse.json(out)
    } catch (e: any) {
      console.error('[mcp-route]', e)
      return NextResponse.json(
        { error: e?.message || 'MCP route failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Resolve the active project for a bridge-authenticated user. MCP tools
 * (cms_*, etc.) don't carry projectId because claude calls them
 * out-of-band — we infer it from the user's most-recently-updated
 * project. Returns null when the user has no saved projects yet.
 *
 * Power-user case (multiple projects): we'd add an explicit projectId
 * arg to the MCP tools, but until that's a real pain we'll let
 * most-recent be the rule.
 */
export async function activeProjectId(userId: string): Promise<string | null> {
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const userOid = ObjectId.isValid(userId) ? new ObjectId(userId) : userId
  const proj = await db.collection('projects').findOne(
    { userId: userOid as any },
    { sort: { updatedAt: -1 }, projection: { _id: 1 } }
  )
  return proj ? String(proj._id) : null
}
