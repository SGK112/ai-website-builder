// Manage a project's collaborators (sharing + roles).
//
//   GET    /api/projects/:id/collaborators            → list (owner or member)
//   POST   /api/projects/:id/collaborators { email, role } → invite/update (owner only)
//   DELETE /api/projects/:id/collaborators?email=…     → remove (owner, or self-leave)
//
// Invite-by-email: if the email already has an account we capture its userId so
// access is immediate; otherwise it's a pending invite matched by email on
// their next session. No email is sent here — the owner shares the link.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { resolveProjectAccess } from '@/lib/project-access'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

async function getDb() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

function normEmail(raw: any): string {
  return String(raw || '').trim().toLowerCase()
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const db = await getDb()
  const { project, role } = await resolveProjectAccess(db, params.id, session.user.id, session.user.email)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!role) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  return NextResponse.json({
    ownerId: project.userId?.toString?.() || String(project.userId || ''),
    collaborators: Array.isArray(project.collaborators) ? project.collaborators : [],
    yourRole: role,
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const db = await getDb()
  const { project, role } = await resolveProjectAccess(db, params.id, session.user.id, session.user.email)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (role !== 'owner') return NextResponse.json({ error: 'Only the owner can manage sharing.' }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const email = normEmail(body?.email)
  const newRole = body?.role === 'viewer' ? 'viewer' : 'editor'
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (email === normEmail(session.user.email)) return NextResponse.json({ error: "That's you — you already own this project." }, { status: 400 })

  // Capture the invitee's account id if they already have one.
  const user = await db.collection('users').findOne({ email }, { projection: { _id: 1 } })
  const userId = user?._id ? String(user._id) : null

  const entry = { userId, email, role: newRole, addedAt: new Date() }
  // Replace any existing entry for this email, then add the fresh one.
  await db.collection('projects').updateOne(
    { _id: new ObjectId(params.id) },
    { $pull: { collaborators: { email } } as any },
  )
  await db.collection('projects').updateOne(
    { _id: new ObjectId(params.id) },
    { $push: { collaborators: entry } as any, $set: { updatedAt: new Date() } },
  )

  // Actually invite them. Without this the collaborator was stored but never
  // notified — the owner had no way to know a manual link-share was expected.
  // Best-effort: a mail failure must not undo the (successful) invite.
  let emailed = false
  try {
    // Canonical public origin — behind Cloudflare→Render, req.nextUrl.origin
    // is the internal bind (https://localhost:5001), which dead-links the
    // emailed invite. Same precedence as the integrations + notify routes.
    const origin = (
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin
    ).replace(/\/+$/, '')
    const link = `${origin}/login?callbackUrl=${encodeURIComponent('/workspace?project=' + params.id)}`
    const ownerName = session.user.name || session.user.email || 'Someone'
    const ownerEmail = session.user.email || ''
    const projectName = String((project as any).name || 'a project')
    const res = await sendMail({
      to: email,
      kind: 'noreply',
      replyTo: ownerEmail || undefined,
      subject: `${ownerName} invited you to collaborate on "${projectName}"`,
      text:
        `${ownerName} (${ownerEmail}) invited you to collaborate on "${projectName}" as a ${newRole} on Webstew.\n\n` +
        `Open the project: ${link}\n\n` +
        `Sign in — or sign up free — with THIS email address (${email}) so we can match the invite and give you access.\n\n` +
        `— Webstew`,
      html:
        `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto">` +
        `<h2 style="margin:0 0 8px">You've been invited 🤝</h2>` +
        `<p style="color:#444;margin:0 0 16px"><b>${escapeHtml(ownerName)}</b> invited you to collaborate on <b>${escapeHtml(projectName)}</b> as a <b>${newRole}</b>.</p>` +
        `<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">Open the project →</a></p>` +
        `<p style="color:#888;font-size:12px;margin:0">Sign in or sign up free with <b>${escapeHtml(email)}</b> so we can match your invite. — Webstew</p>` +
        `</div>`,
    })
    emailed = res.ok
    if (!res.ok) console.warn('[collaborators] invite email not sent:', res.reason, res.error)
  } catch (e: any) {
    console.warn('[collaborators] invite email failed:', e?.message)
  }

  return NextResponse.json({ ok: true, collaborator: entry, pending: !userId, emailed })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const db = await getDb()
  const { project, role } = await resolveProjectAccess(db, params.id, session.user.id, session.user.email)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!role) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const email = normEmail(req.nextUrl.searchParams.get('email'))
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  // Owner can remove anyone; a collaborator can remove only themselves.
  if (role !== 'owner' && email !== normEmail(session.user.email)) {
    return NextResponse.json({ error: 'You can only remove yourself.' }, { status: 403 })
  }
  await db.collection('projects').updateOne(
    { _id: new ObjectId(params.id) },
    { $pull: { collaborators: { email } } as any, $set: { updatedAt: new Date() } },
  )
  return NextResponse.json({ ok: true })
}
