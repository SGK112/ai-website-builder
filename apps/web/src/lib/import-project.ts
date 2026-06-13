// Parse an uploaded project archive (.zip) or a set of dropped files into the
// workspace's project shape. Static HTML sites get first-class treatment: each
// .html becomes a page, and same-folder CSS/JS are inlined so the srcDoc preview
// actually renders. Framework projects (React/Next/Vue/etc.) are imported into
// the VFS so nothing is lost and the agent can work the code, even if the live
// preview is limited until they deploy.
import JSZip from 'jszip'

export interface ImportedPage {
  id: string
  name: string
  slug: string
  html: string
  isHome: boolean
}

export interface ImportedProject {
  name: string
  html: string // home page html (website target)
  pages: ImportedPage[]
  vfsFiles: Record<string, string>
  // Matches the workspace BuildTarget set. Vue/Nuxt have no dedicated target, so
  // they import into the VFS labelled 'react' (the files are preserved as-is).
  buildTarget: 'website' | 'react' | 'nextjs' | 'astro' | 'expo'
}

// Only pull in text we can actually edit/preview. Binaries (images, fonts) are
// skipped — they'd bloat the doc and can't live in our text-based VFS anyway.
const TEXT_EXT = /\.(html?|css|js|cjs|mjs|jsx|ts|tsx|json|md|markdown|txt|svg|xml|yml|yaml|vue|astro|env)$/i
const SKIP_PATH = /(^|\/)(node_modules|\.git|\.next|dist|build|\.cache|coverage)\//

const titleCase = (s: string) =>
  s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || s

// If every file sits under one top-level folder (the usual `my-site/…` zip
// layout), strip it so paths are project-relative.
function stripCommonRoot(paths: string[]): string {
  if (paths.length === 0) return ''
  const first = paths[0].split('/')[0] + '/'
  return paths.every(p => p.startsWith(first)) && paths.some(p => p.includes('/')) ? first : ''
}

// Inline same-folder <link rel=stylesheet> and <script src> so a static page
// renders in the sandboxed srcDoc preview (which can't fetch sibling files).
function inlineAssets(html: string, files: Record<string, string>, htmlPath: string): string {
  const dir = htmlPath.includes('/') ? htmlPath.slice(0, htmlPath.lastIndexOf('/') + 1) : ''
  const resolve = (ref: string): string | null => {
    const clean = ref.replace(/^\.\//, '').replace(/^\//, '').split(/[?#]/)[0]
    return files[dir + clean] ?? files[clean] ?? null
  }
  let out = html.replace(
    /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    (m, href) => { const css = /^https?:/i.test(href) ? null : resolve(href); return css != null ? `<style>\n${css}\n</style>` : m },
  )
  out = out.replace(
    /<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (m, src) => { const js = /^https?:/i.test(src) ? null : resolve(src); return js != null ? `<script>\n${js}\n</script>` : m },
  )
  return out
}

function detectTarget(files: Record<string, string>): ImportedProject['buildTarget'] {
  const pkgRaw = files['package.json']
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw)
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      if (deps['expo'] || deps['react-native']) return 'expo'
      if (deps['next']) return 'nextjs'
      if (deps['astro']) return 'astro'
      if (deps['vue'] || deps['nuxt']) return 'react' // no vue target; VFS-import
      if (deps['react']) return 'react'
    } catch { /* fall through */ }
  }
  return 'website'
}

function toProject(name: string, files: Record<string, string>): ImportedProject {
  const target = detectTarget(files)
  const htmlPaths = Object.keys(files).filter(p => /\.html?$/i.test(p) && !SKIP_PATH.test(p))

  // Framework project (or no HTML at all) → import into the VFS untouched.
  if (target !== 'website' || htmlPaths.length === 0) {
    return { name, html: '', pages: [], vfsFiles: files, buildTarget: target === 'website' ? 'react' : target }
  }

  // Static site → one page per HTML file, home = index.html (or shallowest).
  const homePath =
    htmlPaths.find(p => p === 'index.html') ||
    htmlPaths.slice().sort((a, b) => a.split('/').length - b.split('/').length)[0]

  const pages: ImportedPage[] = htmlPaths.map((p, i) => {
    const isHome = p === homePath
    const base = p.replace(/\.html?$/i, '').split('/').pop() || `page-${i}`
    const slug = isHome ? 'index' : base.toLowerCase()
    return {
      id: isHome ? 'home' : `page-${slug}-${i}`,
      name: isHome ? 'Home' : titleCase(base),
      slug,
      html: inlineAssets(files[p], files, p),
      isHome,
    }
  })

  const home = pages.find(p => p.isHome) || pages[0]
  return { name, html: home.html, pages, vfsFiles: {}, buildTarget: 'website' }
}

export async function parseProjectZip(file: File): Promise<ImportedProject> {
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter(f => !f.dir && TEXT_EXT.test(f.name) && !SKIP_PATH.test(f.name))
  if (entries.length === 0) throw new Error('No editable files found in that archive.')

  const raw: Record<string, string> = {}
  for (const entry of entries) raw[entry.name] = await entry.async('string')

  const root = stripCommonRoot(Object.keys(raw))
  const files: Record<string, string> = {}
  for (const [p, c] of Object.entries(raw)) files[root ? p.slice(root.length) : p] = c

  const baseName = file.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ').trim() || 'Imported project'
  return toProject(baseName, files)
}

// Browser File[] (folder / multi-file picker) → same shape, no unzip needed.
export async function parseProjectFiles(files: File[]): Promise<ImportedProject> {
  const map: Record<string, string> = {}
  for (const f of files) {
    const path = (f as any).webkitRelativePath || f.name
    if (!TEXT_EXT.test(path) || SKIP_PATH.test(path)) continue
    map[path] = await f.text()
  }
  if (Object.keys(map).length === 0) throw new Error('No editable files found.')
  const root = stripCommonRoot(Object.keys(map))
  const rooted: Record<string, string> = {}
  for (const [p, c] of Object.entries(map)) rooted[root ? p.slice(root.length) : p] = c
  return toProject('Imported project', rooted)
}
