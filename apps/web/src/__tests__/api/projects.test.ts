import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing route handlers
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
  Project: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}))

vi.mock('@ai-website-builder/ai-agents', () => ({
  AIAgentRouter: vi.fn().mockImplementation(() => ({})),
  CODE_GENERATION_PROMPTS: {},
}))

vi.mock('mongoose', () => {
  const ObjectId: any = vi.fn().mockImplementation((id) => id || 'mock-object-id')
  // Routes call the static mongoose.Types.ObjectId.isValid(); the mock omitted
  // it → "isValid is not a function" → 500. Provide a real-ish 24-hex check.
  ObjectId.isValid = (id: any) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)
  return { default: { Types: { ObjectId } } }
})

import { getServerSession } from 'next-auth'
import { Project } from '@ai-website-builder/database'
import { GET, POST } from '@/app/api/projects/route'

describe('Projects API', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/projects', () => {
    it('returns user projects when authenticated', async () => {
      const mockProjects = [
        { _id: '1', name: 'Project 1', type: 'website' },
        { _id: '2', name: 'Project 2', type: 'ecommerce' },
      ]

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(Project.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProjects),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toHaveLength(2)
      // Route queries with a collaborator-aware $or (own projects + shared),
      // scoped to this user's id — not a bare { userId } match.
      const calledWith = vi.mocked(Project.find).mock.calls[0][0] as any
      expect(calledWith).toHaveProperty('$or')
      expect(calledWith.$or).toContainEqual({ userId: 'user-123' })
    })

    it('returns an empty list when not authenticated', async () => {
      // Anon users must NOT see other users' projects (was a dev-mode leak).
      // The route short-circuits to [] without ever touching the DB.
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toEqual([])
      expect(Project.find).not.toHaveBeenCalled()
    })

    it('limits results to 50 projects', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

      const limitMock = vi.fn().mockReturnThis()
      vi.mocked(Project.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: limitMock,
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects')
      await GET(req)

      expect(limitMock).toHaveBeenCalledWith(50)
    })

    it('sorts by updatedAt descending', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

      const sortMock = vi.fn().mockReturnThis()
      vi.mocked(Project.find).mockReturnValue({
        sort: sortMock,
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects')
      await GET(req)

      expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 })
    })

    it('excludes file contents from list', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

      const selectMock = vi.fn().mockReturnThis()
      vi.mocked(Project.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: selectMock,
        lean: vi.fn().mockResolvedValue([]),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects')
      await GET(req)

      expect(selectMock).toHaveBeenCalledWith('-files.content')
    })

    it('handles database errors', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(Project.find).mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const req = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch projects')
    })
  })

  describe('POST /api/projects', () => {
    it('creates a new project', async () => {
      const newProject = {
        name: 'New Project',
        type: 'website',
        description: 'A test project',
      }

      const createdProject = {
        _id: 'new-project-id',
        ...newProject,
        status: 'ready',
        config: {},
      }

      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(Project.create).mockResolvedValueOnce(createdProject as any)

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.project).toHaveProperty('_id')
      expect(data.project.name).toBe('New Project')
    })

    it('validates required fields - name', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ type: 'website' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Name and type are required')
    })

    it('validates required fields - type', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Name and type are required')
    })

    it('creates project for anonymous users', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)
      vi.mocked(Project.create).mockResolvedValueOnce({
        _id: 'anon-project',
        name: 'Anon Project',
        type: 'website',
        status: 'ready',
        config: {},
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Anon Project', type: 'website' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('sets default values for optional fields', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(Project.create).mockResolvedValueOnce({
        _id: 'id',
        name: 'Test',
        type: 'website',
        status: 'ready',
        config: {},
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'website' }),
      })

      await POST(req)

      expect(Project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
          config: {},
          aiAgent: 'claude',
          status: 'ready',
          wizardStep: 5,
          wizardCompleted: true,
        })
      )
    })

    it('handles creation errors', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(Project.create).mockRejectedValueOnce(new Error('DB error'))

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', type: 'website' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create project')
    })

    it('accepts preferred AI agent', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any)
      vi.mocked(Project.create).mockResolvedValueOnce({
        _id: 'id',
        name: 'Test',
        type: 'website',
        aiAgent: 'gpt4',
        status: 'ready',
        config: {},
      } as any)

      const req = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          type: 'website',
          preferredAgent: 'gpt4',
        }),
      })

      await POST(req)

      expect(Project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          aiAgent: 'gpt4',
        })
      )
    })
  })
})
