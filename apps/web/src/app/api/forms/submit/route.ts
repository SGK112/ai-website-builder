import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { sendMail } from '@/lib/mailer'

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
    // Cloudflare fronts the app and overwrites CF-Connecting-IP with the real
    // client IP, so it can't be spoofed — unlike X-Forwarded-For, whose leftmost
    // value a client can forge to rotate "IPs" and defeat the rate limit.
    const ip = req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-real-ip') ||
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
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

    // Fire-and-forget notification email to the project owner. We intentionally
    // do NOT await this — the submission is already saved, and we don't want
    // a slow SMTP host to keep the visitor's browser hanging on the form POST.
    // sendMail() handles its own errors (no throws bubble out).
    notifyOwner(submission._id.toString(), projectObjectId, formId, sanitizedData, body.page).catch((e) => {
      console.error('[forms] notification error:', e?.message || e)
    })

    // Slack fan-out via Composio (if owner has it connected). Mirror of the
    // CMS publish-hook pattern. Best-effort, no blocking, no per-form config
    // yet — every form fires to the owner's default Slack.
    ;(async () => {
      try {
        const mongoose = (await import('mongoose')).default
        const db = mongoose.connection.db
        if (!db) return
        const proj = await db.collection('projects').findOne(
          { _id: projectObjectId },
          { projection: { userId: 1, name: 1 } }
        )
        const ownerId = proj?.userId?.toString?.()
        if (!ownerId) return
        const { fireFormSubmissionHook } = await import('@/lib/form-submission-hook')
        await fireFormSubmissionHook({
          ownerId,
          projectName: typeof proj?.name === 'string' ? proj.name : 'Your site',
          formId,
          data: sanitizedData,
          submissionId: submission._id.toString(),
        })
      } catch (e: any) {
        console.warn('[forms] slack hook failed:', e?.message)
      }
    })()

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    await connectDB()

    // IDOR guard: submissions hold visitor PII (name/email/phone/message) — only
    // the project's OWNER may read them. Without this, any logged-in user could
    // pass any projectId (exposed in published-site markup) and read everyone's.
    const db = mongoose.connection.db
    const project = db && await db.collection('projects').findOne(
      { _id: new mongoose.Types.ObjectId(projectId) },
      { projection: { userId: 1 } }
    )
    if (!project || project.userId?.toString?.() !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

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

// Look up the project owner's email (and optional per-project notification
// override), then dispatch the notification through the generic mailer.
// Runs fire-and-forget from POST — any errors are logged inside sendMail().
async function notifyOwner(
  submissionId: string,
  projectObjectId: mongoose.Types.ObjectId,
  formId: string,
  data: Record<string, any>,
  pageUrl?: unknown
): Promise<void> {
  // Sentinel project (orphan / preview submissions) — nobody to notify.
  if (projectObjectId.toString() === '000000000000000000000000') return

  await connectDB()
  const db = mongoose.connection.db
  if (!db) return

  const project = await db.collection('projects').findOne(
    { _id: projectObjectId },
    { projection: { userId: 1, name: 1, notificationEmail: 1 } }
  )
  if (!project) return

  // Per-project override → fall back to the owner's account email.
  let to: string | undefined = typeof project.notificationEmail === 'string'
    ? project.notificationEmail.trim() || undefined
    : undefined

  if (!to && project.userId) {
    const owner = await db.collection('users').findOne(
      { _id: project.userId },
      { projection: { email: 1 } }
    )
    to = typeof owner?.email === 'string' ? owner.email : undefined
  }

  if (!to || !isValidEmail(to)) return

  // Visitor's email if the form included one — use it as Reply-To so the
  // owner can respond directly from their inbox without bouncing through us.
  const visitorEmail = typeof data.email === 'string' && isValidEmail(data.email)
    ? data.email
    : undefined

  const projectName: string = typeof project.name === 'string' && project.name
    ? project.name
    : 'Your site'

  const pageStr = typeof pageUrl === 'string' ? pageUrl : ''

  await sendMail({
    to,
    replyTo: visitorEmail,
    subject: `New ${formId} submission · ${projectName}`,
    text: buildTextBody({ projectName, formId, data, pageStr, submissionId }),
    html: buildHtmlBody({ projectName, formId, data, pageStr, submissionId, visitorEmail }),
  })
}

interface BodyArgs {
  projectName: string
  formId: string
  data: Record<string, any>
  pageStr: string
  submissionId: string
  visitorEmail?: string
}

function buildTextBody({ projectName, formId, data, pageStr, submissionId }: BodyArgs): string {
  const lines: string[] = [
    `New ${formId} submission on ${projectName}`,
    '',
  ]
  for (const [k, v] of Object.entries(data)) {
    if (k === 'website' || k === 'url_honeypot') continue
    const val = Array.isArray(v) ? v.join(', ') : String(v)
    lines.push(`${k}: ${val}`)
  }
  if (pageStr) {
    lines.push('', `Submitted from: ${pageStr}`)
  }
  lines.push('', `Submission ID: ${submissionId}`)
  lines.push('— Webstew')
  return lines.join('\n')
}

function buildHtmlBody({ projectName, formId, data, pageStr, submissionId, visitorEmail }: BodyArgs): string {
  // Inline-style only — most email clients (Gmail in particular) strip
  // <style> blocks. Keep it minimal: a card with the submission, the
  // visitor's email as a mailto reply CTA, and a small Webstew footer.
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const rows = Object.entries(data)
    .filter(([k]) => k !== 'website' && k !== 'url_honeypot')
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(', ') : String(v)
      return `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#71717a;vertical-align:top;white-space:nowrap;">${escape(k)}</td><td style="padding:6px 0;font-size:14px;color:#18181b;">${escape(val).replace(/\n/g, '<br>')}</td></tr>`
    })
    .join('')

  const replyCta = visitorEmail
    ? `<a href="mailto:${escape(visitorEmail)}" style="display:inline-block;background:linear-gradient(90deg,#8b5cf6,#d946ef);color:white;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;">Reply to ${escape(visitorEmail)}</a>`
    : ''

  const pageLink = pageStr
    ? `<p style="margin:18px 0 0;font-size:12px;color:#71717a;">Submitted from <a href="${escape(pageStr)}" style="color:#8b5cf6;">${escape(pageStr)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#fafafa;font-family:-apple-system,system-ui,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:white;border:1px solid #e4e4e7;border-radius:12px;padding:28px;">
    <p style="margin:0;font-size:12px;color:#a1a1aa;letter-spacing:0.05em;text-transform:uppercase;">${escape(formId)} submission</p>
    <h1 style="margin:4px 0 20px;font-size:20px;color:#18181b;">${escape(projectName)}</h1>
    <table style="border-collapse:collapse;width:100%;">${rows}</table>
    ${replyCta ? `<div style="margin-top:22px;">${replyCta}</div>` : ''}
    ${pageLink}
    <hr style="margin:24px 0 14px;border:none;border-top:1px solid #e4e4e7;">
    <p style="margin:0;font-size:11px;color:#a1a1aa;">Sent by Webstew · Submission ID: ${escape(submissionId)}</p>
  </div>
</body></html>`
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Cap the number of fields too — per-field length is bounded below, but an
// unbounded key count still lets one submission bloat toward Mongo's 16MB limit.
const MAX_FORM_FIELDS = 50
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj).slice(0, MAX_FORM_FIELDS)) {
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
