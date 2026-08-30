// POST /api/github/push { projectId, message?, files?, branch?, expectHeadSha? }
//
// Commit the project's current files onto its LINKED repo — the half of the
// round trip that didn't exist. Before this, "Push to GitHub" only ever
// created a brand-new repo containing index.html, so a cloned repo could be
// edited here forever and never receive a single change.
//
// Files come from the client (the editor state the user is looking at) when
// provided, else from the project's stored file set.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { resolveProjectAccess, canEdit } from '@/lib/project-access'
import { requireGithubToken } from '@/lib/github-token'
import { parseOwnerRepo, pushFilesToRepo, getBranchHead, type PushFile } from '@/lib/github-sync'
import { getLink, upsertLink } from '@/lib/github-links'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILES = 400
const MAX_TOTAL_BYTES = 20 * 1024 * 1024

// Same guard the repo-create path uses: a `.env` in a repo is how someone's
// keys end up on github.com. Webstew's own sidecars aren't repo content.
function sanitize(files: unknown): PushFile[] {
  if (!Array.isArray(files)) return []
  const out: PushFile[] = []
  for (const f of files) {
    const path = String((f as any)?.path || '').replace(/^\/+/, '')
    const content = (f as any)?.content
    if (!path || typeof content !== 'string') continue
    if (path.startsWith('_webstew_')) continue
    if (/(^|\/)\.env(\.|$)/i.test(path)) continue
    if (path.includes('..')) continue // no path traversal into the tree
    out.push({ path, content })
  }
  return out
}

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
  if (!canEdit(role)) return NextResponse.json({ error: 'You need edit access to push.' }, { status: 403 })

  // Where to push: the stored link, else an explicit repoUrl, else the repo a
  // previous deploy created for this project.
  const link = await getLink(projectId)
  let owner = link?.owner, repo = link?.repo
  let branch = String(body?.branch || link?.branch || '')
  if (!owner || !repo) {
    const parsed = parseOwnerRepo(String(body?.repoUrl || project?.deployment?.repoUrl || project?.repositoryUrl || ''))
    if (!parsed) {
      return NextResponse.json(
        { error: 'No linked repo. Connect one first, or create a new repo.', needsRepo: true },
        { status: 400 },
      )
    }
    owner = parsed.owner; repo = parsed.repo
  }
  if (!branch) branch = 'main'

  const gate = await requireGithubToken(session.user.id, (session.user as any).githubAccessToken)
  if ('err' in gate) return gate.err

  // Client files (what the editor shows) win; fall back to what's stored.
  let files = sanitize(body?.files)
  if (!files.length) files = sanitize(project?.files)
  if (!files.length && typeof project?.html === 'string' && project.html) {
    files = [{ path: 'index.html', content: project.html }]
  }
  if (!files.length) return NextResponse.json({ error: 'Nothing to push — this project has no files yet.' }, { status: 422 })
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Too many files to push (${files.length}, max ${MAX_FILES}).` }, { status: 413 })
  }
  const total = files.reduce((n, f) => n + Buffer.byteLength(f.content, 'utf8'), 0)
  if (total > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: 'This project is too large to push in one commit.' }, { status: 413 })
  }

  const message = String(body?.message || '').trim().slice(0, 500) ||
    `Update from Webstew — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`

  try {
    const result = await pushFilesToRepo({
      owner, repo, branch, token: gate.token, files, message,
      expectHeadSha: body?.expectHeadSha || null,
    })

    // First push to a repo that wasn't linked yet — record the link so Pull
    // and the webhook work from here on.
    if (!link) {
      await upsertLink({
        projectId, userId: session.user.id, owner, repo, branch,
        secret: (await import('@/lib/github-links')).genWebhookSecret(), webhookId: null,
      })
    }
    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { 'githubSync.lastPushedAt': new Date(), 'githubSync.lastPushSha': result.commitSha, 'githubSync.branch': branch } },
    )

    return NextResponse.json({ ok: true, repo: `${owner}/${repo}`, ...result })
  } catch (e: any) {
    const msg = String(e?.message || 'Push failed')
    // 403/404 from the Git Data API on a repo the user can see almost always
    // means the token lacks write access, not that the repo vanished.
    const isPerm = /\b(403|404)\b/.test(msg)
    return NextResponse.json(
      {
        error: isPerm
          ? `GitHub refused the push to ${owner}/${repo}. Check you have write access and that GitHub is connected with repo scope.`
          : msg,
        needsGithub: isPerm || undefined,
      },
      { status: isPerm ? 403 : 502 },
    )
  }
}

// GET /api/github/push?projectId= — remote head, so the UI can tell whether
// the repo has moved since the last sync before offering to push.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const projectId = req.nextUrl.searchParams.get('projectId') || ''
  const link = projectId ? await getLink(projectId) : null
  if (!link) return NextResponse.json({ link: null })

  const gate = await requireGithubToken(session.user.id, (session.user as any).githubAccessToken)
  if ('err' in gate) return gate.err
  try {
    const head = await getBranchHead(link.owner, link.repo, link.branch || 'main', gate.token)
    return NextResponse.json({
      link: { owner: link.owner, repo: link.repo, branch: link.branch },
      head: head?.commitSha || null,
    })
  } catch (e: any) {
    return NextResponse.json({ link: { owner: link.owner, repo: link.repo, branch: link.branch }, head: null, warning: e?.message })
  }
}
