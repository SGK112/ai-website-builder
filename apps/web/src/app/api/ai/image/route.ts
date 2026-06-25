import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spendCredits } from '@/lib/credits'

export const dynamic = 'force-dynamic'
// 300s — long-running Anthropic/Replicate/OpenAI/Runpod call. Without this
// Render's default kills the request before the upstream finishes. Cloudflare
// still 524s at 100s on non-streaming responses; SSE-wrap if you hit that ceiling.
export const maxDuration = 300

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
  // Image generation / upscaling / bg-removal all hit Replicate which costs
  // real money per call — gate behind auth so anonymous traffic can't drain
  // the budget. (Was wide open.)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({
      error: 'AI image tools (remove-background, enhance, generate) are not available on this instance — REPLICATE_API_TOKEN is not configured. Use the stock-photo picker instead.',
      feature: 'image',
      reason: 'replicate_unconfigured',
    }, { status: 503 })
  }

  try {
    const body: GenerateRequest = await request.json()
    const { action, prompt, imageUrl, style, aspectRatio = '16:9' } = body

    // Map action → credit cost, then validate inputs BEFORE charging so a
    // missing-input 400 never bills the user.
    const op = action === 'generate' ? 'image_generation'
      : (action === 'upscale' || action === 'remove-bg' || action === 'restore' || action === 'caption') ? 'image_enhance'
      : null
    if (!op) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    if (action === 'generate' && !prompt) {
      return NextResponse.json({ error: 'Prompt required for generation' }, { status: 400 })
    }
    if (action !== 'generate' && !imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    // Replicate costs real money per call — charge up front (atomic), refund if
    // the provider call fails. (Previously unmetered: free unlimited generation.)
    const charge = await spendCredits(session, op)
    if (!charge.ok) {
      return NextResponse.json(
        { error: charge.error || 'Not enough credits.', requireCredits: charge.status === 402 },
        { status: charge.status || 402 },
      )
    }

    let prediction

    try {
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
        await charge.refund()
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Refund if the provider job didn't actually succeed.
    if (prediction?.status === 'failed') {
      await charge.refund()
      return NextResponse.json({ error: 'Image generation failed.' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      ...prediction,
    })
    } catch (e) {
      await charge.refund()
      throw e
    }
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
  // Determine API endpoint and body based on model type
  const isOfficialModel = !model.includes(':')
  const apiUrl = isOfficialModel
    ? `https://api.replicate.com/v1/models/${model}/predictions`
    : 'https://api.replicate.com/v1/predictions'

  const body = isOfficialModel
    ? { input }
    : { version: model.split(':')[1], input }

  // Create prediction
  const createResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

    // Guard the response shape — dereferencing prediction.urls.get blindly turns
    // a provider hiccup into a cryptic "cannot read 'get' of undefined" 500.
    const pollUrl = prediction?.urls?.get
    if (!pollUrl) {
      throw new Error('Image provider returned an unexpected response (no poll URL).')
    }
    const pollResponse = await fetch(pollUrl, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    })
    if (!pollResponse.ok) {
      // Don't JSON.parse an error/HTML body — surface a clear status instead.
      throw new Error(`Image provider error while polling (${pollResponse.status}).`)
    }

    prediction = await pollResponse.json()
    attempts++
  }

  if (prediction.status === 'failed') {
    throw new Error(prediction.error || 'AI processing failed')
  }

  if (prediction.status !== 'succeeded') {
    throw new Error('AI processing timed out')
  }

  // 'succeeded' with no output is a failure dressed as success — don't hand the
  // caller an empty image and call it done.
  const succeededOutput = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  if (!succeededOutput) {
    throw new Error('The image provider reported success but returned no image — please try again.')
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
    return NextResponse.json({
      error: 'AI image tools not available — REPLICATE_API_TOKEN unconfigured.',
      feature: 'image',
      reason: 'replicate_unconfigured',
    }, { status: 503 })
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
