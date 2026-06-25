import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { spendCredits } from '@/lib/credits'

export const dynamic = 'force-dynamic'
// 300s — long-running OpenAI Whisper call.
export const maxDuration = 300

// POST /api/ai/video/captions
// Auto-generates captions/transcript from a video URL using OpenAI Whisper.

// Only fetch from known media hosts (our generated/uploaded video origins) over
// https — NEVER an arbitrary client URL. Without this, videoUrl was a blind SSRF
// (http://169.254.169.254/…, localhost) and an unbounded-buffer OOM lever.
const ALLOWED_HOSTS = ['x.ai', 'replicate.delivery', 'replicate.com', 'res.cloudinary.com', 'cloudinary.com', 'cdn.pixabay.com']
const hostOk = (u: URL) => u.protocol === 'https:' && ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))
const MAX_BYTES = 100 * 1024 * 1024 // 100MB — don't buffer unbounded media into RAM

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Rate limit — Whisper costs real money and this buffers media.
  try {
    await checkApiRateLimit(req, 'aiGeneration')
  } catch (error) {
    const rateLimitResponse = handleRateLimitError(error)
    if (rateLimitResponse) return rateLimitResponse
    throw error
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      error: 'coming_soon',
      message: 'AI captions require OPENAI_API_KEY — set it in your environment to enable.',
      comingSoon: true,
    }, { status: 503 })
  }

  const { videoUrl } = await req.json().catch(() => ({}))
  if (!videoUrl) {
    return NextResponse.json({ error: 'videoUrl required' }, { status: 400 })
  }
  let url: URL
  try { url = new URL(String(videoUrl)) } catch { return NextResponse.json({ error: 'Invalid videoUrl' }, { status: 400 }) }
  if (!hostOk(url)) {
    return NextResponse.json({ error: 'Unsupported video host.' }, { status: 400 })
  }

  // Meter (transcription is paid external compute). Refund on any failure.
  const charge = await spendCredits(session, 'image_enhance')
  if (!charge.ok) {
    return NextResponse.json(
      { error: charge.error || 'Not enough credits.', requireCredits: charge.status === 402 },
      { status: charge.status || 402 },
    )
  }

  try {
    const videoRes = await fetch(url.toString())
    if (!videoRes.ok) throw new Error('Could not fetch video for transcription')
    const declared = Number(videoRes.headers.get('content-length') || 0)
    if (declared > MAX_BYTES) throw new Error('Video too large to transcribe (max 100MB).')

    const videoBuffer = await videoRes.arrayBuffer()
    if (videoBuffer.byteLength > MAX_BYTES) throw new Error('Video too large to transcribe (max 100MB).')
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })

    const form = new FormData()
    form.append('file', videoBlob, 'video.mp4')
    form.append('model', 'whisper-1')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'segment')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.json().catch(() => ({}))
      throw new Error(err.error?.message || `Whisper error ${whisperRes.status}`)
    }

    const data = await whisperRes.json()
    return NextResponse.json({
      transcript: data.text || '',
      segments: data.segments || [],
      language: data.language || 'en',
    })
  } catch (e: any) {
    await charge.refund()
    console.error('[captions]', e?.message)
    return NextResponse.json({ error: e?.message || 'Transcription failed' }, { status: 500 })
  }
}
