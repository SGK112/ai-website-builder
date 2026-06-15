import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { z } from 'zod'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { isDisposableEmail, makeVerifyToken, verifyEmailContent } from '@/lib/email-verification'
import { sendMail } from '@/lib/mailer'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  const blocked = await guardAnonAbuse(req, { rateLimit: 'signup' })
  if (blocked) return blocked

  try {
    const body = await req.json()

    // Validate input
    const result = signupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data
    const normalizedEmail = email.trim().toLowerCase()

    // Block throwaway email providers. Free tier grants ~$8 of Anthropic
    // credits per account — disposable addresses are the cheapest way to
    // farm that. This is a speed bump (lazy abuse) not a wall.
    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please use a permanent email address — disposable / temporary email providers are not allowed.' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Create new user. app:'webstew' tags this as a Webstew-side signup
    // so the shared users collection (with VoiceNow + Webstew co-tenants)
    // can be filtered cleanly in /admin queries.
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      plan: 'free',
      app: 'webstew',
      firstSeenWebstewAt: new Date(),
    })

    // Mark unverified + send the verification email. emailVerified is set
    // via the raw driver because it's a field added after the Mongoose
    // schema was registered — doc.save() would strip it.
    try {
      const conn = await connectDB()
      const rawDb = conn.connection.db
      if (rawDb) {
        await rawDb.collection('users').updateOne(
          { _id: new mongoose.Types.ObjectId(user._id.toString()) },
          { $set: { emailVerified: false, emailVerifySentAt: new Date() } }
        )
      }
      const origin =
        req.headers.get('origin') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'https://www.webstew.net'
      const link = `${origin}/verify-email?token=${encodeURIComponent(makeVerifyToken(normalizedEmail))}`
      const mail = verifyEmailContent(link)
      // Fire-and-forget — never block signup on email delivery.
      void sendMail({ to: normalizedEmail, subject: mail.subject, text: mail.text, html: mail.html })
        .catch((e) => console.warn('[signup] verify email failed:', e?.message || e))
    } catch (e: any) {
      console.warn('[signup] verification setup failed (non-fatal):', e?.message || e)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
