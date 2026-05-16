// CMS tools — read + write the project's content collections.
// Mirror the in-app agent's cms_* tools (see apps/web/src/lib/agent-tools.ts).
// All operations require the user to be on a saved project (projectId
// flows through the server's session, so the MCP server doesn't have
// to know about it).

import type { McpTool } from '../mcp'
import { callWebstew } from '../api'
import type { BridgeAuth } from '../auth'

export function cmsTools(auth: BridgeAuth): McpTool[] {
  return [
    {
      name: 'webstew_list_cms_collections',
      description:
        'List the content collections in the active Webstew project. ' +
        'Each collection has a slug, name, item count, and field schema. ' +
        'Use this BEFORE list_cms_items so you know what collections exist. ' +
        'Returns empty list when the user has no saved project yet.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const out = await callWebstew<{ collections: any[] }>(auth, 'GET', '/api/mcp/cms/collections')
        return JSON.stringify(out.collections, null, 2)
      },
    },
    {
      name: 'webstew_list_cms_items',
      description:
        'List items in a specific content collection. Provide the collection slug ' +
        '(e.g. "blog-posts", "services"). Returns up to 50 items with their slug, ' +
        'status (draft/published), and fields.',
      inputSchema: {
        type: 'object',
        properties: {
          collection: { type: 'string', description: 'Collection slug' },
        },
        required: ['collection'],
      },
      handler: async (args) => {
        const out = await callWebstew<{ items: any[] }>(
          auth, 'GET', '/api/mcp/cms/items',
          undefined,
          { collection: String(args.collection) }
        )
        return JSON.stringify(out.items, null, 2)
      },
    },
    {
      name: 'webstew_create_cms_item',
      description:
        'Create a new item in a collection. Field names must match the collection ' +
        'schema (use list_cms_collections first). Default status is "published" — ' +
        'pass status: "draft" if the user wants to stage it.',
      inputSchema: {
        type: 'object',
        properties: {
          collection: { type: 'string', description: 'Collection slug' },
          slug: { type: 'string', description: 'URL-safe slug for the item' },
          fields: { type: 'object', description: 'Field values matching the collection schema' },
          status: { type: 'string', enum: ['draft', 'published'], description: 'Defaults to published' },
        },
        required: ['collection', 'slug', 'fields'],
      },
      handler: async (args) => {
        const out = await callWebstew<{ ok: boolean; itemId: string }>(
          auth, 'POST', '/api/mcp/cms/items',
          {
            collection: args.collection,
            slug: args.slug,
            fields: args.fields,
            status: args.status || 'published',
          }
        )
        return out.ok
          ? `Created item ${args.slug} in ${args.collection} (id: ${out.itemId})`
          : `Failed to create item.`
      },
    },
  ]
}
