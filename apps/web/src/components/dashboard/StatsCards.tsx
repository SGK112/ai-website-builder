'use client'

import { LucideIcon, FolderOpen, Rocket, Eye, CreditCard, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
  iconColor?: string
  iconBgColor?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {(description || trend) && (
            <div className="mt-1 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
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
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />
      <StatCard
        title="Deployed"
        value={stats.deployedProjects}
        description={`${Math.round((stats.deployedProjects / Math.max(stats.totalProjects, 1)) * 100)}% of total`}
        icon={Rocket}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
      />
      <StatCard
        title="Total Views"
        value={stats.totalViews.toLocaleString()}
        description="Last 30 days"
        icon={Eye}
        trend={stats.viewsTrend ? { value: stats.viewsTrend, isPositive: stats.viewsTrend > 0 } : undefined}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
      />
      <StatCard
        title="Credits"
        value={stats.remainingCredits}
        description="Remaining"
        icon={CreditCard}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
      />
    </div>
  )
}

// Quick actions component
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
            'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
            action.variant === 'outline'
              ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </a>
      ))}
    </div>
  )
}
