// Pure helpers for serializing a workspace project into the `files[]` array the
// /api/projects API stores, and for reading the sidecars back. Extracted from
// page.tsx (which had this logic inline + duplicated across three save paths)
// so the persistence shape lives in one tested place.

export const CHAT_SIDECAR = '_webstew_chat.json'
export const PAGES_SIDECAR = '_webstew_pages.json'
export const META_SIDECAR = '_webstew_meta.json'

export interface FileEntry { path: string; content: string; type: string }

interface ChatMsg { role: string; content: unknown; suggestions?: string[] }
interface PageLike { id: string; name: string; slug: string; html: string; isHome: boolean }

// Serialize the conversation as a sidecar. Capped to the last 60 turns and
// truncated per-message to stay well under Mongo's 16MB doc limit. Returns null
// when there's nothing worth saving (just the seeded welcome message).
export function chatSidecarFile(messages: ChatMsg[]): FileEntry | null {
  if (!messages || messages.length <= 1) return null
  return {
    path: CHAT_SIDECAR,
    content: JSON.stringify({
      messages: messages.slice(-60).map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content.slice(0, 8000) : '',
        ...(m.suggestions ? { suggestions: m.suggestions } : {}),
      })),
    }),
    type: 'json',
  }
}

// Parse a `_webstew_chat.json` sidecar back into a messages array, or null if
// it's missing/corrupt. The null fallback is the documented contract — callers
// reset to a fresh welcome — so a bad sidecar degrades instead of throwing.
export function parseChatSidecar(content: string): ChatMsg[] | null {
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed?.messages) ? parsed.messages : null
  } catch {
    return null
  }
}

// Build the canonical full `files[]` payload for a project: multi-target VFS +
// meta, OR a multi-page HTML site (index + pages sidecar), OR a single page —
// plus the chat sidecar. One definition for every save path.
export function buildProjectFiles(opts: {
  html: string
  vfsFiles: Record<string, string>
  pages: PageLike[]
  activePageId: string
  buildTarget: string
  chatMessages: ChatMsg[]
}): FileEntry[] {
  const { html, vfsFiles, pages, buildTarget, chatMessages } = opts
  const isMulti = buildTarget !== 'website' && Object.keys(vfsFiles).length > 0

  const files: FileEntry[] = isMulti
    ? [
        ...Object.entries(vfsFiles).map(([path, content]) => ({ path, content, type: 'other' })),
        { path: META_SIDECAR, content: JSON.stringify({ buildTarget }), type: 'json' },
      ]
    : pages.length > 1
      ? [
          { path: 'index.html', content: html, type: 'html' },
          {
            path: PAGES_SIDECAR,
            content: JSON.stringify({
              activePageId: opts.activePageId,
              pages: pages.map(p => ({ id: p.id, name: p.name, slug: p.slug, html: p.html, isHome: p.isHome })),
            }),
            type: 'json',
          },
        ]
      : [{ path: 'index.html', content: html, type: 'html' }]

  const chat = chatSidecarFile(chatMessages)
  if (chat) files.push(chat)
  return files
}
