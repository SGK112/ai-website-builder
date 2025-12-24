/**
 * In-memory rate limiter with sliding window algorithm
 * For production, consider using Upstash Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  maxRequests: number      // Maximum requests allowed
  windowMs: number         // Time window in milliseconds
  message?: string         // Custom error message
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number           // Unix timestamp when the limit resets
  retryAfter?: number     // Seconds until retry (only if limited)
}

// In-memory store for rate limiting (use Redis in production)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60000 // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null

const startCleanup = () => {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)

  // Don't prevent Node from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

startCleanup()

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = store.get(key)

  // If no entry or window has passed, start fresh
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs
    store.set(key, { count: 1, resetTime })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: Math.floor(resetTime / 1000),
    }
  }

  // Increment count
  entry.count++
  store.set(key, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const reset = Math.floor(entry.resetTime / 1000)

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    reset,
  }
}

// Preset rate limit configurations
export const rateLimitConfigs = {
  // General API rate limit
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    message: 'Too many requests, please try again later.',
  },

  // AI generation (more restrictive due to cost)
  aiGeneration: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 generations per minute
    message: 'AI generation limit reached. Please wait before generating more content.',
  },

  // Strict AI limit for free tier
  aiGenerationFree: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 generations per minute for free users
    message: 'Free tier AI limit reached. Upgrade to Pro for more generations.',
  },

  // Deployment rate limit
  deployment: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 deployments per hour
    message: 'Deployment limit reached. Please wait before deploying again.',
  },

  // Authentication attempts
  auth: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 10 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  },

  // Password reset requests
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    message: 'Too many password reset requests. Please try again later.',
  },

  // Project creation
  projectCreation: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 20 projects per hour
    message: 'Project creation limit reached. Please try again later.',
  },
} as const

export type RateLimitType = keyof typeof rateLimitConfigs

/**
 * Rate limit by type with automatic identifier
 */
export function rateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  const config = rateLimitConfigs[type]
  return checkRateLimit(`${type}:${identifier}`, config)
}

/**
 * Create a rate limiter function for a specific type
 */
export function createRateLimiter(type: RateLimitType) {
  const config = rateLimitConfigs[type]

  return (identifier: string): RateLimitResult => {
    return checkRateLimit(`${type}:${identifier}`, config)
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public readonly statusCode = 429
  public readonly limit: number
  public readonly remaining: number
  public readonly reset: number
  public readonly retryAfter: number

  constructor(result: RateLimitResult, message?: string) {
    super(message || 'Rate limit exceeded')
    this.name = 'RateLimitError'
    this.limit = result.limit
    this.remaining = result.remaining
    this.reset = result.reset
    this.retryAfter = result.retryAfter || 0
  }

  toHeaders(): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.limit.toString(),
      'X-RateLimit-Remaining': this.remaining.toString(),
      'X-RateLimit-Reset': this.reset.toString(),
      'Retry-After': this.retryAfter.toString(),
    }
  }
}

/**
 * Helper to apply rate limiting in API routes
 * Throws RateLimitError if limit is exceeded
 */
export function applyRateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  const result = rateLimit(identifier, type)

  if (!result.success) {
    throw new RateLimitError(result, rateLimitConfigs[type].message)
  }

  return result
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}

export default {
  check: checkRateLimit,
  rateLimit,
  createRateLimiter,
  applyRateLimit,
  getRateLimitHeaders,
  configs: rateLimitConfigs,
  RateLimitError,
}
