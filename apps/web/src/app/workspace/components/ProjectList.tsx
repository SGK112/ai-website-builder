'use client'

import { motion } from 'framer-motion'
import { Plus, FolderOpen, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillLevel } from '../types'

// Display-only shape — ProjectList never needs the full project (html body,
// VFS, env vars). page.tsx owns those and does the id → loadProject lookup,
// so the panel stays decoupled from the workspace's richer Project type.
export interface ProjectSummary {
  id: string
  name: string
  html: string
  skillLevel: SkillLevel
  updatedAt: Date | string | number
  role?: 'owner' | 'editor' | 'viewer'
}

interface ProjectListProps {
  isDark: boolean
  projects: ProjectSummary[]
  currentProjectId: string | null
  onNewProject: () => void
  onLoadProject: (id: string) => void
  onDeleteProject: (id: string) => void
}

export function ProjectList({
  isDark,
  projects,
  currentProjectId,
  onNewProject,
  onLoadProject,
  onDeleteProject,
}: ProjectListProps) {
  const owned = projects.filter(p => !p.role || p.role === 'owner')
  const shared = projects.filter(p => p.role === 'editor' || p.role === 'viewer')

  const card = (project: ProjectSummary) => (
    <div
      key={project.id}
      className={cn(
        'p-3 rounded-xl border transition-all cursor-pointer',
        currentProjectId === project.id
          ? (isDark ? 'bg-violet-500/10 border-violet-500/30' : 'bg-violet-50 border-violet-300')
          : isDark
            ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
            : 'bg-slate-50 border-slate-200 hover:bg-slate-100',
      )}
      onClick={() => onLoadProject(project.id)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>{project.name}</div>
          <div className={cn('text-[10px] mt-0.5', isDark ? 'text-zinc-500' : 'text-slate-500')}>
            {new Date(project.updatedAt).toLocaleString()}
          </div>
        </div>
        {(!project.role || project.role === 'owner') ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteProject(project.id)
            }}
            className={cn(
              'p-1.5 rounded hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400',
              isDark ? 'text-zinc-500' : 'text-slate-500',
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className={cn('text-[9px] px-1.5 py-0.5 rounded capitalize shrink-0', isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700')}>
            {project.role}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn(
          'text-[9px] px-1.5 py-0.5 rounded',
          project.skillLevel === 'no-code' && (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'),
          project.skillLevel === 'low-code' && (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'),
          project.skillLevel === 'full-stack' && (isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-800'),
        )}>
          {project.skillLevel}
        </span>
        <span className={cn('text-[9px]', isDark ? 'text-zinc-500' : 'text-slate-500')}>
          {(project.html.length / 1024).toFixed(1)}KB
        </span>
      </div>
    </div>
  )

  return (
    <motion.div
      key="projects"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium', isDark ? 'text-zinc-400' : 'text-slate-700')}>Saved Projects</span>
        <button
          onClick={onNewProject}
          className={cn('text-xs flex items-center gap-1', isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-900')}
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className={cn('w-8 h-8 mx-auto mb-2', isDark ? 'text-zinc-500' : 'text-slate-400')} />
          <p className={cn('text-xs', isDark ? 'text-zinc-300' : 'text-slate-700')}>No saved projects yet</p>
          <p className={cn('text-[10px] mt-1', isDark ? 'text-zinc-500' : 'text-slate-500')}>Build something and save it!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shared.length > 0 && (
            <div className="mb-1">
              <div className={cn('text-[10px] font-medium uppercase tracking-wider mb-2 px-0.5', isDark ? 'text-zinc-500' : 'text-slate-500')}>
                Shared with me
              </div>
              <div className="space-y-2">{shared.map(card)}</div>
            </div>
          )}
          {owned.length > 0 && shared.length > 0 && (
            <div className={cn('text-[10px] font-medium uppercase tracking-wider mb-2 px-0.5 pt-3 mt-1 border-t border-white/[0.06]', isDark ? 'text-zinc-500' : 'text-slate-500')}>
              Your projects
            </div>
          )}
          {owned.map(card)}
        </div>
      )}
    </motion.div>
  )
}
