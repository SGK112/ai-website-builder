// Cross-session persistence for in-flight + completed generations so users
// can close the tab, come back later, and resume their build. Backs the
// "background builds + notifications" feature (Path B). The browser
// Notification API + document.title + cross-tab BroadcastChannel layer
// is separate (see lib/notifications.ts); this file is the source of truth
// for what the SERVER produced regardless of whether anyone was watching.
//
// Collection shape (`pending_builds`):
//   { _id, userId, kind, status, prompt, model?, html?, files?, name?, slug?,
//     error?, startedAt, completedAt?, consumed, notifiedAt? }
//
// Indices: { userId: 1, completedAt: -1 } — ensured lazily on first write.

import { ObjectId } from 'mongodb'
import { connectDB } from '@/lib/db'

export type BuildKind = 'website' | 'expo' | 'astro' | 'nextjs' | 'react'
export type BuildStatus = 'running' | 'done' | 'failed'

export interface PendingBuild {
  _id?: ObjectId | string
  userId: string
  kind: BuildKind
  status: BuildStatus
  prompt: string
  model?: string
  html?: string
  files?: Record<string, string>
  name?: string
  slug?: string
  description?: string
  error?: string
  startedAt: Date
  completedAt?: Date
  consumed: boolean
  notifiedAt?: Date
}

let indexEnsured = false

async function getCollection() {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('Mongo not connected')
  const col = db.collection<PendingBuild>('pending_builds')
  if (!indexEnsured) {
    // Fire-and-forget — duplicate index creates are no-ops. Don't await on
    // the hot path more than once.
    col.createIndex({ userId: 1, completedAt: -1 }).catch(() => {})
    col.createIndex({ userId: 1, status: 1 }).catch(() => {})
    indexEnsured = true
  }
  return col
}

// Record a completed build. Always upserts a new row — we don't dedupe by
// prompt because the same prompt run twice should produce two records.
// Callers MUST wrap this in try/catch and never throw from the SSE controller.
export async function recordCompletedBuild(input: {
  userId: string
  kind: BuildKind
  prompt: string
  model?: string
  html?: string
  files?: Record<string, string>
  name?: string
  slug?: string
  description?: string
  startedAt?: Date
}): Promise<void> {
  if (!input.userId) return // anonymous trial users — nothing to persist for
  const col = await getCollection()
  await col.insertOne({
    userId: input.userId,
    kind: input.kind,
    status: 'done',
    prompt: input.prompt.slice(0, 4000),
    model: input.model,
    html: input.html,
    files: input.files,
    name: input.name,
    slug: input.slug,
    description: input.description,
    startedAt: input.startedAt || new Date(),
    completedAt: new Date(),
    consumed: false,
  })
}

// Record a failed build so the user gets a "tried to build X, it errored —
// here's what went wrong" card on return instead of silent loss.
export async function recordFailedBuild(input: {
  userId: string
  kind: BuildKind
  prompt: string
  model?: string
  error: string
  startedAt?: Date
}): Promise<void> {
  if (!input.userId) return
  const col = await getCollection()
  await col.insertOne({
    userId: input.userId,
    kind: input.kind,
    status: 'failed',
    prompt: input.prompt.slice(0, 4000),
    model: input.model,
    error: input.error.slice(0, 2000),
    startedAt: input.startedAt || new Date(),
    completedAt: new Date(),
    consumed: false,
  })
}

// Return the user's most recent unclaimed build from the last `maxAgeMs`
// (default 30 min). Anything older is ignored because the user almost
// certainly doesn't care anymore — and we don't want a stale build from
// a previous session to override a fresh empty workspace.
export async function getLatestUnclaimedBuild(
  userId: string,
  maxAgeMs: number = 30 * 60 * 1000,
): Promise<PendingBuild | null> {
  if (!userId) return null
  const col = await getCollection()
  const cutoff = new Date(Date.now() - maxAgeMs)
  const doc = await col.findOne(
    { userId, consumed: false, completedAt: { $gte: cutoff } },
    { sort: { completedAt: -1 } },
  )
  return doc as PendingBuild | null
}

// Mark a build claimed so we don't re-offer it on the next mount.
export async function markBuildConsumed(userId: string, buildId: string): Promise<boolean> {
  if (!userId || !buildId) return false
  if (!ObjectId.isValid(buildId)) return false
  const col = await getCollection()
  const res = await col.updateOne(
    { _id: new ObjectId(buildId), userId },
    { $set: { consumed: true } },
  )
  return res.matchedCount > 0
}
