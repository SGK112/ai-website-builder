// Generic SMTP mailer. Env-driven so we can swap providers without touching
// code (AWS SES SMTP, Gmail, Mailgun, Postmark — they all expose SMTP).
// If SMTP_HOST is unset, sendMail() logs the payload and returns ok=false
// instead of throwing. That way local dev without creds doesn't break the
// form-submit path; we still persist the submission to Mongo.

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
  // Overrides SMTP_FROM env when set — useful for "from this project's domain"
  // sends once domain verification is wired up.
  from?: string
}

export interface SendMailResult {
  ok: boolean
  reason?: 'not-configured' | 'send-failed'
  error?: string
  messageId?: string
}

export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  const cfg = loadConfig()
  if (!cfg) {
    // Dev-friendly: log the payload so the developer can see what would have
    // been sent, then return not-configured. Callers should treat this as a
    // soft failure and continue (the submission is already in Mongo).
    console.warn('[mailer] SMTP_HOST not set — skipping email send')
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
    console.error('[mailer] send failed:', e?.message || e)
    return { ok: false, reason: 'send-failed', error: e?.message || String(e) }
  }
}

export function isMailerConfigured(): boolean {
  return !!process.env.SMTP_HOST
}
