/**
 * Credits API Tests - Demo/Anonymous User Flow
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// These exercise live routes (DB / HuggingFace) without mocks — integration
// only. Skipped unless RUN_INTEGRATION=1 so default `npm test` stays green.
const describeLive = process.env.RUN_INTEGRATION ? describe : describe.skip

describeLive('Credits API - Demo Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/credits', () => {
    it('returns demo credits for anonymous users', async () => {
      const res = await fetch('http://localhost:3000/api/credits')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.credits).toBe(100)
      expect(data.plan).toBe('demo')
      expect(data.isDemo).toBe(true)
      expect(data.creditCosts).toBeDefined()
      expect(data.creditCosts.generate_website).toBe(10)
    })

    it('includes credit packages', async () => {
      const res = await fetch('http://localhost:3000/api/credits')
      const data = await res.json()

      expect(data.packages).toBeInstanceOf(Array)
      expect(data.packages.length).toBeGreaterThan(0)
      expect(data.packages[0]).toHaveProperty('id')
      expect(data.packages[0]).toHaveProperty('credits')
      expect(data.packages[0]).toHaveProperty('price')
    })
  })

  describe('PATCH /api/credits', () => {
    it('allows anonymous users with demo mode', async () => {
      const res = await fetch('http://localhost:3000/api/credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, operation: 'generate_website' })
      })

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.isDemo).toBe(true)
      expect(data.credits).toBe(100) // Demo credits don't deduct
      expect(data.deducted).toBe(0)
    })
  })
})

describeLive('Builder Generate API - Model Selection', () => {
  it('works with claude-3-haiku model', async () => {
    const res = await fetch('http://localhost:3000/api/builder/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'simple test page',
        model: 'claude-3-haiku'
      })
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    // Read first chunk
    const reader = res.body?.getReader()
    if (reader) {
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)
      expect(text).toContain('data:')
      expect(text).toContain('html')
      reader.releaseLock()
    }
  }, 30000)

  it('works with llama-free model', async () => {
    const res = await fetch('http://localhost:3000/api/builder/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'simple test page',
        model: 'llama-free'
      })
    })

    expect(res.status).toBe(200)

    const reader = res.body?.getReader()
    if (reader) {
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)
      expect(text).toContain('data:')
      reader.releaseLock()
    }
  }, 30000)
})
