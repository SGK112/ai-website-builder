// POST /api/github/pull { projectId, repoUrl? } — pull the linked repo's files
// back into the project (the GitHub → Webstew half of two-way sync). Owner or
// editor may pull. Resolves the repo from the stored link, an explicit
// repoUrl, or the project's deploy metadata.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { resolveProjectAccess, canEdit } from '@/lib/project-access'
import { getUserCredential } from '@/lib/credentials-store'
import { parseOwnerRepo, pullRepoIntoProject } from '@/lib/github-sync'
import { getLink } from '@/lib/github-links'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const projectId = String(body?.projectId || '')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

  const { project, role } = await resolveProjectAccess(db, projectId, session.user.id, session.user.email)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!canEdit(role)) return NextResponse.json({ error: 'You need edit access to pull.' }, { status: 403 })

  // Resolve owner/repo/branch: stored link → explicit repoUrl → deploy metadata.
  const link = await getLink(projectId)
  let owner = link?.owner, repo = link?.repo, branch = link?.branch
  if (!owner || !repo) {
    const repoUrl = String(body?.repoUrl || project?.deployment?.repoUrl || project?.repositoryUrl || '')
    const parsed = parseOwnerRepo(repoUrl)
    if (!parsed) return NextResponse.json({ error: 'No linked repo. Connect a GitHub repo first.' }, { status: 400 })
    owner = parsed.owner; repo = parsed.repo
  }

  // Token: link owner's stored credential → platform env. Public repos work
  // unauthenticated too (lower rate limit).
  const token = (await getUserCredential(session.user.id, 'github')) || process.env.GITHUB_ACCESS_TOKEN || null

  try {
    const result = await pullRepoIntoProject(db, { projectId, owner: owner!, repo: repo!, branch, token })
    return NextResponse.json({ ok: true, repo: `${owner}/${repo}`, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Pull failed' }, { status: 502 })
  }
}
