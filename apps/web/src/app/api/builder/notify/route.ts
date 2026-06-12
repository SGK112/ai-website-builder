// POST /api/builder/notify — "your stew is cooked" email when a build finishes
// while the user has stepped away. Sends to the signed-in user's account email
// via Resend (noreply sender). Auth-gated + rate-limited so it can't be abused
// or loop. The client fires this only when the tab is hidden at completion.
//
//   POST { projectName?, url?, target? }  → { sent, reason? }

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendMail, isMailerConfigured } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

// In-memory throttle: at most one build-done email per user per 60s. Survives
// for the lifetime of the server process — enough to stop a runaway client
// loop or rapid re-builds from spamming the inbox.
const lastSentAt = new Map<string, number>()
const THROTTLE_MS = 60_000

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const email = session.user.email
  if (!email) {
    return NextResponse.json({ sent: false, reason: 'no-email-on-account' })
  }
  if (!isMailerConfigured()) {
    return NextResponse.json({ sent: false, reason: 'mailer-not-configured' })
  }

  const now = Date.now()
  const last = lastSentAt.get(session.user.id) || 0
  if (now - last < THROTTLE_MS) {
    return NextResponse.json({ sent: false, reason: 'throttled' })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* body optional */ }
  const projectName = String(body?.projectName || 'your site').slice(0, 120)
  const target = String(body?.target || 'website')
  // Only allow same-origin / webstew links so the email can't be turned into
  // an open-redirect carrier. Fall back to the workspace.
  //
  // Prefer NEXTAUTH_URL / NEXT_PUBLIC_SITE_URL over req.nextUrl.origin: behind
  // Cloudflare→Render, req.nextUrl.origin resolves to the internal bind
  // (https://localhost:5001), which made the emailed link a dead page. Same
  // precedence as the integrations OAuth routes. nextUrl.origin is the local-
  // dev last resort only.
  const origin = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin
  ).replace(/\/+$/, '')
  let link = `${origin}/workspace`
  const rawUrl = String(body?.url || '')
  if (rawUrl && /^https?:\/\//i.test(rawUrl)) {
    try {
      const u = new URL(rawUrl)
      if (u.hostname.endsWith('webstew.app') || u.hostname.endsWith('webstew.net') || u.origin === origin) {
        link = u.toString()
      }
    } catch { /* keep workspace default */ }
  }

  const subject = `🍲 Your stew is cooked — "${projectName}" is ready`
  const text =
    `Good news — your build for "${projectName}" just finished while you were away.\n\n` +
    `View it here: ${link}\n\n` +
    `— Webstew`
  const html =
    `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto">` +
    `<h2 style="margin:0 0 8px">🍲 Your stew is cooked</h2>` +
    `<p style="color:#444;margin:0 0 16px">Your build for <b>${escapeHtml(projectName)}</b> just finished while you were away${target === 'expo' ? ' (mobile app)' : ''}.</p>` +
    `<p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">View your build →</a></p>` +
    `<p style="color:#999;font-size:12px;margin:0">You're getting this because you stepped away mid-build. — Webstew</p>` +
    `</div>`

  const result = await sendMail({ to: email, subject, text, html, kind: 'noreply' })
  if (result.ok) lastSentAt.set(session.user.id, now)
  return NextResponse.json({ sent: result.ok, reason: result.ok ? undefined : (result.reason || 'send-failed') })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
