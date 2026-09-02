'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Image as ImageIcon,
  MessageSquare,
  Rocket,
  Cpu,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Info,
  Sparkles,
  CreditCard,
  BarChart3,
  Calendar
} from 'lucide-react'

interface UsageStats {
  user: {
    plan: string
    credits: number
    isAdmin?: boolean
  }
  today: {
    generations: number
    images: number
    tokens: number
    credits: number
  }
  month: {
    generations: number
    images: number
    tokens: number
    credits: number
  }
  limits: {
    dailyGenerations: number | 'unlimited'
    dailyImages: number | 'unlimited'
    monthlyCredits: number | 'unlimited'
    availableModels: string[]
  }
  remaining: {
    dailyGenerations: number | 'unlimited'
    dailyImages: number | 'unlimited'
    credits: number | 'unlimited'
  }
  history: Array<{
    type: string
    provider: string
    aiModel?: string
    creditsUsed: number
    tokensUsed: number
    createdAt: string
    metadata?: {
      projectId?: string
      responseLength?: number
      duration?: number
      success?: boolean
    }
  }>
}

// Credit costs for reference
const CREDIT_COSTS = {
  'Generation (Free AI)': 1,
  'Generation (GPT-3.5)': 1,
  'Generation (Claude Haiku)': 2,
  'Generation (GPT-4o)': 5,
  'Generation (Claude Sonnet)': 5,
  'Generation (GPT-4-turbo)': 8,
  'Generation (GPT-4)': 10,
  'Generation (Claude Opus)': 10,
  'Image Generation': 5,
  'Image Enhancement': 3,
  'Chat Message': 1,
  'Video Generation': 20,
  'Audio Generation': 10,
  'Deployment': 0
}

interface UsageDashboardProps {
  compact?: boolean
  showHistory?: boolean
  onUpgrade?: () => void
}

