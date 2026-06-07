// Agent tools — what Claude can do inside the builder loop.
//
// Right now the VFS lives in two places, depending on context:
//   • In-memory `files` map passed in by the caller (e.g., during a chat
//     turn where the workspace already has the current state in its
//     client). The executor mutates the map and returns the snapshot.
//   • A Mongo `projects` doc when a `projectId` is supplied — used when
//     the agent is editing a saved project and the client expects the
//     server to persist the changes.
//
// Keeping the executor agnostic about persistence means the agent endpoint
// can use it either way without duplicating logic.
//
// The TOOLS export is the JSON-schema list Anthropic expects in
// `messages.create({ tools: [...] })`.

import Anthropic from '@anthropic-ai/sdk'
import { loadProjectCms, upsertItem, upsertSchema, deleteItem } from '@/lib/cms-store'
import {
  isSafeSlug,
  coerceItemFields,
  enforceRequiredFields,
  validateReferences,
  validateSchema,
  type CmsSchema,
  type CmsItem,
} from '@/lib/cms'
import { gradeHtml, gradeWebsite } from '@/lib/grader'
import {
  SUPPORTED_TOOLKITS,
  listUserConnections,
  listToolkitActions,
  executeAction,
} from '@/lib/composio'

export type VfsMap = Record<string, string>

export interface AgentVfs {
  files: VfsMap
  // Hooks for callers that want to persist (e.g., Mongo update). Optional.
  onWrite?: (path: string, contents: string) => Promise<void> | void
  onDelete?: (path: string) => Promise<void> | void
  // CMS context — when provided, the agent's cms_* tools become usable.
  // The agent can list/read/write content collections owned by this project.
  // Absent context = cms tools return "CMS not available in this session".
  cms?: {
    projectId: string
    userId: string
  }
}

