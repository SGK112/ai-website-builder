// POST /api/github/connect { projectId, repoUrl?, branch? } — link a GitHub
// repo to a project for two-way sync, and (best-effort) register a push webhook
// so edits made on GitHub flow back automatically.
//
// Mock-safe: if no GitHub token is available, or the app can't determine a
// public callback URL, the link + secret are still stored and returned so the
// user can add the webhook manually (Settings → Webhooks).
//
//   GET  ?projectId=  → current link + webhook URL (no secret)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { resolveProjectAccess } from '@/lib/project-access'
import { resolveGithubToken } from '@/lib/github-token'
import { parseOwnerRepo, getDefaultBranch } from '@/lib/github-sync'
import { getLink, upsertLink, genWebhookSecret } from '@/lib/github-links'

export const dynamic = 'force-dynamic'

function callbackUrl(req: NextRequest): string | null {
  const envBase = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL
  const base = envBase || req.nextUrl.origin
  if (!base || /localhost|127\.0\.0\.1/.test(base)) return null // GitHub can't reach localhost
  return `${base.replace(/\/$/, '')}/api/github/webhook`
}

// `owner` gates CHANGING the link (it registers a webhook on someone's repo);
// reading it only needs project access — an editor has to see which repo they
// are pushing to, and returning nothing left the panel stuck on "connect a
// repo" for every collaborator. No secret is exposed either way.
async function projectGate(req: NextRequest, projectId: string, requireOwner: boolean) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { err: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return { err: NextResponse.json({ error: 'DB not connected' }, { status: 500 }) }
  const { project, role } = await resolveProjectAccess(db, projectId, session.user.id, session.user.email)
  if (!project) return { err: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  if (requireOwner && role !== 'owner') {
    return { err: NextResponse.json({ error: 'Only the owner can connect a repo.' }, { status: 403 }) }
  }
  return { session, db, project }
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || ''
  const g = await projectGate(req, projectId, false)
  if ('err' in g) return g.err
  const link = await getLink(projectId)
  return NextResponse.json({
    link: link ? { owner: link.owner, repo: link.repo, branch: link.branch, webhookId: link.webhookId ?? null } : null,
    webhookUrl: callbackUrl(req),
  })
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const projectId = String(body?.projectId || '')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const g = await projectGate(req, projectId, true)
  if ('err' in g) return g.err
  const { session, project } = g

  const repoUrl = String(body?.repoUrl || project?.deployment?.repoUrl || project?.repositoryUrl || '')
  const parsed = parseOwnerRepo(repoUrl)
  if (!parsed) return NextResponse.json({ error: 'Provide a GitHub repo URL (or deploy to GitHub first).' }, { status: 400 })
  const existing = await getLink(projectId)
  const secret = existing?.secret || genWebhookSecret()
  const token = await resolveGithubToken(session.user.id, (session.user as any).githubAccessToken)
  // Hardcoding 'main' silently linked the wrong branch on any repo that still
  // uses master (or a default like `develop`) — pushes then went nowhere the
  // user was looking. Ask GitHub what the default actually is.
  const branch = String(
    body?.branch || existing?.branch || (await getDefaultBranch(parsed.owner, parsed.repo, token)),
  )
  const hookUrl = callbackUrl(req)

  let webhookId: number | null = existing?.webhookId ?? null
  let webhookStatus: 'created' | 'exists' | 'manual' | 'failed' = 'manual'

  // Best-effort webhook registration. Needs a token AND a public callback URL.
  if (token && hookUrl && !webhookId) {
    try {
      const r = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/hooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'webstew-sync',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          name: 'web', active: true, events: ['push'],
          config: { url: hookUrl, content_type: 'json', secret, insecure_ssl: '0' },
        }),
      })
      if (r.ok) { const d = await r.json(); webhookId = d.id; webhookStatus = 'created' }
      else if (r.status === 422) { webhookStatus = 'exists' } // hook already present
      else { webhookStatus = 'failed' }
    } catch { webhookStatus = 'failed' }
  }

  await upsertLink({ projectId, userId: session.user.id, owner: parsed.owner, repo: parsed.repo, branch, secret, webhookId })

  return NextResponse.json({
    ok: true,
    repo: `${parsed.owner}/${parsed.repo}`,
    branch,
    webhookStatus,
    // For manual setup when we couldn't auto-register (no public URL / no token).
    manual: webhookStatus !== 'created' && webhookStatus !== 'exists'
      ? { url: hookUrl || '<your deployed URL>/api/github/webhook', secret, contentType: 'application/json', events: ['push'] }
      : undefined,
  })
}
