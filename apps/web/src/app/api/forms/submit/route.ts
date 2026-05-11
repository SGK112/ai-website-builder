import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'
import { verifyRecaptcha } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

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
const MAX_IPS = 10000 // max tracked IPs before cleanup
let lastCleanup = Date.now()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = submissions.get(ip) || []
  const recent = timestamps.filter(t => now - t < RATE_WINDOW)

  // Periodic cleanup to prevent memory leak
  if (submissions.size > MAX_IPS || now - lastCleanup > RATE_WINDOW * 5) {
    for (const [key, values] of submissions.entries()) {
      const valid = values.filter(t => now - t < RATE_WINDOW)
      if (valid.length === 0) {
        submissions.delete(key)
      } else {
        submissions.set(key, valid)
      }
    }
    lastCleanup = now
  }

  if (recent.length >= RATE_LIMIT) {
    return true
  }

  recent.push(now)
  submissions.set(ip, recent)
  return false
}

// Accept both JSON and form-encoded bodies — generated sites sometimes POST
// FormData, sometimes JSON; we'd rather take both than 400.
async function parseBody(req: NextRequest): Promise<{ projectId?: string; formId?: string; data?: Record<string, any>; page?: string; recaptchaToken?: string }> {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try { return await req.json() } catch { return {} }
  }
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData()
      const data: Record<string, any> = {}
      let projectId: string | undefined
      let formId: string | undefined
      let page: string | undefined
      let recaptchaToken: string | undefined
      for (const [key, value] of form.entries()) {
        const v = typeof value === 'string' ? value : value.name
        if (key === 'projectId') projectId = v
        else if (key === 'formId') formId = v
        else if (key === 'page') page = v
        else if (key === 'recaptchaToken' || key === 'g-recaptcha-response') recaptchaToken = v
        else data[key] = v
      }
      return { projectId, formId, data, page, recaptchaToken }
    } catch { return {} }
  }
  try { return await req.json() } catch { return {} }
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

    const body = await parseBody(req)
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

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
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

    // Reject obvious bot honeypot trips (forms can include a hidden field
    // named "website" or "url" that humans never fill — block submissions
    // where it's populated).
    if (data.website || data.url_honeypot) {
      // Pretend success so bots don't retry — but don't save.
      return NextResponse.json({ success: true, message: 'Submitted' })
    }

    // Sanitize data (basic XSS prevention)
    const sanitizedData = sanitizeObject(data)

    await connectDB()

    // Resolve projectId: must be a valid ObjectId to be stored. If the form
    // came from a preview iframe that doesn't yet have one, save under a
    // sentinel "preview" project so submissions aren't lost — owner can pick
    // them up after they save the project.
    let projectObjectId: mongoose.Types.ObjectId
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      projectObjectId = new mongoose.Types.ObjectId(projectId)
    } else {
      // Deterministic sentinel id for orphan/preview submissions
      projectObjectId = new mongoose.Types.ObjectId('000000000000000000000000')
    }

    // Create submission
    const submission = await FormSubmission.create({
      projectId: projectObjectId,
      formId,
      data: sanitizedData,
      metadata: {
        ip,
        userAgent: (req.headers.get('user-agent') || '').slice(0, 500) || undefined,
        referrer: (req.headers.get('referer') || '').slice(0, 500) || undefined,
        page: typeof body.page === 'string' ? body.page.slice(0, 500) : undefined,
      },
    })

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

    // Authentication check - require login to view submissions
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const query: Record<string, string> = { projectId }
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
