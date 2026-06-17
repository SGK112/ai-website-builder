// POST /api/ai/video/share — mint a PUBLIC share link for a finished video.
//
// The video file already lives on our Cloudinary CDN; this creates a
// `shared_videos` record (unguessable shareId) that the public watch page at
// /v/<shareId> reads to render a player + a "make your own" CTA back to the
// studio. No file is re-hosted — webstew hosts the watch PAGE, Cloudinary
// hosts the bytes.
//
// Dedupe: re-sharing the same video for the same user returns the same link.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_HOSTS = ['res.cloudinary.com', 'cloudinary.com', 'x.ai', 'replicate.delivery', 'replicate.com']
const urlOk = (s: string) => { try { const u = new URL(s); return u.protocol === 'https:' && ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`)) } catch { return false } }

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://www.webstew.net').replace(/\/+$/, '')
}

async function col() {
  const conn = await connectDB()
  const db = conn.connection.db
  if (!db) throw new Error('DB unavailable')
  return db.collection('shared_videos')
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: { url?: string; title?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  if (!body.url || !urlOk(body.url)) return NextResponse.json({ error: 'A valid video URL is required.' }, { status: 400 })

  const c = await col()
  const userId = String(session.user.id)

  // Reuse an existing share for this exact video so the link is stable.
  const existing = await c.findOne({ userId, url: body.url })
  if (existing) return NextResponse.json({ shareId: existing.shareId, shareUrl: `${baseUrl()}/v/${existing.shareId}` })

  // URL-safe, unguessable, short-ish id.
  const shareId = crypto.randomBytes(9).toString('base64url')
  await c.insertOne({
    shareId, userId, url: body.url,
    title: (body.title || 'A Webstew video').slice(0, 120),
    views: 0, createdAt: new Date(),
  })
  return NextResponse.json({ shareId, shareUrl: `${baseUrl()}/v/${shareId}` })
}
