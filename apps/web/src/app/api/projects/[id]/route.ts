import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { getClient } from '@/lib/mongodb'
import { Project } from '@ai-website-builder/database'
import mongoose from 'mongoose'

// GET /api/projects/[id] - Get a specific project with pages
// Note: For demo purposes, allows unauthenticated access by project ID
// In production, implement proper access control (ownership, sharing tokens, etc.)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    await connectDB()

    // Allow access by ID for demo - in production, add proper access control
    const project = await Project.findById(params.id).lean()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    await connectDB()

    // If logged in, only delete user's own projects
    // In dev mode (no session), allow deleting any project by ID
    const query = session?.user?.id
      ? { _id: params.id, userId: session.user.id }
      : { _id: params.id }

    const result = await Project.deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('Project deleted:', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
