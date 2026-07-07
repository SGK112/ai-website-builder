// POST /api/auth/reset — consume a forgot-password token and set a new
// password. Validates the HMAC signature + expiry inline so no DB lookups
// for token state are needed.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { connectDB } from '@/lib/db'
import { User } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

// Parse + expiry-check only. The signature is verified in POST against the
// account's CURRENT password hash (see below), which the token is bound to —
// so it can't be done statelessly here.
function parseResetToken(token: string):
  | { ok: true; email: string; exp: number; sig: string }
  | { ok: false; reason: string } {
  const secret = process.env.NEXTAUTH_SECRET || ''
  if (!secret) return { ok: false, reason: 'server_unconfigured' }
  let decoded: string
  try { decoded = Buffer.from(token, 'base64url').toString('utf8') }
  catch { return { ok: false, reason: 'malformed' } }
  const parts = decoded.split(':')
  if (parts.length !== 3) return { ok: false, reason: 'malformed' }
  const [email, expStr, sig] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return { ok: false, reason: 'expired' }
  return { ok: true, email, exp, sig }
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

  const parsed = parseResetToken(token)
  if (!parsed.ok) {
    const msg = parsed.reason === 'expired'
      ? 'This reset link expired. Request a new one.'
      : 'This reset link is invalid. Request a new one.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    await connectDB()
    const user = await User.findOne({ email: parsed.email }).select('+password')
    if (!user) {
      return NextResponse.json({ error: 'This reset link is invalid. Request a new one.' }, { status: 400 })
    }
    // Verify the signature against the account's CURRENT password hash. forgot
    // signs over `email:exp:pwfrag(currentHash)`; once THIS reset changes the
    // hash, the same token no longer matches — so it's single-use and can't be
    // replayed from a leaked link after the legitimate reset. pwfrag never
    // leaves the server (not in the token), so it's not a hash oracle.
    const secret = process.env.NEXTAUTH_SECRET || ''
    const pwfrag = createHmac('sha256', secret).update('pw:' + String((user as any).password || '')).digest('hex').slice(0, 16)
    const expected = createHmac('sha256', secret).update(`${parsed.email}:${parsed.exp}:${pwfrag}`).digest('hex')
    const sigBuf = Buffer.from(parsed.sig, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    const sigOk = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)
    if (!sigOk) {
      return NextResponse.json({ error: 'This reset link is invalid. Request a new one.' }, { status: 400 })
    }
    user.password = password // pre-save hook hashes via bcrypt
    await user.save()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[reset] failed:', e)
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 })
  }
}
