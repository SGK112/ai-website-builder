import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getImageCacheStats, clearImageCache } from '@/lib/image-generation-service'
import imageCache from '@/lib/image-cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/cache
 * Returns cache statistics
 */
export async function GET() {
  const stats = getImageCacheStats()

  return NextResponse.json({
    status: 'ok',
    cache: {
      type: 'multi-layer',
      layers: ['memory', 'supabase-storage'],
      ...stats,
      oldestEntryAge: stats.oldestEntry
        ? Math.round((Date.now() - stats.oldestEntry) / 1000 / 60)
        : null,
      newestEntryAge: stats.newestEntry
        ? Math.round((Date.now() - stats.newestEntry) / 1000 / 60)
        : null,
    },
    config: {
      memoryTTLMinutes: 30,
      maxMemoryEntries: 500,
      storageBucket: 'webstew-uploads',
      cacheFolder: 'cache',
    },
  })
}

/**
 * POST /api/ai/cache
 * Cache management actions
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication for cache management
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, prompt, options } = body

    switch (action) {
      case 'clear-memory':
        // Clear in-memory cache only
        imageCache.clearMemory()
        return NextResponse.json({
          success: true,
          action: 'clear-memory',
          message: 'Memory cache cleared',
        })

      case 'clear-storage':
        // Clear storage cache (requires extra confirmation)
        if (!body.confirm) {
          return NextResponse.json({
            error: 'Confirmation required',
            message: 'Set confirm: true to clear storage cache',
          }, { status: 400 })
        }
        const storageResult = await clearImageCache(true)
        return NextResponse.json({
          success: storageResult.success,
          action: 'clear-storage',
          deleted: storageResult.deleted,
          error: storageResult.error,
        })

      case 'clear-all':
        // Clear both memory and storage
        if (!body.confirm) {
          return NextResponse.json({
            error: 'Confirmation required',
            message: 'Set confirm: true to clear all caches',
          }, { status: 400 })
        }
        const allResult = await clearImageCache(true)
        return NextResponse.json({
          success: allResult.success,
          action: 'clear-all',
          deleted: allResult.deleted,
          error: allResult.error,
        })

      case 'lookup':
        // Check if a specific prompt is cached
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }
        const lookupResult = await imageCache.get(prompt, options || {})
        return NextResponse.json({
          success: true,
          action: 'lookup',
          hit: lookupResult.hit,
          source: lookupResult.source,
          url: lookupResult.url,
        })

      case 'stats':
        // Get detailed stats
        const stats = getImageCacheStats()
        return NextResponse.json({
          success: true,
          action: 'stats',
          ...stats,
        })

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['clear-memory', 'clear-storage', 'clear-all', 'lookup', 'stats'],
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Cache API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Cache operation failed' },
      { status: 500 }
    )
  }
}
