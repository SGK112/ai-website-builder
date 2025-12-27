import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Lazy initialization of OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

// Provider availability check
function getAvailableProviders() {
  return {
    flux: !!(process.env.RUNPOD_API_KEY && process.env.RUNPOD_FLUX_ENDPOINT),
    dalle: !!process.env.OPENAI_API_KEY,
  }
}

// Generate with RunPod FLUX
async function generateWithFlux(prompt: string, width: number, height: number): Promise<{ url: string; provider: string } | null> {
  console.log('[ImageGen] Generating with RunPod FLUX...')

  try {
    const response = await fetch(
      `https://api.runpod.ai/v2/${process.env.RUNPOD_FLUX_ENDPOINT}/runsync`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt,
            width,
            height,
            num_inference_steps: 4,
            guidance_scale: 3.5,
            seed: Math.floor(Math.random() * 1000000),
          },
        }),
      }
    )

    if (!response.ok) {
      console.error('[ImageGen] FLUX API error:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[ImageGen] FLUX response status:', data.status)

    // Handle various response formats
    if (data.output?.images?.[0]) {
      const img = data.output.images[0]
      return {
        url: img.startsWith('data:') ? img : `data:image/png;base64,${img}`,
        provider: 'RunPod FLUX',
      }
    }
    if (data.output?.image) {
      return { url: data.output.image, provider: 'RunPod FLUX' }
    }
    if (data.output?.image_url) {
      return { url: data.output.image_url, provider: 'RunPod FLUX' }
    }
    if (typeof data.output === 'string' && data.output.length > 100) {
      return {
        url: data.output.startsWith('data:') ? data.output : `data:image/png;base64,${data.output}`,
        provider: 'RunPod FLUX',
      }
    }

    console.error('[ImageGen] FLUX: No image in response')
    return null
  } catch (error) {
    console.error('[ImageGen] FLUX error:', error)
    return null
  }
}

// Generate with DALL-E 3
async function generateWithDalle(prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792'): Promise<{ url: string; provider: string; revised_prompt?: string } | null> {
  console.log('[ImageGen] Generating with DALL-E 3...')

  const openai = getOpenAIClient()
  if (!openai) {
    console.error('[ImageGen] OpenAI client not available')
    return null
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'standard',
      style: 'vivid',
    })

    if (response.data?.[0]?.url) {
      return {
        url: response.data[0].url,
        provider: 'DALL-E 3',
        revised_prompt: response.data[0].revised_prompt,
      }
    }
    return null
  } catch (error) {
    console.error('[ImageGen] DALL-E error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      style = 'photorealistic',
      aspectRatio = '16:9',
      provider: preferredProvider = 'auto'  // 'auto' | 'flux' | 'dalle'
    } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const available = getAvailableProviders()

    if (!available.flux && !available.dalle) {
      return NextResponse.json({
        error: 'No image generation providers configured',
        setup: 'Add RUNPOD_API_KEY + RUNPOD_FLUX_ENDPOINT or OPENAI_API_KEY',
      }, { status: 503 })
    }

    // Enhance prompt for better results
    const enhancedPrompt = `${prompt}. Style: ${style}, high quality, professional, ${
      style === 'photorealistic' ? '8k, ultra detailed, realistic lighting' :
      style === 'illustration' ? 'clean vector style, modern illustration' :
      style === 'minimal' ? 'minimalist, clean, simple shapes' :
      'artistic, creative'
    }`

    // Determine dimensions based on aspect ratio
    const fluxDimensions = aspectRatio === '1:1' ? { width: 1024, height: 1024 } :
                          aspectRatio === '9:16' ? { width: 768, height: 1344 } :
                          { width: 1344, height: 768 } // 16:9

    const dalleSize = aspectRatio === '1:1' ? '1024x1024' as const :
                     aspectRatio === '9:16' ? '1024x1792' as const :
                     '1792x1024' as const

    let result = null

    // Provider selection logic
    if (preferredProvider === 'flux' && available.flux) {
      result = await generateWithFlux(enhancedPrompt, fluxDimensions.width, fluxDimensions.height)
    } else if (preferredProvider === 'dalle' && available.dalle) {
      result = await generateWithDalle(enhancedPrompt, dalleSize)
    } else {
      // Auto mode: Try FLUX first (faster + cheaper), then DALL-E
      if (available.flux) {
        result = await generateWithFlux(enhancedPrompt, fluxDimensions.width, fluxDimensions.height)
      }
      if (!result && available.dalle) {
        result = await generateWithDalle(enhancedPrompt, dalleSize)
      }
    }

    if (result) {
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Image generation failed - all providers failed' }, { status: 500 })
  } catch (error) {
    console.error('[ImageGen] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check available providers
export async function GET() {
  const available = getAvailableProviders()
  return NextResponse.json({
    providers: available,
    defaultProvider: available.flux ? 'flux' : available.dalle ? 'dalle' : null,
    message: available.flux || available.dalle
      ? 'Image generation available'
      : 'No providers configured',
  })
}
