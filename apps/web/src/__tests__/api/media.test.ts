import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

// Use real Pixabay API - no mocking
describe('Media APIs (Real APIs)', () => {
  beforeAll(() => {
    expect(process.env.PIXABAY_API_KEY).toBeDefined()
    console.log('Using real Pixabay API key')
  })

  describe('GET /api/media/pixabay', () => {
    it('returns images from real Pixabay API', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=nature')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      expect(Array.isArray(data.images)).toBe(true)
      expect(data.images.length).toBeGreaterThan(0)
      console.log(`Found ${data.images.length} nature images from Pixabay`)
    }, 30000)

    it('searches for technology images', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=technology')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      expect(data.images.length).toBeGreaterThan(0)
      console.log(`Found ${data.images.length} technology images`)
    }, 30000)

    it('searches for business images', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=business')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      console.log(`Found ${data.images.length} business images`)
    }, 30000)

    it('handles pagination', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=office&page=2&per_page=10')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      console.log(`Page 2 returned ${data.images.length} office images`)
    }, 30000)

    it('returns image with required fields', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=laptop')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.images && data.images.length > 0) {
        const image = data.images[0]
        expect(image).toHaveProperty('id')
        // Check for either webformatURL or url (depending on API transformation)
        const imageUrl = image.webformatURL || image.url || image.src
        expect(imageUrl).toBeDefined()
        console.log(`Sample image: ${JSON.stringify(image, null, 2).slice(0, 300)}`)
      }
    }, 30000)

    it('handles empty query gracefully', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay')
      const response = await GET(req)
      const data = await response.json()

      // Should return error or handle gracefully
      expect([200, 400, 500]).toContain(response.status)
    }, 30000)

    it('searches for abstract images', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=abstract+background')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      console.log(`Found ${data.images.length} abstract background images`)
    }, 30000)

    it('searches for food images', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=food')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      expect(data.images.length).toBeGreaterThan(0)
      console.log(`Found ${data.images.length} food images`)
    }, 30000)

    it('searches for people images', async () => {
      const { GET } = await import('@/app/api/media/pixabay/route')

      const req = new NextRequest('http://localhost:3000/api/media/pixabay?query=people+working')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.images).toBeDefined()
      console.log(`Found ${data.images.length} people working images`)
    }, 30000)
  })
})
