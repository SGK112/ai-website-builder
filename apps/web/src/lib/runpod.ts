/**
 * Runpod Serverless GPU API Utility
 *
 * Runpod provides serverless GPU endpoints for running AI models.
 * This utility handles communication with Runpod's API for:
 * - Image generation (Stable Diffusion, SDXL, FLUX)
 * - Video generation (SVD, AnimateDiff)
 * - LLM inference (Llama, Mistral)
 * - Custom model deployment
 */

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY

// Runpod endpoint base URL
const RUNPOD_BASE_URL = 'https://api.runpod.ai/v2'

// Default endpoint IDs - these should be configured per deployment
// Users can create their own endpoints on Runpod and add the IDs here
export const RUNPOD_ENDPOINTS = {
  // Image Generation
  sdxl: process.env.RUNPOD_SDXL_ENDPOINT || '',
  flux: process.env.RUNPOD_FLUX_ENDPOINT || '',
  sd15: process.env.RUNPOD_SD15_ENDPOINT || '',

  // Video Generation
  svd: process.env.RUNPOD_SVD_ENDPOINT || '',
  animateDiff: process.env.RUNPOD_ANIMATEDIFF_ENDPOINT || '',

  // LLM Inference
  llama: process.env.RUNPOD_LLAMA_ENDPOINT || '',
  mistral: process.env.RUNPOD_MISTRAL_ENDPOINT || '',

  // Audio
  tts: process.env.RUNPOD_TTS_ENDPOINT || '',

  // Custom/General purpose
  custom: process.env.RUNPOD_CUSTOM_ENDPOINT || '',
}

export interface RunpodInput {
  [key: string]: any
}

export interface RunpodResponse {
  id: string
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  output?: any
  error?: string
  executionTime?: number
  delayTime?: number
}

export interface RunpodJobResult {
  id: string
  status: string
  output: any
  error?: string
  metrics?: {
    executionTime: number
    delayTime: number
  }
}

/**
 * Check if Runpod is configured
 */
export function isRunpodConfigured(): boolean {
  return !!RUNPOD_API_KEY
}

/**
 * Get available endpoints
 */
export function getAvailableEndpoints(): string[] {
  return Object.entries(RUNPOD_ENDPOINTS)
    .filter(([_, id]) => !!id)
    .map(([name]) => name)
}

/**
 * Run a job on a Runpod serverless endpoint
 * @param endpointId - The Runpod endpoint ID
 * @param input - The input parameters for the model
 * @param sync - Whether to wait for the result (default: true)
 */
export async function runRunpodJob(
  endpointId: string,
  input: RunpodInput,
  sync: boolean = true
): Promise<RunpodJobResult> {
  if (!RUNPOD_API_KEY) {
    throw new Error('Runpod API key not configured. Add RUNPOD_API_KEY to environment.')
  }

  if (!endpointId) {
    throw new Error('Runpod endpoint ID not provided.')
  }

  const endpoint = sync ? 'runsync' : 'run'
  const url = `${RUNPOD_BASE_URL}/${endpointId}/${endpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `Runpod API error: ${response.status}`)
  }

  const result: RunpodResponse = await response.json()

  if (result.status === 'FAILED') {
    throw new Error(result.error || 'Runpod job failed')
  }

  return {
    id: result.id,
    status: result.status,
    output: result.output,
    error: result.error,
    metrics: result.executionTime ? {
      executionTime: result.executionTime,
      delayTime: result.delayTime || 0,
    } : undefined,
  }
}

/**
 * Check the status of an async Runpod job
 * @param endpointId - The Runpod endpoint ID
 * @param jobId - The job ID to check
 */
export async function checkRunpodJob(
  endpointId: string,
  jobId: string
): Promise<RunpodJobResult> {
  if (!RUNPOD_API_KEY) {
    throw new Error('Runpod API key not configured')
  }

  const url = `${RUNPOD_BASE_URL}/${endpointId}/status/${jobId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to check job status: ${response.status}`)
  }

  const result: RunpodResponse = await response.json()

  return {
    id: result.id,
    status: result.status,
    output: result.output,
    error: result.error,
    metrics: result.executionTime ? {
      executionTime: result.executionTime,
      delayTime: result.delayTime || 0,
    } : undefined,
  }
}

/**
 * Cancel a running Runpod job
 * @param endpointId - The Runpod endpoint ID
 * @param jobId - The job ID to cancel
 */
export async function cancelRunpodJob(
  endpointId: string,
  jobId: string
): Promise<{ success: boolean }> {
  if (!RUNPOD_API_KEY) {
    throw new Error('Runpod API key not configured')
  }

  const url = `${RUNPOD_BASE_URL}/${endpointId}/cancel/${jobId}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    },
  })

  return { success: response.ok }
}

