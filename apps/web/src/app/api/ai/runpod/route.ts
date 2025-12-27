import { NextRequest, NextResponse } from 'next/server'
import {
  isRunpodConfigured,
  getAvailableEndpoints,
  runRunpodJob,
  checkRunpodJob,
  cancelRunpodJob,
  pollRunpodJob,
  generateImageSDXL,
  generateImageFLUX,
  generateVideoSVD,
  runLLMInference,
  generateTTS,
  RUNPOD_ENDPOINTS,
} from '@/lib/runpod'

interface RunpodRequest {
  action:
    | 'generate-image'
    | 'generate-video'
    | 'llm-inference'
    | 'tts'
    | 'custom'
    | 'status'
    | 'cancel'
    | 'endpoints'
  model?: 'sdxl' | 'flux' | 'sd15' | 'svd' | 'llama' | 'mistral'
  prompt?: string
  negative_prompt?: string
  image_url?: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
  max_tokens?: number
  temperature?: number
  // For custom endpoints
  endpoint_id?: string
  input?: Record<string, any>
  // For status/cancel
  job_id?: string
  // For async jobs
  async?: boolean
  // For TTS
  text?: string
  voice?: string
  speed?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RunpodRequest = await request.json()
    const { action } = body

    // Check configuration for all actions except 'endpoints'
    if (action !== 'endpoints' && !isRunpodConfigured()) {
      return NextResponse.json(
        {
          error: 'Runpod not configured',
          message: 'Add RUNPOD_API_KEY to environment variables.',
          setup: {
            step1: 'Create account at runpod.io',
            step2: 'Create serverless endpoints for your models',
            step3: 'Add RUNPOD_API_KEY and endpoint IDs to .env.local',
          },
        },
        { status: 503 }
      )
    }

    switch (action) {
      case 'endpoints':
        return NextResponse.json({
          configured: isRunpodConfigured(),
          available: getAvailableEndpoints(),
          endpoints: {
            sdxl: !!RUNPOD_ENDPOINTS.sdxl,
            flux: !!RUNPOD_ENDPOINTS.flux,
            sd15: !!RUNPOD_ENDPOINTS.sd15,
            svd: !!RUNPOD_ENDPOINTS.svd,
            animateDiff: !!RUNPOD_ENDPOINTS.animateDiff,
            llama: !!RUNPOD_ENDPOINTS.llama,
            mistral: !!RUNPOD_ENDPOINTS.mistral,
            custom: !!RUNPOD_ENDPOINTS.custom,
          },
        })

      case 'generate-image':
        return handleImageGeneration(body)

      case 'generate-video':
        return handleVideoGeneration(body)

      case 'llm-inference':
        return handleLLMInference(body)

      case 'tts':
        return handleTTS(body)

      case 'custom':
        return handleCustomEndpoint(body)

      case 'status':
        return handleJobStatus(body)

      case 'cancel':
        return handleJobCancel(body)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Runpod API error:', error)
    return NextResponse.json(
      { error: error.message || 'Runpod processing failed' },
      { status: 500 }
    )
  }
}

async function handleImageGeneration(body: RunpodRequest) {
  const { model = 'sdxl', prompt, negative_prompt, width, height, num_inference_steps, guidance_scale, seed } = body

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required for image generation' }, { status: 400 })
  }

  let result

  switch (model) {
    case 'sdxl':
      result = await generateImageSDXL({
        prompt,
        negative_prompt,
        width,
        height,
        num_inference_steps,
        guidance_scale,
        seed,
      })
      break

    case 'flux':
      result = await generateImageFLUX({
        prompt,
        width,
        height,
        num_inference_steps,
        guidance_scale,
        seed,
      })
      break

    case 'sd15':
      const sd15Endpoint = RUNPOD_ENDPOINTS.sd15
      if (!sd15Endpoint) {
        return NextResponse.json(
          { error: 'SD 1.5 endpoint not configured. Set RUNPOD_SD15_ENDPOINT.' },
          { status: 503 }
        )
      }
      result = await runRunpodJob(sd15Endpoint, {
        prompt,
        negative_prompt: negative_prompt || 'blurry, low quality',
        width: width || 512,
        height: height || 512,
        num_inference_steps: num_inference_steps || 25,
        guidance_scale: guidance_scale || 7.5,
        seed: seed || Math.floor(Math.random() * 1000000),
      })
      break

    default:
      return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    ...result,
  })
}

async function handleVideoGeneration(body: RunpodRequest) {
  const { model = 'svd', image_url } = body

  if (!image_url) {
    return NextResponse.json({ error: 'Image URL required for video generation' }, { status: 400 })
  }

  let result

  switch (model) {
    case 'svd':
      result = await generateVideoSVD({
        image_url,
        motion_bucket_id: body.input?.motion_bucket_id,
        fps: body.input?.fps,
        num_frames: body.input?.num_frames,
      })
      break

    default:
      const animateEndpoint = RUNPOD_ENDPOINTS.animateDiff
      if (!animateEndpoint) {
        return NextResponse.json(
          { error: 'AnimateDiff endpoint not configured' },
          { status: 503 }
        )
      }
      result = await runRunpodJob(animateEndpoint, {
        image_url,
        ...body.input,
      }, false)
  }

  return NextResponse.json({
    success: true,
    async: true,
    message: 'Video generation started. Use status endpoint to check progress.',
    ...result,
  })
}

