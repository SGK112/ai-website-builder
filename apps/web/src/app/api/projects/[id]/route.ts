import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { getClient } from '@/lib/mongodb'
import { Project, IProject } from '@ai-website-builder/database'
import mongoose from 'mongoose'

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
    await connectDB()

    const project = await Project.findById(params.id).lean() as LeanProject | null

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Access control: Allow if user owns the project OR project is public
    // userId is stored as ObjectId, session.user.id is the string representation
    const projectUserId = project.userId?.toString?.() || String(project.userId || '')
    const isOwner = session?.user?.id && projectUserId === session.user.id
    const isPublic = project.isPublic === true || project.status === 'published'

    if (!isOwner && !isPublic) {
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

    return NextResponse.json({
      project: {
        ...project,
        pages: formattedPages,
      }
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

    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update allowed fields
    if (name) project.name = name
    if (description !== undefined) project.description = description
    if (files) project.files = files
    if (status) project.status = status

    await project.save()

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

    // Only allow users to delete their own projects
    const query = { _id: params.id, userId: session.user.id }

    const result = await Project.deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
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
