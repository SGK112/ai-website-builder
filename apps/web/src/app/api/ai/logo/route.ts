// POST /api/ai/logo — generate a logo / icon / image from a text description via
// xAI grok-imagine-image (the only image provider with a key in prod; Replicate
// isn't configured). Synchronous. Persists to Cloudinary (xAI image URLs are
// temporary) so the result is durable, and meters credits (image_generation=5,
// refunded on failure). The caller saves it to the creations library.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spendCredits } from '@/lib/credits'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const XAI_KEY = process.env.XAI_API_KEY
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const CKEY = process.env.CLOUDINARY_API_KEY
const CSECRET = process.env.CLOUDINARY_API_SECRET

async function persistToCloudinary(srcUrl: string, userId: string): Promise<string | null> {
  if (!CLOUD || !CKEY || !CSECRET) return null
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const publicId = `logo-${timestamp}`
    const folder = `webstew/${userId}`
    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${CSECRET}`
    const signature = createHash('sha1').update(toSign).digest('hex')
    const form = new URLSearchParams()
    form.set('file', srcUrl); form.set('api_key', CKEY); form.set('timestamp', String(timestamp))
    form.set('signature', signature); form.set('public_id', publicId); form.set('folder', folder)
    const up = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: form })
    const data = await up.json().catch(() => ({}))
    return up.ok && data.secure_url ? data.secure_url : null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to create images.' }, { status: 401 })
  if (!XAI_KEY) return NextResponse.json({ error: 'Image generation is not configured on this server.' }, { status: 503 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const prompt = String(body?.prompt || '').trim().slice(0, 1000)
  if (prompt.length < 3) return NextResponse.json({ error: 'A description is required.' }, { status: 400 })

  const spend = await spendCredits(session, 'image_generation')
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error, ...(spend.status === 402 ? { reason: 'insufficient_credits' } : {}) }, { status: spend.status || 402 })
  }

  try {
    const r = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 }),
      signal: AbortSignal.timeout(90_000),
    })
    const d = await r.json().catch(() => ({}))
    const tempUrl = d?.data?.[0]?.url
    if (!r.ok || !tempUrl) {
      await spend.refund()
      return NextResponse.json({ error: d?.error?.message || d?.error || 'Image generation failed.' }, { status: 502 })
    }
    // xAI image URLs are temporary — persist so the creation stays viewable.
    const url = (await persistToCloudinary(tempUrl, session.user.id)) || tempUrl
    return NextResponse.json({ url })
  } catch (e: any) {
    await spend.refund()
    return NextResponse.json({ error: e?.name === 'TimeoutError' ? 'Image generation timed out — try again.' : 'Image generation failed. Try again.' }, { status: 502 })
  }
}
