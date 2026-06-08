// Mailer — Resend-first (already wired for webstew.net with a working
// RESEND_API_KEY), with SMTP/nodemailer as a fallback when Resend isn't
// configured. Calls are HTTP fetch against api.resend.com so we don't
// need an extra SDK dep.
//
// If neither is configured, sendMail() logs the payload and returns
// ok=false instead of throwing. That way local dev without creds doesn't
// break the form-submit path; the submission is still persisted upstream.

import nodemailer, { type Transporter } from 'nodemailer'

interface MailerConfig {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
  secure: boolean
}

function loadConfig(): MailerConfig | null {
  const host = process.env.SMTP_HOST
  if (!host) return null
  const port = parseInt(process.env.SMTP_PORT || '587', 10) || 587
  return {
    host,
    port,
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: process.env.SMTP_FROM || `Webstew <notifications@${host}>`,
    // SES + most providers use STARTTLS on 587. Implicit TLS on 465.
    secure: port === 465,
  }
}

let cachedTransporter: Transporter | null = null
let cachedKey = ''

function getTransporter(cfg: MailerConfig): Transporter {
  // Key on the env values so a hot-reload that changes them refreshes the
  // transporter, but stable runtime doesn't recreate it on every send.
  const key = `${cfg.host}|${cfg.port}|${cfg.user}|${cfg.secure}`
  if (cachedTransporter && cachedKey === key) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    // Hard timeouts — nodemailer defaults to "wait forever". Without these,
    // a stalled SMTP socket (Gmail throttling, AWS SES regional outage,
    // network partition) holds the request handler indefinitely. Burned
    // SG's site for 30+ leads in May 2026 — applying preemptively here.
    connectionTimeout: 10_000, // 10s to open the TCP socket
    greetingTimeout: 10_000,   // 10s for the SMTP greeting
    socketTimeout: 20_000,     // 20s of idle on the established socket
  })
  cachedKey = key
  return cachedTransporter
}

export interface SendMailArgs {
  to: string
  subject: string
  text?: string
  html?: string
  replyTo?: string
  // Overrides the resolved from-address when set.
  from?: string
  // Which verified sender to use. 'noreply' (default) for transactional/
  // automated mail (build-done, etc.); 'help' for support correspondence the
  // user can reply to. Resolved from RESEND_FROM_NOREPLY / RESEND_FROM_HELP.
  kind?: 'noreply' | 'help'
}

// Resolve the From header. The env vars hold bare addresses
// (noreply@webstew.net), so we wrap them with a display name unless they
// already include one. Falls back to legacy RESEND_FROM, then a sane default.
function resolveFrom(args: SendMailArgs): string {
  if (args.from) return args.from
  const wrap = (addr: string | undefined, name: string, fallback: string): string => {
    const a = (addr || '').trim()
    if (!a) return fallback
    return a.includes('<') ? a : `${name} <${a}>`
  }
  if (args.kind === 'help') {
    return wrap(process.env.RESEND_FROM_HELP, 'Webstew Support', process.env.RESEND_FROM || 'Webstew Support <help@webstew.net>')
  }
  return wrap(process.env.RESEND_FROM_NOREPLY, 'Webstew', process.env.RESEND_FROM || 'Webstew <noreply@webstew.net>')
}

export interface SendMailResult {
  ok: boolean
  reason?: 'not-configured' | 'send-failed'
  error?: string
  messageId?: string
}

// Resend — domain verified for webstew.net, working API key already in
// the Webstew env. Preferred over SMTP because no socket-timeout risk +
// proper deliverability tracking. Send via the REST API to avoid pulling
// in the @resend SDK as a new dep.
async function sendViaResend(args: SendMailArgs): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, reason: 'not-configured' }
  const from = resolveFrom(args)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
        reply_to: args.replyTo,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[mailer] Resend rejected:', res.status, body.slice(0, 300))
      return { ok: false, reason: 'send-failed', error: `Resend ${res.status}: ${body.slice(0, 200)}` }
    }
    const data = await res.json().catch(() => ({} as any))
    return { ok: true, messageId: data?.id }
  } catch (e: any) {
    console.error('[mailer] Resend fetch failed:', e?.message || e)
    return { ok: false, reason: 'send-failed', error: e?.message || String(e) }
  }
}

export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  // Prefer Resend when its key is present. Falls back to SMTP only if
  // RESEND_API_KEY is unset (e.g. legacy / local dev without an API key).
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(args)
  }

  const cfg = loadConfig()
  if (!cfg) {
    // Dev-friendly: log the payload so the developer can see what would have
    // been sent, then return not-configured. Callers should treat this as a
    // soft failure and continue (the submission is already in Mongo).
    console.warn('[mailer] No RESEND_API_KEY and no SMTP_HOST — skipping email send')
    console.warn('[mailer]', { to: args.to, subject: args.subject, replyTo: args.replyTo })
    return { ok: false, reason: 'not-configured' }
  }
  try {
    const t = getTransporter(cfg)
    const info = await t.sendMail({
      from: args.from || cfg.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      replyTo: args.replyTo,
    })
    return { ok: true, messageId: info.messageId }
  } catch (e: any) {
    console.error('[mailer] SMTP send failed:', e?.message || e)
    return { ok: false, reason: 'send-failed', error: e?.message || String(e) }
  }
}

export function isMailerConfigured(): boolean {
  return !!process.env.RESEND_API_KEY || !!process.env.SMTP_HOST
}
