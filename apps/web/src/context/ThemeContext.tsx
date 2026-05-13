'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  hasChosenTheme: boolean
  setHasChosenTheme: (value: boolean) => void
  isTransitioning: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [hasChosenTheme, setHasChosenTheme] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Sync helper — writes both attribute AND class so Tailwind's `dark:`
  // variant (configured to fire on [data-theme="dark"] OR .dark) AND our
  // own CSS variables (keyed off [data-theme="dark"]) agree.
  const applyTheme = (t: Theme) => {
    const root = document.documentElement
    root.setAttribute('data-theme', t)
    if (t === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }

  // Initialize theme from localStorage. NOTE: an inline script in
  // app/layout.tsx already sets data-theme + .dark before hydration, so
  // this effect's job is just to mirror that into React state.
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('webcraft-theme') as Theme | null
    const initial: Theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  // Set theme with smooth transition
  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === theme) return

    // Start transition
    setIsTransitioning(true)
    document.body.classList.add('theme-transitioning')

    // Apply theme after a tiny delay to allow transition to start
    requestAnimationFrame(() => {
      setThemeState(newTheme)
      localStorage.setItem('webcraft-theme', newTheme)
      applyTheme(newTheme)

      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false)
        document.body.classList.remove('theme-transitioning')
      }, 500)
    })
  }, [theme])

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const handleSetHasChosenTheme = (value: boolean) => {
    setHasChosenTheme(value)
    localStorage.setItem('webcraft-theme-chosen', value.toString())
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      hasChosenTheme,
      setHasChosenTheme: handleSetHasChosenTheme,
      isTransitioning,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
