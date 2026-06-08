// POST /api/builder/feedback — thumbs up/down (+ optional "what went wrong")
// on an AI build/edit. Stored per-user; down-votes with a comment are fed back
// into future builds (see getRecentNegativeNotes).
//
//   POST { messageKey, rating: 'up'|'down', comment?, prompt?, projectId?,
//          buildId?, target?, model? }
//   GET  → { up, down } stats for the signed-in user

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveFeedback, getFeedbackStats } from '@/lib/feedback-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const messageKey = String(body?.messageKey || '').slice(0, 200)
  const rating = body?.rating === 'down' ? 'down' : body?.rating === 'up' ? 'up' : null
  if (!messageKey) return NextResponse.json({ error: 'messageKey required' }, { status: 400 })
  if (!rating) return NextResponse.json({ error: "rating must be 'up' or 'down'" }, { status: 400 })

  await saveFeedback({
    userId: session.user.id,
    projectId: body?.projectId ? String(body.projectId) : null,
    buildId: body?.buildId ? String(body.buildId) : null,
    messageKey,
    rating,
    comment: body?.comment ? String(body.comment) : undefined,
    prompt: body?.prompt ? String(body.prompt) : undefined,
    target: body?.target ? String(body.target) : undefined,
    model: body?.model ? String(body.model) : undefined,
  })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  return NextResponse.json(await getFeedbackStats(session.user.id))
}
