// Server-side credit metering for paid generations.
//
// Atomic check-and-deduct so a burst of concurrent requests can't overspend or
// drive a balance negative, with a refund() to call if the paid action fails to
// start. Enterprise plans and admins are unmetered.

import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { User, isAdminEmail } from '@ai-website-builder/database'
import { CREDIT_COSTS } from '@/lib/stripe-plans'

type Operation = keyof typeof CREDIT_COSTS

export interface SpendResult {
  ok: boolean
  status?: number          // suggested HTTP status when !ok (401/404/402)
  error?: string
  charged: number          // credits actually deducted (0 if unmetered)
  remaining?: number
  userId?: string          // resolved User._id (present when charged > 0)
  refund: () => Promise<void>
}

const NOOP_REFUND = async () => {}

interface SessionLike { user?: { id?: string; email?: string | null } | null }

async function resolveUser(id?: string, email?: string | null) {
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const u = await User.findById(id)
    if (u) return u
  }
  if (email) {
    const u = await User.findOne({ email: email.toLowerCase() })
    if (u) return u
  }
  return null
}

function isUnmetered(user: any): boolean {
  const plan = String(user?.plan || '').toLowerCase()
  if (plan === 'enterprise' || plan === 'custom') return true
  return !!user?.email && isAdminEmail(user.email)
}

/**
 * Charge `operation`'s credit cost to the session user.
 * - cost 0 / enterprise / admin → ok, charged 0.
 * - not enough credits → ok:false, status 402.
 * Always call the returned refund() if the downstream paid call fails to start.
 */
export async function spendCredits(session: SessionLike | null, operation: Operation): Promise<SpendResult> {
  const cost = CREDIT_COSTS[operation] ?? 0
  if (cost <= 0) return { ok: true, charged: 0, refund: NOOP_REFUND }
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: 'Authentication required', charged: 0, refund: NOOP_REFUND }
  }

  await connectDB()
  const user = await resolveUser(session.user.id, session.user.email)
  if (!user) return { ok: false, status: 404, error: 'User not found', charged: 0, refund: NOOP_REFUND }
  if (isUnmetered(user)) return { ok: true, charged: 0, refund: NOOP_REFUND }

  // Atomic: decrement only if the balance covers it. Returns null if it doesn't,
  // which also prevents two concurrent requests from both passing a pre-check.
  const updated = await User.findOneAndUpdate(
    { _id: user._id, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true },
  )
  if (!updated) {
    return {
      ok: false, status: 402, charged: 0, refund: NOOP_REFUND,
      error: `Not enough credits — this needs ${cost}. Add credits to keep going.`,
    }
  }

  const userId = updated._id
  return {
    ok: true,
    charged: cost,
    remaining: (updated as any).credits,
    userId: String(userId),
    refund: async () => {
      try { await User.findByIdAndUpdate(userId, { $inc: { credits: cost } }) }
      catch (e) { console.error('[credits] refund failed for', String(userId), e) }
    },
  }
}

// ── Async-job credit ledger ──────────────────────────────────────────────────
// Video generation charges on START, but the job runs async on Replicate/xAI.
// Record the charge against the job id so that if a later status poll sees the
// job FAILED, we can refund — exactly once, no matter how many times it's polled.

export async function recordVideoCharge(jobId: string, userId: string, charged: number): Promise<void> {
  if (!jobId || !userId || charged <= 0) return
  try {
    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return
    // $setOnInsert so a re-record (shouldn't happen) can't reset `refunded`.
    await db.collection('video_jobs').updateOne(
      { _id: jobId as any },
      { $setOnInsert: { userId, charged, refunded: false, createdAt: new Date() } },
      { upsert: true },
    )
  } catch (e) {
    console.error('[credits] recordVideoCharge failed for', jobId, e)
  }
}

// Mark a job terminal-but-not-refunded (i.e. it succeeded) so the reconciliation
// cron stops re-checking it. Refunded jobs are already excluded via `refunded`.
export async function markVideoJobResolved(jobId: string): Promise<void> {
  if (!jobId) return
  try {
    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return
    await db.collection('video_jobs').updateOne(
      { _id: jobId as any },
      { $set: { resolved: true, resolvedAt: new Date() } },
    )
  } catch (e) {
    console.error('[credits] markVideoJobResolved failed for', jobId, e)
  }
}

// Refund a failed job's credits, atomically claiming the refund so repeated
// failed-polls (the client polls every few seconds) refund only once. Returns
// true if THIS call performed the refund.
export async function refundVideoJob(jobId: string): Promise<boolean> {
  if (!jobId) return false
  try {
    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return false
    const job = await db.collection('video_jobs').findOneAndUpdate(
      { _id: jobId as any, refunded: false, charged: { $gt: 0 } },
      { $set: { refunded: true, refundedAt: new Date() } },
      { returnDocument: 'after' },
    )
    if (!job) return false // already refunded, or unknown/unmetered job
    await User.findByIdAndUpdate(job.userId, { $inc: { credits: job.charged } })
    return true
  } catch (e) {
    console.error('[credits] refundVideoJob failed for', jobId, e)
    return false
  }
}
