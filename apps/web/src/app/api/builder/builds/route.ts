// Builds that finished while the user was away.
//
//   GET  ?id=<buildId>   → the full build (files) to restore it
//   GET                  → list of unseen finished builds (for a "ready" banner)
//   POST { buildId }     → mark a build as seen (dismiss / after loading)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBuild, getUnseenFinishedBuilds, markBuildSeen } from '@/lib/builds-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const build = await getBuild(id, session.user.id)
    if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    return NextResponse.json({
      build: {
        buildId: build.buildId, projectId: build.projectId, target: build.target,
        status: build.status, summary: build.summary, prompt: build.prompt,
        files: build.files || [], completedAt: build.completedAt,
      },
    })
  }

  const builds = await getUnseenFinishedBuilds(session.user.id)
  return NextResponse.json({
    builds: builds.map((b) => ({
      buildId: b.buildId, projectId: b.projectId, target: b.target,
      summary: b.summary, prompt: b.prompt, fileCount: (b.files || []).length, completedAt: b.completedAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const buildId = String(body?.buildId || '')
  if (!buildId) return NextResponse.json({ error: 'buildId required' }, { status: 400 })
  await markBuildSeen(buildId, session.user.id)
  return NextResponse.json({ ok: true })
}
