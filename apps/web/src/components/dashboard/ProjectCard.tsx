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
} from 'lucide-react'
import { Card } from '@/components/ui/card'
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

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  generating: { label: 'Generating', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  ready: { label: 'Ready', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  deployed: { label: 'Live', color: 'text-green-600', bgColor: 'bg-green-100' },
  failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
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
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Thumbnail / Preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', type.gradient)}>
            <TypeIcon className="h-12 w-12 text-white/80" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              status.bgColor,
              status.color
            )}
          >
            {project.status === 'deployed' && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            )}
            {project.status === 'generating' && (
              <span className="h-1.5 w-1.5 animate-spin rounded-full border border-blue-500 border-t-transparent" />
            )}
            {status.label}
          </span>
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={`/builder/${project._id}`}>
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          {project.deployment?.url && (
            <a href={project.deployment.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{project.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{type.label}</span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(project.updatedAt)}</span>
            </div>
          </div>

          {/* Dropdown menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <Link href={`/builder/${project._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              Open Builder
            </Button>
          </Link>
          {project.deployment?.url ? (
            <a href={project.deployment.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Live
              </Button>
            </a>
          ) : (
            <Link href={`/builder/${project._id}?deploy=true`}>
              <Button size="sm" className="gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Deploy
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
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
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Layers className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first project to get started
        </p>
        <Link href="/new-project" className="mt-6">
          <Button>Create Project</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
