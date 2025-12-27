import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'
import { verifyRecaptcha } from '@/lib/recaptcha'

// Import or define the FormSubmission model inline
const formSubmissionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  formId: { type: String, required: true, default: 'contact' },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: {
    ip: String,
    userAgent: String,
    referrer: String,
    page: String,
  },
  status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new' },
}, { timestamps: true })

const FormSubmission = mongoose.models.FormSubmission || mongoose.model('FormSubmission', formSubmissionSchema)

// Rate limiting: simple in-memory store (use Redis in production)
const submissions = new Map<string, number[]>()
const RATE_LIMIT = 5 // max submissions
const RATE_WINDOW = 60 * 1000 // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = submissions.get(ip) || []
  const recent = timestamps.filter(t => now - t < RATE_WINDOW)

  if (recent.length >= RATE_LIMIT) {
    return true
  }

  recent.push(now)
  submissions.set(ip, recent)
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // Rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { projectId, formId = 'contact', data, recaptchaToken } = body

    // Verify reCAPTCHA if token provided
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken)
      if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
        return NextResponse.json(
          { error: 'Spam detection triggered. Please try again.' },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      )
    }

    // Basic validation for contact forms
    if (formId === 'contact') {
      if (!data.email || !isValidEmail(data.email)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        )
      }
    }

    // Sanitize data (basic XSS prevention)
    const sanitizedData = sanitizeObject(data)

    await connectDB()

    // Create submission
    const submission = await FormSubmission.create({
      projectId,
      formId,
      data: sanitizedData,
      metadata: {
        ip,
        userAgent: req.headers.get('user-agent') || undefined,
        referrer: req.headers.get('referer') || undefined,
        page: body.page || undefined,
      },
    })

    // Optional: Send email notification (if configured)
    // await sendNotificationEmail(projectId, submission)

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: submission._id,
    })
  } catch (error: any) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}

// Get submissions for a project (authenticated)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // TODO: Add authentication check here
    // const session = await getServerSession(authOptions)
    // if (!session) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    await connectDB()

    const query: any = { projectId }
    if (status) query.status = status

    const submissions = await FormSubmission
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ submissions })
  } catch (error: any) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Failed to get submissions' },
      { status: 500 }
    )
  }
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic HTML sanitization
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .slice(0, 10000) // Limit field length
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 100).map(v =>
        typeof v === 'string' ? v.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 1000) : v
      )
    }
    // Ignore other types (objects, functions, etc.)
  }
  return sanitized
}
