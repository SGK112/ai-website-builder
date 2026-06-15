import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/db', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@ai-website-builder/database', () => ({
  isAdminEmail: () => false,
  User: {
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}))

vi.mock('@/lib/stripe', () => ({
  createCreditsCheckoutSession: vi.fn().mockResolvedValue('https://checkout.stripe.com/test'),
  CREDIT_PACKAGES: [
    { id: 'starter', name: 'Starter', credits: 100, price: 999, popular: false },
    { id: 'pro', name: 'Pro', credits: 500, price: 2999, popular: true },
  ],
  CREDIT_COSTS: { generation: 1, image: 2, deploy: 5 },
}))

import { getServerSession } from 'next-auth'
import { User } from '@ai-website-builder/database'
import { GET, POST } from '@/app/api/credits/route'

describe('Credits API', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  }

  const mockUser = {
    _id: 'user-123',
    credits: 100,
    plan: 'free',
    creditHistory: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/credits', () => {
    it('returns credits for authenticated user', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      // Route resolves a non-ObjectId session id via User.findOne(email).
      vi.mocked(User.findOne).mockResolvedValueOnce(mockUser as any)

      const req = new NextRequest('http://localhost:3000/api/credits')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('credits')
      expect(data).toHaveProperty('creditCosts')
    })

    it('returns demo credits for unauthenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost:3000/api/credits')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isDemo).toBe(true)
      expect(data.credits).toBe(100)
      expect(data.plan).toBe('demo')
    })

    it('returns 404 when user not found', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(User.findOne).mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost:3000/api/credits')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })

    it('includes plan information', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(User.findOne).mockResolvedValueOnce({ ...mockUser, plan: 'pro' } as any)

      const req = new NextRequest('http://localhost:3000/api/credits')
      const response = await GET(req)
      const data = await response.json()

      expect(data).toHaveProperty('plan')
    })
  })

  describe('POST /api/credits', () => {
    it('requires authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost:3000/api/credits', {
        method: 'POST',
        body: JSON.stringify({ packageId: 'starter' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('requires package ID', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

      const req = new NextRequest('http://localhost:3000/api/credits', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Package ID required')
    })
  })
})
