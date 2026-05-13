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
import { isSafeSlug, coerceItemFields, validateSchema, type CmsSchema, type CmsItem } from '@/lib/cms'
import { gradeHtml, gradeWebsite } from '@/lib/grader'

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
      'this is not a patch operation. Use this for both new files and edits. ' +
      'For edits, read_file first, then write_file with the full updated content.',
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
        const saved = await upsertSchema(vfs.cms.projectId, validated.schema as CmsSchema)
        return { ok: true, content: `Created collection "${saved.slug}" with ${saved.fields.length} fields` }
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
        // Enforce required fields on create only.
        for (const f of schema.fields) {
          if (f.required && (coerced.fields[f.key] === undefined || coerced.fields[f.key] === null || coerced.fields[f.key] === '')) {
            return { ok: false, content: `Required field "${f.key}" missing` }
          }
        }
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
        const saved = await upsertItem(vfs.cms.projectId, collection, next)
        return { ok: true, content: `Updated "${collection}/${saved.slug}" (status: ${saved.status})` }
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
