import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - List all submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    if (!ObjectId.isValid(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('form_submissions')

    const submissions = await collection
      .find({ formId })
      .sort({ submittedAt: -1 })
      .toArray()

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json({ error: 'Failed to get submissions' }, { status: 500 })
  }
}

// POST - Submit a form (public endpoint for websites)
export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params
    const data = await request.json()

    if (!ObjectId.isValid(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')

    // Verify form exists
    const formsCollection = db.collection('forms')
    const form = await formsCollection.findOne({ _id: new ObjectId(formId) })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Save submission
    const submissionsCollection = db.collection('form_submissions')
    const submission = {
      formId,
      formName: form.name,
      data,
      submittedAt: new Date(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }

    await submissionsCollection.insertOne(submission)

    // Increment submission count
    await formsCollection.updateOne(
      { _id: new ObjectId(formId) },
      {
        $inc: { submissionCount: 1 },
        $set: { updatedAt: new Date() },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
  }
}
