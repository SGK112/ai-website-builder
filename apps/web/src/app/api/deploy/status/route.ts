// GET /api/deploy/status?serviceId=srv-xxx
//
// Polls the latest Render deploy for a service and maps its state to a simple
// status. /api/deploy returns success at service-CREATION time (before the
// build runs), so the UI used to show "deployed" + a URL that 404s if the
// build later fails. The workspace polls this after deploying to flip to a
// real "live" or "build failed" state.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserCredential } from '@/lib/credentials-store'

export const dynamic = 'force-dynamic'

const ENV_RENDER_API_KEY = process.env.RENDER_API_KEY

// Render deploy.status → our simple buckets.
function mapStatus(s: string): 'building' | 'live' | 'failed' | 'canceled' | 'unknown' {
  if (s === 'live') return 'live'
  if (s === 'canceled') return 'canceled'
  if (/_failed$/.test(s) || s === 'failed') return 'failed'
  if (/(_in_progress|created|queued|building)$/.test(s) || /_in_progress/.test(s)) return 'building'
  return 'unknown'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const serviceId = new URL(req.url).searchParams.get('serviceId')?.trim()
  if (!serviceId || !/^srv-[a-zA-Z0-9]+$/.test(serviceId)) {
    return NextResponse.json({ error: 'Valid serviceId required' }, { status: 400 })
  }

  const renderKey = (await getUserCredential(session.user.id, 'render')) || ENV_RENDER_API_KEY
  if (!renderKey) {
    return NextResponse.json({ error: 'Render not configured', status: 'unknown' }, { status: 503 })
  }

  try {
    const res = await fetch(`https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/deploys?limit=1`, {
      headers: { Authorization: `Bearer ${renderKey}`, Accept: 'application/json' },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json({ error: `Render ${res.status}`, detail: body.slice(0, 200), status: 'unknown' }, { status: 502 })
    }
    const list = await res.json().catch(() => [])
    const latest = Array.isArray(list) ? list[0]?.deploy : null
    const renderStatus = String(latest?.status || 'unknown')
    return NextResponse.json({
      status: mapStatus(renderStatus),
      renderStatus,
      finishedAt: latest?.finishedAt || null,
      commitId: latest?.commit?.id || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'status check failed', status: 'unknown' }, { status: 502 })
  }
}
