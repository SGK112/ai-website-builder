import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - List all submissions for a form (requires auth - form owner only)
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    // SECURITY: Require authentication to view form submissions
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { formId } = params

    if (!ObjectId.isValid(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')

    // SECURITY: Verify user owns this form
    const formsCollection = db.collection('forms')
    const form = await formsCollection.findOne({ _id: new ObjectId(formId) })
    if (!form || form.userId !== session.user.id) {
      return NextResponse.json({ error: 'Form not found or access denied' }, { status: 404 })
    }

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

// Escape HTML + cap fields for the public submit path. Returns null when the
// payload isn't a usable object, so the caller can 400.
function sanitizeSubmission(raw: unknown): Record<string, any> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, any> = {}
  const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').slice(0, 10000)
  for (const [key, value] of Object.entries(raw as Record<string, any>).slice(0, 50)) {
    if (typeof value === 'string') out[key] = esc(value)
    else if (typeof value === 'number' || typeof value === 'boolean') out[key] = value
    else if (Array.isArray(value)) out[key] = value.slice(0, 100).map((v) => (typeof v === 'string' ? esc(v) : v))
    // drop nested objects/other types
  }
  return Object.keys(out).length ? out : null
}

// POST - Submit a form (public endpoint for websites)
export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params
    const raw = await request.json().catch(() => null)

    if (!ObjectId.isValid(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 })
    }
    // Public, unauthenticated write — escape HTML and cap field count/length so a
    // submission can't store XSS that fires in the owner's dashboard or bloat the
    // collection toward Mongo's 16MB limit.
    const data = sanitizeSubmission(raw)
    if (!data) {
      return NextResponse.json({ error: 'Form data is required' }, { status: 400 })
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
