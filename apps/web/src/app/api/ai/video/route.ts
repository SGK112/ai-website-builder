import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video generation

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Video generation models on Replicate
const VIDEO_MODELS = {
  // Image to Video
  'svd': 'stability-ai/stable-video-diffusion',
  'svd-xt': 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',

  // Text to Video
  'animate-diff': 'lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48571',
  'zeroscope': 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',

  // Advanced models
  'kling': 'kuaishou/kling-v1',
  'luma': 'luma/dream-machine',
  'minimax': 'minimax/video-01',
}

interface VideoRequest {
  action: 'text-to-video' | 'image-to-video' | 'status'
  prompt?: string
  imageUrl?: string
  model?: keyof typeof VIDEO_MODELS
  duration?: number // seconds
  fps?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  predictionId?: string
}

export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API not configured. Add REPLICATE_API_TOKEN to environment.' },
      { status: 500 }
    )
  }

  try {
    const body: VideoRequest = await request.json()
    const {
      action,
      prompt,
      imageUrl,
      model = 'animate-diff',
      duration = 4,
      fps = 8,
      aspectRatio = '16:9'
    } = body

    switch (action) {
      case 'text-to-video':
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt required for text-to-video' }, { status: 400 })
        }
        return await generateTextToVideo(prompt, model, duration, fps, aspectRatio)

      case 'image-to-video':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required for image-to-video' }, { status: 400 })
        }
        return await generateImageToVideo(imageUrl, prompt, duration, fps)

      case 'status':
        if (!body.predictionId) {
          return NextResponse.json({ error: 'Prediction ID required' }, { status: 400 })
        }
        return await checkStatus(body.predictionId)

      default:
        return NextResponse.json({ error: 'Invalid action. Use: text-to-video, image-to-video, or status' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Video generation error:', error)
    const message = error instanceof Error ? error.message : 'Video generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function generateTextToVideo(
  prompt: string,
  model: keyof typeof VIDEO_MODELS,
  duration: number,
  fps: number,
  aspectRatio: string
) {
  const modelId = VIDEO_MODELS[model] || VIDEO_MODELS['animate-diff']
  const isOfficialModel = !modelId.includes(':')

  // Build input based on model
  let input: Record<string, unknown> = {}

  if (model === 'animate-diff') {
    input = {
      prompt: enhancePrompt(prompt),
      negative_prompt: 'bad quality, worse quality, low resolution, blurry, distorted',
      num_frames: Math.min(duration * fps, 32),
      num_inference_steps: 25,
      guidance_scale: 7.5,
    }
  } else if (model === 'zeroscope') {
    input = {
      prompt: enhancePrompt(prompt),
      negative_prompt: 'bad quality, low resolution',
      num_frames: Math.min(duration * 8, 24),
      fps: fps,
    }
  } else if (model === 'kling' || model === 'luma' || model === 'minimax') {
    input = {
      prompt: enhancePrompt(prompt),
      duration: duration,
      aspect_ratio: aspectRatio,
    }
  } else {
    input = {
      prompt: enhancePrompt(prompt),
      num_frames: duration * fps,
    }
  }

  const apiUrl = isOfficialModel
    ? `https://api.replicate.com/v1/models/${modelId}/predictions`
    : 'https://api.replicate.com/v1/predictions'

  const requestBody = isOfficialModel
    ? { input }
    : { version: modelId.split(':')[1], input }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to start video generation')
  }

  const prediction = await response.json()

  // For quick models, poll for result
  if (model === 'animate-diff' || model === 'zeroscope') {
    const result = await pollForResult(prediction.id, 120) // 2 min timeout
    return NextResponse.json({
      success: true,
      id: result.id,
      status: result.status,
      output: result.output,
      metrics: result.metrics,
    })
  }

  // For slower models, return immediately with ID for polling
  return NextResponse.json({
    success: true,
    id: prediction.id,
    status: prediction.status,
    message: 'Video generation started. Use status endpoint to check progress.',
    urls: prediction.urls,
  })
}

async function generateImageToVideo(
  imageUrl: string,
  prompt?: string,
  duration: number = 4,
  fps: number = 8
) {
  // Use Stable Video Diffusion for image-to-video
  const modelId = VIDEO_MODELS['svd']

  const input: Record<string, unknown> = {
    input_image: imageUrl,
    motion_bucket_id: 127,
    cond_aug: 0.02,
    decoding_t: 7,
    fps: fps,
    seed: Math.floor(Math.random() * 1000000),
  }

  if (prompt) {
    // Some models support text guidance
    input.prompt = prompt
  }

  const response = await fetch(`https://api.replicate.com/v1/models/${modelId}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to start image-to-video generation')
  }

  const prediction = await response.json()

  // Poll for result (SVD is relatively quick)
  const result = await pollForResult(prediction.id, 180) // 3 min timeout

  return NextResponse.json({
    success: true,
    id: result.id,
    status: result.status,
    output: result.output,
    metrics: result.metrics,
  })
}

async function checkStatus(predictionId: string) {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to check prediction status')
  }

  const prediction = await response.json()

  return NextResponse.json({
    id: prediction.id,
    status: prediction.status,
    output: prediction.output,
    error: prediction.error,
    metrics: prediction.metrics,
    logs: prediction.logs,
  })
}

async function pollForResult(predictionId: string, timeoutSeconds: number) {
  const maxAttempts = timeoutSeconds
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    })

    const prediction = await response.json()

    if (prediction.status === 'succeeded') {
      return prediction
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || 'Video generation failed')
    }

    // Wait 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
  }

  throw new Error('Video generation timed out')
}

function enhancePrompt(prompt: string): string {
  return `${prompt}, high quality, smooth motion, cinematic, professional video`
}

// GET endpoint for checking status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const predictionId = searchParams.get('id')

  if (!predictionId) {
    // Return available models and capabilities
    return NextResponse.json({
      models: Object.keys(VIDEO_MODELS),
      capabilities: {
        'text-to-video': ['animate-diff', 'zeroscope', 'kling', 'luma', 'minimax'],
        'image-to-video': ['svd', 'svd-xt'],
      },
      configured: !!REPLICATE_API_TOKEN,
    })
  }

  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Replicate API not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    })

    const prediction = await response.json()

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      progress: prediction.logs?.match(/(\d+)%/)?.[1] || null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
