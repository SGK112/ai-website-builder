import { NextRequest, NextResponse } from 'next/server'
import { isRunpodConfigured, RUNPOD_ENDPOINTS } from '@/lib/runpod'

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY

interface EndpointStatus {
  id: string
  name: string
  status: 'healthy' | 'unhealthy' | 'not_configured'
  workers?: {
    ready: number
    running: number
    idle: number
  }
  jobs?: {
    inQueue: number
    inProgress: number
    completed: number
  }
}

async function checkEndpointHealth(endpointId: string): Promise<any> {
  if (!endpointId || !RUNPOD_API_KEY) return null

  try {
    const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/health`, {
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      },
    })

    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error(`Failed to check health for ${endpointId}:`, error)
  }
  return null
}

export async function GET() {
  const endpoints: EndpointStatus[] = []

  // Check each configured endpoint
  const endpointConfigs = [
    { key: 'sdxl', name: 'SDXL Image Generation', id: RUNPOD_ENDPOINTS.sdxl },
    { key: 'flux', name: 'FLUX Image Generation', id: RUNPOD_ENDPOINTS.flux },
    { key: 'sd15', name: 'Stable Diffusion 1.5', id: RUNPOD_ENDPOINTS.sd15 },
    { key: 'svd', name: 'Stable Video Diffusion', id: RUNPOD_ENDPOINTS.svd },
    { key: 'animateDiff', name: 'AnimateDiff Video', id: RUNPOD_ENDPOINTS.animateDiff },
    { key: 'llama', name: 'Llama LLM', id: RUNPOD_ENDPOINTS.llama },
    { key: 'mistral', name: 'Mistral LLM', id: RUNPOD_ENDPOINTS.mistral },
    { key: 'tts', name: 'Text-to-Speech', id: RUNPOD_ENDPOINTS.tts },
    { key: 'custom', name: 'Custom Endpoint', id: RUNPOD_ENDPOINTS.custom },
  ]

  for (const config of endpointConfigs) {
    if (!config.id) {
      endpoints.push({
        id: config.key,
        name: config.name,
        status: 'not_configured',
      })
      continue
    }

    const health = await checkEndpointHealth(config.id)
    endpoints.push({
      id: config.id,
      name: config.name,
      status: health ? 'healthy' : 'unhealthy',
      workers: health?.workers,
      jobs: health?.jobs,
    })
  }

  return NextResponse.json({
    configured: isRunpodConfigured(),
    apiKey: RUNPOD_API_KEY ? `${RUNPOD_API_KEY.slice(0, 8)}...` : null,
    endpoints,
    setupInstructions: {
      step1: 'Go to https://www.runpod.io/console/serverless',
      step2: 'Click "New Endpoint" button',
      step3: 'Choose a template:',
      templates: {
        sdxl: {
          name: 'SDXL Image Generation',
          recommended: 'runpod/worker-comfyui:5.3.0-sdxl',
          gpu: 'RTX 4090 or A100 (24GB+ VRAM)',
          envVar: 'RUNPOD_SDXL_ENDPOINT',
        },
        flux: {
          name: 'FLUX Image Generation',
          recommended: 'runpod/worker-comfyui:latest-flux1-dev',
          gpu: 'RTX 4090 or A100 (24GB+ VRAM)',
          envVar: 'RUNPOD_FLUX_ENDPOINT',
        },
        llama: {
          name: 'Llama LLM Inference',
          recommended: 'runpod/worker-vllm:stable-cuda12.1.0',
          gpu: 'A100 (40GB+ for larger models)',
          envVar: 'RUNPOD_LLAMA_ENDPOINT',
        },
      },
      step4: 'Configure endpoint settings:',
      settings: {
        idleTimeout: '5 seconds (cost efficient)',
        workersMin: '0 (scale to zero)',
        workersMax: '3 (adjust based on load)',
        scalerType: 'QUEUE_DELAY',
        scalerValue: '4 seconds',
      },
      step5: 'Copy the endpoint ID and add to .env.local',
    },
    quickStartEndpoints: {
      message: 'These are pre-configured Runpod endpoints you can use directly:',
      note: 'Visit runpod.io/console/serverless to create your own endpoints',
    },
  })
}
