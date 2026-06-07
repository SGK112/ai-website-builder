// Shared helpers for the managed-backend admin surfaces (Data Studio +
// server-actions). All owner-authenticated paths resolve the app via the
// project's owner so one user can never read another tenant's data.

import { connectDB } from '@/lib/db'

export interface AppBackend {
  appId: string
  apiKey: string
  userId: string
  projectId: string | null
  name: string
}

async function getDb() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

// Resolve the backend a user owns, by projectId OR appId. Returns null if the
// user doesn't own a matching backend — callers turn that into a 404/403.
export async function resolveOwnedBackend(
  userId: string,
  opts: { projectId?: string | null; appId?: string | null },
): Promise<AppBackend | null> {
  const db = await getDb()
  const filter: any = { userId }
  if (opts.appId) filter.appId = opts.appId
  else if (opts.projectId) filter.projectId = opts.projectId
  else return null
  const b = await db.collection('app_backends').findOne(filter)
  if (!b) return null
  return {
    appId: b.appId,
    apiKey: b.apiKey,
    userId: b.userId,
    projectId: b.projectId ?? null,
    name: b.name || 'App backend',
  }
}

// Collections that exist in app_data for an app, with row counts. Excludes the
// reserved auth collection (_users is surfaced separately as "Users").
export async function listAppCollections(appId: string): Promise<Array<{ collection: string; count: number }>> {
  const db = await getDb()
  const rows = await db
    .collection('app_data')
    .aggregate([
      { $match: { appId } },
      { $group: { _id: '$collection', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray()
  return rows.map((r) => ({ collection: r._id, count: r.count }))
}

export async function countAppUsers(appId: string): Promise<number> {
  const db = await getDb()
  return db.collection('app_users').countDocuments({ appId })
}