export function UsageDashboard({ compact = false, showHistory = true, onUpgrade }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [showCosts, setShowCosts] = useState(false)

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/usage')
      // 401 from the middleware just means the viewer isn't signed in.
      // Don't treat it as an error — surface a "sign in" state and stop polling.
      if (res.status === 401) {
        setNeedsAuth(true)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch usage')

      const data = await res.json()
      setStats(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError('Unable to load usage data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  useEffect(() => {
    if (needsAuth) return
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [fetchUsage, needsAuth])

  const formatNumber = (num: number | 'unlimited'): string => {
    if (num === 'unlimited') return 'Unlimited'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getPercentage = (used: number, limit: number | 'unlimited'): number => {
    if (limit === 'unlimited') return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 70) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatTime = (date: string): string => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'generation': return <Sparkles className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'chat': return <MessageSquare className="w-4 h-4" />
      case 'deploy': return <Rocket className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (needsAuth) {
    return (
      <div className="p-4 bg-muted/50 border border-border rounded-xl text-center">
        <p className="text-sm text-foreground/80">Sign in to view your usage.</p>
        <a
          href="/signup"
          className="mt-2 inline-block text-xs text-purple-700 dark:text-purple-300 hover:text-purple-700 dark:text-purple-200"
        >
          Sign in or create an account →
        </a>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400">{error || 'Unable to load usage'}</p>
        <button
          onClick={fetchUsage}
          className="mt-2 text-xs text-red-400 hover:text-red-700 dark:text-red-300"
        >
          Try again
        </button>
      </div>
    )
  }

  const creditPercentage = getPercentage(
    typeof stats.remaining.credits === 'number' ? stats.user.credits - stats.remaining.credits : 0,
    stats.limits.monthlyCredits
  )

  const genPercentage = getPercentage(
    stats.today.generations,
    stats.limits.dailyGenerations
  )

  const imgPercentage = getPercentage(
    stats.today.images,
    stats.limits.dailyImages
  )

  // Compact view for sidebar/header
  if (compact) {
    return (
      <div className="p-4 bg-muted rounded-xl border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">Credits</span>
          </div>
          <button onClick={fetchUsage} className="text-gray-500 hover:text-foreground">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-2xl font-bold text-foreground mb-1">
          {formatNumber(stats.remaining.credits)}
          {stats.limits.monthlyCredits !== 'unlimited' && (
            <span className="text-sm font-normal text-gray-500">
              /{formatNumber(stats.limits.monthlyCredits)}
            </span>
          )}
        </div>

        <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full ${getBarColor(creditPercentage)} transition-all duration-500`}
            style={{ width: `${100 - creditPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            <span>{stats.today.generations} today</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ImageIcon className="w-3 h-3" />
            <span>{stats.today.images} images</span>
          </div>
        </div>

        {onUpgrade && stats.user.plan !== 'enterprise' && (
          <button
            onClick={onUpgrade}
            className="mt-3 w-full py-2 text-xs text-purple-400 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
          >
            Upgrade for more
          </button>
        )}
      </div>
    )
  }

  // Full dashboard view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Usage Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Plan: <span className="text-purple-400 capitalize">{stats.user.plan}</span>
            {stats.user.isAdmin && <span className="ml-2 text-yellow-400">(Admin)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchUsage}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Credit Balance Card */}
      <div className="p-6 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-2xl border border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
            <div className="text-4xl font-bold text-foreground">
              {formatNumber(stats.remaining.credits)}
            </div>
            {stats.limits.monthlyCredits !== 'unlimited' && (
              <p className="text-sm text-gray-500 mt-1">
                of {formatNumber(stats.limits.monthlyCredits)} monthly
              </p>
            )}
          </div>
          <div className="p-3 bg-muted/70 rounded-xl">
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {stats.limits.monthlyCredits !== 'unlimited' && (
          <div className="mt-4">
            <div className="h-2 bg-muted/70 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(creditPercentage)} transition-all duration-500`}
                style={{ width: `${100 - creditPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{stats.month.credits} used this month</span>
              <span className={getStatusColor(creditPercentage)}>
                {Math.round(100 - creditPercentage)}% remaining
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Generations */}
        <div className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-muted-foreground">Generations</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.today.generations}
            <span className="text-sm font-normal text-gray-500">
              /{formatNumber(stats.limits.dailyGenerations)}
            </span>
          </div>
          <div className="text-xs text-gray-500">today</div>
          {stats.limits.dailyGenerations !== 'unlimited' && (
            <div className="mt-2 h-1.5 bg-muted/70 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(genPercentage)}`}
                style={{ width: `${genPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Daily Images */}
        <div className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-green-400" />
            <span className="text-sm text-muted-foreground">Images</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.today.images}
            <span className="text-sm font-normal text-gray-500">
              /{formatNumber(stats.limits.dailyImages)}
            </span>
          </div>
          <div className="text-xs text-gray-500">today</div>
          {stats.limits.dailyImages !== 'unlimited' && (
            <div className="mt-2 h-1.5 bg-muted/70 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(imgPercentage)}`}
                style={{ width: `${imgPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Tokens Used */}
        <div className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-muted-foreground">Tokens</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {formatNumber(stats.today.tokens)}
          </div>
          <div className="text-xs text-gray-500">today</div>
          <div className="mt-2 text-xs text-gray-500">
            {formatNumber(stats.month.tokens)} this month
          </div>
        </div>

        {/* Credits Used Today */}
        <div className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-muted-foreground">Spent</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {stats.today.credits}
          </div>
          <div className="text-xs text-gray-500">credits today</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.month.credits} this month
          </div>
        </div>
      </div>

      {/* Credit Costs Reference */}
      <div className="p-4 bg-muted rounded-xl border border-border">
        <button
          onClick={() => setShowCosts(!showCosts)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Credit Costs Reference</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showCosts ? 'rotate-90' : ''}`} />
        </button>

        {showCosts && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
              <div
                key={action}
                className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg"
              >
                <span className="text-xs text-muted-foreground">{action}</span>
                <span className={`text-xs font-medium ${cost === 0 ? 'text-green-400' : 'text-foreground'}`}>
                  {cost === 0 ? 'Free' : `${cost} cr`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {showHistory && stats.history && stats.history.length > 0 && (
        <div className="p-4 bg-muted rounded-xl border border-border">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.history.slice(0, 10).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    item.metadata?.success === false ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <p className="text-sm text-foreground capitalize">
                      {item.type}
                      {item.aiModel && (
                        <span className="text-gray-500 ml-1">({item.aiModel})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{item.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    -{item.creditsUsed} cr
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {onUpgrade && stats.user.plan !== 'enterprise' && (
        <div className="p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Need more credits?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to {stats.user.plan === 'free' ? 'Pro' : 'Enterprise'} for more generations
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini credit display for navbar
export function CreditBadge({ onClick }: { onClick?: () => void }) {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits')
        if (res.ok) {
          const data = await res.json()
          setCredits(data.credits)
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()

    // Refresh every minute
    const interval = setInterval(fetchCredits, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="px-3 py-1.5 bg-muted rounded-lg animate-pulse">
        <div className="w-12 h-4 bg-muted/70 rounded" />
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 rounded-lg text-sm hover:from-yellow-500/30 hover:to-orange-500/30 transition-all group"
    >
      <Zap className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
      <span className="font-medium text-foreground">{credits ?? '...'}</span>
      <span className="text-muted-foreground text-xs">credits</span>
    </button>
  )
}

export default UsageDashboard
