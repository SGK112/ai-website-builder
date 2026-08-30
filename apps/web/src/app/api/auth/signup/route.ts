import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'
import { z } from 'zod'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { isDisposableEmail, makeVerifyToken, verifyEmailContent } from '@/lib/email-verification'
import { sendMail } from '@/lib/mailer'
import { ANON_COOKIE, startingCreditsFor, anonCreditsSpent } from '@/lib/anon-credits'

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

    // Anti-enumeration: if the email is already registered, DON'T reveal that.
    // Email the address a login nudge (so a real owner gets help) and return the
    // exact same generic response as a brand-new signup, so a prober can't tell
    // registered emails from new ones.
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://www.webstew.net'
      void sendMail({
        to: normalizedEmail,
        subject: 'You already have a Webstew account',
        text: `Someone just tried to sign up for Webstew with this email, but you already have an account.\n\nLog in here: ${origin}/login\nForgot your password? Use "Forgot password" on the login page.\n\nIf this wasn't you, you can safely ignore this email.`,
        html: `<p>Someone just tried to sign up for Webstew with this email, but you already have an account.</p><p><a href="${origin}/login">Log in</a> — or use <strong>Forgot password</strong> on the login page if you need to reset it.</p><p style="color:#888">If this wasn't you, you can safely ignore this email.</p>`,
      }).catch((e) => console.warn('[signup] account-exists email failed:', e?.message || e))
      return NextResponse.json({ success: true })
    }

    // Create new user. app:'webstew' tags this as a Webstew-side signup
    // so the shared users collection (with VoiceNow + Webstew co-tenants)
    // can be filtered cleanly in /admin queries.
    // Signing up CLAIMS the free allowance this browser has been spending as
    // an anon — it doesn't hand out a second one. Without this, ten free
    // generations then a signup yielded 200 credits, repeatable by signing out.
    const anonSpent = anonCreditsSpent(req.cookies.get(ANON_COOKIE)?.value)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      plan: 'free',
      app: 'webstew',
      credits: startingCreditsFor(req.cookies.get(ANON_COOKIE)?.value),
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
          // anonCreditsClaimed is audit only — it explains a starting balance
          // under 100 if the user ever asks why. Written raw for the same
          // reason as emailVerified: not in the registered schema.
          { $set: { emailVerified: false, emailVerifySentAt: new Date(), anonCreditsClaimed: anonSpent } }
        )
      }
      // NEVER use the request Origin here — it's attacker-controlled, so a
      // direct API call could point the verification link at a phishing host
      // that captures + replays the token. Use only trusted server config.
      const origin =
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

    // Identical shape to the already-exists branch above — the client only
    // reads res.ok (then shows "check your email"), so leaking nothing here
    // keeps new vs existing indistinguishable.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
