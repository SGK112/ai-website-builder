import { NextRequest, NextResponse } from 'next/server'
import { warmUpEndpoints, isRunpodConfigured, getAvailableEndpoints } from '@/lib/runpod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for warm-up

// Secret token for cron authentication
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/warmup
 * Warm up RunPod GPU endpoints to prevent cold starts
 *
 * This endpoint should be called by:
 * - Vercel Cron Jobs (configured in vercel.json)
 * - Render Cron Jobs
 * - External cron service (e.g., cron-job.org, EasyCron)
 * - GitHub Actions scheduled workflow
 *
 * Authentication:
 * - Vercel Cron: Automatic via CRON_SECRET header
 * - External: Pass ?secret=YOUR_CRON_SECRET or Authorization header
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const secretParam = request.nextUrl.searchParams.get('secret')
  const vercelCronHeader = request.headers.get('x-vercel-cron')

  // Allow Vercel's internal cron calls
  const isVercelCron = vercelCronHeader === '1'

  // Check secret if not a Vercel internal call
  if (!isVercelCron && CRON_SECRET) {
    const providedSecret = authHeader?.replace('Bearer ', '') || secretParam
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing cron secret' },
        { status: 401 }
      )
    }
  }

  // Check if RunPod is configured
  if (!isRunpodConfigured()) {
    return NextResponse.json({
      success: false,
      message: 'RunPod not configured',
      hint: 'Set RUNPOD_API_KEY in environment variables',
    }, { status: 503 })
  }

  try {
    console.log('[Cron] Starting endpoint warm-up...')

    const result = await warmUpEndpoints()
    const duration = Date.now() - startTime

    console.log(`[Cron] Warm-up completed in ${duration}ms:`, result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      availableEndpoints: getAvailableEndpoints(),
      warmup: result,
      nextRun: 'In 5 minutes (configured interval)',
    })
  } catch (error: any) {
    console.error('[Cron] Warm-up failed:', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Warm-up failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

/**
 * POST /api/cron/warmup
 * Manual warm-up trigger (requires authentication)
 */
export async function POST(request: NextRequest) {
  // For POST, always require secret
  const authHeader = request.headers.get('authorization')
  const body = await request.json().catch(() => ({}))
  const providedSecret = authHeader?.replace('Bearer ', '') || body.secret

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Delegate to GET handler
  return GET(request)
}
