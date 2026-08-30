// POST /api/github/webhook — receives GitHub push events and pulls the changed
// repo back into the linked project. This is the automatic half of two-way
// sync: edit on github.com (or push from your machine) → it lands in Webstew.
//
// Security: every link has its own HMAC secret; we verify x-hub-signature-256
// against the secret of the link the payload maps to. Unsigned/bad-sig → 401.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getLinkByRepo, verifyWebhookSignature } from '@/lib/github-links'
import { resolveGithubToken } from '@/lib/github-token'
import { pullRepoIntoProject } from '@/lib/github-sync'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const event = req.headers.get('x-github-event') || ''
  const signature = req.headers.get('x-hub-signature-256')
  // Read the raw body for signature verification — must be the exact bytes.
  const raw = await req.text()

  // ping → GitHub's test event when a hook is created. Ack it.
  if (event === 'ping') return NextResponse.json({ ok: true, pong: true })
  if (event !== 'push') return NextResponse.json({ ok: true, ignored: event })

  let payload: any
  try { payload = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }) }

  const fullName: string = payload?.repository?.full_name || ''
  const [owner, repo] = fullName.split('/')
  if (!owner || !repo) return NextResponse.json({ error: 'No repository in payload' }, { status: 400 })

  const link = await getLinkByRepo(owner, repo)
  if (!link) return NextResponse.json({ error: 'No linked project for this repo' }, { status: 404 })

  if (!verifyWebhookSignature(raw, signature, link.secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Only react to pushes on the linked branch.
  const ref: string = payload?.ref || ''
  const branch = ref.replace('refs/heads/', '')
  if (link.branch && branch && branch !== link.branch) {
    return NextResponse.json({ ok: true, ignored: `branch ${branch}` })
  }

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

  const token = await resolveGithubToken(link.userId)
  try {
    const result = await pullRepoIntoProject(db, { projectId: link.projectId, owner, repo, branch: link.branch || branch, token })
    return NextResponse.json({ ok: true, synced: result.count })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 502 })
  }
}
