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
// limited, no results). Returns a data-URI SVG placeholder — always loads,
// never rate-limits, shows the query keyword so it's clear what the image is for.
const picsumFallback = (q: string, w: number, h: number) => {
  const label = encodeURIComponent(q.slice(0, 40))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#e2e8f0"/><text x="50%" y="50%" font-family="system-ui,sans-serif" font-size="${Math.max(12, Math.min(24, Math.floor(w / 15)))}" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">${decodeURIComponent(label)}</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// Wraps a promise with a hard timeout. Used so a hung Mongo connection
// (e.g. local dev pointing at a Mongo that isn't running) doesn't block
// the request forever — we bail to the direct-Pexels path instead.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    p.then((v) => { clearTimeout(timer); resolve(v) }).catch(() => { clearTimeout(timer); resolve(null) })
  })
}

// Hot in-process cache (single Render instance). A repeat query then skips the
// Mongo round-trip entirely — a warm hit drops from a ~300ms DB lookup to ~0ms,
// which matters when a page loads 10-40 images at once. The durable cache still
// lives in Mongo (media_cache); this is just the fast lane in front of it.
// FIFO-capped so it can't grow unbounded.
const MEM_MAX = 3000
const memUrl = new Map<string, string>()
const memVariants = new Map<string, string[]>()
function memSet<T>(m: Map<string, T>, k: string, val: T) {
  if (m.size >= MEM_MAX) {
    const first = m.keys().next().value
    if (first !== undefined) m.delete(first)
  }
  m.set(k, val)
}
function mediaRedirect(url: string): NextResponse {
  return NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
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
  // Variant index (0..5) — used by the workspace Stock Photos picker to
  // show 6 thumbnails for the same query without burning 6 Pexels API
  // calls. We fetch per_page=6 once on cache miss, then resolve v=N from
  // the cached batch row.
  const vRaw = sp.get('v')
  const v = vRaw !== null ? Math.max(0, Math.min(5, parseInt(vRaw, 10) || 0)) : null

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
  // map to the same row when the photo would be reusable. Variant batches
  // share a key — we resolve v=N from the row's `variants` array.
  const normQuery = q.toLowerCase().replace(/[,\s]+/g, '_').replace(/[^a-z0-9_]/g, '')
  const isBatch = v !== null
  const cacheKey = isBatch
    ? `pexels:${type}:${normQuery}:${w}x${h}:batch6`
    : `pexels:${type}:${normQuery}:${w}x${h}`

  // Fastest lane: in-process cache — no network, no DB.
  const memHit = isBatch ? memVariants.get(cacheKey)?.[v!] : memUrl.get(cacheKey)
  if (memHit) return mediaRedirect(memHit)

  // Durable cache (Mongo). Tight timeout so a slow/cold Mongo connection
  // fast-fails to the direct Pexels call instead of stalling the request.
  const cached = await withTimeout(
    (async () => {
      const client = await clientPromise
      const db = client.db('ai-website-builder')
      return db.collection('media_cache').findOne({ key: cacheKey })
    })(),
    1500
  )
  if (cached) {
    if (isBatch && Array.isArray(cached.variants)) memSet(memVariants, cacheKey, cached.variants)
    else if (!isBatch && cached.url) memSet(memUrl, cacheKey, cached.url)
    const hitUrl = isBatch
      ? (Array.isArray(cached.variants) ? cached.variants[v!] : undefined)
      : cached.url
    if (hitUrl) return mediaRedirect(hitUrl)
  }

  // Cache miss (or unreachable) — call Pexels. For variant requests we
  // pull per_page=6 once so all 6 thumbnails resolve from a single API
  // call (vs 6 round trips).
  const perPage = isBatch ? 6 : 1
  const endpoint =
    type === 'video'
      ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=landscape`
      : `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=${w > h ? 'landscape' : h > w ? 'portrait' : 'square'}`

  let data: any
  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
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
  let variants: string[] | undefined
  let credit: Record<string, any> = {}

  if (type === 'video') {
    const items: PexelsVideo[] = Array.isArray(data?.videos) ? data.videos : []
    if (isBatch) {
      variants = items.map((vd) => pickVideoFile(vd.video_files || [], w)).filter(Boolean) as string[]
      url = variants[v!]
    } else {
      const vd = items[0]
      url = vd ? pickVideoFile(vd.video_files || [], w) : undefined
      if (vd) {
        credit = {
          provider: 'pexels',
          mediaId: vd.id,
          pexelsUrl: vd.url,
          photographer: vd.user?.name,
          photographerUrl: vd.user?.url,
        }
      }
    }
  } else {
    const items: PexelsPhoto[] = Array.isArray(data?.photos) ? data.photos : []
    if (isBatch) {
      variants = items
        .map((p) => p?.src?.original ? sizedPhotoUrl(p.src.original, w, h) : null)
        .filter(Boolean) as string[]
      url = variants[v!]
    } else {
      const p = items[0]
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
  }

  if (!url) {
    // Pexels returned 200 but no results for this query (or the requested
    // variant index is out of range) — fall back.
    return NextResponse.redirect(fallback, { status: 302 })
  }

  // Populate the in-process fast lane immediately (the Mongo write below is
  // fire-and-forget and may lag or be skipped).
  if (isBatch && variants) memSet(memVariants, cacheKey, variants)
  else if (!isBatch) memSet(memUrl, cacheKey, url)

  // Fire-and-forget cache write. Time-boxed so a slow Mongo doesn't
  // make the user wait. Errors are swallowed (cache is optional).
  withTimeout(
    (async () => {
      const client = await clientPromise
      const db = client.db('ai-website-builder')
      const row: Record<string, any> = {
        key: cacheKey,
        query: q,
        width: w,
        height: h,
        type,
        createdAt: new Date(),
      }
      if (isBatch && variants) {
        row.variants = variants
      } else {
        row.url = url
        Object.assign(row, credit)
      }
      await db.collection('media_cache').insertOne(row)
    })(),
    3000
  ).catch(() => {})

  return NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  })
}
