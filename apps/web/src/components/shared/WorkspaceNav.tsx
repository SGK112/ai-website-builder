'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  ChevronDown,
  Plus,
  FolderOpen,
  Home,
  Sparkles,
  Check,
  Loader2,
  LayoutDashboard,
  Code2,
  Palette,
  Store,
  Settings,
  CreditCard,
  Search,
  Command,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Project {
  _id: string
  name: string
  updatedAt: string
  type?: string
  status?: string
}

export function WorkspaceNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [showProjects, setShowProjects] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number | null>(null)

  // Extract project ID from pathname
  useEffect(() => {
    const match = pathname.match(/\/(create|builder|editor)\/([a-f0-9]+)/)
    if (match) {
      setCurrentProjectId(match[2])
    } else {
      setCurrentProjectId(null)
    }
  }, [pathname])

  // Fetch projects and credits
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, creditsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/credits')
        ])

        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjects(data.projects || [])
        }

        if (creditsRes.ok) {
          const data = await creditsRes.json()
          setCredits(data.credits ?? 0)
        }
      } catch (e) {
        console.error('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowProjects(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentProject = projects.find(p => p._id === currentProjectId)
  const isInBuilder = pathname.startsWith('/create') || pathname.startsWith('/builder') || pathname.startsWith('/editor')
  const isHome = pathname === '/'
  const isDashboard = pathname.startsWith('/dashboard')
  const isMarketplace = pathname.startsWith('/marketplace')
  const isUpgrade = pathname.startsWith('/upgrade')

  // Navigation items - workspace focused
  const isWorkspace = pathname.startsWith('/workspace')
  const navItems = [
    { href: '/workspace', label: 'Workspace', icon: LayoutDashboard, active: isDashboard || isWorkspace },
    { href: '/marketplace', label: 'Templates', icon: Store, active: isMarketplace },
  ]

  // Don't show on login/auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return null
  }

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-2xl border-b border-white/[0.06]" />

        <div className="relative max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-bold text-lg text-white hidden sm:block">WebCraft</span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      item.active
                        ? 'bg-white/[0.1] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Project Switcher - When in builder */}
            <AnimatePresence>
              {isInBuilder && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-px bg-white/10" />
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowProjects(!showProjects)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition text-sm"
                    >
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {currentProject?.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <span className="text-white max-w-[120px] truncate font-medium">
                        {currentProject?.name || 'Select Project'}
                      </span>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-slate-400 transition-transform duration-200',
                        showProjects && 'rotate-180'
                      )} />
                    </motion.button>

                    {/* Project Dropdown */}
                    <AnimatePresence>
                      {showProjects && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setShowProjects(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-72 bg-[#0c0c14] backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                          >
                            {/* New Project Button */}
                            <div className="p-2">
                              <motion.button
                                whileHover={{ scale: 1.02, x: 2 }}
                                onClick={() => {
                                  setShowProjects(false)
                                  router.push('/new-project')
                                }}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/[0.05] transition"
                              >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                  <Plus className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">New Project</p>
                                  <p className="text-xs text-slate-400">Start with AI</p>
                                </div>
                              </motion.button>
                            </div>

                            {/* Projects List */}
                            {projects.length > 0 && (
                              <>
                                <div className="h-px bg-white/[0.06]" />
                                <div className="p-2 max-h-64 overflow-y-auto">
                                  <p className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-medium">Recent Projects</p>
                                  {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                    </div>
                                  ) : (
                                    projects.slice(0, 5).map((project, i) => (
                                      <motion.button
                                        key={project._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => {
                                          setShowProjects(false)
                                          router.push(`/workspace?project=${project._id}`)
                                        }}
                                        className={cn(
                                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition',
                                          project._id === currentProjectId
                                            ? 'bg-white/[0.08] border border-white/[0.1]'
                                            : 'hover:bg-white/[0.04]'
                                        )}
                                      >
                                        <div className={cn(
                                          'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold',
                                          project._id === currentProjectId
                                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                                            : 'bg-white/[0.05] text-slate-400'
                                        )}>
                                          {project.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-white truncate">{project.name}</p>
                                          <p className="text-xs text-slate-500">
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                        {project._id === currentProjectId && (
                                          <Check className="w-4 h-4 text-blue-400" />
                                        )}
                                      </motion.button>
                                    ))
                                  )}
                                </div>
                                <div className="h-px bg-white/[0.06]" />
                                <div className="p-2">
                                  <motion.button
                                    whileHover={{ x: 2 }}
                                    onClick={() => {
                                      setShowProjects(false)
                                      router.push('/workspace')
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition"
                                  >
                                    <span className="flex items-center gap-2">
                                      <FolderOpen className="w-4 h-4" />
                                      View All Projects
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] text-slate-500">
                <Command className="w-3 h-3" />K
              </kbd>
            </motion.button>

            {/* Credits/Upgrade */}
            <Link href="/upgrade">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition"
              >
                <CreditCard className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">
                  {credits !== null ? credits.toLocaleString() : '---'}
                </span>
              </motion.div>
            </Link>

            {/* Create Button */}
            {!isInBuilder && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => router.push('/new-project')}
                  className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl shadow-lg shadow-white/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create New</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Command Palette / Search */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-xl"
            >
              <div className="bg-[#0c0c14] backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search projects, templates, settings..."
                    className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <kbd className="px-2 py-1 rounded bg-white/[0.05] text-xs text-slate-500">ESC</kbd>
                </div>
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Quick Actions</p>
                  {[
                    { label: 'New Project', icon: Plus, href: '/new-project' },
                    { label: 'Workspace', icon: LayoutDashboard, href: '/workspace' },
                    { label: 'Templates', icon: Store, href: '/marketplace' },
                    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
                  ].map((item, i) => (
                    <motion.button
                      key={item.href}
                      whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.04)' }}
                      onClick={() => {
                        setShowSearch(false)
                        router.push(item.href)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
