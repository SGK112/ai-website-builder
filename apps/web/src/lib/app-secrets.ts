// Per-app secrets store for managed-backend apps.
//
// A generated app often needs a secret its client code must NOT hold — a
// Stripe secret key, an OpenAI key, a webhook signing secret. We store those
// encrypted, scoped to the app's backend (appId), and expose them ONLY to
// server-side execution (the backend server-actions route), never to the
// browser-facing data API.
//
// Encryption is self-contained AES-256-GCM keyed off ENCRYPTION_KEY, falling
// back to NEXTAUTH_SECRET so this works out-of-the-box in every environment
// (NEXTAUTH_SECRET is always set) without a new deploy-time key.

import crypto from 'crypto'
import { connectDB } from '@/lib/db'

const ALGO = 'aes-256-gcm'

function keyMaterial(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('No ENCRYPTION_KEY or NEXTAUTH_SECRET configured for secret encryption')
  // Derive a stable 32-byte key from whatever secret material we have.
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGO, keyMaterial(), iv)
  let enc = cipher.update(plaintext, 'utf8', 'hex')
  enc += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, enc] = String(payload || '').split(':')
  if (!ivHex || !tagHex || !enc) return ''
  const decipher = crypto.createDecipheriv(ALGO, keyMaterial(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  let dec = decipher.update(enc, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}

// A safe preview of a secret value — first 3 + last 2 chars, never the middle.
// Lets the owner recognize which key is stored without revealing it.
export function maskSecret(plaintext: string): string {
  if (!plaintext) return ''
  if (plaintext.length <= 6) return '•'.repeat(plaintext.length)
  return `${plaintext.slice(0, 3)}${'•'.repeat(Math.min(8, plaintext.length - 5))}${plaintext.slice(-2)}`
}

const KEY_RE = /^[A-Z][A-Z0-9_]{0,63}$/

export function isValidSecretKey(key: string): boolean {
  return KEY_RE.test(key)
}

async function db() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

export interface SecretMeta {
  key: string
  masked: string
  updatedAt: Date
}

// List secrets for an app — keys + masked previews only, never plaintext.
export async function listSecrets(appId: string): Promise<SecretMeta[]> {
  const rows = await (await db())
    .collection('app_secrets')
    .find({ appId })
    .sort({ key: 1 })
    .toArray()
  return rows.map((r) => ({
    key: r.key,
    masked: maskSecret(safeDecrypt(r.value)),
    updatedAt: r.updatedAt,
  }))
}

function safeDecrypt(payload: string): string {
  try { return decryptSecret(payload) } catch { return '' }
}

// Upsert a single secret.
export async function setSecret(appId: string, key: string, value: string): Promise<void> {
  const now = new Date()
  await (await db()).collection('app_secrets').updateOne(
    { appId, key },
    { $set: { appId, key, value: encryptSecret(value), updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
}

export async function deleteSecret(appId: string, key: string): Promise<boolean> {
  const res = await (await db()).collection('app_secrets').deleteOne({ appId, key })
  return res.deletedCount > 0
}

// Resolve all secrets for an app as a plaintext map — SERVER-SIDE ONLY.
// Used by the backend server-actions runner to inject secrets into outbound
// requests. Never return this to a browser.
export async function getSecretMap(appId: string): Promise<Record<string, string>> {
  const rows = await (await db()).collection('app_secrets').find({ appId }).toArray()
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = safeDecrypt(r.value)
  return out
}
