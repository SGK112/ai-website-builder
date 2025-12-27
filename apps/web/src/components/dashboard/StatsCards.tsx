'use client'

import { LucideIcon, FolderOpen, Rocket, Eye, CreditCard, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  gradient?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  gradient = 'from-blue-500 to-cyan-500',
}: StatCardProps) {
  return (
    <div className="group relative p-5 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
      {/* Glass highlight */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-400">{title}</p>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg', gradient)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium mb-1',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        {description && (
          <span className="text-xs text-slate-500 mt-1">{description}</span>
        )}
      </div>
    </div>
  )
}

interface DashboardStatsProps {
  stats: {
    totalProjects: number
    deployedProjects: number
    totalViews: number
    remainingCredits: number
    projectsTrend?: number
    viewsTrend?: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Projects"
        value={stats.totalProjects}
        description="All time"
        icon={FolderOpen}
        trend={stats.projectsTrend ? { value: stats.projectsTrend, isPositive: stats.projectsTrend > 0 } : undefined}
        gradient="from-blue-500 to-cyan-500"
      />
      <StatCard
        title="Deployed"
        value={stats.deployedProjects}
        description={`${Math.round((stats.deployedProjects / Math.max(stats.totalProjects, 1)) * 100)}% of total`}
        icon={Rocket}
        gradient="from-green-500 to-emerald-500"
      />
      <StatCard
        title="Total Views"
        value={stats.totalViews.toLocaleString()}
        description="Last 30 days"
        icon={Eye}
        trend={stats.viewsTrend ? { value: stats.viewsTrend, isPositive: stats.viewsTrend > 0 } : undefined}
        gradient="from-purple-500 to-pink-500"
      />
      <StatCard
        title="Credits"
        value={stats.remainingCredits}
        description="Remaining"
        icon={CreditCard}
        gradient="from-orange-500 to-red-500"
      />
    </div>
  )
}

// Quick actions component - Liquid Glass
interface QuickAction {
  label: string
  icon: LucideIcon
  href: string
  variant?: 'default' | 'outline'
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200',
            action.variant === 'outline'
              ? 'bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white'
              : 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5'
          )}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </a>
      ))}
    </div>
  )
}
