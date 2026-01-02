'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface ProjectFile {
  path: string
  content: string
  type: 'html' | 'css' | 'javascript' | 'json' | 'other'
}

export interface EnvVar {
  key: string
  value: string
  isSecret: boolean
}

export interface Project {
  id: string
  _id?: string  // MongoDB id
  name: string
  description?: string
  html?: string
  files?: ProjectFile[]
  envVars?: EnvVar[]
  skillLevel?: 'no-code' | 'low-code' | 'full-stack'
  status?: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}

interface UseProjectOptions {
  autoLoad?: boolean
  projectId?: string
}

interface UseProjectReturn {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Project operations
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<Project | null>
  saveProject: (project: Partial<Project>) => Promise<Project | null>
  createProject: (name: string, description?: string) => Promise<Project | null>
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>
  deleteProject: (id: string) => Promise<boolean>
  setCurrentProject: (project: Project | null) => void

  // Helpers
  clearError: () => void
}

export function useProject(options: UseProjectOptions = {}): UseProjectReturn {
  const { autoLoad = true, projectId } = options
  const { data: session } = useSession()

  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // Load all projects for the current user
  const loadProjects = useCallback(async () => {
    if (!session?.user) {
      setProjects([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects')

      if (!response.ok) {
        if (response.status === 401) {
          setProjects([])
          return
        }
        throw new Error(`Failed to load projects: ${response.statusText}`)
      }

      const data = await response.json()
      const projectList = data.projects || data || []

      // Normalize dates
      const normalizedProjects = projectList.map((p: Project) => ({
        ...p,
        id: p.id || p._id,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }))

      setProjects(normalizedProjects)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      setError(message)
      console.error('Error loading projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user])

  // Load a single project by ID
  const loadProject = useCallback(async (id: string): Promise<Project | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Project not found')
          return null
        }
        throw new Error(`Failed to load project: ${response.statusText}`)
      }

      const data = await response.json()
      const project = data.project || data

      const normalizedProject: Project = {
        ...project,
        id: project.id || project._id,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      }

      setCurrentProject(normalizedProject)
      return normalizedProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project'
      setError(message)
      console.error('Error loading project:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a new project
  const createProject = useCallback(async (
    name: string,
    description?: string
  ): Promise<Project | null> => {
    if (!session?.user) {
      setError('You must be logged in to create a project')
      return null
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type: 'website',
          status: 'draft',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create project: ${response.statusText}`)
      }

      const data = await response.json()
      const project = data.project || data

      const normalizedProject: Project = {
        ...project,
        id: project.id || project._id,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      }

      setProjects(prev => [normalizedProject, ...prev])
      setCurrentProject(normalizedProject)

      return normalizedProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
      console.error('Error creating project:', err)
      return null
    } finally {
      setIsSaving(false)
    }
  }, [session?.user])

  // Update an existing project
  const updateProject = useCallback(async (
    id: string,
    updates: Partial<Project>
  ): Promise<Project | null> => {
    setIsSaving(true)
    setError(null)

    try {
      // Prepare the update payload - convert html to files format if needed
      const payload: Record<string, unknown> = {}

      if (updates.name !== undefined) payload.name = updates.name
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.status !== undefined) payload.status = updates.status

      // Store HTML content in files array
      if (updates.html !== undefined) {
        payload.files = [{
          path: 'index.html',
          content: updates.html,
          type: 'html',
        }]
      }

      if (updates.files !== undefined) {
        payload.files = updates.files
      }

      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update project: ${response.statusText}`)
      }

      const data = await response.json()
      const project = data.project || data

      const normalizedProject: Project = {
        ...project,
        id: project.id || project._id,
        html: updates.html || extractHtmlFromFiles(project.files),
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      }

      // Update in projects list
      setProjects(prev => prev.map(p =>
        (p.id === id || p._id === id) ? normalizedProject : p
      ))

      // Update current project if it's the one being updated
      if (currentProject && (currentProject.id === id || currentProject._id === id)) {
        setCurrentProject(normalizedProject)
      }

      return normalizedProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project'
      setError(message)
      console.error('Error updating project:', err)
      return null
    } finally {
      setIsSaving(false)
    }
  }, [currentProject])

  // Save project (create or update)
  const saveProject = useCallback(async (
    project: Partial<Project>
  ): Promise<Project | null> => {
    const id = project.id || project._id

    if (id) {
      return updateProject(id, project)
    } else {
      const created = await createProject(
        project.name || 'Untitled Project',
        project.description
      )

      if (created && project.html) {
        // Update with content after creation
        return updateProject(created.id, { html: project.html })
      }

      return created
    }
  }, [createProject, updateProject])

  // Delete a project
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to delete project: ${response.statusText}`)
      }

      // Remove from projects list
      setProjects(prev => prev.filter(p => p.id !== id && p._id !== id))

      // Clear current project if it was deleted
      if (currentProject && (currentProject.id === id || currentProject._id === id)) {
        setCurrentProject(null)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      setError(message)
      console.error('Error deleting project:', err)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [currentProject])

  // Auto-load projects on mount or when session changes
  useEffect(() => {
    if (autoLoad && session?.user) {
      loadProjects()
    }
  }, [autoLoad, session?.user, loadProjects])

  // Auto-load specific project if projectId is provided
  useEffect(() => {
    if (projectId && session?.user) {
      loadProject(projectId)
    }
  }, [projectId, session?.user, loadProject])

  return {
    projects,
    currentProject,
    isLoading,
    isSaving,
    error,
    loadProjects,
    loadProject,
    saveProject,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    clearError,
  }
}

// Helper to extract HTML from files array
function extractHtmlFromFiles(files?: ProjectFile[]): string {
  if (!files || files.length === 0) return ''

  const htmlFile = files.find(f =>
    f.path === 'index.html' || f.type === 'html'
  )

  return htmlFile?.content || ''
}

export default useProject
