// POST /api/builder/cancel { buildId } — explicit Stop. Marks the build
// cancelled so the agent loop halts (vs a mere disconnect, which lets it
// finish in the background). The client calls this when the user hits Stop,
// THEN aborts the SSE fetch.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelBuild, getBuild } from '@/lib/builds-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const buildId = String(body?.buildId || '')
  if (!buildId) return NextResponse.json({ error: 'buildId required' }, { status: 400 })

  // Only let a user cancel their own build.
  const build = await getBuild(buildId, session.user.id)
  if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

  cancelBuild(buildId)
  return NextResponse.json({ ok: true })
}
