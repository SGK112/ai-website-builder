import { NextRequest, NextResponse } from 'next/server'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Comprehensive Replicate model catalog
const MODELS = {
  // Image Generation
  'flux-schnell': { id: 'black-forest-labs/flux-schnell', type: 'image', name: 'Flux Schnell', description: 'Fast, high-quality images' },
  'flux-dev': { id: 'black-forest-labs/flux-dev', type: 'image', name: 'Flux Dev', description: 'Best quality images' },
  'sdxl': { id: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', type: 'image', name: 'Stable Diffusion XL', description: 'Versatile image generation' },
  'playground': { id: 'playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24', type: 'image', name: 'Playground v2.5', description: 'Aesthetic focused' },
  'kandinsky': { id: 'ai-forever/kandinsky-2.2:ad9d7879fbffa2874e1d909d1d37d9bc682889cc65b31f7bb00d2362619f194a', type: 'image', name: 'Kandinsky 2.2', description: 'Artistic style' },

  // Logo & Icon Generation
  'logo': { id: 'flux-logo', type: 'image', name: 'Logo Generator', description: 'Professional logos', promptPrefix: 'minimalist logo design, vector style, professional,' },
  'icon': { id: 'flux-icon', type: 'image', name: 'Icon Generator', description: 'App & web icons', promptPrefix: 'app icon, simple, clean, modern UI icon,' },

  // Image Enhancement
  'upscale': { id: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa', type: 'enhance', name: 'Upscale 4x', description: 'Increase resolution' },
  'remove-bg': { id: 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003', type: 'enhance', name: 'Remove Background', description: 'Transparent background' },
  'restore': { id: 'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c', type: 'enhance', name: 'Face Restore', description: 'Fix blurry faces' },
  'colorize': { id: 'arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5f5e3d5b750ae7099afae83', type: 'enhance', name: 'Colorize', description: 'Add color to B&W' },

  // Video Generation
  'minimax-video': { id: 'minimax/video-01', type: 'video', name: 'Minimax Video', description: 'Text to video' },
  'animate-diff': { id: 'lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f', type: 'video', name: 'Animate Diff', description: 'Animate images' },
  'stable-video': { id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438', type: 'video', name: 'Stable Video', description: 'Image to video' },

  // Audio & Music
  'musicgen': { id: 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb', type: 'audio', name: 'MusicGen', description: 'Generate music' },
  'bark': { id: 'suno-ai/bark:b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787', type: 'audio', name: 'Bark TTS', description: 'Text to speech' },

  // Understanding
  'caption': { id: 'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746', type: 'understand', name: 'Image Caption', description: 'Describe images' },
  'ocr': { id: 'abiruyt/text-extract-ocr:a524caeaa23495bc9edc805ab08ab5fe943afd3febed884a4f3747aa32e9cd61', type: 'understand', name: 'OCR', description: 'Extract text' },
}

type ModelKey = keyof typeof MODELS
type MediaType = 'image' | 'video' | 'audio' | 'enhance' | 'understand'

interface MediaRequest {
  action: ModelKey
  prompt?: string
  imageUrl?: string
  imageBase64?: string
  style?: string
  aspectRatio?: string
  duration?: number // for video/audio
  negative_prompt?: string
}

export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    // Return demo response for testing
    return NextResponse.json({
      success: true,
      demo: true,
      output: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'],
      message: 'Demo mode - add REPLICATE_API_TOKEN for real generation',
    })
  }

  try {
    const body: MediaRequest = await request.json()
    const { action, prompt, imageUrl, imageBase64, style, aspectRatio = '16:9', duration = 5, negative_prompt } = body

    const modelConfig = MODELS[action]
    if (!modelConfig) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
    }

    let input: Record<string, any> = {}
    let modelId = modelConfig.id

    // Handle special cases for logo/icon (use flux with prefix)
    if (action === 'logo' || action === 'icon') {
      modelId = 'black-forest-labs/flux-schnell'
      const prefix = (modelConfig as any).promptPrefix || ''
      input = {
        prompt: `${prefix} ${prompt}`,
        aspect_ratio: '1:1',
        num_outputs: 1,
        output_format: 'webp',
      }
    }
    // Image generation models
    else if (modelConfig.type === 'image') {
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
      }
      input = {
        prompt: buildPrompt(prompt, style),
        negative_prompt: negative_prompt || 'ugly, blurry, low quality, distorted',
        aspect_ratio: aspectRatio,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 90,
      }
    }
    // Enhancement models
    else if (modelConfig.type === 'enhance') {
      const imgInput = imageUrl || (imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null)
      if (!imgInput) {
        return NextResponse.json({ error: 'Image required' }, { status: 400 })
      }

      if (action === 'upscale') {
        input = { image: imgInput, scale: 4, face_enhance: true }
      } else if (action === 'remove-bg') {
        input = { image: imgInput }
      } else if (action === 'restore') {
        input = { img: imgInput, scale: 2, version: 'v1.4' }
      } else if (action === 'colorize') {
        input = { input_image: imgInput, model_name: 'Artistic', render_factor: 35 }
      }
    }
    // Video models
    else if (modelConfig.type === 'video') {
      if (action === 'minimax-video') {
        if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
        input = { prompt, prompt_optimizer: true }
      } else if (action === 'animate-diff') {
        input = {
          prompt: prompt || 'subtle motion, cinematic',
          motion_module: 'mm_sd_v15_v2',
          n_prompt: 'bad quality, worse quality'
        }
      } else if (action === 'stable-video') {
        if (!imageUrl) return NextResponse.json({ error: 'Image required' }, { status: 400 })
        input = {
          input_image: imageUrl,
          sizing_strategy: 'maintain_aspect_ratio',
          frames_per_second: 6,
          motion_bucket_id: 127
        }
      }
    }
    // Audio models
    else if (modelConfig.type === 'audio') {
      if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
      if (action === 'musicgen') {
        input = {
          prompt,
          model_version: 'stereo-melody-large',
          duration: Math.min(duration, 30),
          output_format: 'mp3'
        }
      } else if (action === 'bark') {
        input = { prompt, text_temp: 0.7, waveform_temp: 0.7 }
      }
    }
    // Understanding models
    else if (modelConfig.type === 'understand') {
      const imgInput = imageUrl || (imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null)
      if (!imgInput) {
        return NextResponse.json({ error: 'Image required' }, { status: 400 })
      }
      if (action === 'caption') {
        input = { image: imgInput, task: 'image_captioning' }
      } else if (action === 'ocr') {
        input = { image: imgInput }
      }
    }

    const prediction = await runModel(modelId, input)

    return NextResponse.json({
      success: true,
      model: action,
      type: modelConfig.type,
      ...prediction,
    })
  } catch (error: any) {
    console.error('Media API error:', error)
    return NextResponse.json(
      { error: error.message || 'Media generation failed' },
      { status: 500 }
    )
  }
}

// Run model with polling
async function runModel(model: string, input: Record<string, any>) {
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
    throw new Error(error.detail || 'Failed to start generation')
  }

  let prediction = await createResponse.json()

  // Poll for completion (max 120 seconds for video)
  const maxAttempts = 120
  let attempts = 0

  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const pollResponse = await fetch(prediction.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
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

  return {
    id: prediction.id,
    output: prediction.output,
    status: prediction.status,
    metrics: prediction.metrics,
  }
}

// Style-enhanced prompts
function buildPrompt(prompt: string, style?: string): string {
  const styles: Record<string, string> = {
    'professional': 'professional, corporate, clean, modern, high quality',
    'modern': 'modern, minimalist, sleek, contemporary',
    'creative': 'creative, artistic, unique, vibrant colors',
    'tech': 'technology, futuristic, digital, innovative',
    'nature': 'natural, organic, environmental, sustainable',
    'luxury': 'luxury, premium, elegant, sophisticated',
    'playful': 'fun, playful, colorful, energetic',
    'minimal': 'minimalist, simple, clean, white space',
    'vintage': 'vintage, retro, nostalgic, classic',
    'dark': 'dark mode, moody, dramatic lighting',
    'bright': 'bright, cheerful, well-lit, optimistic',
  }

  const styleAddition = style && styles[style] ? `, ${styles[style]}` : ''
  return `${prompt}${styleAddition}, high resolution, 4k, detailed`
}

// List available models
export async function GET() {
  const categories = {
    image: Object.entries(MODELS).filter(([_, m]) => m.type === 'image').map(([k, m]) => ({ key: k, ...m })),
    enhance: Object.entries(MODELS).filter(([_, m]) => m.type === 'enhance').map(([k, m]) => ({ key: k, ...m })),
    video: Object.entries(MODELS).filter(([_, m]) => m.type === 'video').map(([k, m]) => ({ key: k, ...m })),
    audio: Object.entries(MODELS).filter(([_, m]) => m.type === 'audio').map(([k, m]) => ({ key: k, ...m })),
    understand: Object.entries(MODELS).filter(([_, m]) => m.type === 'understand').map(([k, m]) => ({ key: k, ...m })),
  }

  return NextResponse.json({
    success: true,
    categories,
    configured: !!REPLICATE_API_TOKEN
  })
}