/**
 * Poll for job completion with timeout
 * @param endpointId - The Runpod endpoint ID
 * @param jobId - The job ID to poll
 * @param timeoutMs - Maximum time to wait (default: 120 seconds)
 * @param intervalMs - Polling interval (default: 2 seconds)
 */
export async function pollRunpodJob(
  endpointId: string,
  jobId: string,
  timeoutMs: number = 120000,
  intervalMs: number = 2000
): Promise<RunpodJobResult> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const result = await checkRunpodJob(endpointId, jobId)

    if (result.status === 'COMPLETED' || result.status === 'FAILED' || result.status === 'CANCELLED') {
      if (result.status === 'FAILED') {
        throw new Error(result.error || 'Runpod job failed')
      }
      return result
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Runpod job timed out')
}

/**
 * Helper: Generate image with SDXL
 */
export async function generateImageSDXL(params: {
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
}): Promise<RunpodJobResult> {
  const endpointId = RUNPOD_ENDPOINTS.sdxl
  if (!endpointId) {
    throw new Error('SDXL endpoint not configured. Set RUNPOD_SDXL_ENDPOINT in environment.')
  }

  return runRunpodJob(endpointId, {
    prompt: params.prompt,
    negative_prompt: params.negative_prompt || 'blurry, low quality, distorted',
    width: params.width || 1024,
    height: params.height || 1024,
    num_inference_steps: params.num_inference_steps || 30,
    guidance_scale: params.guidance_scale || 7.5,
    seed: params.seed || Math.floor(Math.random() * 1000000),
  })
}

/**
 * Helper: Generate image with FLUX via ComfyUI worker
 * The worker expects a ComfyUI workflow format
 */
