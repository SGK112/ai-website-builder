// GET  /api/auth/verify?token=...  — consume an email-verification token,
//      flip emailVerified:true on the user doc.
// POST /api/auth/verify            — resend the verification email for the
//      signed-in (but unverified) user.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { verifyVerifyToken, makeVerifyToken, verifyEmailContent } from '@/lib/email-verification'
import { sendMail } from '@/lib/mailer'

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const email = session.user.email.toLowerCase()
  try {
    await connectDB()
    const user: any = await User.findOne({ email }).select('_id').lean()
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://www.webstew.net'
    const link = `${origin}/verify-email?token=${encodeURIComponent(makeVerifyToken(email))}`
    const mail = verifyEmailContent(link)
    const result = await sendMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html })
    if (!result.ok) {
      return NextResponse.json({ error: 'Could not send the email — try again shortly.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[verify] POST resend failed:', e?.message || e)
    return NextResponse.json({ error: 'Could not resend verification' }, { status: 500 })
  }
}
