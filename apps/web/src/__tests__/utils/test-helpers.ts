import { vi } from 'vitest'
import { NextRequest } from 'next/server'

// Create a mock NextRequest for API route testing
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options

  const urlObj = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestInit)
}

// Mock authenticated session
export function createMockSession(overrides = {}) {
  return {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      plan: 'free',
      credits: 100,
      isAdmin: false,
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Mock enterprise session
export function createMockEnterpriseSession() {
  return createMockSession({
    plan: 'enterprise',
    credits: 10000,
    isAdmin: true,
  })
}

// Mock fetch responses
export function mockFetch(responses: Record<string, any>) {
  return vi.fn().mockImplementation((url: string) => {
    const matchingKey = Object.keys(responses).find(key => url.includes(key))
    if (matchingKey) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[matchingKey]),
        text: () => Promise.resolve(JSON.stringify(responses[matchingKey])),
        status: 200,
      })
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    })
  })
}

// Mock Supabase client
export function createMockSupabase() {
  const mockData: any[] = []

  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData[0], error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    _setMockData: (data: any[]) => {
      mockData.length = 0
      mockData.push(...data)
    },
  }
}

// Mock MongoDB collection
export function createMockCollection() {
  const documents: any[] = []

  return {
    find: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue(documents),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    findOne: vi.fn().mockResolvedValue(documents[0] || null),
    insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-id' }),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    countDocuments: vi.fn().mockResolvedValue(documents.length),
    _setDocuments: (docs: any[]) => {
      documents.length = 0
      documents.push(...docs)
    },
  }
}

// Validate API response structure
export function expectApiResponse(response: Response, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus)
  expect(response.headers.get('Content-Type')).toContain('application/json')
}

// Validate error response
export function expectErrorResponse(response: Response, expectedStatus: number, expectedMessage?: string) {
  expect(response.status).toBe(expectedStatus)
  return response.json().then((data: any) => {
    expect(data).toHaveProperty('error')
    if (expectedMessage) {
      expect(data.error).toContain(expectedMessage)
    }
  })
}

// Wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generate random test data
export function generateTestData() {
  return {
    id: `test-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    randomNumber: Math.floor(Math.random() * 1000),
  }
}

// Mock environment variables
export function mockEnv(vars: Record<string, string>) {
  const original = { ...process.env }
  Object.assign(process.env, vars)
  return () => {
    Object.keys(vars).forEach(key => {
      if (original[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original[key]
      }
    })
  }
}
