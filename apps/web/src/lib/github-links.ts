// Stores the repo↔project link that makes two-way GitHub sync possible: a push
// webhook needs to map an incoming repo event back to a Webstew project, and
// the pull needs to know which repo + branch belongs to a project.

import { connectDB } from '@/lib/db'
import crypto from 'crypto'

export interface GithubLink {
  projectId: string
  userId: string
  owner: string
  repo: string
  branch: string
  secret: string
  webhookId?: number | null
  createdAt?: Date
  updatedAt?: Date
}

async function db() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

export function genWebhookSecret(): string {
  return crypto.randomBytes(24).toString('hex')
}

export async function getLink(projectId: string): Promise<GithubLink | null> {
  return (await db()).collection('github_links').findOne({ projectId }) as any
}

export async function getLinkByRepo(owner: string, repo: string): Promise<GithubLink | null> {
  return (await db())
    .collection('github_links')
    .findOne({ owner: new RegExp(`^${escapeRe(owner)}$`, 'i'), repo: new RegExp(`^${escapeRe(repo)}$`, 'i') }) as any
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function upsertLink(link: Omit<GithubLink, 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date()
  await (await db()).collection('github_links').updateOne(
    { projectId: link.projectId },
    { $set: { ...link, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
}

// Verify a GitHub webhook HMAC (x-hub-signature-256: "sha256=<hex>").
export function verifyWebhookSignature(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