// The Anthropic tool definitions. Kept SHORT — over-long descriptions
// burn tokens. The model reads these on every iteration.
export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'list_files',
    description:
      'List all files in the current project. Returns a JSON array of file paths. ' +
      'Call this first if you need to know what exists.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'read_file',
    description:
      "Read the full contents of one file in the project. Use this to inspect " +
      "code before editing. Returns the file's text contents.",
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: "File path relative to project root, e.g. 'app/page.tsx'",
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Create a new file or completely overwrite an existing one. Provide the FULL final contents — ' +
      'this is not a patch operation. PREFER edit_file for narrow changes to existing files; ' +
      'use write_file only when creating a new file or rewriting >50% of an existing one.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: "File path, e.g. 'app/page.tsx'" },
        contents: { type: 'string', description: 'Full file contents' },
      },
      required: ['path', 'contents'],
    },
  },
  {
    name: 'edit_file',
    description:
      'Surgical edit of an existing file: replace one exact substring with another. ' +
      'STRONGLY PREFERRED over write_file for narrow changes (rename a heading, swap a class, ' +
      'change one attribute). 5x faster than full rewrites and cannot accidentally touch other ' +
      'parts of the file.\n\n' +
      'RULES:\n' +
      '- old_string must appear EXACTLY ONCE in the file. If it appears multiple times, expand it ' +
      'with surrounding context until it is unique.\n' +
      '- Match is literal (no regex). Whitespace, indentation, casing all matter.\n' +
      '- new_string can be empty (= delete).\n' +
      '- For multiple changes in the same file, make multiple edit_file calls — do not bundle ' +
      'into a write_file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: "Existing file path, e.g. 'index.html'" },
        old_string: { type: 'string', description: 'Exact substring to find (must appear exactly once)' },
        new_string: { type: 'string', description: 'Replacement text (may be empty)' },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project. Use sparingly.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_cms_collections',
    description:
      'List the content collections owned by this project. Each collection has a slug, name, ' +
      'field schema, and item count. Use this when the user mentions blog posts, services, ' +
      'team members, or any structured content that might live in the CMS.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_cms_items',
    description:
      'List items in one CMS collection. Returns the schema plus an array of items. ' +
      'Each item has `slug`, `fields` (object keyed by schema field key), and `status` (draft|published). ' +
      'Only published items are baked into deploys, but both kinds are returned here so the agent ' +
      'can preview/edit drafts. Use this BEFORE writing fetch code so the field names you reference ' +
      'match what the schema actually defines.',
    input_schema: {
      type: 'object' as const,
      properties: {
        collection: { type: 'string', description: 'Collection slug (e.g. "posts", "services")' },
      },
      required: ['collection'],
    },
  },
  {
    name: 'create_cms_collection',
    description:
      "Create a new content collection on this project. Fails if one with the same slug exists " +
      "(use update_cms_item / list_cms_items instead). Field types: text, textarea, markdown, image, " +
      "boolean, url, number, date, reference. Use this when the user asks for a new kind of content " +
      "the existing schemas can't hold (e.g. they have a 'posts' collection but want a separate 'team').",
    input_schema: {
      type: 'object' as const,
      properties: {
        slug:  { type: 'string', description: 'lowercase-hyphenated collection slug' },
        name:  { type: 'string', description: 'Human label, e.g. "Blog Posts"' },
        fields: {
          type: 'array',
          description: 'Field definitions',
          items: {
            type: 'object',
            properties: {
              key:      { type: 'string' },
              type:     { type: 'string', description: 'text|textarea|markdown|image|boolean|url|number|date|reference' },
              required: { type: 'boolean' },
              label:    { type: 'string' },
            },
            required: ['key', 'type'],
          },
        },
      },
      required: ['slug', 'name', 'fields'],
    },
  },
  {
    name: 'create_cms_item',
    description:
      'Create one item in an existing collection. Fails if the slug already exists. ' +
      "Pass `status: 'published'` so it ships in the next deploy; default is draft.",
    input_schema: {
      type: 'object' as const,
      properties: {
        collection: { type: 'string' },
        slug:       { type: 'string', description: 'lowercase-hyphenated item slug' },
        fields:     { type: 'object', description: 'Field values keyed by schema field.key' },
        status:     { type: 'string', description: "'draft' or 'published'" },
      },
      required: ['collection', 'slug', 'fields'],
    },
  },
  {
    name: 'update_cms_item',
    description:
      'Partial update of a CMS item. Only `fields` keys you pass are touched. Status flip allowed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        collection: { type: 'string' },
        slug:       { type: 'string' },
        fields:     { type: 'object' },
        status:     { type: 'string' },
      },
      required: ['collection', 'slug'],
    },
  },
  {
    name: 'get_cms_item',
    description:
      'Read one CMS item by collection + slug. Returns { item, schema }. Use this when you ' +
      'need to inspect a single item without paging the whole collection (cheaper than ' +
      'list_cms_items if you already know the slug).',
    input_schema: {
      type: 'object' as const,
      properties: {
        collection: { type: 'string' },
        slug:       { type: 'string' },
      },
      required: ['collection', 'slug'],
    },
  },
  {
    name: 'delete_cms_item',
    description: 'Hard-delete one CMS item. Asks no confirmation; only use when the user clearly meant to delete.',
    input_schema: {
      type: 'object' as const,
      properties: {
        collection: { type: 'string' },
        slug:       { type: 'string' },
      },
      required: ['collection', 'slug'],
    },
  },
  {
    name: 'upload_image',
    description:
      'Upload an image from a public URL to Cloudinary, returning the hosted Cloudinary URL ' +
      'you can store in CMS image fields or paste into <img src>. Use this when the user ' +
      'gives you an image to "save" or "host" — the result is the durable URL, vs. a ' +
      'fragile remote URL that might 404. Skip for picsum/unsplash URLs (those are already ' +
      "fine to embed directly). Returns { url }.",
    input_schema: {
      type: 'object' as const,
      properties: {
        sourceUrl: { type: 'string', description: 'http(s) URL to upload' },
        publicId:  { type: 'string', description: 'Optional Cloudinary public_id (otherwise auto-generated)' },
      },
      required: ['sourceUrl'],
    },
  },
  {
    name: 'list_integrations',
    description:
      "List which third-party services the user has connected (Gmail, Slack, HubSpot, etc.). " +
      "Use this when the user says 'send a Slack message', 'add this to my HubSpot', etc. — " +
      "if the service isn't in the result, tell the user to connect it at /integrations first.",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_integration_actions',
    description:
      'List the available actions (verbs) for a connected toolkit. Returns slugs you can pass to ' +
      'run_integration_action. Example: for "gmail" you might get GMAIL_SEND_EMAIL, GMAIL_LIST_THREADS, ' +
      'GMAIL_CREATE_DRAFT, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        toolkit: { type: 'string', description: 'Toolkit slug (e.g. "gmail", "slack")' },
      },
      required: ['toolkit'],
    },
  },
  {
    name: 'run_integration_action',
    description:
      'Execute one action on the user\'s behalf via a connected toolkit. Example: send an email, ' +
      'post a Slack message, create a HubSpot contact. The action slug comes from ' +
      'list_integration_actions — DO NOT guess slugs. args is a JSON object matching the ' +
      'action\'s parameter schema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', description: 'Action slug, e.g. "GMAIL_SEND_EMAIL"' },
        args:   { type: 'object', description: 'Parameters for the action' },
      },
      required: ['action', 'args'],
    },
  },
  {
    name: 'grade_site',
    description:
      "Grade the current website for SEO, technical, mobile, social presence, and AI-visibility. " +
      "Returns an overall score 0-100 + letter grade, plus a list of concrete issues + " +
      "recommendations. Use this when the user asks for an SEO audit, score, grade, or 'how's my " +
      "site doing'. By default grades the in-progress draft from index.html in the VFS; pass " +
      "{ url } to grade a deployed URL instead. After grading, FIX the top issues that are " +
      "directly actionable (e.g. add a meta description if missing).",
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Optional: grade an already-deployed URL instead of the local draft' },
      },
    },
  },
  {
    name: 'generate_logo',
    description:
      "Generate a custom logo (or any brand graphic) from a text description and get back a " +
      "durable hosted image URL you can drop straight into the site. Use this when the user asks " +
      "for a logo, brand mark, icon, hero illustration, or favicon. WRITE A RICH PROMPT: include " +
      "the business name to render as text if they want a wordmark, the style (minimal flat, " +
      "gradient, vintage badge, mascot, monogram), colors, and 'transparent background' / 'on " +
      "white' as needed. After you get the { url }, PLACE it: put it in the header <img> (and " +
      "swap any text logo), set it as the favicon (<link rel=icon>), and/or use it where the user " +
      "asked. Returns { url, publicId }.",
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: { type: 'string', description: 'Rich description of the logo/graphic to generate (style, colors, any text to render, background).' },
        shape: { type: 'string', enum: ['square', 'wide', 'tall'], description: 'Aspect ratio. square (1:1) for logos/icons/favicons, wide (16:9) for banners/heroes, tall (9:16) for posters. Default square.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'done',
    description:
      'Signal that the user-requested task is complete. Call this ONCE at the end ' +
      'with a 1–2 sentence summary of what was changed. After calling done, the loop ends.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: {
          type: 'string',
          description: 'Short summary of changes made, for the user.',
        },
      },
      required: ['summary'],
    },
  },
]

