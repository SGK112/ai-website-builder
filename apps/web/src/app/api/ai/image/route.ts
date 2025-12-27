import { NextRequest, NextResponse } from 'next/server'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Replicate model versions
const MODELS = {
  // Image Generation
  flux: 'black-forest-labs/flux-schnell',
  sdxl: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',

  // Image Enhancement
  upscale: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
  removeBg: 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  restore: 'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',

  // Image Understanding
  caption: 'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
}

interface GenerateRequest {
  action: 'generate' | 'upscale' | 'remove-bg' | 'restore' | 'caption'
  prompt?: string
  imageUrl?: string
  style?: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
}

export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API not configured. Add REPLICATE_API_TOKEN to environment.' },
      { status: 500 }
    )
  }

  try {
    const body: GenerateRequest = await request.json()
    const { action, prompt, imageUrl, style, aspectRatio = '16:9' } = body

    let prediction

    switch (action) {
      case 'generate':
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt required for generation' }, { status: 400 })
        }
        prediction = await runModel(MODELS.flux, {
          prompt: buildPrompt(prompt, style),
          aspect_ratio: aspectRatio,
          num_outputs: 1,
          output_format: 'webp',
          output_quality: 90,
        })
        break

      case 'upscale':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required for upscaling' }, { status: 400 })
        }
        prediction = await runModel(MODELS.upscale, {
          image: imageUrl,
          scale: 4,
          face_enhance: true,
        })
        break

      case 'remove-bg':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required for background removal' }, { status: 400 })
        }
        prediction = await runModel(MODELS.removeBg, {
          image: imageUrl,
        })
        break

      case 'restore':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required for restoration' }, { status: 400 })
        }
        prediction = await runModel(MODELS.restore, {
          img: imageUrl,
          scale: 2,
          version: 'v1.4',
        })
        break

      case 'caption':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required for captioning' }, { status: 400 })
        }
        prediction = await runModel(MODELS.caption, {
          image: imageUrl,
          task: 'image_captioning',
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ...prediction,
    })
  } catch (error: any) {
    console.error('Replicate API error:', error)
    return NextResponse.json(
      { error: error.message || 'AI processing failed' },
      { status: 500 }
    )
  }
}

// Run a Replicate model and wait for result
async function runModel(model: string, input: Record<string, any>) {
  // Create prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: model.includes(':') ? model.split(':')[1] : undefined,
      model: model.includes(':') ? undefined : model,
      input,
    }),
  })

  if (!createResponse.ok) {
    const error = await createResponse.json()
    throw new Error(error.detail || 'Failed to start AI processing')
  }

  let prediction = await createResponse.json()

  // Poll for completion (max 60 seconds)
  const maxAttempts = 60
  let attempts = 0

  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const pollResponse = await fetch(prediction.urls.get, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    })

    prediction = await pollResponse.json()
    attempts++
  }

  if (prediction.status === 'failed') {
    throw new Error(prediction.error || 'AI processing failed')
  }

  if (prediction.status !== 'succeeded') {
    throw new Error('AI processing timed out')
  }

  return {
    id: prediction.id,
    output: prediction.output,
    status: prediction.status,
    metrics: prediction.metrics,
  }
}

// Build enhanced prompt with style
function buildPrompt(prompt: string, style?: string): string {
  const stylePrompts: Record<string, string> = {
    'professional': 'professional, corporate, clean, modern, high quality photography',
    'modern': 'modern, minimalist, sleek, contemporary design',
    'creative': 'creative, artistic, unique, vibrant colors',
    'tech': 'technology, futuristic, digital, innovative',
    'nature': 'natural, organic, environmental, sustainable',
    'luxury': 'luxury, premium, elegant, sophisticated',
    'playful': 'fun, playful, colorful, energetic',
    'minimal': 'minimalist, simple, clean, white space',
  }

  const styleAddition = style && stylePrompts[style] ? `, ${stylePrompts[style]}` : ''

  return `${prompt}${styleAddition}, high resolution, 4k, detailed`
}

// Check status of a running prediction
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const predictionId = searchParams.get('id')

  if (!predictionId) {
    return NextResponse.json({ error: 'Prediction ID required' }, { status: 400 })
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
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
