// Server-side build persistence. A build (an agent turn that generates/edits a
// project) is recorded here so it survives the user closing the tab: the agent
// route keeps running after a disconnect, writes the result here, and emails
// the user. On return the client can pull finished builds it never saw.
//
// Distinguishing "user closed the tab" (continue + notify) from "user clicked
// Stop" (cancel) is done with an in-memory cancel set — the build runs in the
// same Node process on Render, so a process-local Set is sufficient and avoids
// a DB round-trip per loop iteration.

import { connectDB } from '@/lib/db'
import { randomUUID } from 'crypto'

export type BuildStatus = 'running' | 'done' | 'failed' | 'cancelled'

export interface BuildFile { path: string; content: string }

export interface BuildRecord {
  buildId: string
  userId: string
  projectId: string | null
  prompt: string
  target: string
  status: BuildStatus
  files?: BuildFile[]
  summary?: string
  error?: string
  // True when the client disconnected before completion (so we know to email).
  disconnected?: boolean
  notified?: boolean
  seen?: boolean
  createdAt: Date
  completedAt?: Date
}

// Explicit-cancel registry. cancelBuild() adds; the agent loop polls
// isCancelled() each iteration and stops cleanly (vs a mere disconnect, which
// it ignores so the build finishes in the background).
const cancelled = new Set<string>()

async function db() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

export async function startBuild(opts: {
  userId: string; projectId?: string | null; prompt: string; target: string
}): Promise<string> {
  const buildId = randomUUID().replace(/-/g, '')
  const now = new Date()
  await (await db()).collection('builds').insertOne({
    buildId, userId: opts.userId, projectId: opts.projectId || null,
    prompt: String(opts.prompt || '').slice(0, 2000), target: opts.target || 'website',
    status: 'running', createdAt: now,
  })
  return buildId
}

export async function completeBuild(buildId: string, result: {
  files?: BuildFile[]; summary?: string; disconnected?: boolean
}): Promise<void> {
  const set: any = { status: 'done', completedAt: new Date() }
  if (result.summary) set.summary = String(result.summary).slice(0, 500)
  if (result.disconnected != null) set.disconnected = result.disconnected
  if (Array.isArray(result.files)) {
    // Cap stored payload so one runaway build can't bloat the collection.
    let bytes = 0
    const capped: BuildFile[] = []
    for (const f of result.files) {
      const b = Buffer.byteLength(f.content || '', 'utf8')
      if (bytes + b > 4 * 1024 * 1024) break
      bytes += b
      capped.push({ path: f.path, content: f.content })
    }
    set.files = capped
  }
  await (await db()).collection('builds').updateOne({ buildId }, { $set: set })
  cancelled.delete(buildId)
}

export async function failBuild(buildId: string, error: string): Promise<void> {
  await (await db()).collection('builds').updateOne(
    { buildId }, { $set: { status: 'failed', error: String(error).slice(0, 500), completedAt: new Date() } },
  )
  cancelled.delete(buildId)
}

export function cancelBuild(buildId: string): void {
  cancelled.add(buildId)
}

export function isCancelled(buildId: string): boolean {
  return cancelled.has(buildId)
}

export async function markBuildCancelled(buildId: string): Promise<void> {
  await (await db()).collection('builds').updateOne(
    { buildId, status: 'running' }, { $set: { status: 'cancelled', completedAt: new Date() } },
  )
  cancelled.delete(buildId)
}

// Builds that finished while the user was away and they haven't loaded yet.
export async function getUnseenFinishedBuilds(userId: string): Promise<BuildRecord[]> {
  const rows = await (await db()).collection('builds')
    .find({ userId, status: 'done', disconnected: true, seen: { $ne: true } })
    .sort({ completedAt: -1 })
    .limit(5)
    .toArray()
  return rows as any
}

export async function getBuild(buildId: string, userId: string): Promise<BuildRecord | null> {
  return (await db()).collection('builds').findOne({ buildId, userId }) as any
}

export async function markBuildSeen(buildId: string, userId: string): Promise<void> {
  await (await db()).collection('builds').updateOne({ buildId, userId }, { $set: { seen: true } })
}
