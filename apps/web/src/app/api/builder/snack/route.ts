// POST /api/builder/snack
// Uploads a generated Expo project's VFS to Expo Snack and returns the
// share / embed / Expo Go links. Auth-gated — Snack URLs are public, so we
// only let signed-in Webstew users publish through us.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User, isAdminEmail } from '@ai-website-builder/database'
import { saveSnack } from '@/lib/expo-snack'

export const dynamic = 'force-dynamic'
// Snack's save is usually <5s but the upstream has occasionally cold-started
// into the teens. Give it room without holding the request hostage.
export const maxDuration = 60

interface SnackRequestBody {
  files?: Record<string, string>
  name?: string
  description?: string
  slug?: string
  iconUrl?: string
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to publish to Expo Snack.' }, { status: 401 })
  }

  // Plan gate — device-preview via Snack is a paid feature (decision logged
  // in project_webstew_app_builder_2026_05_21). Admins bypass. DB hiccup =
  // soft-allow so a Mongo blip doesn't block paying users.
  try {
    await connectDB()
    const user: any = await User.findById(session.user.id).lean()
    const email = (user?.email || session.user.email || '').toLowerCase()
    const plan = (user?.plan || 'free') as string
    const isAdmin = email ? isAdminEmail(email) : false
    if (!isAdmin && plan === 'free') {
      return NextResponse.json(
        {
          error:
            'Running your app on a real phone is a Pro feature — upgrade to share builds with your phone.',
          upgrade: true,
          plan,
        },
        { status: 402 },
      )
    }
  } catch (e: any) {
    console.warn('[Snack] plan check soft-allowed after DB error:', e?.message || e)
  }

  let body: SnackRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const files = body.files
  if (!files || typeof files !== 'object' || !Object.keys(files).length) {
    return NextResponse.json({ error: 'No files supplied' }, { status: 400 })
  }
  // Hard cap on payload size — Snack itself rejects very large projects and
  // we'd rather fail fast than burn 60s on a request that can't succeed.
  const totalChars = Object.values(files).reduce((n, v) => n + (typeof v === 'string' ? v.length : 0), 0)
  if (totalChars > 600_000) {
    return NextResponse.json(
      { error: 'Project is too large to publish to Snack (over ~600KB of source).' },
      { status: 413 },
    )
  }

  // Only accept https Cloudinary-hosted icons — we own that bucket and it
  // means we can guarantee Expo Go can fetch the URL. Random user-supplied
  // URLs would be a SSRF vector + reliability risk.
  let iconUrl: string | undefined
  if (typeof body.iconUrl === 'string' && body.iconUrl) {
    if (/^https:\/\/res\.cloudinary\.com\//.test(body.iconUrl)) {
      iconUrl = body.iconUrl
    } else {
      console.warn('[Snack] ignoring non-Cloudinary iconUrl')
    }
  }

  try {
    const result = await saveSnack({
      files,
      name: body.name,
      description: body.description,
      slug: body.slug,
      iconUrl,
    })
    return NextResponse.json(result)
  } catch (err: any) {
    const msg = err?.message || 'Snack save failed'
    console.warn('[Snack] save failed:', msg)
    // 502 — upstream Snack failure, not the caller's fault.
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
