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

export const dynamic = 'force-dynamic'

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
  return NextResponse.json({ ok: true, collaborator: entry, pending: !userId })
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
