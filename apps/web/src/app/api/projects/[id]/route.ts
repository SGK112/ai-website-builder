import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { getClient } from '@/lib/mongodb'
import { Project, IProject } from '@ai-website-builder/database'
import mongoose from 'mongoose'
import { resolveProjectAccess, canEdit } from '@/lib/project-access'

// Lean project document type
interface LeanProject {
  _id: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  name: string
  description?: string
  type: string
  status: string
  isPublic?: boolean
  [key: string]: unknown
}

// GET /api/projects/[id] - Get a specific project with pages
// Access control: Owner can access any of their projects, others can only access public projects
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const mongooseConn = await connectDB()
    const accessDb = mongooseConn.connection.db
    if (!accessDb) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

    // Access control: owner, collaborator (editor/viewer), or public.
    const { project, role } = await resolveProjectAccess(
      accessDb, params.id, session?.user?.id, session?.user?.email,
    )
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (!role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch pages for this project
    const client = await getClient()
    const db = client.db()
    const pages = await db
      .collection('pages')
      .find({ projectId: params.id })
      .sort({ isHome: -1, createdAt: 1 })
      .toArray()

    const formattedPages = pages.map(page => ({
      id: page._id?.toString(),
      name: page.name,
      slug: page.slug,
      isHome: page.isHome,
      html: page.html,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }))

    // Only the OWNER gets the full document. Editors/viewers (and anyone on a
    // published/public project — the ObjectId is exposed in site markup and
    // form payloads) must not receive the owner's contact email, the deploy
    // infra IDs (the leaked renderServiceId is exactly what the deploy/status
    // IDOR guard protects), stored credential refs, or the other collaborators'
    // emails. Strip those for every non-owner role.
    let safeProject: any = project
    if (role !== 'owner') {
      const { notificationEmail, credentialIds, deployment, collaborators, serviceCredentials, ...rest } = project as any
      safeProject = rest
    }

    return NextResponse.json({
      project: {
        ...safeProject,
        pages: formattedPages,
      },
      role,
    })
  } catch (error) {
    console.error('GET project error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await req.json()
    const { name, description, files, status } = body

    await connectDB()

    // Use $set with the raw driver — never load + .save() the full doc.
    // Reason: the mongoose Project model has been edited at runtime to add new
    // fields (e.g. `cms`). The registered model cache may not know about them,
    // and `doc.save()` writes the WHOLE in-memory doc, stripping anything
    // mongoose doesn't recognise. $set only writes the keys we name, leaving
    // the rest of the document (cms, deployment metadata, etc.) untouched.
    const updates: Record<string, any> = { updatedAt: new Date() }
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (files) updates.files = files
    if (status) updates.status = status

    const mongooseConn = await connectDB()
    const db = mongooseConn.connection.db
    if (!db) {
      return NextResponse.json({ error: 'DB not connected' }, { status: 500 })
    }
    const { ObjectId } = await import('mongodb')

    // Owner OR editor collaborator may write; viewers are read-only.
    const { project: target, role } = await resolveProjectAccess(db, params.id, session.user.id, session.user.email)
    if (!target) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!canEdit(role)) {
      return NextResponse.json({ error: role === 'viewer' ? 'You have view-only access to this project.' : 'Access denied' }, { status: 403 })
    }

    const result = await db.collection('projects').findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: updates },
      { returnDocument: 'after' }
    )
    const project = (result as any)?.value || result
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('PATCH project error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // SECURITY: Require authentication to delete projects
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    await connectDB()

    // Find-first pattern so we can distinguish "doesn't exist" (404) from
    // "exists but not yours" (403). Previously this used a single deleteOne
    // with a combined filter and returned an ambiguous "not found or access
    // denied" 404 — which made anon-orphaned projects (POST /api/projects
    // assigns a random ObjectId when there's no session) indistinguishable
    // from missing IDs.
    //
    // Drop into the raw driver with explicit ObjectId casts (matches the
    // PATCH route). Mongoose's implicit cast can mismatch when older docs
    // stored userId as a string.
    const mongooseConn = await connectDB()
    const db = mongooseConn.connection.db
    if (!db) {
      return NextResponse.json({ error: 'DB not connected' }, { status: 500 })
    }
    const { ObjectId } = await import('mongodb')

    const projectOid = new ObjectId(params.id)
    const existing = await db.collection('projects').findOne(
      { _id: projectOid },
      { projection: { userId: 1 } }
    )

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Owner check: compare as strings so both ObjectId-stored and
    // legacy-string-stored userIds work.
    const ownerId = existing.userId?.toString?.() || String(existing.userId || '')
    if (ownerId !== session.user.id) {
      console.warn('DELETE project: owner mismatch', {
        projectId: params.id,
        projectOwner: ownerId,
        requester: session.user.id,
      })
      return NextResponse.json(
        { error: 'You do not own this project' },
        { status: 403 }
      )
    }

    const result = await db.collection('projects').deleteOne({ _id: projectOid })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
