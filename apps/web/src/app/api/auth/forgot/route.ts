// POST /api/auth/forgot — send a password-reset email with a signed,
// time-limited token. Stateless (no schema changes) — the token is an HMAC
// over { email, exp } using NEXTAUTH_SECRET. Always returns 200 regardless
// of whether the email exists, so attackers can't probe for accounts.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

const TTL_MS = 60 * 60 * 1000 // 1 hour

// Inline — Next.js route files only allow GET/POST/etc. exports plus the
// `dynamic` / `runtime` config consts. Non-handler exports break the build.
function makeResetToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || ''
  const exp = Date.now() + TTL_MS
  const body = `${email.toLowerCase()}:${exp}`
  const sig = createHmac('sha256', secret).update(body).digest('hex')
  return Buffer.from(`${body}:${sig}`).toString('base64url')
}

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try { body = await req.json() } catch { body = {} }
  const email = String(body.email || '').trim().toLowerCase()

  // Validate shape; same 200 + generic message for missing/invalid/unknown
  // emails so we don't leak which addresses have accounts.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true })
  }

  try {
    await connectDB()
    const user = await User.findOne({ email }).select('_id email').lean()
    if (user) {
      const token = makeResetToken(email)
      const origin =
        req.headers.get('origin') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'https://www.webstew.net'
      const link = `${origin}/reset-password?token=${encodeURIComponent(token)}`
      await sendMail({
        to: email,
        subject: 'Reset your Webstew password',
        text: `We got a request to reset your Webstew password.\n\nOpen this link within the next hour to set a new one:\n${link}\n\nDidn't request this? Ignore this email — your password stays the same.`,
        html: `<p>We got a request to reset your Webstew password.</p>
<p><a href="${link}" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
<p style="color:#64748b;font-size:13px">Or paste this URL into your browser:<br><code>${link}</code></p>
<p style="color:#64748b;font-size:13px">Link expires in 1 hour. Didn't request this? Ignore this email — your password stays the same.</p>`,
      })
    }
  } catch (e) {
    console.error('[forgot] failed:', e)
    // Fall through to the generic 200 so probers can't tell.
  }

  return NextResponse.json({ ok: true })
}
