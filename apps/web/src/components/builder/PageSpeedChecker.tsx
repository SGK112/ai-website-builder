'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gauge,
  Smartphone,
  Monitor,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageSpeedResult {
  scores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  metrics: {
    firstContentfulPaint: string
    largestContentfulPaint: string
    totalBlockingTime: string
    cumulativeLayoutShift: string
    speedIndex: string
    timeToInteractive: string
  }
  opportunities: Array<{
    title: string
    description: string
    savings: string
  }>
  diagnostics: Array<{
    title: string
    description: string
  }>
}

interface PageSpeedCheckerProps {
  defaultUrl?: string
  onClose?: () => void
}

export function PageSpeedChecker({ defaultUrl = '', onClose }: PageSpeedCheckerProps) {
  const [url, setUrl] = useState(defaultUrl)
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PageSpeedResult | null>(null)

  const runAnalysis = async () => {
    if (!url) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze page')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const ScoreCircle = ({ score, label }: { score: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 100) * 226} 226`}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-xl font-bold', getScoreColor(score))}>{score}</span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mt-2">{label}</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            PageSpeed Insights
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm"
            >
              Close
            </button>
          )}
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to analyze..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={runAnalysis}
            disabled={loading || !url}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Analyze
          </button>
        </div>

        {/* Strategy Toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setStrategy('mobile')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition',
              strategy === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </button>
          <button
            onClick={() => setStrategy('desktop')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition',
              strategy === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            <Monitor className="w-4 h-4" />
            Desktop
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400">Analyzing page performance...</p>
            <p className="text-slate-500 text-sm mt-1">This may take 30-60 seconds</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">
            {/* Scores */}
            <div className="grid grid-cols-4 gap-4">
              <ScoreCircle score={result.scores.performance} label="Performance" />
              <ScoreCircle score={result.scores.accessibility} label="Accessibility" />
              <ScoreCircle score={result.scores.bestPractices} label="Best Practices" />
              <ScoreCircle score={result.scores.seo} label="SEO" />
            </div>

            {/* Core Web Vitals */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Core Web Vitals
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<Eye className="w-4 h-4" />}
                  label="First Contentful Paint"
                  value={result.metrics.firstContentfulPaint}
                />
                <MetricCard
                  icon={<Eye className="w-4 h-4" />}
                  label="Largest Contentful Paint"
                  value={result.metrics.largestContentfulPaint}
                />
                <MetricCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Total Blocking Time"
                  value={result.metrics.totalBlockingTime}
                />
                <MetricCard
                  icon={<Gauge className="w-4 h-4" />}
                  label="Cumulative Layout Shift"
                  value={result.metrics.cumulativeLayoutShift}
                />
                <MetricCard
                  icon={<Zap className="w-4 h-4" />}
                  label="Speed Index"
                  value={result.metrics.speedIndex}
                />
                <MetricCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Time to Interactive"
                  value={result.metrics.timeToInteractive}
                />
              </div>
            </div>

            {/* Opportunities */}
            {result.opportunities.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  Opportunities
                </h4>
                <div className="space-y-2">
                  {result.opportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{opp.title}</p>
                        {opp.savings && (
                          <span className="text-xs text-green-400 bg-green-400/20 px-2 py-0.5 rounded">
                            Save {opp.savings}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">{opp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Legend */}
            <div className="flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">0-49 Poor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-slate-400">50-89 Needs Work</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-400">90-100 Good</span>
              </div>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="text-center py-12 text-slate-500">
            <Gauge className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Enter a URL above to analyze its performance</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-white font-medium">{value}</p>
    </div>
  )
}
