'use client'

import Link from 'next/link'
import {
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Globe,
  Code2,
  Briefcase,
  ShoppingCart,
  Layers,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ProjectType = 'business-portfolio' | 'ecommerce' | 'saas'
type ProjectStatus = 'draft' | 'generating' | 'ready' | 'deployed' | 'failed'

interface Project {
  _id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  updatedAt: string
  deployment?: {
    url?: string
  }
  thumbnail?: string
}

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
}

const typeConfig: Record<ProjectType, { icon: typeof Globe; label: string; gradient: string }> = {
  'business-portfolio': {
    icon: Briefcase,
    label: 'Portfolio',
    gradient: 'from-blue-500 to-cyan-500',
  },
  'ecommerce': {
    icon: ShoppingCart,
    label: 'E-Commerce',
    gradient: 'from-purple-500 to-pink-500',
  },
  'saas': {
    icon: Layers,
    label: 'SaaS',
    gradient: 'from-orange-500 to-red-500',
  },
}

const statusConfig: Record<ProjectStatus, { label: string; dotColor: string; bgColor: string }> = {
  draft: { label: 'Draft', dotColor: 'bg-slate-400', bgColor: 'bg-slate-500/10' },
  generating: { label: 'Generating', dotColor: 'bg-blue-400 animate-pulse', bgColor: 'bg-blue-500/10' },
  ready: { label: 'Ready', dotColor: 'bg-amber-400', bgColor: 'bg-amber-500/10' },
  deployed: { label: 'Live', dotColor: 'bg-green-400 animate-pulse', bgColor: 'bg-green-500/10' },
  failed: { label: 'Failed', dotColor: 'bg-red-400', bgColor: 'bg-red-500/10' },
}

export function ProjectCard({ project, onDelete, onDuplicate }: ProjectCardProps) {
  const type = typeConfig[project.type]
  const status = statusConfig[project.status]
  const TypeIcon = type.icon

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="group relative rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] overflow-hidden hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />

      {/* Thumbnail / Preview */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', type.gradient)}>
            <TypeIcon className="h-12 w-12 text-white/80" />
          </div>
        )}

        {/* Status badge - Glass */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium backdrop-blur-xl border border-white/10',
              status.bgColor,
              'text-white'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dotColor)} />
            {status.label}
          </span>
        </div>

        {/* Quick actions overlay - Glass */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100">
          <Link href={`/create/${project._id}`}>
            <Button size="sm" className="bg-white/90 text-black hover:bg-white rounded-xl gap-1.5 font-medium shadow-lg">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          {project.deployment?.url && (
            <a href={project.deployment.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 rounded-xl gap-1.5 font-medium border border-white/20">
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-white text-lg">{project.name}</h3>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{type.label}</span>
              <span className="text-slate-600">•</span>
              <span>{formatDate(project.updatedAt)}</span>
            </div>
          </div>

          {/* Dropdown menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action buttons - Glass */}
        <div className="mt-5 flex gap-2">
          <Link href={`/create/${project._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5 bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white rounded-xl h-10">
              <Code2 className="h-3.5 w-3.5" />
              Open Builder
            </Button>
          </Link>
          {project.deployment?.url ? (
            <a href={project.deployment.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl h-10 px-4">
                <Globe className="h-3.5 w-3.5" />
                Live
              </Button>
            </a>
          ) : (
            <Link href={`/create/${project._id}?deploy=true`}>
              <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 rounded-xl h-10 px-4 font-medium">
                <Globe className="h-3.5 w-3.5" />
                Deploy
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProjectGridProps {
  projects: Project[]
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
}

export function ProjectGrid({ projects, onDelete, onDuplicate }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] py-20">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-6">
            <Layers className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white text-center mb-2">No projects yet</h3>
          <p className="text-sm text-slate-400 text-center max-w-sm mx-auto mb-8">
            Create your first project and start building amazing websites with AI
          </p>
          <Link href="/new-project" className="block">
            <Button className="bg-white text-black hover:bg-white/90 rounded-xl font-semibold shadow-lg shadow-white/5">
              <Zap className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  )
}