export async function generateImageFLUX(params: {
  prompt: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
}): Promise<RunpodJobResult> {
  const endpointId = RUNPOD_ENDPOINTS.flux
  if (!endpointId) {
    throw new Error('FLUX endpoint not configured. Set RUNPOD_FLUX_ENDPOINT in environment.')
  }

  const width = params.width || 1024
  const height = params.height || 1024
  const seed = params.seed || Math.floor(Math.random() * 1000000)
  const steps = params.num_inference_steps || 4

  // ComfyUI FLUX Schnell workflow format
  const workflow = {
    "5": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": params.prompt,
        "clip": ["11", 0]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["13", 0],
        "vae": ["11", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "flux",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    },
    "11": {
      "inputs": {
        "unet_name": "flux1-schnell.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader"
    },
    "13": {
      "inputs": {
        "noise": ["25", 0],
        "guider": ["22", 0],
        "sampler": ["16", 0],
        "sigmas": ["17", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "SamplerCustomAdvanced"
    },
    "16": {
      "inputs": {
        "sampler_name": "euler"
      },
      "class_type": "KSamplerSelect"
    },
    "17": {
      "inputs": {
        "scheduler": "simple",
        "steps": steps,
        "denoise": 1,
        "model": ["11", 0]
      },
      "class_type": "BasicScheduler"
    },
    "22": {
      "inputs": {
        "model": ["11", 0],
        "conditioning": ["6", 0]
      },
      "class_type": "BasicGuider"
    },
    "25": {
      "inputs": {
        "noise_seed": seed
      },
      "class_type": "RandomNoise"
    }
  }

  // Try simple API format first (most common for serverless FLUX)
  // Some endpoints use direct prompt/width/height, others use ComfyUI workflow
  return runRunpodJob(endpointId, {
    prompt: params.prompt,
    width: width,
    height: height,
    num_inference_steps: steps,
    guidance_scale: params.guidance_scale || 3.5,
    seed: seed,
    // Include workflow for ComfyUI-based endpoints
    workflow,
    images: []
  })
}

/**
 * Helper: Generate video with Stable Video Diffusion
 */
export async function generateVideoSVD(params: {
  image_url: string
  motion_bucket_id?: number
  fps?: number
  num_frames?: number
}): Promise<RunpodJobResult> {
  const endpointId = RUNPOD_ENDPOINTS.svd
  if (!endpointId) {
    throw new Error('SVD endpoint not configured. Set RUNPOD_SVD_ENDPOINT in environment.')
  }

  return runRunpodJob(endpointId, {
    image_url: params.image_url,
    motion_bucket_id: params.motion_bucket_id || 127,
    fps: params.fps || 7,
    num_frames: params.num_frames || 25,
  }, false) // Video generation is async
}

/**
 * Helper: Run LLM inference
 */
export async function runLLMInference(params: {
  prompt: string
  model?: 'llama' | 'mistral'
  max_tokens?: number
  temperature?: number
  top_p?: number
}): Promise<RunpodJobResult> {
  const model = params.model || 'llama'
  const endpointId = model === 'llama' ? RUNPOD_ENDPOINTS.llama : RUNPOD_ENDPOINTS.mistral

  if (!endpointId) {
    throw new Error(`${model} endpoint not configured. Set RUNPOD_${model.toUpperCase()}_ENDPOINT in environment.`)
  }

  return runRunpodJob(endpointId, {
    prompt: params.prompt,
    max_tokens: params.max_tokens || 2048,
    temperature: params.temperature || 0.7,
    top_p: params.top_p || 0.9,
  })
}

/**
 * Helper: Text-to-Speech
 */
export async function generateTTS(params: {
  text: string
  voice?: string
  speed?: number
}): Promise<RunpodJobResult> {
  const endpointId = RUNPOD_ENDPOINTS.tts
  if (!endpointId) {
    throw new Error('TTS endpoint not configured. Set RUNPOD_TTS_ENDPOINT in environment.')
  }

  return runRunpodJob(endpointId, {
    text: params.text,
    voice: params.voice || 'default',
    speed: params.speed || 1.0,
  })
}

/**
 * Get endpoint health status
 */
export async function getEndpointHealth(endpointId: string): Promise<{
  healthy: boolean
  workers: { ready: number; running: number; idle: number }
  jobs: { inQueue: number; inProgress: number; completed: number }
} | null> {
  if (!RUNPOD_API_KEY || !endpointId) return null

  try {
    const response = await fetch(`${RUNPOD_BASE_URL}/${endpointId}/health`, {
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        healthy: true,
        workers: data.workers || { ready: 0, running: 0, idle: 0 },
        jobs: data.jobs || { inQueue: 0, inProgress: 0, completed: 0 },
      }
    }
  } catch (error) {
    console.error(`Health check failed for ${endpointId}:`, error)
  }

  return null
}

/**
 * Warm up RunPod endpoints to prevent cold starts
 * Call this periodically (e.g., every 5 minutes) to keep workers ready
 */
export async function warmUpEndpoints(): Promise<{
  warmedUp: string[]
  failed: string[]
  skipped: string[]
}> {
  const results = {
    warmedUp: [] as string[],
    failed: [] as string[],
    skipped: [] as string[],
  }

  if (!RUNPOD_API_KEY) {
    return results
  }

  const endpointsToWarm = [
    { name: 'flux', id: RUNPOD_ENDPOINTS.flux },
    { name: 'sdxl', id: RUNPOD_ENDPOINTS.sdxl },
    { name: 'tts', id: RUNPOD_ENDPOINTS.tts },
  ]

  for (const endpoint of endpointsToWarm) {
    if (!endpoint.id) {
      results.skipped.push(endpoint.name)
      continue
    }

    try {
      const health = await getEndpointHealth(endpoint.id)

      // If no workers are ready, send a minimal request to wake them up
      if (health && health.workers.ready === 0 && health.workers.running === 0) {
        console.log(`[RunPod] Warming up ${endpoint.name} endpoint...`)

        // Send a minimal async request to trigger worker spin-up
        const response = await fetch(`${RUNPOD_BASE_URL}/${endpoint.id}/run`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: {
              prompt: 'warmup',
              width: 64,
              height: 64,
              num_inference_steps: 1,
            }
          }),
        })

        if (response.ok) {
          results.warmedUp.push(endpoint.name)
        } else {
          results.failed.push(endpoint.name)
        }
      } else {
        results.skipped.push(endpoint.name) // Already warm
      }
    } catch (error) {
      console.error(`[RunPod] Warm-up failed for ${endpoint.name}:`, error)
      results.failed.push(endpoint.name)
    }
  }

  return results
}

