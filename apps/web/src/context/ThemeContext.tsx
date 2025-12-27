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

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('webcraft-theme') as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
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
      document.documentElement.setAttribute('data-theme', newTheme)

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

  // Prevent flash of wrong theme
  if (!mounted) {
    return null
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