async function handleLLMInference(body: RunpodRequest) {
  const { model = 'llama', prompt, max_tokens, temperature } = body

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required for LLM inference' }, { status: 400 })
  }

  const result = await runLLMInference({
    prompt,
    model: model as 'llama' | 'mistral',
    max_tokens,
    temperature,
  })

  return NextResponse.json({
    success: true,
    ...result,
  })
}

async function handleTTS(body: RunpodRequest) {
  const { text, voice, speed } = body

  if (!text) {
    return NextResponse.json({ error: 'Text required for TTS' }, { status: 400 })
  }

  const result = await generateTTS({
    text,
    voice,
    speed,
  })

  return NextResponse.json({
    success: true,
    ...result,
  })
}

async function handleCustomEndpoint(body: RunpodRequest) {
  const { endpoint_id, input } = body

  const endpointId = endpoint_id || RUNPOD_ENDPOINTS.custom

  if (!endpointId) {
    return NextResponse.json(
      { error: 'Endpoint ID required. Provide endpoint_id or set RUNPOD_CUSTOM_ENDPOINT.' },
      { status: 400 }
    )
  }

  if (!input) {
    return NextResponse.json({ error: 'Input required for custom endpoint' }, { status: 400 })
  }

  const isAsync = body.async ?? false

  if (isAsync) {
    const result = await runRunpodJob(endpointId, input, false)
    return NextResponse.json({
      success: true,
      async: true,
      message: 'Job started. Use status endpoint to check progress.',
      ...result,
    })
  }

  const result = await runRunpodJob(endpointId, input, true)
  return NextResponse.json({
    success: true,
    ...result,
  })
}

async function handleJobStatus(body: RunpodRequest) {
  const { endpoint_id, job_id } = body

  if (!endpoint_id || !job_id) {
    return NextResponse.json(
      { error: 'endpoint_id and job_id required for status check' },
      { status: 400 }
    )
  }

  const result = await checkRunpodJob(endpoint_id, job_id)

  return NextResponse.json({
    success: true,
    ...result,
  })
}

async function handleJobCancel(body: RunpodRequest) {
  const { endpoint_id, job_id } = body

  if (!endpoint_id || !job_id) {
    return NextResponse.json(
      { error: 'endpoint_id and job_id required for cancellation' },
      { status: 400 }
    )
  }

  const result = await cancelRunpodJob(endpoint_id, job_id)

  return NextResponse.json(result)
}

// GET endpoint to check available endpoints and status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')
  const endpointId = searchParams.get('endpoint_id')

  // If job_id and endpoint_id provided, check job status
  if (jobId && endpointId) {
    try {
      const result = await checkRunpodJob(endpointId, jobId)
      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Otherwise return configuration status
  return NextResponse.json({
    configured: isRunpodConfigured(),
    available: getAvailableEndpoints(),
    endpoints: {
      sdxl: { configured: !!RUNPOD_ENDPOINTS.sdxl, id: RUNPOD_ENDPOINTS.sdxl ? 'configured' : null },
      flux: { configured: !!RUNPOD_ENDPOINTS.flux, id: RUNPOD_ENDPOINTS.flux ? 'configured' : null },
      sd15: { configured: !!RUNPOD_ENDPOINTS.sd15, id: RUNPOD_ENDPOINTS.sd15 ? 'configured' : null },
      svd: { configured: !!RUNPOD_ENDPOINTS.svd, id: RUNPOD_ENDPOINTS.svd ? 'configured' : null },
      animateDiff: { configured: !!RUNPOD_ENDPOINTS.animateDiff, id: RUNPOD_ENDPOINTS.animateDiff ? 'configured' : null },
      llama: { configured: !!RUNPOD_ENDPOINTS.llama, id: RUNPOD_ENDPOINTS.llama ? 'configured' : null },
      mistral: { configured: !!RUNPOD_ENDPOINTS.mistral, id: RUNPOD_ENDPOINTS.mistral ? 'configured' : null },
      tts: { configured: !!RUNPOD_ENDPOINTS.tts, id: RUNPOD_ENDPOINTS.tts ? 'configured' : null },
      custom: { configured: !!RUNPOD_ENDPOINTS.custom, id: RUNPOD_ENDPOINTS.custom ? 'configured' : null },
    },
    usage: {
      'generate-image': 'POST with action: "generate-image", model: "sdxl"|"flux"|"sd15", prompt: "..."',
      'generate-video': 'POST with action: "generate-video", model: "svd", image_url: "..."',
      'llm-inference': 'POST with action: "llm-inference", model: "llama"|"mistral", prompt: "..."',
      'tts': 'POST with action: "tts", text: "Hello world", voice?: "...", speed?: 1.0',
      'custom': 'POST with action: "custom", endpoint_id: "...", input: {...}',
      'status': 'POST with action: "status", endpoint_id: "...", job_id: "..."',
      'cancel': 'POST with action: "cancel", endpoint_id: "...", job_id: "..."',
    },
  })
}
