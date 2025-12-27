import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - List all forms for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('forms')

    const query = projectId ? { projectId } : {}
    const forms = await collection.find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Get forms error:', error)
    return NextResponse.json({ error: 'Failed to get forms' }, { status: 500 })
  }
}

// POST - Create a new form
export async function POST(request: NextRequest) {
  try {
    const { name, projectId, fields } = await request.json()

    if (!name || !fields || fields.length === 0) {
      return NextResponse.json({ error: 'Form name and fields required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('forms')

    const form = {
      name,
      projectId: projectId || null,
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
