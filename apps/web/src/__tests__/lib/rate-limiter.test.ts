import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  rateLimit,
  createRateLimiter,
  applyRateLimit,
  getRateLimitHeaders,
  RateLimitError,
} from '@ai-website-builder/shared'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate limit store between tests by using unique identifiers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('allows requests under the limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      const id = `test-${Date.now()}-1`

      const result = checkRateLimit(id, config)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })

    it('tracks multiple requests correctly', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      const id = `test-${Date.now()}-2`

      // Make 3 requests
      checkRateLimit(id, config)
      checkRateLimit(id, config)
      const result = checkRateLimit(id, config)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('blocks requests over the limit', () => {
      const config = { maxRequests: 3, windowMs: 60000 }
      const id = `test-${Date.now()}-3`

      // Make 3 requests (at limit)
      checkRateLimit(id, config)
      checkRateLimit(id, config)
      checkRateLimit(id, config)

      // 4th request should be blocked
      const result = checkRateLimit(id, config)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('resets after window expires', () => {
      const config = { maxRequests: 2, windowMs: 1000 }
      const id = `test-${Date.now()}-4`

      // Exhaust limit
      checkRateLimit(id, config)
      checkRateLimit(id, config)

      // Should be blocked
      let result = checkRateLimit(id, config)
      expect(result.success).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(1001)

      // Should be allowed again
      result = checkRateLimit(id, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })
  })

  describe('rateLimit', () => {
    it('uses predefined config for api type', () => {
      const id = `test-api-${Date.now()}`
      const result = rateLimit(id, 'api')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(100) // api limit is 100/min
    })

    it('uses predefined config for aiGeneration type', () => {
      const id = `test-ai-${Date.now()}`
      const result = rateLimit(id, 'aiGeneration')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(20) // aiGeneration limit is 20/min
    })

    it('uses predefined config for deployment type', () => {
      const id = `test-deploy-${Date.now()}`
      const result = rateLimit(id, 'deployment')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(10) // deployment limit is 10/hour
    })
  })

  describe('createRateLimiter', () => {
    it('creates a reusable rate limiter function', () => {
      const limiter = createRateLimiter('auth')
      const id = `test-auth-${Date.now()}`

      const result = limiter(id)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(10) // auth limit is 10/15min
    })
  })

  describe('applyRateLimit', () => {
    it('returns result when under limit', () => {
      const id = `test-apply-${Date.now()}`
      const result = applyRateLimit(id, 'api')

      expect(result.remaining).toBeLessThan(100)
    })

    it('throws RateLimitError when over limit', () => {
      const id = `test-throw-${Date.now()}`

      // Exhaust a small limit
      for (let i = 0; i < 10; i++) {
        try {
          applyRateLimit(id, 'auth')
        } catch {
          // Expected after limit
        }
      }

      expect(() => applyRateLimit(id, 'auth')).toThrow(RateLimitError)
    })
  })

  describe('RateLimitError', () => {
    it('creates error with correct properties', () => {
      const result = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
        retryAfter: 60,
      }

      const error = new RateLimitError(result, 'Custom message')

      expect(error.message).toBe('Custom message')
      expect(error.statusCode).toBe(429)
      expect(error.limit).toBe(10)
      expect(error.remaining).toBe(0)
      expect(error.retryAfter).toBe(60)
    })

    it('generates correct headers', () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: 1234567890,
        retryAfter: 30,
      }

      const error = new RateLimitError(result)
      const headers = error.toHeaders()

      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('0')
      expect(headers['X-RateLimit-Reset']).toBe('1234567890')
      expect(headers['Retry-After']).toBe('30')
    })
  })

  describe('getRateLimitHeaders', () => {
    it('generates headers for successful request', () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 95,
        reset: 1234567890,
      }

      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('95')
      expect(headers['X-RateLimit-Reset']).toBe('1234567890')
      expect(headers['Retry-After']).toBeUndefined()
    })

    it('includes Retry-After for rate limited requests', () => {
      const result = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: 1234567890,
        retryAfter: 45,
      }

      const headers = getRateLimitHeaders(result)

      expect(headers['Retry-After']).toBe('45')
    })
  })
})
