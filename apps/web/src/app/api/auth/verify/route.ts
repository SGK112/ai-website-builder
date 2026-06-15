// GET  /api/auth/verify?token=...  — consume an email-verification token,
//      flip emailVerified:true on the user doc.
// POST /api/auth/verify            — resend the verification email. Works
//      with OR without a session: login is now gated on verification, so an
//      unverified user has no session and resends with { email } in the body.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { verifyVerifyToken, makeVerifyToken, verifyEmailContent } from '@/lib/email-verification'
import { sendMail } from '@/lib/mailer'
import { guardAnonAbuse } from '@/lib/abuse-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || ''
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }
  const verified = verifyVerifyToken(token)
  if (!verified.ok) {
    const msg = verified.reason === 'expired'
      ? 'This verification link expired. Request a new one from your account.'
      : 'This verification link is invalid.'
    return NextResponse.json({ error: msg, reason: verified.reason }, { status: 400 })
  }
  try {
    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })
    const res = await db.collection('users').updateOne(
      { email: verified.email },
      { $set: { emailVerified: true, emailVerifiedAt: new Date() } }
    )
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, email: verified.email })
  } catch (e: any) {
    console.error('[verify] GET failed:', e?.message || e)
    return NextResponse.json({ error: 'Could not verify email' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Rate-limited — this sends email; an open resend endpoint is an
  // inbox-spam vector otherwise.
  const blocked = await guardAnonAbuse(req, { rateLimit: 'waitlist', allowBotUa: true })
  if (blocked) return blocked

  // Email comes from the session (logged-in resend) or the request body
  // (unverified user, who has no session since login is gated on it).
  const session = await getServerSession(authOptions)
  let email = session?.user?.email?.toLowerCase() || ''
  if (!email) {
    const body = await req.json().catch(() => ({} as any))
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  }
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }
  try {
    await connectDB()
    const user: any = await User.findOne({ email }).select('_id emailVerified').lean()
    // Only send for a real account that is still unverified — and return
    // the SAME response either way, so this can't be used to probe which
    // emails are registered.
    if (user && user.emailVerified === false) {
      const origin =
        req.headers.get('origin') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'https://www.webstew.net'
      const link = `${origin}/verify-email?token=${encodeURIComponent(makeVerifyToken(email))}`
      const mail = verifyEmailContent(link)
      await sendMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[verify] POST resend failed:', e?.message || e)
    return NextResponse.json({ error: 'Could not resend verification' }, { status: 500 })
  }
}
