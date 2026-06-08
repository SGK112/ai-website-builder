// Feedback loop for the AI builders. Users thumbs-up/down a build or edit and
// (on a down) can say what went wrong. We store it for analysis AND feed the
// user's recent complaints back into their next build's system prompt, so the
// agent stops repeating the same mistakes for that person — a per-user
// learning loop (mirrors the Aria autograder pattern: signal → inline rule).

import { connectDB } from '@/lib/db'

export type FeedbackRating = 'up' | 'down'

export interface FeedbackRecord {
  userId: string
  projectId: string | null
  buildId: string | null
  // Stable key for the message being rated, so a user re-rating updates rather
  // than duplicates (e.g. "msg-<index>" or a content hash from the client).
  messageKey: string
  rating: FeedbackRating
  comment?: string
  prompt?: string
  target?: string
  model?: string
  createdAt: Date
  updatedAt: Date
}

async function db() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

export async function saveFeedback(opts: {
  userId: string; projectId?: string | null; buildId?: string | null;
  messageKey: string; rating: FeedbackRating; comment?: string;
  prompt?: string; target?: string; model?: string
}): Promise<void> {
  const now = new Date()
  await (await db()).collection('feedback').updateOne(
    { userId: opts.userId, messageKey: opts.messageKey },
    {
      $set: {
        userId: opts.userId,
        projectId: opts.projectId || null,
        buildId: opts.buildId || null,
        messageKey: opts.messageKey,
        rating: opts.rating,
        comment: opts.comment ? String(opts.comment).slice(0, 600) : undefined,
        prompt: opts.prompt ? String(opts.prompt).slice(0, 600) : undefined,
        target: opts.target,
        model: opts.model,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )
}

// The user's recent thumbs-DOWN notes — what they disliked, with the prompt
// that produced it. Injected into the next build's system prompt so the agent
// avoids repeating the same issues for this user. Only entries with a comment
// (an actual correction) are useful here; a bare down-vote has no signal.
export async function getRecentNegativeNotes(userId: string, limit = 5): Promise<string[]> {
  const rows = await (await db()).collection('feedback')
    .find({ userId, rating: 'down', comment: { $exists: true, $ne: '' } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray()
  return rows.map((r) => {
    const ctx = r.prompt ? ` (on "${String(r.prompt).slice(0, 60)}")` : ''
    return `${String(r.comment).slice(0, 200)}${ctx}`
  })
}

// Aggregate stats for an owner/admin view (and to confirm the loop is alive).
export async function getFeedbackStats(userId: string): Promise<{ up: number; down: number }> {
  const col = (await db()).collection('feedback')
  const [up, down] = await Promise.all([
    col.countDocuments({ userId, rating: 'up' }),
    col.countDocuments({ userId, rating: 'down' }),
  ])
  return { up, down }
}
