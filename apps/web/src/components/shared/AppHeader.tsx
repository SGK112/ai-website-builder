'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Zap,
  ChevronDown,
  Plus,
  FolderOpen,
  Settings,
  LogOut,
  Home,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Project {
  _id: string
  name: string
  updatedAt: string
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [showProjects, setShowProjects] = useState(false)
  const [loading, setLoading] = useState(true)

  // Extract project ID from pathname
  useEffect(() => {
    const match = pathname.match(/\/(create|builder)\/([a-f0-9]+)/)
    if (match) {
      setCurrentProjectId(match[2])
    } else {
      setCurrentProjectId(null)
    }
  }, [pathname])

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects || [])
        }
      } catch (e) {
        console.error('Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const currentProject = projects.find(p => p._id === currentProjectId)
  const isInBuilder = pathname.startsWith('/create') || pathname.startsWith('/builder')
  const isHome = pathname === '/'
  const isDashboard = pathname.startsWith('/dashboard')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo & Project Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white hidden sm:block">AI Builder</span>
          </Link>

          {/* Project Switcher - show when in builder */}
          {isInBuilder && (
            <>
              <div className="h-6 w-px bg-white/10" />
              <div className="relative">
                <button
                  onClick={() => setShowProjects(!showProjects)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
                >
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-white max-w-[150px] truncate">
                    {currentProject?.name || 'Select Project'}
                  </span>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-slate-400 transition-transform',
                    showProjects && 'rotate-180'
                  )} />
                </button>

                {showProjects && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProjects(false)} />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowProjects(false)
                            router.push('/new-project')
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">New Project</p>
                            <p className="text-xs text-slate-400">Start with AI</p>
                          </div>
                        </button>
                      </div>

                      {projects.length > 0 && (
                        <>
                          <div className="border-t border-white/5" />
                          <div className="p-2 max-h-64 overflow-y-auto">
                            <p className="px-3 py-1 text-xs text-slate-500 uppercase tracking-wide">Recent Projects</p>
                            {loading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                              </div>
                            ) : (
                              projects.slice(0, 5).map(project => (
                                <button
                                  key={project._id}
                                  onClick={() => {
                                    setShowProjects(false)
                                    router.push(`/create/${project._id}`)
                                  }}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition',
                                    project._id === currentProjectId
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'hover:bg-white/5 text-white'
                                  )}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                                    {project.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{project.name}</p>
                                    <p className="text-xs text-slate-500">
                                      {new Date(project.updatedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {project._id === currentProjectId && (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                          <div className="border-t border-white/5 p-2">
                            <button
                              onClick={() => {
                                setShowProjects(false)
                                router.push('/dashboard')
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
                            >
                              <FolderOpen className="w-4 h-4" />
                              View All Projects
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition',
              isHome ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition',
              isDashboard ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            My Projects
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!isInBuilder && (
            <Button
              onClick={() => router.push('/new-project')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create with AI</span>
              <span className="sm:hidden">Create</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
