import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status', 'healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('version')
    })

    it('includes valid timestamp', async () => {
      const response = await GET()
      const data = await response.json()

      const timestamp = new Date(data.timestamp)
      expect(timestamp.getTime()).toBeGreaterThan(0)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('returns correct content type', async () => {
      const response = await GET()

      expect(response.headers.get('Content-Type')).toContain('application/json')
    })

    it('responds quickly (under 100ms)', async () => {
      const start = Date.now()
      await GET()
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })
  })
})