export interface ToolResult {
  ok: boolean
  content: string
}

// Cap on individual file sizes (chars) so a runaway model can't dump a
// 50 MB file and OOM the server.
const MAX_FILE_BYTES = 200_000

// Execute one tool call against the VFS. Returns a JSON string the
// caller can pipe back to Anthropic as a `tool_result.content` value.
export async function executeTool(
  name: string,
  input: any,
  vfs: AgentVfs
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_files': {
        const paths = Object.keys(vfs.files).sort()
        return { ok: true, content: JSON.stringify(paths) }
      }
      case 'read_file': {
        const path = String(input?.path || '').trim()
        if (!path) return { ok: false, content: 'Missing required field: path' }
        const contents = vfs.files[path]
        if (contents == null) return { ok: false, content: `File not found: ${path}` }
        return { ok: true, content: contents }
      }
      case 'write_file': {
        const path = String(input?.path || '').trim()
        const contents = String(input?.contents ?? '')
        if (!path) return { ok: false, content: 'Missing required field: path' }
        if (contents.length > MAX_FILE_BYTES) {
          return { ok: false, content: `File too large (${contents.length} > ${MAX_FILE_BYTES} chars)` }
        }
        // Reject path traversal + absolute paths.
        if (path.startsWith('/') || path.includes('..')) {
          return { ok: false, content: `Invalid path: ${path}` }
        }
        vfs.files[path] = contents
        if (vfs.onWrite) await vfs.onWrite(path, contents)
        return { ok: true, content: `Wrote ${path} (${contents.length} chars)` }
      }
      case 'edit_file': {
        const path = String(input?.path || '').trim()
        const oldStr = String(input?.old_string ?? '')
        const newStr = String(input?.new_string ?? '')
        if (!path) return { ok: false, content: 'Missing required field: path' }
        if (!oldStr) return { ok: false, content: 'old_string is required and must be non-empty' }
        if (path.startsWith('/') || path.includes('..')) {
          return { ok: false, content: `Invalid path: ${path}` }
        }
        const current = vfs.files[path]
        if (current == null) {
          return { ok: false, content: `File not found: ${path}. Use write_file to create it.` }
        }
        // Uniqueness check — refuses to edit if old_string appears 0 or 2+
        // times. Forces the agent to widen the snippet with more context
        // until it's unambiguous; prevents accidental mass replacements.
        const idx = current.indexOf(oldStr)
        if (idx === -1) {
          return { ok: false, content: `old_string not found in ${path}. Read the file again and copy the exact substring (whitespace + casing matter).` }
        }
        if (current.indexOf(oldStr, idx + 1) !== -1) {
          return { ok: false, content: `old_string matches multiple locations in ${path}. Expand it with surrounding lines until it's unique, then retry.` }
        }
        const updated = current.slice(0, idx) + newStr + current.slice(idx + oldStr.length)
        if (updated.length > MAX_FILE_BYTES) {
          return { ok: false, content: `Resulting file too large (${updated.length} > ${MAX_FILE_BYTES} chars)` }
        }
        vfs.files[path] = updated
        if (vfs.onWrite) await vfs.onWrite(path, updated)
        return { ok: true, content: `Edited ${path} (${oldStr.length} → ${newStr.length} chars at offset ${idx})` }
      }
      case 'delete_file': {
        const path = String(input?.path || '').trim()
        if (!path) return { ok: false, content: 'Missing required field: path' }
        if (!(path in vfs.files)) return { ok: false, content: `File not found: ${path}` }
        delete vfs.files[path]
        if (vfs.onDelete) await vfs.onDelete(path)
        return { ok: true, content: `Deleted ${path}` }
      }
      // ── CMS tools ──────────────────────────────────────────────────────
      // All of these gate on vfs.cms — if the caller didn't wire CMS context
      // (legacy paths, anonymous use), they short-circuit so the agent gets
      // a clear "not available" instead of a 500.
      case 'list_cms_collections': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session (no projectId)' }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        const summary = Object.values(loaded.cms.schemas).map((s: any) => ({
          slug: s.slug,
          name: s.name,
          fields: s.fields,
          itemCount: Object.keys(loaded.cms.items[s.slug] || {}).length,
        }))
        return { ok: true, content: JSON.stringify(summary, null, 2) }
      }
      case 'list_cms_items': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session' }
        const collection = String(input?.collection || '').trim()
        if (!isSafeSlug(collection)) return { ok: false, content: 'Invalid or missing collection slug' }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        const schema = loaded.cms.schemas[collection]
        if (!schema) return { ok: false, content: `Collection "${collection}" does not exist. Call list_cms_collections first.` }
        const items = Object.values(loaded.cms.items[collection] || {})
        return { ok: true, content: JSON.stringify({ schema, items }, null, 2) }
      }
      case 'create_cms_collection': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session' }
        const validated = validateSchema(input)
        if (!validated.ok) return { ok: false, content: validated.error }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        if (loaded.cms.schemas[validated.schema.slug]) {
          return { ok: false, content: `Collection "${validated.schema.slug}" already exists` }
        }
        const result = await upsertSchema(vfs.cms.projectId, validated.schema as CmsSchema, null)
        return { ok: true, content: `Created collection "${result.schema.slug}" with ${result.schema.fields.length} fields` }
      }
      case 'create_cms_item': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session' }
        const collection = String(input?.collection || '').trim()
        const slug = String(input?.slug || '').trim()
        if (!isSafeSlug(collection)) return { ok: false, content: 'Invalid collection' }
        if (!isSafeSlug(slug)) return { ok: false, content: 'Invalid item slug (lowercase-hyphenated)' }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        const schema = loaded.cms.schemas[collection]
        if (!schema) return { ok: false, content: `Collection "${collection}" not found` }
        if (loaded.cms.items[collection]?.[slug]) {
          return { ok: false, content: `Item "${slug}" already exists in "${collection}". Use update_cms_item.` }
        }
        const coerced = coerceItemFields(schema as any, input?.fields || {})
        if (!coerced.ok) return { ok: false, content: coerced.error }

        const reqOk = enforceRequiredFields(schema as any, coerced.fields)
        if (!reqOk.ok) return { ok: false, content: reqOk.error }

        const refOk = validateReferences(
          schema as any,
          coerced.fields,
          loaded.cms.items as Record<string, Record<string, any>>
        )
        if (!refOk.ok) return { ok: false, content: refOk.error }

        const item: CmsItem = {
          slug,
          fields: coerced.fields,
          status: input?.status === 'published' ? 'published' : 'draft',
        }
        const saved = await upsertItem(vfs.cms.projectId, collection, item)
        return { ok: true, content: `Created item "${collection}/${saved.slug}" (status: ${saved.status})` }
      }
      case 'update_cms_item': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session' }
        const collection = String(input?.collection || '').trim()
        const slug = String(input?.slug || '').trim()
        if (!isSafeSlug(collection) || !isSafeSlug(slug)) return { ok: false, content: 'Invalid collection or item slug' }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        const schema = loaded.cms.schemas[collection]
        const existing = loaded.cms.items[collection]?.[slug]
        if (!schema || !existing) return { ok: false, content: `Item "${collection}/${slug}" not found` }
        const next: CmsItem = { ...existing }
        if (input?.fields) {
          const coerced = coerceItemFields(schema as any, input.fields)
          if (!coerced.ok) return { ok: false, content: coerced.error }
          next.fields = { ...existing.fields, ...coerced.fields }
        }
        if (input?.status === 'draft' || input?.status === 'published') next.status = input.status

        // Required + reference checks AFTER the merge — previously only ran
        // on create, so a partial update could blank a required field.
        const reqOk = enforceRequiredFields(schema as any, next.fields)
        if (!reqOk.ok) return { ok: false, content: reqOk.error }
        const refOk = validateReferences(
          schema as any,
          next.fields,
          loaded.cms.items as Record<string, Record<string, any>>
        )
        if (!refOk.ok) return { ok: false, content: refOk.error }

        const saved = await upsertItem(vfs.cms.projectId, collection, next)
        return { ok: true, content: `Updated "${collection}/${saved.slug}" (status: ${saved.status})` }
      }
      case 'get_cms_item': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session' }
        const collection = String(input?.collection || '').trim()
        const slug = String(input?.slug || '').trim()
        if (!isSafeSlug(collection) || !isSafeSlug(slug)) return { ok: false, content: 'Invalid collection or item slug' }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        const schema = loaded.cms.schemas[collection]
        const item = loaded.cms.items[collection]?.[slug]
        if (!schema || !item) return { ok: false, content: `Item "${collection}/${slug}" not found` }
        return { ok: true, content: JSON.stringify({ schema, item }) }
      }
      case 'upload_image': {
        if (!vfs.cms) return { ok: false, content: 'Upload requires a project context (cms.projectId/userId)' }
        const sourceUrl = String(input?.sourceUrl || '').trim()
        if (!/^https?:\/\//i.test(sourceUrl)) return { ok: false, content: 'sourceUrl must be http(s)://' }
        try {
          const cloud = process.env.CLOUDINARY_CLOUD_NAME
          const key = process.env.CLOUDINARY_API_KEY
          const secret = process.env.CLOUDINARY_API_SECRET
          if (!cloud || !key || !secret) {
            return { ok: false, content: 'Cloudinary not configured on this deploy. Embed the source URL directly instead.' }
          }
          // Cloudinary's fetch-via-URL upload — no need to stream bytes through
          // us. Sign per their docs.
          const timestamp = Math.floor(Date.now() / 1000)
          const publicId = String(input?.publicId || `agent-${timestamp}`)
          const folder = `webstew/${vfs.cms.userId}`
          const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`
          const crypto = await import('crypto')
          const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')
          const form = new URLSearchParams()
          form.set('file', sourceUrl)
          form.set('api_key', key)
          form.set('timestamp', String(timestamp))
          form.set('signature', signature)
          form.set('public_id', publicId)
          form.set('folder', folder)
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
            method: 'POST',
            body: form,
          })
          const data = await res.json()
          if (!res.ok || !data.secure_url) {
            return { ok: false, content: `Cloudinary upload failed: ${data.error?.message || JSON.stringify(data).slice(0, 200)}` }
          }
          return { ok: true, content: JSON.stringify({ url: data.secure_url, publicId: data.public_id }) }
        } catch (e: any) {
          return { ok: false, content: `upload_image error: ${e?.message || e}` }
        }
      }
      case 'generate_logo': {
        const prompt = String(input?.prompt || '').trim()
        if (!prompt) return { ok: false, content: 'prompt required' }
        const replicateToken = process.env.REPLICATE_API_TOKEN
        if (!replicateToken) {
          return { ok: false, content: 'Image generation unavailable (REPLICATE_API_TOKEN not set). Ask the user to add it, or use an /api/media image instead.' }
        }
        const shape = String(input?.shape || 'square')
        const aspect_ratio = shape === 'wide' ? '16:9' : shape === 'tall' ? '9:16' : '1:1'
        try {
          // Generate with Flux Schnell (fast, high quality) via Replicate.
          const create = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${replicateToken}`, 'Content-Type': 'application/json', Prefer: 'wait' },
            body: JSON.stringify({ input: { prompt, aspect_ratio, output_format: 'png', num_outputs: 1 } }),
          })
          let pred = await create.json()
          if (!create.ok) return { ok: false, content: `Image generation failed: ${pred?.detail || JSON.stringify(pred).slice(0, 200)}` }
          // Poll if not already complete (Prefer: wait usually resolves inline).
          let tries = 0
          while (pred?.status && pred.status !== 'succeeded' && pred.status !== 'failed' && tries < 20) {
            await new Promise(r => setTimeout(r, 1500))
            const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${replicateToken}` } })
            pred = await poll.json()
            tries++
          }
          if (pred?.status !== 'succeeded') return { ok: false, content: `Image generation did not complete (status=${pred?.status || 'unknown'}).` }
          const genUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output
          if (!genUrl) return { ok: false, content: 'Image generation returned no output.' }

          // Persist to Cloudinary so the URL is durable (Replicate URLs expire).
          const cloud = process.env.CLOUDINARY_CLOUD_NAME
          const key = process.env.CLOUDINARY_API_KEY
          const secret = process.env.CLOUDINARY_API_SECRET
          if (cloud && key && secret && vfs.cms?.userId) {
            try {
              const timestamp = Math.floor(Date.now() / 1000)
              const publicId = `logo-${timestamp}`
              const folder = `webstew/${vfs.cms.userId}`
              const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`
              const crypto = await import('crypto')
              const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')
              const form = new URLSearchParams()
              form.set('file', genUrl); form.set('api_key', key); form.set('timestamp', String(timestamp))
              form.set('signature', signature); form.set('public_id', publicId); form.set('folder', folder)
              const up = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form })
              const data = await up.json()
              if (up.ok && data.secure_url) {
                return { ok: true, content: JSON.stringify({ url: data.secure_url, publicId: data.public_id }) }
              }
            } catch { /* fall through to the raw Replicate URL */ }
          }
          // No Cloudinary — return the Replicate URL (works now; may expire later).
          return { ok: true, content: JSON.stringify({ url: genUrl, publicId: null, note: 'Cloudinary not configured — URL may expire; consider upload_image to persist.' }) }
        } catch (e: any) {
          return { ok: false, content: `generate_logo error: ${e?.message || e}` }
        }
      }
      case 'list_integrations': {
        if (!vfs.cms?.userId) return { ok: false, content: 'Integrations require a user context' }
        try {
          const conns = await listUserConnections(vfs.cms.userId)
          const byToolkit = new Map(conns.map((c) => [c.toolkitSlug, c]))
          const out = SUPPORTED_TOOLKITS.map((t) => ({
            toolkit: t.slug,
            label: t.label,
            connected: byToolkit.get(t.slug)?.status === 'ACTIVE',
          }))
          return { ok: true, content: JSON.stringify(out) }
        } catch (e: any) {
          return { ok: false, content: `list_integrations error: ${e?.message || e}` }
        }
      }
      case 'list_integration_actions': {
        const toolkit = String(input?.toolkit || '').trim().toLowerCase()
        if (!toolkit) return { ok: false, content: 'toolkit is required' }
        try {
          const actions = await listToolkitActions(toolkit)
          // Return a compact list — slug + 1-line description. The full set
          // can be 50+ per toolkit; cap to 30 to keep tool_result small.
          const trimmed = actions.slice(0, 30).map((a) => ({
            slug: a.slug,
            description: a.description?.slice(0, 140),
          }))
          return { ok: true, content: JSON.stringify({ toolkit, actions: trimmed, total: actions.length }) }
        } catch (e: any) {
          return { ok: false, content: `list_integration_actions error: ${e?.message || e}` }
        }
      }
      case 'run_integration_action': {
        if (!vfs.cms?.userId) return { ok: false, content: 'run_integration_action requires a user context' }
        const action = String(input?.action || '').trim()
        if (!action) return { ok: false, content: 'action is required' }
        const args = (input && typeof input.args === 'object' && input.args) || {}
        try {
          const result = await executeAction({ userId: vfs.cms.userId, actionSlug: action, args })
          if (!result.successful) {
            return { ok: false, content: `Action failed: ${result.error || 'unknown error'}` }
          }
          // Trim the response — Composio sometimes returns huge payloads
          // (Gmail thread bodies, Drive file lists). Cap to 4KB so the
          // tool_result doesn't blow the context window.
          const serialized = JSON.stringify(result.data ?? null)
          return { ok: true, content: serialized.length > 4000 ? serialized.slice(0, 4000) + '…' : serialized }
        } catch (e: any) {
          return { ok: false, content: `run_integration_action error: ${e?.message || e}` }
        }
      }
      case 'delete_cms_item': {
        if (!vfs.cms) return { ok: false, content: 'CMS not available in this session' }
        const collection = String(input?.collection || '').trim()
        const slug = String(input?.slug || '').trim()
        if (!isSafeSlug(collection) || !isSafeSlug(slug)) return { ok: false, content: 'Invalid collection or item slug' }
        const loaded = await loadProjectCms(vfs.cms.projectId, vfs.cms.userId)
        if (!loaded.ok) return { ok: false, content: `CMS load failed: ${loaded.error}` }
        if (!loaded.cms.items[collection]?.[slug]) return { ok: false, content: `Item "${collection}/${slug}" not found` }
        await deleteItem(vfs.cms.projectId, collection, slug)
        return { ok: true, content: `Deleted "${collection}/${slug}"` }
      }
      case 'grade_site': {
        // Two modes:
        //   - { url } → fetch + grade the deployed site
        //   - no input → grade the index.html in the VFS (pre-deploy draft)
        const urlInput = typeof input?.url === 'string' ? input.url.trim() : ''
        try {
          let result
          if (urlInput) {
            if (!/^https?:\/\//i.test(urlInput)) return { ok: false, content: 'url must start with http(s)://' }
            result = await gradeWebsite(urlInput)
          } else {
            const html = vfs.files['index.html']
            if (!html) return { ok: false, content: 'No index.html in this project to grade. Provide a url to grade a deployed site instead.' }
            result = await gradeHtml(html, 'https://draft.local')
          }
          // Trim down to the actionable parts so we don't blow tokens on
          // the full per-bucket numerics.
          const summary = {
            overall: result.scores.overall,
            grade: result.scores.overall_grade,
            ai_visibility: result.scores.ai_visibility,
            seo: result.scores.seo,
            technical: result.scores.technical,
            presence: result.scores.presence,
            issues: result.issues,
            recommendations: result.recommendations,
          }
          return { ok: true, content: JSON.stringify(summary, null, 2) }
        } catch (e: any) {
          return { ok: false, content: `grade_site failed: ${e?.message || String(e)}` }
        }
      }
      case 'done': {
        // Caller handles the loop-exit signal — this just returns the summary.
        return { ok: true, content: String(input?.summary || 'Done.') }
      }
      default:
        return { ok: false, content: `Unknown tool: ${name}` }
    }
  } catch (e: any) {
    return { ok: false, content: `Tool error: ${e?.message || String(e)}` }
  }
}
