import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/ai/video/captions
// Auto-generates captions/transcript from a video URL using OpenAI Whisper.
// Requires OPENAI_API_KEY. Returns { transcript, segments }.

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      error: 'coming_soon',
      message: 'AI captions require OPENAI_API_KEY — set it in your environment to enable.',
      comingSoon: true,
    }, { status: 503 })
  }

  try {
    const { videoUrl } = await req.json()
    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl required' }, { status: 400 })
    }

    // Fetch the video and pipe to Whisper
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) throw new Error('Could not fetch video for transcription')

    const videoBuffer = await videoRes.arrayBuffer()
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
    console.error('[captions]', e?.message)
    return NextResponse.json({ error: e?.message || 'Transcription failed' }, { status: 500 })
  }
}
