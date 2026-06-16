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

function authorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const fromHeader = (req.headers.get('authorization') || '').replace('Bearer ', '')
  const fromQuery = new URL(req.url).searchParams.get('secret') || ''
  return fromHeader === CRON_SECRET || fromQuery === CRON_SECRET
}

async function replicateStatus(id: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null
  const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, { headers: { Authorization: `Token ${token}` } })
  if (!r.ok) return null
  return String((await r.json())?.status || '') // starting|processing|succeeded|failed|canceled
}

async function xaiStatus(rid: string): Promise<string | null> {
  const key = process.env.XAI_API_KEY
  if (!key) return null
  const r = await fetch(`https://api.x.ai/v1/videos/${rid}`, { headers: { Authorization: `Bearer ${key}` } })
  if (!r.ok && r.status !== 202) return null
  return String((await r.json().catch(() => ({})))?.status || '').toLowerCase() // pending|done|failed
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

  let refunded = 0, resolved = 0, pending = 0, errors = 0
  for (const job of jobs) {
    const id = String(job._id)
    try {
      const ageMin = (now - new Date(job.createdAt).getTime()) / 60000
      const status = id.startsWith('xai:') ? await xaiStatus(id.slice(4)) : await replicateStatus(id)
      if (status === null) { errors++; continue } // provider unreachable — retry next run
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

  return NextResponse.json({ checked: jobs.length, refunded, resolved, pending, errors })
}
