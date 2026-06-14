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

// Rebuild a website's page list from individual <slug>.html files (the shape the
// AGENT writes pages in). Used by both project loaders so an agent-built
// multi-page site restores as real pages instead of being misread as a framework
// project / lost in the VFS. Returns [] when there's nothing beyond the home page
// (caller then keeps the single-page / framework handling).
export function pagesFromHtmlFiles(
  homeHtml: string,
  htmlFiles: Record<string, string>,
): PageLike[] {
  const titleCase = (s: string) =>
    s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || s
  const pages: PageLike[] = [{ id: 'home', name: 'Home', slug: 'index', html: homeHtml, isHome: true }]
  for (const [path, content] of Object.entries(htmlFiles)) {
    const slug = path.replace(/\.html?$/i, '').toLowerCase()
    if (slug === 'index' || pages.some(p => p.slug === slug)) continue
    pages.push({ id: `page-${slug}`, name: titleCase(slug), slug, html: content, isHome: false })
  }
  return pages.length > 1 ? pages : []
}

export interface ParsedProject {
  html: string                          // index.html content
  pages: PageLike[] | null              // multi-page tree (null = single-page / framework)
  activePageId: string | null
  vfsFiles: Record<string, string>      // genuine non-page files (framework projects)
  buildTarget: string | null
  chat: ChatMsg[] | null
}

// The INVERSE of buildProjectFiles: turn a stored `files[]` array back into a
// workspace project. One definition used by BOTH project loaders (the list
// loader and loadProject), so the file shape is interpreted identically and the
// agent's individual-<slug>.html pages are never misread as a framework project.
export function parseStoredProjectFiles(
  files: Array<{ path: string; content: string }>,
  fallbackHtml = '',
): ParsedProject {
  const vfsFiles: Record<string, string> = {}
  const htmlPageFiles: Record<string, string> = {}
  let buildTarget: string | null = null
  let pages: PageLike[] | null = null
  let activePageId: string | null = null
  let chat: ChatMsg[] | null = null
  let html = ''

  for (const f of files || []) {
    if (f.path === META_SIDECAR) {
      try { buildTarget = JSON.parse(f.content).buildTarget ?? null } catch { /* ignore */ }
    } else if (f.path === PAGES_SIDECAR) {
      try {
        const parsed = JSON.parse(f.content)
        if (Array.isArray(parsed?.pages)) { pages = parsed.pages; activePageId = parsed.activePageId ?? null }
      } catch { /* ignore */ }
    } else if (f.path === CHAT_SIDECAR) {
      chat = parseChatSidecar(f.content)
    } else if (f.path === 'index.html') {
      html = f.content
    } else if (/\.html?$/i.test(f.path)) {
      htmlPageFiles[f.path] = f.content
    } else {
      vfsFiles[f.path] = f.content
    }
  }

  // Reconcile individual <slug>.html files (the shape the AGENT writes pages in)
  // with the sidecar:
  //   • No sidecar → rebuild the page list from the html files.
  //   • Sidecar AND html files BOTH present → the agent edited/added pages via
  //     write_file AFTER the sidecar was saved. Overlay the (newer) html files
  //     onto the sidecar tree — index.html → home, <slug>.html → matching page
  //     (or a new page) — so the edits aren't misfiled into the VFS and lost.
  //     This was a real data-loss bug: agent edits to a saved multi-page site
  //     showed the STALE sidecar and dropped any newly-added pages.
  const titleCase = (s: string) =>
    s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || s
  const isWebsite = !buildTarget || buildTarget === 'website'
  const hasHtmlFiles = Object.keys(htmlPageFiles).length > 0
  let consumedHtmlFiles = false

  if (!pages && isWebsite && hasHtmlFiles) {
    const r = pagesFromHtmlFiles(html || fallbackHtml, htmlPageFiles)
    if (r.length > 0) { pages = r; activePageId = 'home'; consumedHtmlFiles = true }
  } else if (pages && isWebsite && hasHtmlFiles) {
    const home = pages.find(p => p.isHome)
    if (home && html) home.html = html
    const bySlug = new Map(pages.map(p => [p.slug, p]))
    for (const [path, content] of Object.entries(htmlPageFiles)) {
      const slug = path.replace(/\.html?$/i, '').toLowerCase()
      if (slug === 'index') continue
      const existing = bySlug.get(slug)
      if (existing) {
        existing.html = content
      } else {
        const np: PageLike = { id: `page-${slug}`, name: titleCase(slug), slug, html: content, isHome: false }
        pages.push(np)
        bySlug.set(slug, np)
      }
    }
    consumedHtmlFiles = true
  }
  if (!consumedHtmlFiles) Object.assign(vfsFiles, htmlPageFiles)
  if (pages && pages.length > 0) buildTarget = 'website'

  return { html, pages, activePageId, vfsFiles, buildTarget, chat }
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
