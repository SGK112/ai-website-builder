// Two-way GitHub sync — the "pull" half (GitHub → Webstew project).
//
// /api/deploy already pushes a project to a new repo (one-way). This pulls
// changes BACK: fetch the repo's text files via the Git Data API and replace
// the project's file set. Shared by the manual "Pull from GitHub" button and
// the push-webhook so both behave identically.

import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'

const GH = 'https://api.github.com'

// Text-ish extensions we sync. Binaries (images, fonts) are skipped — they
// don't belong in the editor VFS and would bloat the project doc.
const TEXT_EXT = new Set([
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'js', 'mjs', 'cjs', 'jsx',
  'ts', 'tsx', 'json', 'md', 'mdx', 'txt', 'svg', 'xml', 'yml', 'yaml',
  'vue', 'astro', 'env', 'toml', 'csv', 'graphql', 'gql',
])
const SKIP_DIRS = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', '.astro/']
const MAX_FILES = 300
const MAX_FILE_BYTES = 512 * 1024

export function parseOwnerRepo(input: string): { owner: string; repo: string } | null {
  if (!input) return null
  // Accept full URLs or "owner/repo".
  const m = input.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?\/?$/i) || input.match(/^([^/\s]+)\/([^/\s]+?)(?:\.git)?$/)
  if (!m) return null
  return { owner: m[1], repo: m[2] }
}

function ghHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'webstew-sync',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function extOf(path: string): string {
  const base = path.split('/').pop() || ''
  return base.includes('.') ? base.split('.').pop()!.toLowerCase() : ''
}

async function defaultBranch(owner: string, repo: string, token?: string | null): Promise<string> {
  try {
    const r = await fetch(`${GH}/repos/${owner}/${repo}`, { headers: ghHeaders(token) })
    if (r.ok) { const d = await r.json(); return d.default_branch || 'main' }
  } catch { /* fall through */ }
  return 'main'
}

export interface PulledFile { path: string; content: string }

// Fetch all text files from a repo branch via the Git trees + blobs API.
export async function fetchRepoFiles(opts: {
  owner: string; repo: string; branch?: string; token?: string | null
}): Promise<{ files: PulledFile[]; branch: string; skipped: number }> {
  const { owner, repo, token } = opts
  const branch = opts.branch || (await defaultBranch(owner, repo, token))

  const treeRes = await fetch(`${GH}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { headers: ghHeaders(token) })
  if (!treeRes.ok) {
    const body = await treeRes.text().catch(() => '')
    throw new Error(`GitHub tree fetch failed (${treeRes.status}): ${body.slice(0, 160)}`)
  }
  const tree = await treeRes.json()
  const blobs: Array<{ path: string; sha: string }> = (tree.tree || []).filter((t: any) =>
    t.type === 'blob' &&
    (t.size ?? 0) <= MAX_FILE_BYTES &&
    TEXT_EXT.has(extOf(t.path)) &&
    !SKIP_DIRS.some((d) => t.path.startsWith(d) || t.path.includes(`/${d}`)),
  )
  let skipped = ((tree.tree || []).length) - blobs.length
  const capped = blobs.slice(0, MAX_FILES)
  if (blobs.length > MAX_FILES) skipped += blobs.length - MAX_FILES

  const files: PulledFile[] = []
  // Fetch blobs with limited concurrency.
  const queue = [...capped]
  async function worker() {
    while (queue.length) {
      const b = queue.shift()!
      try {
        const r = await fetch(`${GH}/repos/${owner}/${repo}/git/blobs/${b.sha}`, { headers: ghHeaders(token) })
        if (!r.ok) continue
        const d = await r.json()
        const content = d.encoding === 'base64' ? Buffer.from(d.content || '', 'base64').toString('utf8') : String(d.content || '')
        files.push({ path: b.path, content })
      } catch { /* skip unreadable blob */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, capped.length) }, worker))
  return { files, branch, skipped }
}

function languageOf(path: string): string {
  const e = extOf(path)
  if (e === 'ts' || e === 'tsx') return 'typescript'
  if (e === 'js' || e === 'mjs' || e === 'cjs' || e === 'jsx') return 'javascript'
  if (e === 'json') return 'json'
  if (e === 'css' || e === 'scss' || e === 'sass') return 'css'
  if (e === 'md' || e === 'mdx') return 'markdown'
  if (e === 'html' || e === 'htm') return 'html'
  return 'plaintext'
}

// Pull a repo into a project: replace its file set with the repo's text files.
// Writes the `files` array shape loadProject reads, and mirrors index.html into
// the `html` field so the website preview restores.
export async function pullRepoIntoProject(
  db: Db,
  opts: { projectId: string; owner: string; repo: string; branch?: string; token?: string | null },
): Promise<{ count: number; branch: string; skipped: number; hasIndex: boolean }> {
  const { files, branch, skipped } = await fetchRepoFiles(opts)
  const now = new Date()
  const fileDocs = files.map((f) => ({
    path: f.path, content: f.content, language: languageOf(f.path),
    generatedBy: 'github' as const, lastModified: now,
  }))
  const index = files.find((f) => f.path === 'index.html')
  const set: any = { files: fileDocs, updatedAt: now, 'githubSync.lastPulledAt': now, 'githubSync.branch': branch }
  if (index) set.html = index.content
  await db.collection('projects').updateOne({ _id: new ObjectId(opts.projectId) }, { $set: set })
  return { count: files.length, branch, skipped, hasIndex: !!index }
}
