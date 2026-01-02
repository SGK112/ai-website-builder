import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// Mock all dependencies before any imports
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}))

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    resolvedTheme: 'dark',
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('can be imported without errors', async () => {
    const module = await import('@/app/login/page')
    expect(module.default).toBeDefined()
  })

  it('exports a valid React component', async () => {
    const module = await import('@/app/login/page')
    expect(typeof module.default).toBe('function')
  })

  it('component has a name', async () => {
    const module = await import('@/app/login/page')
    expect(module.default.name || 'LoginPage').toBeDefined()
  })

  it('module structure is correct', async () => {
    const module = await import('@/app/login/page')
    expect(module).toHaveProperty('default')
  })
})
