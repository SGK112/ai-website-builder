'use client'

// "Your stew is cooked" banner — shown when a build finished server-side while
// the user was away (they closed the tab; the agent route kept running and
// persisted the result). Lives in its own module to keep the workspace page
// from growing further.

import { Sparkles, X } from 'lucide-react'

export interface FinishedAwayBuild {
  buildId: string
  target: string
  summary?: string
  prompt?: string
  fileCount?: number
}

export function FinishedBuildBanner({
  build, onLoad, onDismiss, isDark, loading,
}: {
  build: FinishedAwayBuild | null
  onLoad: () => void
  onDismiss: () => void
  isDark: boolean
  loading?: boolean
}) {
  if (!build) return null
  const label = build.summary || (build.prompt ? `"${build.prompt.slice(0, 70)}"` : 'Your build')
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[200] w-[min(94%,520px)] bottom-[calc(1rem+var(--bottom-nav-h,0px))]">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${isDark ? 'bg-zinc-900/95 border-emerald-500/30' : 'bg-white/95 border-emerald-200'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-lg">🍲</div>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Your stew is cooked</div>
            <div className={`truncate text-[12px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              A build finished while you were away — {label}
            </div>
          </div>
          <button
            onClick={onLoad}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? 'Loading…' : 'Load it'}
          </button>
          <button onClick={onDismiss} aria-label="Dismiss" className={`shrink-0 p-1 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-700'}`} title="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
