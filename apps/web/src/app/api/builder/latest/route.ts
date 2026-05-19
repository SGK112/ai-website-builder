// /api/builder/latest — read + dismiss the user's most recent unclaimed
// completed build. Powers the "Welcome back, your site finished while you
// were gone" resume banner on /workspace mount.
//
// GET   → returns { build } (the doc) or { build: null }
// PATCH → body { id, consumed: true } marks it claimed so we don't keep
//         re-offering the same one.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLatestUnclaimedBuild, markBuildConsumed } from '@/lib/pending-builds'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ build: null }, { status: 200 })
  }
  try {
    const build = await getLatestUnclaimedBuild(session.user.id)
    if (!build) return NextResponse.json({ build: null })
    // Trim what we send back — html/files can be large, but the resume
    // banner needs them to actually load the result on click.
    return NextResponse.json({
      build: {
        id: String(build._id),
        kind: build.kind,
        status: build.status,
        prompt: build.prompt,
        model: build.model,
        html: build.html,
        files: build.files,
        name: build.name,
        slug: build.slug,
        description: build.description,
        error: build.error,
        startedAt: build.startedAt,
        completedAt: build.completedAt,
      },
    })
  } catch (e: any) {
    console.error('[latest] GET failed:', e?.message || e)
    return NextResponse.json({ build: null }, { status: 200 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  let body: { id?: string; consumed?: boolean }
  try { body = await req.json() } catch { body = {} }
  if (!body.id || body.consumed !== true) {
    return NextResponse.json({ error: 'id + consumed:true required' }, { status: 400 })
  }
  try {
    const ok = await markBuildConsumed(session.user.id, body.id)
    return NextResponse.json({ ok })
  } catch (e: any) {
    console.error('[latest] PATCH failed:', e?.message || e)
    return NextResponse.json({ error: 'Could not mark consumed' }, { status: 500 })
  }
}
