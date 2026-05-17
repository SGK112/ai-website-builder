import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TOKEN = process.env.REPLICATE_API_TOKEN

// ── Model registry ──────────────────────────────────────────────────────────
// isOfficial=true  → POST to /v1/models/{owner}/{name}/predictions
// isOfficial=false → POST to /v1/predictions with { version: "sha256..." }
//
// Seedance is the default — fastest quality-per-second model right now.
// Supports both text-to-video AND image-to-video with the same endpoint.

const MODELS = {
  seedance: {
    id: 'bytedance/seedance-1-lite:78c9c4b0a7056c911b0483f58349b9931aff30d6465e7ab665e6c852949ce6d5',
    label: 'Seedance 1 Lite',
    isOfficial: false,
    supportsImage: true,
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
  },
  animatediff: {
    id: 'lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f',
    label: 'AnimateDiff',
    isOfficial: false,
    supportsImage: false,
    maxDuration: 4,
    resolutions: [],
  },
  zeroscope: {
    id: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
    label: 'Zeroscope XL',
    isOfficial: false,
    supportsImage: false,
    maxDuration: 3,
    resolutions: [],
  },
  wan: {
    id: 'wan-video/wan2.1-t2v-480p',
    label: 'Wan 2.1',
    isOfficial: true,
    supportsImage: false,
    maxDuration: 5,
    resolutions: [],
  },
  svd: {
    id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    label: 'Stable Video Diffusion',
    isOfficial: false,
    supportsImage: true,
    maxDuration: 4,
    resolutions: [],
  },
} as const

type ModelKey = keyof typeof MODELS

interface VideoRequest {
  action: 'text-to-video' | 'image-to-video' | 'status'
  prompt?: string
  imageUrl?: string
  model?: string
  duration?: number
  fps?: number
  aspectRatio?: string
  resolution?: string
  predictionId?: string
  style?: string
}

// ── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!TOKEN) {
    return NextResponse.json({ error: 'REPLICATE_API_TOKEN not configured' }, { status: 500 })
  }

  try {
    const body: VideoRequest = await request.json()
    const { action } = body

    if (action === 'status') {
      if (!body.predictionId) return NextResponse.json({ error: 'predictionId required' }, { status: 400 })
      return pollOnce(body.predictionId)
    }

    const modelKey = (body.model as ModelKey) || 'seedance'
    const model = MODELS[modelKey] ?? MODELS.seedance

    if (action === 'image-to-video') {
      if (!body.imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 })
      return startPrediction(buildImageToVideoInput(body, model, modelKey), model)
    }

    // text-to-video
    if (!body.prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    return startPrediction(buildTextToVideoInput(body, model, modelKey), model)

  } catch (e: any) {
    console.error('[video] error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Video generation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id')
  if (!TOKEN) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not configured' }, { status: 500 })
  if (!id) {
    return NextResponse.json({
      models: Object.entries(MODELS).map(([k, v]) => ({
        id: k, label: v.label, supportsImage: v.supportsImage, maxDuration: v.maxDuration,
      })),
      configured: !!TOKEN,
    })
  }
  return pollOnce(id)
}

// ── Input builders ───────────────────────────────────────────────────────────

function buildTextToVideoInput(body: VideoRequest, model: typeof MODELS[ModelKey], key: ModelKey) {
  const prompt = enhancePrompt(body.prompt!, body.style)
  const duration = Math.min(body.duration ?? 5, model.maxDuration)
  const aspectRatio = body.aspectRatio ?? '16:9'

  if (key === 'seedance') {
    return {
      prompt,
      duration,
      aspect_ratio: aspectRatio,
      resolution: body.resolution ?? '480p',
      fps: body.fps ?? 24,
      camera_fixed: false,
    }
  }
  if (key === 'animatediff') {
    return {
      prompt,
      negative_prompt: 'bad quality, blurry, distorted, low resolution',
      num_frames: Math.min(duration * (body.fps ?? 8), 32),
      num_inference_steps: 25,
      guidance_scale: 7.5,
    }
  }
  if (key === 'zeroscope') {
    return {
      prompt,
      negative_prompt: 'bad quality, low resolution',
      num_frames: Math.min(duration * 8, 24),
      fps: body.fps ?? 8,
    }
  }
  if (key === 'wan') {
    return { prompt, duration }
  }
  return { prompt, num_frames: duration * (body.fps ?? 8) }
}

function buildImageToVideoInput(body: VideoRequest, model: typeof MODELS[ModelKey], key: ModelKey) {
  const duration = Math.min(body.duration ?? 5, model.maxDuration)

  if (key === 'seedance') {
    return {
      image: body.imageUrl,
      prompt: body.prompt ? enhancePrompt(body.prompt) : 'Smooth natural motion',
      duration,
      aspect_ratio: body.aspectRatio ?? '16:9',
      resolution: body.resolution ?? '480p',
      fps: body.fps ?? 24,
      camera_fixed: false,
    }
  }
  if (key === 'svd') {
    return {
      input_image: body.imageUrl,
      motion_bucket_id: 127,
      cond_aug: 0.02,
      fps: body.fps ?? 8,
      seed: Math.floor(Math.random() * 1_000_000),
    }
  }
  // fallback: try seedance anyway
  return {
    image: body.imageUrl,
    prompt: body.prompt ? enhancePrompt(body.prompt) : 'Smooth natural motion',
    duration,
  }
}

// ── Replicate helpers ────────────────────────────────────────────────────────

async function startPrediction(input: Record<string, unknown>, model: typeof MODELS[ModelKey]) {
  const isOfficial = model.isOfficial
  const modelId = model.id

  const url = isOfficial
    ? `https://api.replicate.com/v1/models/${modelId}/predictions`
    : 'https://api.replicate.com/v1/predictions'

  const body = isOfficial
    ? { input }
    : { version: modelId.split(':')[1], input }

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Replicate error ${res.status}`)
  }
  const prediction = await res.json()
  return NextResponse.json({ id: prediction.id, status: prediction.status })
}

async function pollOnce(predictionId: string) {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { Authorization: `Token ${TOKEN}` },
  })
  if (!res.ok) throw new Error('Failed to check prediction status')
  const p = await res.json()
  // Normalize output — Replicate returns an array for most video models
  const output = Array.isArray(p.output) ? p.output[0] : p.output
  return NextResponse.json({
    id: p.id,
    status: p.status,          // starting | processing | succeeded | failed
    videoUrl: output || null,
    error: p.error || null,
    logs: p.logs || null,
  })
}

function enhancePrompt(prompt: string, style?: string): string {
  const suffix = 'high quality, smooth motion, cinematic'
  if (style && style.toLowerCase() !== 'none') {
    return `${prompt}, ${style} style, ${suffix}`
  }
  return `${prompt}, ${suffix}`
}
