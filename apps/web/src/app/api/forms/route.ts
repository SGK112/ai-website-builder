import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET - List forms owned by the authenticated user (optionally scoped to a project)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('forms')

    // Always filter by the caller's user id. Without this an authed user
    // could list every form in the DB by hitting GET with no filter.
    const query: Record<string, unknown> = { userId: session.user.id }
    if (projectId) query.projectId = projectId

    const forms = await collection.find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Get forms error:', error)
    return NextResponse.json({ error: 'Failed to get forms' }, { status: 500 })
  }
}

// POST - Create a new form owned by the authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { name, projectId, fields } = await request.json()

    if (!name || !fields || fields.length === 0) {
      return NextResponse.json({ error: 'Form name and fields required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('forms')

    // Stamp the owner id so submissions GET (which checks form.userId) actually
    // resolves to the creator. Before this, every form was created without a
    // userId and submission listing was unreachable even for the rightful owner.
    const form = {
      name,
      projectId: projectId || null,
      userId: session.user.id,
      fields,
      createdAt: new Date(),
      updatedAt: new Date(),
      submissionCount: 0,
    }

    const result = await collection.insertOne(form)

    return NextResponse.json({
      success: true,
      formId: result.insertedId.toString(),
      form: { ...form, _id: result.insertedId },
    })
  } catch (error) {
    console.error('Create form error:', error)
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
