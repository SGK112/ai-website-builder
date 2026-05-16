// Media tools — upload the user's own image to Cloudinary (vs the
// /api/media Pexels proxy which is built into URLs the chef writes).
// Use this when the user supplies an external image URL they want
// stored permanently in their project.

import type { McpTool } from '../mcp'
import { callWebstew } from '../api'
import type { BridgeAuth } from '../auth'

export function mediaTools(auth: BridgeAuth): McpTool[] {
  return [
    {
      name: 'webstew_upload_image',
      description:
        'Upload an image to the user\'s Cloudinary store. Use when the user provides ' +
        'their own image URL they want stored permanently. Skip for /api/media (Pexels proxy), ' +
        'pravatar avatars, or URLs already on cloudinary.com — those are already proxied or ' +
        'stable. Returns the permanent Cloudinary URL.',
      inputSchema: {
        type: 'object',
        properties: {
          sourceUrl: { type: 'string', description: 'URL of the image to upload + store' },
        },
        required: ['sourceUrl'],
      },
      handler: async (args) => {
        const out = await callWebstew<{ url: string }>(
          auth, 'POST', '/api/mcp/media/upload',
          { sourceUrl: args.sourceUrl }
        )
        return out.url
      },
    },
  ]
}
