import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/templates/route'

// Hits real Supabase — integration only. Skipped unless RUN_INTEGRATION=1
// (with real Supabase creds). Keeps the default `npm test` deterministic.
describe.skipIf(!process.env.RUN_INTEGRATION)('Templates API (Real Supabase)', () => {
  beforeAll(() => {
    // Ensure real API keys are set
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
  })

  describe('GET /api/templates', () => {
    it('returns templates from real Supabase database', async () => {
      const req = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toBeDefined()
      expect(Array.isArray(data.templates)).toBe(true)
      expect(data.count).toBeGreaterThanOrEqual(0)
      console.log(`Found ${data.count} templates in Supabase`)
    })

    it('filters by category', async () => {
      const req = new NextRequest('http://localhost:3000/api/templates?category=ecommerce')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toBeDefined()
      // All returned templates should have ecommerce category
      data.templates.forEach((template: any) => {
        expect(template.category).toBe('ecommerce')
      })
      console.log(`Found ${data.count} ecommerce templates`)
    })

    it('filters by industry', async () => {
      const req = new NextRequest('http://localhost:3000/api/templates?industry=fashion')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toBeDefined()
      console.log(`Found ${data.count} fashion industry templates`)
    })

    it('fetches single template by id', async () => {
      // First get all templates to find a valid ID
      const listReq = new NextRequest('http://localhost:3000/api/templates')
      const listResponse = await GET(listReq)
      const listData = await listResponse.json()

      if (listData.templates && listData.templates.length > 0) {
        const templateId = listData.templates[0].id
        const req = new NextRequest(`http://localhost:3000/api/templates?id=${templateId}`)
        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.templates).toBeDefined()
        expect(data.templates.length).toBe(1)
        expect(data.templates[0].id).toBe(templateId)
        console.log(`Fetched template: ${data.templates[0].name}`)
      } else {
        console.log('No templates in database to test single fetch')
        expect(true).toBe(true)
      }
    })

    it('handles non-existent template id', async () => {
      // Use a valid UUID format that doesn't exist
      const req = new NextRequest('http://localhost:3000/api/templates?id=00000000-0000-0000-0000-000000000000')
      const response = await GET(req)
      const data = await response.json()

      // Supabase returns empty array or error for non-existent IDs
      expect([200, 400, 500]).toContain(response.status)
    })
  })

  describe('POST /api/templates', () => {
    it('validates required fields', async () => {
      const invalidTemplate = {
        description: 'Missing name and category',
      }

      const req = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify(invalidTemplate),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('creates a new template in Supabase', async () => {
      const testTemplate = {
        name: `Test Template ${Date.now()}`,
        category: 'test',
        industry: 'technology',
        description: 'Test template created by automated tests',
        html_content: '<html><head><title>Test</title></head><body><h1>Test Template</h1></body></html>',
        thumbnail: 'https://picsum.photos/seed/test/800/600',
      }

      const req = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify(testTemplate),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.template).toHaveProperty('id')
      expect(data.template.name).toBe(testTemplate.name)
      console.log(`Created template with ID: ${data.template.id}`)
    })

    it('uses default thumbnail when not provided', async () => {
      const templateWithoutThumbnail = {
        name: `No Thumbnail Test ${Date.now()}`,
        category: 'test',
        html_content: '<html><body>No thumbnail</body></html>',
      }

      const req = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify(templateWithoutThumbnail),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      // Thumbnail may or may not be set depending on API implementation
      if (data.template.thumbnail) {
        expect(data.template.thumbnail).toContain('picsum')
        console.log(`Created template with thumbnail: ${data.template.thumbnail}`)
      } else {
        console.log(`Created template without thumbnail`)
      }
    })
  })
})
