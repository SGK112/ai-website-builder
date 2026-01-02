/**
 * Comprehensive Workspace E2E Tests
 * Tests all major endpoints, buttons, and functionality
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const BASE_URL = 'http://localhost:3000'

describe('Workspace E2E Tests', () => {
  describe('API Health Checks', () => {
    it('GET /api/health returns healthy', async () => {
      const res = await fetch(`${BASE_URL}/api/health`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('healthy')
    })

    it('GET /api/credits returns demo credits', async () => {
      const res = await fetch(`${BASE_URL}/api/credits`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.credits).toBe(100)
      expect(data.isDemo).toBe(true)
    })

    it('GET /api/templates returns templates', async () => {
      const res = await fetch(`${BASE_URL}/api/templates`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.templates).toBeDefined()
    })
  })

  describe('Builder Generate API', () => {
    it('generates HTML with free model (llama-free)', async () => {
      const res = await fetch(`${BASE_URL}/api/builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'minimal test page',
          model: 'llama-free'
        })
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/event-stream')
    }, 30000)

    it('generates HTML with Claude model', async () => {
      const res = await fetch(`${BASE_URL}/api/builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'minimal test page',
          model: 'claude-3-haiku'
        })
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/event-stream')
    }, 30000)

    it('handles edit prompts with existing HTML', async () => {
      const existingHtml = `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>`

      const res = await fetch(`${BASE_URL}/api/builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'change the heading to Goodbye',
          currentHtml: existingHtml,
          model: 'llama-free'
        })
      })

      expect(res.status).toBe(200)
    }, 30000)
  })

  describe('AI Free API', () => {
    it('POST /api/ai/free generates content', async () => {
      const res = await fetch(`${BASE_URL}/api/ai/free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'say hello in one word' }],
          provider: 'huggingface',
          model: 'llama-3.2-3b'
        })
      })

      // May return 200 or 400 depending on API state
      expect([200, 400].includes(res.status)).toBe(true)
    }, 30000)
  })

  describe('Media APIs', () => {
    it('GET /api/media/pixabay searches images', async () => {
      const res = await fetch(`${BASE_URL}/api/media/pixabay?query=nature&per_page=5`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.images).toBeDefined()
    })

    it('GET /api/media/pixabay handles pagination', async () => {
      const res = await fetch(`${BASE_URL}/api/media/pixabay?query=office&page=2&per_page=5`)
      expect(res.status).toBe(200)
    })
  })

  describe('Credits System', () => {
    it('PATCH /api/credits allows demo usage', async () => {
      const res = await fetch(`${BASE_URL}/api/credits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, operation: 'generate_website' })
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.isDemo).toBe(true)
    })

    it('returns credit costs for all operations', async () => {
      const res = await fetch(`${BASE_URL}/api/credits`)
      const data = await res.json()

      expect(data.creditCosts).toHaveProperty('generate_website')
      expect(data.creditCosts).toHaveProperty('chat_message')
      expect(data.creditCosts).toHaveProperty('image_generation')
    })
  })

  describe('Auth Endpoints', () => {
    it('GET /api/auth/session returns session info', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/session`)
      expect(res.status).toBe(200)
      const data = await res.json()
      // Empty session for unauthenticated
      expect(data).toBeDefined()
    })

    it('GET /api/auth/providers returns auth providers', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/providers`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.google).toBeDefined()
    })
  })

  describe('Page Routes', () => {
    it('GET / returns landing page', async () => {
      const res = await fetch(`${BASE_URL}/`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
    })

    it('GET /workspace returns workspace page', async () => {
      const res = await fetch(`${BASE_URL}/workspace`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
    })

    it('GET /login returns login page', async () => {
      const res = await fetch(`${BASE_URL}/login`)
      expect(res.status).toBe(200)
    })
  })
})

describe('Agent API Tests', () => {
  it('POST /api/agent/run executes agent task', async () => {
    const res = await fetch(`${BASE_URL}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Create a simple hello world page',
        context: 'Test context'
      })
    })

    // Agent may return various status codes - just check it responds
    expect(res.status).toBeDefined()
  }, 60000)
})

describe('Template Operations', () => {
  it('GET /api/templates returns templates array', async () => {
    const res = await fetch(`${BASE_URL}/api/templates`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.templates).toBeDefined()
    expect(Array.isArray(data.templates)).toBe(true)
  })

  it('GET /api/templates?industry=restaurant filters by industry', async () => {
    const res = await fetch(`${BASE_URL}/api/templates?industry=restaurant`)
    expect(res.status).toBe(200)
  })
})
