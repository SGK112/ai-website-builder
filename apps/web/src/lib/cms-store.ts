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

// Upsert a collection schema. Returns the persisted schema along with any
// orphan field keys we cleaned up — fields that existed in the old schema
// but were dropped from the new one. We strip those keys from every item in
// the collection so the data stays authoritative under the latest schema.
// Callers can surface the orphan list to the user as a confirmation.
export interface UpsertSchemaResult {
  schema: CmsStoreSchema
  removedFieldKeys: string[]
  itemsAffected: number
}

export async function upsertSchema(
  projectId: string,
  schema: CmsStoreSchema,
  prev?: CmsStoreSchema | null
): Promise<UpsertSchemaResult> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db!
  const now = new Date()
  const path = `cms.schemas.${schema.slug}`
  const next: CmsStoreSchema = { ...schema, updatedAt: now, createdAt: schema.createdAt || now }
  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { $set: { [path]: next, updatedAt: now } }
  )

  // Detect dropped field keys and unset them from every item in the
  // collection. Mongoose-bypass note still applies — direct driver.
  let removedFieldKeys: string[] = []
  let itemsAffected = 0
  if (prev?.fields?.length) {
    const newKeys = new Set(schema.fields.map((f) => f.key))
    removedFieldKeys = prev.fields.map((f) => f.key).filter((k) => !newKeys.has(k))
    if (removedFieldKeys.length > 0) {
      const unsetSpec: Record<string, ''> = {}
      // Load fresh to enumerate item slugs in this collection
      const proj = await db.collection('projects').findOne(
        { _id: new ObjectId(projectId) },
        { projection: { [`cms.items.${schema.slug}`]: 1 } }
      )
      const items = (proj?.cms?.items?.[schema.slug] || {}) as Record<string, any>
      for (const itemSlug of Object.keys(items)) {
        for (const k of removedFieldKeys) {
          unsetSpec[`cms.items.${schema.slug}.${itemSlug}.fields.${k}`] = ''
        }
      }
      if (Object.keys(unsetSpec).length > 0) {
        const res = await db.collection('projects').updateOne(
          { _id: new ObjectId(projectId) },
          { $unset: unsetSpec, $set: { updatedAt: now } }
        )
        itemsAffected = Object.keys(items).length
      }
    }
  }

  return { schema: next, removedFieldKeys, itemsAffected }
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

  // Load prior state so we can detect a draft→published transition. A
  // re-publish (already-published item updated) shouldn't refire the
  // notification — would be noisy on every edit.
  const prior = await db.collection('projects').findOne(
    { _id: new ObjectId(projectId) },
    { projection: { [`cms.items.${collection}.${item.slug}`]: 1, userId: 1 } }
  )
  const wasPublished = prior?.cms?.items?.[collection]?.[item.slug]?.status === 'published'
  const ownerId: string | undefined = prior?.userId?.toString?.()

  const stored: CmsStoreItem = { ...item, updatedAt: now, createdAt: item.createdAt || now }
  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { $set: { [`cms.items.${collection}.${item.slug}`]: stored, updatedAt: now } }
  )

  // Fire publish hook for newly-published items, fire-and-forget so a slow
  // Composio call doesn't block the write. See lib/cms-publish-hook.ts.
  if (stored.status === 'published' && !wasPublished && ownerId) {
    import('@/lib/cms-publish-hook')
      .then((m) => m.firePublishHook({ projectId, collection, item: stored, ownerId }))
      .catch((e) => console.warn('[cms] publish hook import failed:', e?.message))
  }

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
