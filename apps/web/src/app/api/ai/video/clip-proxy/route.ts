// GET /api/ai/video/clip-proxy?url=<encoded> — same-origin proxy for clip bytes.
//
// ffmpeg.wasm stitches clips by fetch()-ing each clip URL in the browser. The
// generated clips live on cross-origin hosts (xAI vidgen, Replicate delivery)
// that don't send permissive CORS headers, so a direct browser fetch fails and
// the stitch breaks. This route fetches the bytes server-side (no CORS) and
// streams them back from our own origin. Locked to an allow-list so it can't be
// turned into an open proxy / SSRF tool.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Hosts our generated media actually comes from. Suffix-matched against the
// request host so subdomains (e.g. <bucket>.replicate.delivery) are allowed.
const ALLOWED_HOST_SUFFIXES = [
  'x.ai',                 // vidgen.x.ai (Grok video output)
  'replicate.delivery',   // Replicate CDN
  'replicate.com',
  'res.cloudinary.com',   // our Cloudinary
  'cloudinary.com',
]

function isAllowed(u: URL): boolean {
  if (u.protocol !== 'https:') return false
  const host = u.hostname.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some(s => host === s || host.endsWith(`.${s}`))
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const raw = new URL(request.url).searchParams.get('url')
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch { return NextResponse.json({ error: 'Invalid url' }, { status: 400 }) }
  if (!isAllowed(target)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  let upstream: Response
  try {
    upstream = await fetch(target.toString(), { redirect: 'follow' })
  } catch (e: any) {
    return NextResponse.json({ error: `Upstream fetch failed: ${e?.message || e}` }, { status: 502 })
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: 502 })
  }

  // Stream the bytes straight through (no buffering) from our origin.
  const headers = new Headers()
  headers.set('Content-Type', upstream.headers.get('content-type') || 'video/mp4')
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  headers.set('Cache-Control', 'private, max-age=300')
  return new NextResponse(upstream.body, { status: 200, headers })
}
