// GET /api/backend/admin?projectId=…  — owner-authenticated backend overview
// for the Data Studio: collections + row counts, user count, and the keys of
// any stored secrets (never their values).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveOwnedBackend, listAppCollections, countAppUsers } from '@/lib/app-backend'
import { listSecrets } from '@/lib/app-secrets'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  const appId = req.nextUrl.searchParams.get('appId')
  const backend = await resolveOwnedBackend(session.user.id, { projectId, appId })
  if (!backend) return NextResponse.json({ error: 'No backend for this project. Add a backend first.' }, { status: 404 })

  const [collections, userCount, secrets] = await Promise.all([
    listAppCollections(backend.appId),
    countAppUsers(backend.appId),
    listSecrets(backend.appId),
  ])

  return NextResponse.json({
    appId: backend.appId,
    name: backend.name,
    baseUrl: `/api/backend/${backend.appId}`,
    collections,
    userCount,
    secrets,
  })
}
