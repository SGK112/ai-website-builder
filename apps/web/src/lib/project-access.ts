// Project access resolution — the single place that decides what a user may do
// with a project. Owner + collaborators (editor/viewer) + public.
//
// Works against the raw `projects` collection so it's consistent whether the
// doc was written by Mongoose or the raw driver (the workspace uses both).

import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'

export type ProjectRole = 'owner' | 'editor' | 'viewer'

export interface Access {
  project: any | null
  role: ProjectRole | null
}

export function canEdit(role: ProjectRole | null): boolean {
  return role === 'owner' || role === 'editor'
}

function ownerIdOf(project: any): string {
  return project?.userId?.toString?.() || String(project?.userId || '')
}

// Resolve a user's role for a project. session may be anonymous (null id) —
// then only public access is possible.
export async function resolveProjectAccess(
  db: Db,
  projectId: string,
  userId: string | null | undefined,
  userEmail: string | null | undefined,
): Promise<Access> {
  if (!ObjectId.isValid(projectId)) return { project: null, role: null }
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) })
  if (!project) return { project: null, role: null }

  if (userId && ownerIdOf(project) === userId) return { project, role: 'owner' }

  const email = (userEmail || '').toLowerCase()
  const collaborators: any[] = Array.isArray(project.collaborators) ? project.collaborators : []
  const match = collaborators.find(
    (c) => (userId && c.userId && String(c.userId) === userId) || (email && String(c.email || '').toLowerCase() === email),
  )
  if (match) return { project, role: match.role === 'viewer' ? 'viewer' : 'editor' }

  const isPublic = project.isPublic === true || project.status === 'published'
  if (isPublic) return { project, role: 'viewer' }

  return { project, role: null }
}
