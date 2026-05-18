// POST /api/auth/reset — consume a forgot-password token and set a new
// password. Validates the HMAC signature + expiry inline so no DB lookups
// for token state are needed.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

function verifyResetToken(token: string): { ok: true; email: string } | { ok: false; reason: string } {
  const secret = process.env.NEXTAUTH_SECRET || ''
  if (!secret) return { ok: false, reason: 'server_unconfigured' }
  let decoded: string
  try { decoded = Buffer.from(token, 'base64url').toString('utf8') }
  catch { return { ok: false, reason: 'malformed' } }
  const parts = decoded.split(':')
  if (parts.length !== 3) return { ok: false, reason: 'malformed' }
  const [email, expStr, sig] = parts
  const body = `${email}:${expStr}`
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  // Constant-time compare to defeat timing oracles.
  if (sig.length !== expected.length) return { ok: false, reason: 'invalid_signature' }
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return { ok: false, reason: 'invalid_signature' }
    }
  } catch { return { ok: false, reason: 'invalid_signature' } }
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true, email }
}

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string }
  try { body = await req.json() } catch { body = {} }

  const token = String(body.token || '').trim()
  const password = String(body.password || '')

  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const verified = verifyResetToken(token)
  if (!verified.ok) {
    const msg = verified.reason === 'expired'
      ? 'This reset link expired. Request a new one.'
      : 'This reset link is invalid. Request a new one.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    await connectDB()
    const user = await User.findOne({ email: verified.email }).select('+password')
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 400 })
    }
    user.password = password // pre-save hook hashes via bcrypt
    await user.save()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[reset] failed:', e)
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 })
  }
}
