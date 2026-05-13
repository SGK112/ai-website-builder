// Preview snapshot store. Anon-friendly: anyone can mint a /preview/<token>
// link for a generated site, so they can share it before signing up. Signed-in
// users own their snapshots and can list / delete them from /profile.
//
// Direct Mongo (no mongoose model) for the same reason cms-store does it —
// the schema can evolve without restarting dev servers, and we don't need
// validation rituals for a write-once table.

import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

const COLLECTION = 'preview_snapshots'
const TTL_DAYS = 7
const MAX_HTML_BYTES = 2 * 1024 * 1024 // 2 MB hard cap per snapshot

export interface PreviewSnapshot {
  _id?: ObjectId
  token: string
  html: string
  name?: string
  userId?: string | null
  createdAt: Date
  expiresAt: Date
}

let ensuredIndexes = false

async function getCollection() {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('DB not connected')
  const col = db.collection<PreviewSnapshot>(COLLECTION)
  if (!ensuredIndexes) {
    // Mongo TTL index on expiresAt — docs auto-delete when expiresAt passes.
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {})
    await col.createIndex({ token: 1 }, { unique: true }).catch(() => {})
    await col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {})
    ensuredIndexes = true
  }
  return col
}

function makeToken(): string {
  // 16 random bytes → 22-char base64url. URL-safe, no padding, hard to guess.
  return crypto.randomBytes(16).toString('base64url')
}

export interface CreateArgs {
  html: string
  name?: string
  userId?: string | null
}

export async function createSnapshot({ html, name, userId }: CreateArgs): Promise<{ token: string; expiresAt: Date }> {
  if (!html || typeof html !== 'string') throw new Error('html required')
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    throw new Error(`html exceeds ${MAX_HTML_BYTES / 1024 / 1024}MB limit`)
  }
  const col = await getCollection()
  const token = makeToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000)
  await col.insertOne({
    token,
    html,
    name: name?.slice(0, 200),
    userId: userId || null,
    createdAt: now,
    expiresAt,
  })
  return { token, expiresAt }
}

export async function getSnapshotByToken(token: string): Promise<PreviewSnapshot | null> {
  if (!token || typeof token !== 'string') return null
  const col = await getCollection()
  return col.findOne({ token })
}

export async function listSnapshotsByUser(userId: string, limit = 50): Promise<PreviewSnapshot[]> {
  if (!userId) return []
  const col = await getCollection()
  return col
    .find({ userId }, { projection: { html: 0 } }) // skip html — list view doesn't need it
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}

export async function deleteSnapshotById(id: string, userId: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false
  const col = await getCollection()
  const res = await col.deleteOne({ _id: new ObjectId(id), userId })
  return res.deletedCount === 1
}
