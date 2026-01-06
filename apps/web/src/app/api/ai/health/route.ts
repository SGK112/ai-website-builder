import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  isRunpodConfigured,
  getAvailableEndpoints,
  getAllProvidersHealth,
  warmUpEndpoints,
  selectBestProvider,
  RUNPOD_ENDPOINTS,
} from '@/lib/runpod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/health
 * Returns health status of all AI providers
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'

  // Basic health check (no auth required)
  const basicHealth = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      runpod: {
        configured: isRunpodConfigured(),
        endpoints: getAvailableEndpoints(),
      },
      replicate: { configured: !!(process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN) },
      openai: { configured: !!process.env.OPENAI_API_KEY },
      anthropic: { configured: !!process.env.ANTHROPIC_API_KEY },
      huggingface: { configured: !!process.env.HUGGINGFACE_API_KEY },
    },
    recommendations: {
      image: selectBestProvider('image'),
      video: selectBestProvider('video'),
      llm: selectBestProvider('llm'),
      tts: selectBestProvider('tts'),
    },
  }

  // Detailed health check requires authentication
  if (detailed) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required for detailed health' }, { status: 401 })
    }

    const detailedHealth = await getAllProvidersHealth()

    return NextResponse.json({
      ...basicHealth,
      detailed: detailedHealth,
      endpoints: {
        flux: RUNPOD_ENDPOINTS.flux ? 'configured' : null,
        sdxl: RUNPOD_ENDPOINTS.sdxl ? 'configured' : null,
        tts: RUNPOD_ENDPOINTS.tts ? 'configured' : null,
        svd: RUNPOD_ENDPOINTS.svd ? 'configured' : null,
        llama: RUNPOD_ENDPOINTS.llama ? 'configured' : null,
        mistral: RUNPOD_ENDPOINTS.mistral ? 'configured' : null,
      },
    })
  }

  return NextResponse.json(basicHealth)
}

/**
 * POST /api/ai/health
 * Warm up endpoints or perform health actions
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication for warm-up
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'warmup':
        const warmupResult = await warmUpEndpoints()
        return NextResponse.json({
          success: true,
          action: 'warmup',
          result: warmupResult,
          message: `Warmed up ${warmupResult.warmedUp.length} endpoints`,
        })

      case 'check':
        const health = await getAllProvidersHealth()
        return NextResponse.json({
          success: true,
          action: 'check',
          health,
        })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: warmup, check' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Health API error:', error)
    return NextResponse.json({ error: error.message || 'Health check failed' }, { status: 500 })
  }
}
