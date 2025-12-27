'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Project {
  _id: string
  name: string
  description?: string
  type: string
  status: string
  updatedAt: string
  createdAt: string
}

interface UserPreferences {
  theme: 'light' | 'dark'
  defaultFramework: string
  showOnboarding: boolean
}

interface AppState {
  // User info
  user: {
    id: string
    name: string
    email: string
    plan: string
  } | null

  // Projects
  projects: Project[]
  currentProject: Project | null
  recentProjects: Project[]

  // UI State
  isLoading: boolean
  sidebarOpen: boolean

  // Preferences
  preferences: UserPreferences
}

interface AppContextType extends AppState {
  // Actions
  setCurrentProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
  addToRecentProjects: (project: Project) => void
  setSidebarOpen: (open: boolean) => void
  updatePreferences: (prefs: Partial<UserPreferences>) => void
  setUser: (user: AppState['user']) => void
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  defaultFramework: 'nextjs',
  showOnboarding: true,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppState['user']>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('app-preferences')
    if (savedPrefs) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(savedPrefs) })
      } catch (e) {
        console.error('Failed to parse preferences')
      }
    }

    const savedRecent = localStorage.getItem('recent-projects')
    if (savedRecent) {
      try {
        setRecentProjects(JSON.parse(savedRecent))
      } catch (e) {
        console.error('Failed to parse recent projects')
      }
    }

    // Set default user for development
    setUser({
      id: 'dev-user',
      name: 'Developer',
      email: 'dev@localhost',
      plan: 'pro',
    })
  }, [])

  // Fetch projects on mount
  useEffect(() => {
    refreshProjects()
  }, [])

  const refreshProjects = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToRecentProjects = (project: Project) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(p => p._id !== project._id)
      const updated = [project, ...filtered].slice(0, 5)
      localStorage.setItem('recent-projects', JSON.stringify(updated))
      return updated
    })
  }

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...prefs }
      localStorage.setItem('app-preferences', JSON.stringify(updated))
      return updated
    })
  }

  const value: AppContextType = {
    user,
    projects,
    currentProject,
    recentProjects,
    isLoading,
    sidebarOpen,
    preferences,
    setCurrentProject,
    refreshProjects,
    addToRecentProjects,
    setSidebarOpen,
    updatePreferences,
    setUser,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
