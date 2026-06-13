// POST /api/projects/import-github { repoUrl, branch? }
// Fetches a GitHub repo's text files and maps them into a workspace project
// (same shape as a .zip import). Uses the caller's connected GitHub token when
// present (so private repos work); public repos work unauthenticated. Returns
// the parsed project; the client loads it as a fresh draft + autosaves it.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserCredential } from '@/lib/credentials-store'
import { parseOwnerRepo, fetchRepoFiles } from '@/lib/github-sync'
import { buildProjectFromFiles } from '@/lib/import-project'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = parseOwnerRepo(String(body?.repoUrl || '').trim())
  if (!parsed) {
    return NextResponse.json({ error: 'Enter a repo URL like github.com/owner/repo' }, { status: 400 })
  }

  const token =
    (await getUserCredential(session.user.id, 'github')) ||
    (session.user as any).githubAccessToken ||
    process.env.GITHUB_ACCESS_TOKEN ||
    null

  try {
    const { files, skipped } = await fetchRepoFiles({
      owner: parsed.owner,
      repo: parsed.repo,
      branch: body?.branch ? String(body.branch) : undefined,
      token,
    })
    if (!files.length) {
      return NextResponse.json({ error: 'No importable text files found in that repo.' }, { status: 422 })
    }
    const map: Record<string, string> = {}
    for (const f of files) map[f.path] = f.content
    const project = buildProjectFromFiles(parsed.repo.replace(/[-_]/g, ' '), map)
    return NextResponse.json({ project, skipped })
  } catch (e: any) {
    const msg = String(e?.message || 'Import failed')
    const is404 = /\b404\b/.test(msg)
    const isAuth = /\b(401|403)\b/i.test(msg) || /rate limit/i.test(msg)
    return NextResponse.json(
      {
        error: is404
          ? "Repo not found. Check the URL — private repos need GitHub connected (Plugins → GitHub)."
          : isAuth
            ? "GitHub blocked the request (private repo or rate limit). Connect GitHub under Plugins and try again."
            : msg,
      },
      { status: is404 ? 404 : isAuth ? 403 : 502 },
    )
  }
}
