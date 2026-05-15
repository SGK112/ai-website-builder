// GET /api/media?q=keywords&w=600&h=600&type=photo|video
//
// 302 redirects to a Pexels CDN URL matching the query. First hit per
// (provider, type, q, w, h) calls the Pexels API and caches the resolved
// URL in media_cache; later hits skip the network. Lets <img src> work
// directly — no React/JSON glue.
//
// Photos are CDN-resized via Pexels query params (?auto=compress&w=&h=&fit=crop).
// Videos pick the MP4 file whose width is closest to (and >=) the requested w.
//
// Attribution: cache row stores photographer + photographer_url + Pexels URL
// so any UI that renders credit can pull from media_cache directly.

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Fallback used when Pexels is unavailable (no API key, network error, rate
// limited, no results). Returns a deterministic Picsum URL so demos still
// show *something* — random photo, but consistent across reloads.
const picsumFallback = (q: string, w: number, h: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(q.replace(/\W+/g, '-'))}/${w}/${h}`

// Wraps a promise with a hard timeout. Used so a hung Mongo connection
// (e.g. local dev pointing at a Mongo that isn't running) doesn't block
// the request forever — we bail to the direct-Pexels path instead.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    p.then((v) => { clearTimeout(timer); resolve(v) }).catch(() => { clearTimeout(timer); resolve(null) })
  })
}

interface PexelsPhoto {
  id: number
  url: string
  photographer: string
  photographer_url: string
  src: { original: string }
}

interface PexelsVideo {
  id: number
  url: string
  user: { name: string; url: string }
  video_files: Array<{ link: string; width: number; height: number; file_type: string }>
}

function sizedPhotoUrl(originalSrc: string, w: number, h: number): string {
  return `${originalSrc}?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`
}

function pickVideoFile(files: PexelsVideo['video_files'], w: number): string | undefined {
  const mp4 = files.filter((f) => f.file_type === 'video/mp4').sort((a, b) => a.width - b.width)
  return (mp4.find((f) => f.width >= w) || mp4[mp4.length - 1])?.link
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY

  const sp = req.nextUrl.searchParams
  const q = (sp.get('q') || '').trim()
  const w = Math.max(50, Math.min(2400, parseInt(sp.get('w') || '600', 10) || 600))
  const h = Math.max(50, Math.min(2400, parseInt(sp.get('h') || '600', 10) || 600))
  const type: 'photo' | 'video' = sp.get('type') === 'video' ? 'video' : 'photo'

  if (!q) {
    return NextResponse.json({ error: 'q (query) required' }, { status: 400 })
  }

  // Last-resort fallback URL — used when anything below fails. Always a
  // valid image so the surrounding <img> doesn't render a broken icon.
  const fallback = picsumFallback(q, w, h)

  // No key? Skip Pexels entirely (e.g. local dev without a key configured).
  if (!apiKey) {
    return NextResponse.redirect(fallback, { status: 302 })
  }

  // Normalise the cache key so "Pearl Necklace" and "pearl,necklace" both
  // map to the same row when the photo would be reusable.
  const normQuery = q.toLowerCase().replace(/[,\s]+/g, '_').replace(/[^a-z0-9_]/g, '')
  const cacheKey = `pexels:${type}:${normQuery}:${w}x${h}`

  // Try the cache, but never let a slow/down Mongo block the route.
  // withTimeout returns null on miss/timeout/error so we fall through to
  // a direct Pexels call.
  const cached = await withTimeout(
    (async () => {
      const client = await clientPromise
      const db = client.db('ai-website-builder')
      return db.collection('media_cache').findOne({ key: cacheKey })
    })(),
    3000
  )
  if (cached?.url) {
    return NextResponse.redirect(cached.url, {
      status: 302,
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    })
  }

  // Cache miss (or unreachable) — call Pexels.
  const endpoint =
    type === 'video'
      ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`
      : `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=${w > h ? 'landscape' : h > w ? 'portrait' : 'square'}`

  let data: any
  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) {
      console.warn(`[/api/media] Pexels ${res.status} for "${q}" — falling back to picsum`)
      return NextResponse.redirect(fallback, { status: 302 })
    }
    data = await res.json()
  } catch (e: any) {
    console.warn(`[/api/media] Pexels fetch failed for "${q}":`, e?.message || e)
    return NextResponse.redirect(fallback, { status: 302 })
  }

  let url: string | undefined
  let credit: Record<string, any> = {}

  if (type === 'video') {
    const v: PexelsVideo | undefined = data?.videos?.[0]
    url = v ? pickVideoFile(v.video_files || [], w) : undefined
    if (v) {
      credit = {
        provider: 'pexels',
        mediaId: v.id,
        pexelsUrl: v.url,
        photographer: v.user?.name,
        photographerUrl: v.user?.url,
      }
    }
  } else {
    const p: PexelsPhoto | undefined = data?.photos?.[0]
    url = p?.src?.original ? sizedPhotoUrl(p.src.original, w, h) : undefined
    if (p) {
      credit = {
        provider: 'pexels',
        mediaId: p.id,
        pexelsUrl: p.url,
        photographer: p.photographer,
        photographerUrl: p.photographer_url,
      }
    }
  }

  if (!url) {
    // Pexels returned 200 but no results for this query — fall back.
    return NextResponse.redirect(fallback, { status: 302 })
  }

  // Fire-and-forget cache write. Time-boxed so a slow Mongo doesn't
  // make the user wait. Errors are swallowed (cache is optional).
  withTimeout(
    (async () => {
      const client = await clientPromise
      const db = client.db('ai-website-builder')
      await db.collection('media_cache').insertOne({
        key: cacheKey,
        url,
        ...credit,
        query: q,
        width: w,
        height: h,
        type,
        createdAt: new Date(),
      })
    })(),
    3000
  ).catch(() => {})

  return NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  })
}
