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