/**
 * Get comprehensive health status of all AI providers
 */
export async function getAllProvidersHealth(): Promise<{
  runpod: {
    configured: boolean
    endpoints: Record<string, { healthy: boolean; workers?: any; jobs?: any }>
  }
  replicate: { configured: boolean }
  openai: { configured: boolean }
  anthropic: { configured: boolean }
}> {
  const status = {
    runpod: {
      configured: isRunpodConfigured(),
      endpoints: {} as Record<string, { healthy: boolean; workers?: any; jobs?: any }>,
    },
    replicate: { configured: !!(process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN) },
    openai: { configured: !!process.env.OPENAI_API_KEY },
    anthropic: { configured: !!process.env.ANTHROPIC_API_KEY },
  }

  // Check RunPod endpoints
  if (status.runpod.configured) {
    const endpoints = [
      { name: 'flux', id: RUNPOD_ENDPOINTS.flux },
      { name: 'sdxl', id: RUNPOD_ENDPOINTS.sdxl },
      { name: 'tts', id: RUNPOD_ENDPOINTS.tts },
      { name: 'svd', id: RUNPOD_ENDPOINTS.svd },
      { name: 'llama', id: RUNPOD_ENDPOINTS.llama },
    ]

    for (const ep of endpoints) {
      if (ep.id) {
        const health = await getEndpointHealth(ep.id)
        status.runpod.endpoints[ep.name] = {
          healthy: !!health,
          workers: health?.workers,
          jobs: health?.jobs,
        }
      }
    }
  }

  return status
}

/**
 * Smart provider selection based on availability and cost
 */
export function selectBestProvider(
  task: 'image' | 'video' | 'llm' | 'tts',
  preferredProvider?: string
): string | null {
  const providers = {
    image: ['runpod', 'replicate', 'openai'],
    video: ['runpod', 'replicate'],
    llm: ['runpod', 'anthropic', 'openai'],
    tts: ['runpod', 'openai'],
  }

  const available = providers[task].filter(p => {
    switch (p) {
      case 'runpod':
        return isRunpodConfigured() && (
          (task === 'image' && (RUNPOD_ENDPOINTS.flux || RUNPOD_ENDPOINTS.sdxl)) ||
          (task === 'video' && RUNPOD_ENDPOINTS.svd) ||
          (task === 'llm' && (RUNPOD_ENDPOINTS.llama || RUNPOD_ENDPOINTS.mistral)) ||
          (task === 'tts' && RUNPOD_ENDPOINTS.tts)
        )
      case 'replicate':
        return !!(process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN)
      case 'openai':
        return !!process.env.OPENAI_API_KEY
      case 'anthropic':
        return !!process.env.ANTHROPIC_API_KEY
      default:
        return false
    }
  })

  // Use preferred if available
  if (preferredProvider && available.includes(preferredProvider)) {
    return preferredProvider
  }

  // Return first available (ordered by cost efficiency)
  return available[0] || null
}
