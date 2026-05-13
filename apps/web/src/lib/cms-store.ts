// Direct MongoDB access for CMS reads/writes. We bypass the mongoose Project
// model on purpose: the model's schema is registered once (`mongoose.models.Project`)
// and ignores schema diffs after that. Adding a new `cms` field doesn't take
// effect for already-running dev servers — assignments get silently stripped
// at save time. Using db.collection('projects') sidesteps the issue and works
// the same way the agent route already persists file edits.

import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

export interface CmsStoreField {
  key: string
  type: string
  label?: string
  required?: boolean
  ref?: string
}
export interface CmsStoreSchema {
  slug: string
  name: string
  fields: CmsStoreField[]
  createdAt?: Date
  updatedAt?: Date
}
export interface CmsStoreItem {
  slug: string
  fields: Record<string, any>
  status: 'draft' | 'published'
  createdAt?: Date
  updatedAt?: Date
}
export interface CmsStore {
  schemas: Record<string, CmsStoreSchema>
  items: Record<string, Record<string, CmsStoreItem>>
}

type LoadResult =
  | { ok: true; project: any; cms: CmsStore }
  | { ok: false; status: 400 | 403 | 404; error: string }

// Load a project + its CMS by id, after verifying ownership.
export async function loadProjectCms(projectId: string, userId: string): Promise<LoadResult> {
  if (!ObjectId.isValid(projectId)) return { ok: false, status: 400, error: 'Invalid projectId' }
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return { ok: false, status: 400, error: 'DB not connected' }
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) })
  if (!project) return { ok: false, status: 404, error: `Project ${projectId} not found in DB` }
  if (project.userId?.toString?.() !== userId) {
    return { ok: false, status: 403, error: 'Project ownership mismatch' }
  }
  const cms: CmsStore = project.cms || { schemas: {}, items: {} }
  // Ensure subkeys exist even if older docs only have one
  if (!cms.schemas) cms.schemas = {}
  if (!cms.items) cms.items = {}
  return { ok: true, project, cms }
}

// Upsert a collection schema. Returns the persisted schema.
export async function upsertSchema(projectId: string, schema: CmsStoreSchema): Promise<CmsStoreSchema> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  const now = new Date()
  const path = `cms.schemas.${schema.slug}`
  const next: CmsStoreSchema = { ...schema, updatedAt: now, createdAt: schema.createdAt || now }
  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { $set: { [path]: next, updatedAt: now } }
  )
  return next
}

export async function deleteSchema(projectId: string, collection: string): Promise<void> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    {
      $unset: { [`cms.schemas.${collection}`]: '', [`cms.items.${collection}`]: '' },
      $set: { updatedAt: new Date() },
    }
  )
}

export async function upsertItem(projectId: string, collection: string, item: CmsStoreItem): Promise<CmsStoreItem> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  const now = new Date()
  const stored: CmsStoreItem = { ...item, updatedAt: now, createdAt: item.createdAt || now }
  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { $set: { [`cms.items.${collection}.${item.slug}`]: stored, updatedAt: now } }
  )
  return stored
}

export async function deleteItem(projectId: string, collection: string, itemSlug: string): Promise<void> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    {
      $unset: { [`cms.items.${collection}.${itemSlug}`]: '' },
      $set: { updatedAt: new Date() },
    }
  )
}
