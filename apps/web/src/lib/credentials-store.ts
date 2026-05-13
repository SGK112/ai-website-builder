// User credential store — encrypted at rest in Mongo, raw-driver writes so we
// don't get bitten by the mongoose schema cache.
//
// Schema:
//   db.user_credentials: { _id, userId (ObjectId), type ('render'|'github'),
//                          value (encrypted base64), updatedAt, lastValidatedAt? }
//
// Encryption: AES-256-GCM. Key is derived once from NEXTAUTH_SECRET via
// scrypt so we never store the raw key on disk. Ciphertext format:
//   v1:<iv-b64>:<tag-b64>:<ciphertext-b64>
//
// Decryption failures surface as null (e.g., if NEXTAUTH_SECRET changes —
// older creds become unreadable and the user has to re-enter). We treat that
// as a recoverable state, not a server-side fatal.

import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

const ALGO = 'aes-256-gcm'
const COLLECTION = 'user_credentials'

export type CredentialType = 'render' | 'github'

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET required for credential encryption')
  // scrypt is slow, but we only run it on each crypt operation. For
  // performance we could cache the derived key — skipping for v1 since each
  // request triggers exactly one encrypt OR one decrypt, not a hot loop.
  return crypto.scryptSync(secret, 'webstew-credentials', 32)
}

function encrypt(plain: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

function decrypt(blob: string): string | null {
  try {
    if (!blob.startsWith('v1:')) return null
    const [, ivB, tagB, encB] = blob.split(':')
    if (!ivB || !tagB || !encB) return null
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB, 'base64'))
    const dec = Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()])
    return dec.toString('utf8')
  } catch (_e) {
    return null
  }
}

export interface CredentialSummary {
  type: CredentialType
  set: boolean
  // First few chars for the UI to confirm the right key is stored without
  // showing the whole thing.
  hint?: string
  updatedAt?: Date
  lastValidatedAt?: Date
}

export async function listUserCredentials(userId: string): Promise<CredentialSummary[]> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return []
  const docs = await db.collection(COLLECTION)
    .find({ userId: new ObjectId(userId) })
    .toArray()
  const byType = new Map<CredentialType, any>()
  for (const d of docs) byType.set(d.type, d)
  const out: CredentialSummary[] = []
  for (const type of ['render', 'github'] as CredentialType[]) {
    const d = byType.get(type)
    if (d) {
      const decrypted = decrypt(d.value)
      out.push({
        type,
        set: !!decrypted,
        hint: decrypted ? `${decrypted.slice(0, 4)}…${decrypted.slice(-4)}` : undefined,
        updatedAt: d.updatedAt,
        lastValidatedAt: d.lastValidatedAt,
      })
    } else {
      out.push({ type, set: false })
    }
  }
  return out
}

// Read a single user credential value (decrypted). Returns null if not set
// or if decryption failed (e.g., NEXTAUTH_SECRET rotated since storage).
export async function getUserCredential(userId: string, type: CredentialType): Promise<string | null> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return null
  const doc = await db.collection(COLLECTION).findOne({
    userId: new ObjectId(userId),
    type,
  })
  if (!doc) return null
  return decrypt(doc.value)
}

export async function upsertUserCredential(
  userId: string,
  type: CredentialType,
  value: string,
  validated?: boolean,
): Promise<void> {
  if (!value || value.length < 8) throw new Error('Value too short')
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  await db.collection(COLLECTION).updateOne(
    { userId: new ObjectId(userId), type },
    {
      $set: {
        value: encrypt(value),
        updatedAt: new Date(),
        ...(validated ? { lastValidatedAt: new Date() } : {}),
      },
      $setOnInsert: { userId: new ObjectId(userId), type, createdAt: new Date() },
    },
    { upsert: true },
  )
}

export async function deleteUserCredential(userId: string, type: CredentialType): Promise<void> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  await db.collection(COLLECTION).deleteOne({
    userId: new ObjectId(userId),
    type,
  })
}

// Validate a credential against the provider's API. Lets the UI tell the
// user "yes this key works" before they wonder why deploys fail later.
export async function validateCredential(type: CredentialType, value: string): Promise<{ ok: true; meta?: any } | { ok: false; error: string }> {
  try {
    if (type === 'render') {
      const res = await fetch('https://api.render.com/v1/owners', {
        headers: { Authorization: `Bearer ${value}`, Accept: 'application/json' },
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return { ok: false, error: `Render returned ${res.status}: ${body.slice(0, 200)}` }
      }
      const owners = await res.json()
      const owner = owners[0]?.owner
      return { ok: true, meta: { ownerEmail: owner?.email, ownerType: owner?.type } }
    }
    if (type === 'github') {
      // /user is the universal "does this token work" probe + tells us the
      // login name. Also returns the scopes via X-OAuth-Scopes header so we
      // can warn if `repo` is missing.
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${value}`, Accept: 'application/vnd.github.v3+json' },
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return { ok: false, error: `GitHub returned ${res.status}: ${body.slice(0, 200)}` }
      }
      const user = await res.json()
      const scopes = res.headers.get('x-oauth-scopes') || ''
      if (!/\brepo\b/.test(scopes)) {
        return { ok: false, error: `Token missing required scope "repo". Current scopes: ${scopes || 'none'}` }
      }
      return { ok: true, meta: { login: user.login, scopes } }
    }
    return { ok: false, error: `Unknown credential type: ${type}` }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}
