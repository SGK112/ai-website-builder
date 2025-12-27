import { NextRequest, NextResponse } from 'next/server'
import { isRunpodConfigured, runRunpodJob, RUNPOD_ENDPOINTS } from '@/lib/runpod'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Background presets for website themes
const BACKGROUND_PRESETS = {
  // Dark theme backgrounds
  'starry-night': {
    prompt: 'Beautiful night sky with stars, milky way galaxy, deep space nebula, dark blue and purple, cosmic atmosphere, 4k wallpaper',
    negative: 'text, watermark, logo, blurry',
    style: 'cosmic',
  },
  'dark-gradient': {
    prompt: 'Abstract dark gradient background, deep purple to black, subtle glow, modern minimalist, smooth gradient transitions',
    negative: 'text, watermark, busy, cluttered',
    style: 'abstract',
  },
  'dark-particles': {
    prompt: 'Abstract dark background with floating glowing particles, network connections, tech futuristic, deep blue and purple',
    negative: 'text, watermark, faces, people',
    style: 'tech',
  },
  'northern-lights': {
    prompt: 'Aurora borealis night sky, green and blue northern lights, stars, dark landscape silhouette, mystical atmosphere',
    negative: 'text, watermark, daylight',
    style: 'nature',
  },

  // Light theme backgrounds
  'sunrise': {
    prompt: 'Beautiful sunrise sky with soft clouds, golden hour, warm orange and pink colors, peaceful serene morning, 4k wallpaper',
    negative: 'text, watermark, dark, night',
    style: 'nature',
  },
  'light-gradient': {
    prompt: 'Abstract light gradient background, soft white to light blue, clean minimalist modern, smooth pastel transitions',
    negative: 'text, watermark, dark, busy',
    style: 'abstract',
  },
  'cloudy-sky': {
    prompt: 'Beautiful blue sky with white fluffy clouds, sunny day, soft light, peaceful calming atmosphere, 4k quality',
    negative: 'text, watermark, dark, storm',
    style: 'nature',
  },
  'soft-waves': {
    prompt: 'Abstract soft wave patterns, light blue and white, gentle flowing curves, modern minimalist design, clean background',
    negative: 'text, watermark, harsh, dark',
    style: 'abstract',
  },

  // Neutral/both themes
  'geometric': {
    prompt: 'Abstract geometric pattern background, low poly style, modern minimal design, subtle colors, tech aesthetic',
    negative: 'text, watermark, photo realistic, faces',
    style: 'abstract',
  },
  'mesh-gradient': {
    prompt: 'Beautiful mesh gradient background, smooth color transitions, modern design, vibrant yet subtle colors, 4k quality',
    negative: 'text, watermark, harsh edges, busy',
    style: 'abstract',
  },
}

interface BackgroundRequest {
  preset?: keyof typeof BACKGROUND_PRESETS
  prompt?: string
  theme?: 'light' | 'dark'
  width?: number
  height?: number
  provider?: 'replicate' | 'runpod'
}

export async function POST(request: NextRequest) {
  try {
    const body: BackgroundRequest = await request.json()
    const { preset, prompt: customPrompt, theme = 'dark', width = 1920, height = 1080, provider = 'replicate' } = body

    // Determine the final prompt
    let finalPrompt: string
    let negativePrompt: string = 'text, watermark, logo, blurry, low quality'

    if (preset && BACKGROUND_PRESETS[preset]) {
      const presetConfig = BACKGROUND_PRESETS[preset]
      finalPrompt = presetConfig.prompt
      negativePrompt = presetConfig.negative
    } else if (customPrompt) {
      finalPrompt = customPrompt
      // Add theme-appropriate enhancements
      if (theme === 'dark') {
        finalPrompt += ', dark background, moody atmosphere'
      } else {
        finalPrompt += ', light background, bright and airy'
      }
    } else {
      // Default based on theme
      finalPrompt = theme === 'dark'
        ? BACKGROUND_PRESETS['starry-night'].prompt
        : BACKGROUND_PRESETS['sunrise'].prompt
      negativePrompt = theme === 'dark'
        ? BACKGROUND_PRESETS['starry-night'].negative
        : BACKGROUND_PRESETS['sunrise'].negative
    }

    // Add quality suffix
    finalPrompt += ', high resolution, 4k, detailed, website background'

    // Try Runpod first if configured and requested
    if (provider === 'runpod' && isRunpodConfigured()) {
      return await generateWithRunpod(finalPrompt, negativePrompt, width, height)
    }

    // Fall back to Replicate
    if (REPLICATE_API_TOKEN) {
      return await generateWithReplicate(finalPrompt, width, height)
    }

    return NextResponse.json(
      {
        error: 'No AI provider configured',
        message: 'Add REPLICATE_API_TOKEN or configure Runpod endpoints',
      },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('Background generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Background generation failed' },
      { status: 500 }
    )
  }
}

async function generateWithRunpod(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number
) {
  // Try FLUX first, fall back to SDXL
  const endpointId = RUNPOD_ENDPOINTS.flux || RUNPOD_ENDPOINTS.sdxl

  if (!endpointId) {
    throw new Error('No Runpod image endpoint configured')
  }

  const input = RUNPOD_ENDPOINTS.flux
    ? {
        prompt,
        width,
        height,
        num_inference_steps: 4,
        guidance_scale: 3.5,
      }
    : {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      }

  const result = await runRunpodJob(endpointId, input)

  return NextResponse.json({
    success: true,
    provider: 'runpod',
    image: result.output,
    ...result,
  })
}

async function generateWithReplicate(
  prompt: string,
  width: number,
  height: number
) {
  // Use FLUX Schnell for fast generation
  const model = 'black-forest-labs/flux-schnell'

  // Determine aspect ratio
  let aspectRatio = '16:9'
  if (width === height) aspectRatio = '1:1'
  else if (height > width) aspectRatio = '9:16'

  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 90,
      },
    }),
  })

  if (!createResponse.ok) {
    const error = await createResponse.json()
    throw new Error(error.detail || 'Failed to start generation')
  }

  let prediction = await createResponse.json()

  // Poll for completion
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
    throw new Error(prediction.error || 'Generation failed')
  }

  if (prediction.status !== 'succeeded') {
    throw new Error('Generation timed out')
  }

  return NextResponse.json({
    success: true,
    provider: 'replicate',
    image: prediction.output?.[0] || prediction.output,
    id: prediction.id,
    metrics: prediction.metrics,
  })
}

// GET endpoint to list available presets
export async function GET() {
  return NextResponse.json({
    presets: Object.entries(BACKGROUND_PRESETS).map(([key, value]) => ({
      id: key,
      ...value,
    })),
    providers: {
      replicate: !!REPLICATE_API_TOKEN,
      runpod: isRunpodConfigured(),
    },
    usage: {
      preset: 'POST with preset: "starry-night"|"sunrise"|"dark-gradient"|etc',
      custom: 'POST with prompt: "your custom prompt", theme: "light"|"dark"',
      dimensions: 'POST with width: 1920, height: 1080',
    },
  })
}
