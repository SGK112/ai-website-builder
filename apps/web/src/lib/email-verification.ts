// Email-verification helpers — disposable-domain blocking + stateless
// HMAC verify tokens. Stateless (no DB column for the token itself):
// the token is an HMAC over { email, exp } with NEXTAUTH_SECRET, same
// pattern as the forgot-password flow.
//
// The `emailVerified` boolean IS persisted on the user doc (via the raw
// Mongo driver — it's a field added after the Mongoose schema was
// registered, and doc.save() strips unregistered fields; see the
// "bypass mongoose for new fields" project rule).

import { createHmac, timingSafeEqual } from 'crypto'

const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days — generous; it's not security-critical, just anti-abuse

// Known disposable / throwaway email providers. Not exhaustive — it's a
// speed bump, not a wall. Catches the lazy abuse (someone farming free
// credits with mailinator addresses) without an external API call.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'throwawaymail.com', 'fakeinbox.com', 'trashmail.com', 'getnada.com',
  'maildrop.cc', 'dispostable.com', 'yopmail.com', 'mailnesia.com',
  'sharklasers.com', 'spam4.me', 'mintemail.com', 'mohmal.com',
  'emailondeck.com', 'tempinbox.com', 'mytemp.email', 'tmpmail.org',
  'mailcatch.com', 'inboxbear.com', 'tempr.email', 'burnermail.io',
  'spamgourmet.com', 'maileater.com', 'trbvm.com', 'discard.email',
  'mailtemp.net', 'tempmailo.com', 'minuteinbox.com', 'fakemail.net',
])

export function isDisposableEmail(email: string): boolean {
  const domain = (email.split('@')[1] || '').trim().toLowerCase()
  if (!domain) return true // no domain = invalid, treat as disposable
  return DISPOSABLE_DOMAINS.has(domain)
}

// Mint a signed verification token for an email address.
export function makeVerifyToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || ''
  const exp = Date.now() + VERIFY_TTL_MS
  const body = `${email.toLowerCase()}:${exp}`
  const sig = createHmac('sha256', secret).update(body).digest('hex')
  return Buffer.from(`${body}:${sig}`).toString('base64url')
}

// Verify a token. Returns the email on success, or null on
// malformed / bad-signature / expired.
export function verifyVerifyToken(token: string): { ok: true; email: string } | { ok: false; reason: string } {
  const secret = process.env.NEXTAUTH_SECRET || ''
  if (!secret) return { ok: false, reason: 'server_unconfigured' }
  let decoded: string
  try { decoded = Buffer.from(token, 'base64url').toString('utf8') }
  catch { return { ok: false, reason: 'malformed' } }
  const parts = decoded.split(':')
  if (parts.length !== 3) return { ok: false, reason: 'malformed' }
  const [email, expStr, sig] = parts
  const expected = createHmac('sha256', secret).update(`${email}:${expStr}`).digest('hex')
  if (sig.length !== expected.length) return { ok: false, reason: 'invalid_signature' }
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return { ok: false, reason: 'invalid_signature' }
    }
  } catch { return { ok: false, reason: 'invalid_signature' } }
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return { ok: false, reason: 'expired' }
  return { ok: true, email }
}

// Build the verification email body.
export function verifyEmailContent(link: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Verify your Webstew email',
    text: `Welcome to Webstew! Confirm your email to unlock AI site generation:\n${link}\n\nThis link is good for 7 days. Didn't sign up? Ignore this email.`,
    html: `<p>Welcome to <strong>Webstew</strong>! Confirm your email to unlock AI site generation.</p>
<p><a href="${link}" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a></p>
<p style="color:#64748b;font-size:13px">Or paste this URL:<br><code>${link}</code></p>
<p style="color:#64748b;font-size:13px">Good for 7 days. Didn't sign up? Ignore this email.</p>`,
  }
}
