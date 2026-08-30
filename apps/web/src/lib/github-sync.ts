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

// ---------------------------------------------------------------------------
// Push (Webstew → GitHub) — the other half of the round trip.
//
// Until this existed the only way "out" was creating a brand-new repo, so a
// cloned repo could never receive the edits made here. This commits the
// project's real file set onto the LINKED repo's branch via the Git Data API
// (blobs → tree → commit → update-ref), which is the same thing `git push`
// does, minus a working copy.
// ---------------------------------------------------------------------------

export interface PushFile { path: string; content: string }

async function ghJson(url: string, token: string, init?: RequestInit): Promise<any> {
  const r = await fetch(url, { ...init, headers: { ...ghHeaders(token), 'Content-Type': 'application/json' } })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`GitHub ${r.status} on ${url.replace(GH, '')}: ${body.slice(0, 200)}`)
  }
  return r.json()
}

// Current head commit + tree of a branch. Returns null when the branch has no
// commits yet (a freshly created empty repo).
export async function getBranchHead(
  owner: string, repo: string, branch: string, token: string,
): Promise<{ commitSha: string; treeSha: string } | null> {
  const r = await fetch(`${GH}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, { headers: ghHeaders(token) })
  if (r.status === 404 || r.status === 409) return null // no such branch / empty repo
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`GitHub ${r.status} reading branch "${branch}": ${body.slice(0, 200)}`)
  }
  const ref = await r.json()
  const commitSha = ref?.object?.sha
  if (!commitSha) return null
  const commit = await ghJson(`${GH}/repos/${owner}/${repo}/git/commits/${commitSha}`, token)
  return { commitSha, treeSha: commit?.tree?.sha }
}

// Commit `files` onto `branch`. Blobs upload with bounded concurrency so a
// 300-file project doesn't open 300 sockets at once. `expectHeadSha` makes the
// push fail loudly instead of silently clobbering when someone else pushed
// while the user was editing.
export async function pushFilesToRepo(opts: {
  owner: string; repo: string; branch: string; token: string
  files: PushFile[]; message: string; expectHeadSha?: string | null
}): Promise<{ commitSha: string; commitUrl: string; branch: string; files: number; created: boolean }> {
  const { owner, repo, branch, token, files, message } = opts
  if (!files.length) throw new Error('Nothing to push — no files in this project.')

  const head = await getBranchHead(owner, repo, branch, token)
  if (opts.expectHeadSha && head && head.commitSha !== opts.expectHeadSha) {
    throw new Error(
      `The repo moved on since you last synced (remote is at ${head.commitSha.slice(0, 7)}). ` +
      'Pull from GitHub first, then push.',
    )
  }

  // blobs, 6 at a time
  const results: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = []
  const queue = [...files]
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift()!
      const blob = await ghJson(`${GH}/repos/${owner}/${repo}/git/blobs`, token, {
        method: 'POST',
        body: JSON.stringify({ content: Buffer.from(f.content, 'utf8').toString('base64'), encoding: 'base64' }),
      })
      if (!blob?.sha) throw new Error(`GitHub returned no blob sha for ${f.path}`)
      results.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, files.length) }, worker))

  // Tree layered on the current one: paths we didn't send stay untouched,
  // which is what a user expects from "commit my changes" (not "delete the
  // half of the repo my editor can't hold").
  const tree = await ghJson(`${GH}/repos/${owner}/${repo}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({ ...(head ? { base_tree: head.treeSha } : {}), tree: results }),
  })
  if (!tree?.sha) throw new Error('GitHub returned no tree sha')

  const commit = await ghJson(`${GH}/repos/${owner}/${repo}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: head ? [head.commitSha] : [] }),
  })
  if (!commit?.sha) throw new Error('GitHub returned no commit sha')

  // Update (or create) the branch ref.
  if (head) {
    await ghJson(`${GH}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    })
  } else {
    await ghJson(`${GH}/repos/${owner}/${repo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    })
  }

  return {
    commitSha: commit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    branch,
    files: files.length,
    created: !head,
  }
}

// ---------------------------------------------------------------------------
// Repo + branch listing — so the user picks from THEIR repos instead of
// hand-typing a URL.
// ---------------------------------------------------------------------------

export interface RepoSummary {
  fullName: string; owner: string; name: string; private: boolean
  defaultBranch: string; description: string | null; pushedAt: string | null; url: string
}

export async function listUserRepos(token: string, limit = 100): Promise<RepoSummary[]> {
  const perPage = Math.min(100, limit)
  const out: RepoSummary[] = []
  for (let page = 1; out.length < limit && page <= 3; page++) {
    const r = await fetch(
      `${GH}/user/repos?sort=pushed&per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`,
      { headers: ghHeaders(token) },
    )
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      throw new Error(`GitHub ${r.status} listing repos: ${body.slice(0, 200)}`)
    }
    const batch = await r.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    for (const repo of batch) {
      out.push({
        fullName: repo.full_name,
        owner: repo.owner?.login || '',
        name: repo.name,
        private: !!repo.private,
        defaultBranch: repo.default_branch || 'main',
        description: repo.description || null,
        pushedAt: repo.pushed_at || null,
        url: repo.html_url,
      })
    }
    if (batch.length < perPage) break
  }
  return out.slice(0, limit)
}

export async function listRepoBranches(owner: string, repo: string, token?: string | null): Promise<string[]> {
  const r = await fetch(`${GH}/repos/${owner}/${repo}/branches?per_page=100`, { headers: ghHeaders(token) })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`GitHub ${r.status} listing branches: ${body.slice(0, 200)}`)
  }
  const branches = await r.json()
  return Array.isArray(branches) ? branches.map((b: any) => String(b.name)) : []
}

export { defaultBranch as getDefaultBranch }

// ---------------------------------------------------------------------------
// Pull preview — what a pull would actually do.
//
// `pullRepoIntoProject` replaces the project's whole file set, which is right
// for a clone and wrong for "I've been editing here and a webhook fired". This
// computes the diff first so the UI can say "3 files will be overwritten, 1
// will be removed" and let the user decide.
// ---------------------------------------------------------------------------

export interface PullDiff {
  branch: string
  added: string[]
  changed: string[]
  removed: string[]   // in the project, absent from the repo — a pull DROPS these
  unchanged: number
  skipped: number
}

export async function previewPull(
  db: Db,
  opts: { projectId: string; owner: string; repo: string; branch?: string; token?: string | null },
): Promise<PullDiff> {
  const { files, branch, skipped } = await fetchRepoFiles(opts)
  const project = await db.collection('projects').findOne(
    { _id: new ObjectId(opts.projectId) },
    { projection: { files: 1, html: 1 } },
  )

  const local = new Map<string, string>()
  for (const f of (project?.files || []) as Array<{ path?: string; content?: string }>) {
    if (f?.path) local.set(f.path, String(f.content ?? ''))
  }
  // A website project keeps its home page in `html`, not always in `files`.
  if (!local.has('index.html') && typeof project?.html === 'string' && project.html) {
    local.set('index.html', project.html)
  }

  const added: string[] = []
  const changed: string[] = []
  let unchanged = 0
  const seen = new Set<string>()
  for (const f of files) {
    seen.add(f.path)
    if (!local.has(f.path)) added.push(f.path)
    else if (local.get(f.path) !== f.content) changed.push(f.path)
    else unchanged++
  }
  // Webstew's own persistence sidecars aren't repo content — a pull rewriting
  // them isn't data loss the user needs warning about.
  const removed = [...local.keys()].filter((p) => !seen.has(p) && !p.startsWith('_webstew_'))

  return { branch, added, changed, removed, unchanged, skipped }
}
