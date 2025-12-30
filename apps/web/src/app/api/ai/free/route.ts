import { NextRequest, NextResponse } from 'next/server'
import {
  generateImageFree,
  generateTextFree,
  FreeAIProvider,
  FREE_PROVIDER_INFO,
  HF_FREE_MODELS,
  REPLICATE_FREE_MODELS,
  TOGETHER_FREE_MODELS,
  CLOUDFLARE_FREE_MODELS,
  hfGenerateImage,
  hfGenerateText,
} from '@/lib/free-ai-providers'

interface FreeAIRequest {
  action: 'generate-image' | 'generate-text' | 'list-models' | 'providers'
  provider?: FreeAIProvider
  prompt?: string
  model?: string
  apiKey?: string
  accountId?: string // For Cloudflare
  options?: {
    maxTokens?: number
    temperature?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FreeAIRequest = await request.json()
    const { action, provider, prompt, model, apiKey, accountId, options } = body

    switch (action) {
      case 'providers':
        return NextResponse.json({
          providers: FREE_PROVIDER_INFO,
          recommendation: 'huggingface', // Best for no-key-required usage
        })

      case 'list-models':
        return NextResponse.json({
          huggingface: {
            image: Object.keys(HF_FREE_MODELS).filter(k =>
              ['stable-diffusion', 'flux'].some(m => k.includes(m))
            ),
            text: Object.keys(HF_FREE_MODELS).filter(k =>
              ['llama', 'mistral', 'phi', 'qwen', 'gemma'].some(m => k.includes(m))
            ),
          },
          replicate: {
            image: Object.keys(REPLICATE_FREE_MODELS).filter(k =>
              ['flux', 'sdxl', 'sd'].some(m => k.includes(m))
            ),
            text: Object.keys(REPLICATE_FREE_MODELS).filter(k =>
              ['llama'].some(m => k.includes(m))
            ),
          },
          together: {
            image: Object.keys(TOGETHER_FREE_MODELS).filter(k =>
              ['flux'].some(m => k.includes(m))
            ),
            text: Object.keys(TOGETHER_FREE_MODELS).filter(k =>
              ['llama', 'mistral', 'qwen', 'gemma'].some(m => k.includes(m))
            ),
          },
          cloudflare: {
            image: Object.keys(CLOUDFLARE_FREE_MODELS).filter(k =>
              ['stable-diffusion', 'dreamshaper'].some(m => k.includes(m))
            ),
            text: Object.keys(CLOUDFLARE_FREE_MODELS).filter(k =>
              ['llama', 'mistral', 'qwen'].some(m => k.includes(m))
            ),
          },
        })

      case 'generate-image':
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
        }

        // Default to Hugging Face (works without API key)
        const imgProvider = provider || 'huggingface'

        // Check if provider requires API key
        if (imgProvider !== 'huggingface' && !apiKey) {
          return NextResponse.json({
            error: `${FREE_PROVIDER_INFO[imgProvider].name} requires an API key`,
            signupUrl: FREE_PROVIDER_INFO[imgProvider].signupUrl,
            freeOffer: FREE_PROVIDER_INFO[imgProvider].freeOffer,
          }, { status: 401 })
        }

        const imgResult = await generateImageFree(
          prompt,
          { provider: imgProvider, apiKey, accountId },
          model
        )

        if (imgResult.error) {
          // Check if it's a loading status
          if (imgResult.error.includes('loading')) {
            return NextResponse.json({
              status: 'loading',
              message: 'Model is loading, please retry in ~20 seconds',
              retryAfter: 20,
            }, { status: 503 })
          }
          return NextResponse.json({ error: imgResult.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          provider: imgProvider,
          model: model || 'default',
          image: imgResult.image,
        })

      case 'generate-text':
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
        }

        // Default to Hugging Face (works without API key)
        const textProvider = provider || 'huggingface'

        // Check if provider requires API key
        if (textProvider !== 'huggingface' && !apiKey) {
          return NextResponse.json({
            error: `${FREE_PROVIDER_INFO[textProvider].name} requires an API key`,
            signupUrl: FREE_PROVIDER_INFO[textProvider].signupUrl,
            freeOffer: FREE_PROVIDER_INFO[textProvider].freeOffer,
          }, { status: 401 })
        }

        // Replicate doesn't support text generation well in free tier
        if (textProvider === 'replicate') {
          return NextResponse.json({
            error: 'Replicate is optimized for image generation. Use Hugging Face, Together AI, or Cloudflare for text.',
            alternatives: ['huggingface', 'together', 'cloudflare'],
          }, { status: 400 })
        }

        const textResult = await generateTextFree(
          prompt,
          { provider: textProvider, apiKey, accountId },
          model,
          options
        )

        if (textResult.error) {
          return NextResponse.json({ error: textResult.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          provider: textProvider,
          model: model || 'default',
          text: textResult.text,
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Free AI API error:', error)
    return NextResponse.json(
      { error: error.message || 'Free AI processing failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for easy testing and info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'test') {
    // Quick test with Hugging Face (no API key needed)
    const prompt = searchParams.get('prompt') || 'A beautiful sunset over mountains'

    try {
      const result = await hfGenerateImage(prompt, 'stable-diffusion-xl')

      if (result.status === 'loading') {
        return NextResponse.json({
          status: 'loading',
          message: 'Model is loading. Hugging Face models need to warm up. Try again in ~20 seconds.',
        })
      }

      return NextResponse.json({
        success: true,
        provider: 'huggingface',
        model: 'stable-diffusion-xl',
        image: result.image,
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Return documentation
  return NextResponse.json({
    name: 'Free AI Providers API',
    description: 'Access free AI models for image and text generation',
    providers: {
      huggingface: {
        ...FREE_PROVIDER_INFO.huggingface,
        models: {
          image: ['stable-diffusion-xl', 'stable-diffusion-2', 'flux-schnell'],
          text: ['llama-3.2-3b', 'mistral-7b', 'phi-3-mini', 'gemma-2'],
        },
      },
      replicate: {
        ...FREE_PROVIDER_INFO.replicate,
        models: {
          image: ['flux-schnell', 'flux-dev', 'sdxl', 'sdxl-lightning'],
        },
      },
      together: {
        ...FREE_PROVIDER_INFO.together,
        models: {
          image: ['flux-schnell'],
          text: ['llama-3.2-3b', 'llama-3.1-8b', 'mistral-7b', 'qwen-2.5-7b'],
        },
      },
      cloudflare: {
        ...FREE_PROVIDER_INFO.cloudflare,
        models: {
          image: ['stable-diffusion-xl', 'dreamshaper'],
          text: ['llama-3.1-8b', 'llama-3.2-3b', 'mistral-7b'],
        },
      },
    },
    usage: {
      'generate-image': {
        method: 'POST',
        body: {
          action: 'generate-image',
          provider: 'huggingface | replicate | together | cloudflare',
          prompt: 'A beautiful landscape',
          model: 'stable-diffusion-xl (optional)',
          apiKey: 'your-api-key (required for all except huggingface)',
        },
      },
      'generate-text': {
        method: 'POST',
        body: {
          action: 'generate-text',
          provider: 'huggingface | together | cloudflare',
          prompt: 'Write a poem about AI',
          model: 'mistral-7b (optional)',
          apiKey: 'your-api-key (required for all except huggingface)',
          options: { maxTokens: 1024, temperature: 0.7 },
        },
      },
      'list-models': {
        method: 'POST',
        body: { action: 'list-models' },
      },
      'providers': {
        method: 'POST',
        body: { action: 'providers' },
      },
      'test': {
        method: 'GET',
        url: '/api/ai/free?action=test&prompt=your+prompt',
        note: 'Quick test using Hugging Face (no API key needed)',
      },
    },
    tips: [
      'Hugging Face is the only provider that works without an API key',
      'Hugging Face models may take ~20s to load on first request (cold start)',
      'Replicate gives $5 free credits - best for FLUX image generation',
      'Together AI has a generous free trial for both images and text',
      'Cloudflare gives 10,000 free neurons/day - great for production',
    ],
  })
}
