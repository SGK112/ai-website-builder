// Preview snapshot store.
// Anon-friendly: anyone can mint a /preview/<token> link for a generated site.
// Proposal mode: extended TTL, view tracking, accept-proposal flow.

import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

const COLLECTION = 'preview_snapshots'
const DEFAULT_TTL_DAYS = 7
const PROPOSAL_TTL_DAYS = 90
const MAX_HTML_BYTES = 2 * 1024 * 1024

export interface AcceptorInfo {
  name?: string
  email?: string
  phone?: string
}

export interface PreviewSnapshot {
  _id?: ObjectId
  token: string
  html: string
  name?: string
  userId?: string | null
  createdAt: Date
  expiresAt: Date
  // Proposal fields
  type?: 'preview' | 'proposal'
  viewCount?: number
  lastViewedAt?: Date
  acceptedAt?: Date
  acceptorInfo?: AcceptorInfo
  ownerEmail?: string
  ownerPhone?: string
}

let ensuredIndexes = false

async function getCollection() {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('DB not connected')
  const col = db.collection<PreviewSnapshot>(COLLECTION)
  if (!ensuredIndexes) {
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {})
    await col.createIndex({ token: 1 }, { unique: true }).catch(() => {})
    await col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {})
    ensuredIndexes = true
  }
  return col
}

function makeToken(): string {
  return crypto.randomBytes(16).toString('base64url')
}

export interface CreateArgs {
  html: string
  name?: string
  userId?: string | null
  type?: 'preview' | 'proposal'
  ttlDays?: number
  ownerEmail?: string
  ownerPhone?: string
}

export async function createSnapshot({
  html,
  name,
  userId,
  type = 'preview',
  ttlDays,
  ownerEmail,
  ownerPhone,
}: CreateArgs): Promise<{ token: string; expiresAt: Date }> {
  if (!html || typeof html !== 'string') throw new Error('html required')
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    throw new Error(`html exceeds ${MAX_HTML_BYTES / 1024 / 1024}MB limit`)
  }
  const col = await getCollection()
  const token = makeToken()
  const now = new Date()
  const days = ttlDays ?? (type === 'proposal' ? PROPOSAL_TTL_DAYS : DEFAULT_TTL_DAYS)
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  await col.insertOne({
    token,
    html,
    name: name?.slice(0, 200),
    userId: userId || null,
    createdAt: now,
    expiresAt,
    type,
    viewCount: 0,
    ...(ownerEmail ? { ownerEmail } : {}),
    ...(ownerPhone ? { ownerPhone } : {}),
  })
  return { token, expiresAt }
}

export async function getSnapshotByToken(token: string): Promise<PreviewSnapshot | null> {
  if (!token || typeof token !== 'string') return null
  const col = await getCollection()
  return col.findOne({ token })
}

export async function incrementViewCount(token: string): Promise<void> {
  const col = await getCollection()
  await col.updateOne(
    { token },
    { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } }
  )
}

export async function acceptProposal(token: string, info: AcceptorInfo): Promise<PreviewSnapshot | null> {
  const col = await getCollection()
  const res = await col.findOneAndUpdate(
    { token, type: 'proposal', acceptedAt: { $exists: false } },
    { $set: { acceptedAt: new Date(), acceptorInfo: info } },
    { returnDocument: 'after' }
  )
  return res ?? null
}

export async function listSnapshotsByUser(userId: string, limit = 50): Promise<PreviewSnapshot[]> {
  if (!userId) return []
  const col = await getCollection()
  return col
    .find({ userId }, { projection: { html: 0 } })
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
