// GET /api/cron/reconcile-video — safety-net refunds for video jobs that the
// client never finished polling (closed tab) and that no webhook covered (xAI
// has no webhooks; a hard process-kill can also strand a job).
//
// Scans the video_jobs ledger for charged-but-unresolved jobs older than a few
// minutes, re-checks the provider's status, and:
//   failed/canceled         → refund (idempotent via refundVideoJob)
//   succeeded               → mark resolved so we stop re-checking
//   still running but stuck  → refund (no real generation runs > 1h)
//
// Gated by CRON_SECRET (Bearer header or ?secret=). Touches credits, so it
// refuses to run if the secret isn't configured.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { refundVideoJob, markVideoJobResolved } from '@/lib/credits'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET
const STALE_MINUTES = 15  // give normal poll/webhook flow time to resolve first
const STUCK_MINUTES = 60  // running longer than this → treat as failed
const TIME_BUDGET_MS = 45_000  // stay inside maxDuration; leftovers roll to next run

function authorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const fromHeader = (req.headers.get('authorization') || '').replace('Bearer ', '')
  const fromQuery = new URL(req.url).searchParams.get('secret') || ''
  return fromHeader === CRON_SECRET || fromQuery === CRON_SECRET
}

// A missing provider key and an unreachable provider are NOT the same failure:
// the first never recovers on its own and would otherwise leave every job
// silently unreconciled forever, so keep them distinguishable to the caller.
type Probe =
  | { ok: true; status: string }
  | { ok: false; reason: 'no_key' | 'unreachable' }

async function replicateStatus(id: string): Promise<Probe> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return { ok: false, reason: 'no_key' }
  const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, { headers: { Authorization: `Token ${token}` } })
  if (!r.ok) return { ok: false, reason: 'unreachable' }
  return { ok: true, status: String((await r.json())?.status || '') } // starting|processing|succeeded|failed|canceled
}

async function xaiStatus(rid: string): Promise<Probe> {
  const key = process.env.XAI_API_KEY
  if (!key) return { ok: false, reason: 'no_key' }
  const r = await fetch(`https://api.x.ai/v1/videos/${rid}`, { headers: { Authorization: `Bearer ${key}` } })
  if (!r.ok && r.status !== 202) return { ok: false, reason: 'unreachable' }
  return { ok: true, status: String((await r.json().catch(() => ({})))?.status || '').toLowerCase() } // pending|done|failed
}

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conn = await connectDB()
  const db = conn.connection.db
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const now = Date.now()
  const staleBefore = new Date(now - STALE_MINUTES * 60 * 1000)
  const jobs = await db.collection('video_jobs')
    .find({ refunded: false, resolved: { $ne: true }, createdAt: { $lt: staleBefore } })
    .limit(100)
    .toArray()

  let refunded = 0, resolved = 0, pending = 0, errors = 0, unconfigured = 0, checked = 0
  let truncated = false
  const startedAt = Date.now()
  for (const job of jobs) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) { truncated = true; break }
    const id = String(job._id)
    checked++
    try {
      const ageMin = (now - new Date(job.createdAt).getTime()) / 60000
      const probe = id.startsWith('xai:') ? await xaiStatus(id.slice(4)) : await replicateStatus(id)
      if (!probe.ok) {
        // no_key never self-heals; unreachable retries next run. Count separately.
        if (probe.reason === 'no_key') unconfigured++; else errors++
        continue
      }
      const status = probe.status
      const failed = status === 'failed' || status === 'canceled' || status === 'error'
      const done = status === 'succeeded' || status === 'done'
      const stuck = !done && !failed && ageMin > STUCK_MINUTES
      if (failed || stuck) {
        if (await refundVideoJob(id)) refunded++
      } else if (done) {
        await markVideoJobResolved(id); resolved++
      } else {
        pending++
      }
    } catch {
      errors++
    }
  }

  // A run that reconciled nothing because every probe failed is a FAILED run,
  // not a clean one — surface it as non-2xx so the cron alerts instead of
  // reporting green while credits sit stranded.
  const allFailed = checked > 0 && unconfigured + errors === checked
  const body = { checked, queued: jobs.length, refunded, resolved, pending, errors, unconfigured, truncated }
  if (allFailed) {
    return NextResponse.json(
      { ...body, error: unconfigured === checked ? 'No provider API key configured — cannot reconcile' : 'Every provider probe failed' },
      { status: unconfigured === checked ? 503 : 502 },
    )
  }
  return NextResponse.json(body)
}
