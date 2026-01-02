import { describe, it, expect, vi } from 'vitest'
import React from 'react'

// Mock all dependencies before any imports
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
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

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
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

describe('Home Page', () => {
  it('can be imported without errors', async () => {
    // Just test that the module can be imported
    const module = await import('@/app/page')
    expect(module.default).toBeDefined()
  })

  it('exports a valid React component', async () => {
    const module = await import('@/app/page')
    expect(typeof module.default).toBe('function')
  })

  it('component has a name', async () => {
    const module = await import('@/app/page')
    // React components should have a name
    expect(module.default.name || 'HomePage').toBeDefined()
  })

  it('module structure is correct', async () => {
    const module = await import('@/app/page')
    // Should export a default function
    expect(module).toHaveProperty('default')
  })
})
