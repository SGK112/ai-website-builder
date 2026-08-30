'use client'

// A pull REPLACES the project's files with the repo's. When that would
// overwrite or drop work that only exists here, say so first — the webhook
// version of this used to just do it.

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowDownToLine, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModalA11y } from '@/hooks/useModalA11y'

interface Props {
  isDark: boolean
  busy: boolean
  diff: {
    branch: string
    added: string[]
    changed: string[]
    removed: string[]
    unchanged: number
  } | null
  onConfirm: () => void
  onCancel: () => void
}

export function GithubPullConfirm({ isDark, busy, diff, onCancel, onConfirm }: Props) {
  const panelRef = useModalA11y<HTMLDivElement>(!!diff, () => { if (!busy) onCancel() })
  const list = (label: string, paths: string[], tone: string) =>
    paths.length > 0 && (
      <div>
        <div className={cn('text-[11px] font-medium mb-1', tone)}>{label} ({paths.length})</div>
        <ul className={cn('text-[11px] font-mono space-y-0.5 max-h-24 overflow-y-auto', isDark ? 'text-zinc-400' : 'text-slate-600')}>
          {paths.slice(0, 20).map(p => <li key={p} className="truncate">{p}</li>)}
          {paths.length > 20 && <li className="opacity-60">…and {paths.length - 20} more</li>}
        </ul>
      </div>
    )

  return (
    <AnimatePresence>
      {diff && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-labelledby="pull-confirm-title"
            className={cn(
              'w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl border shadow-2xl p-5 space-y-4',
              isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="pull-confirm-title" className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> This pull overwrites local work
              </h2>
              <button aria-label="Close" onClick={() => !busy && onCancel()}
                className={cn('p-1 rounded-lg shrink-0', isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-slate-100 text-slate-500')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-slate-600')}>
              Pulling <span className="font-mono">{diff.branch}</span> replaces this project&apos;s files with the repo&apos;s.
              {diff.removed.length > 0 && ' Files that exist only here will be removed.'}
            </p>

            <div className="space-y-3">
              {list('Will be overwritten', diff.changed, 'text-amber-500')}
              {list('Will be removed', diff.removed, 'text-red-500')}
              {list('Will be added', diff.added, 'text-emerald-500')}
              <p className={cn('text-[11px]', isDark ? 'text-zinc-500' : 'text-slate-500')}>{diff.unchanged} file(s) unchanged.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onCancel}
                disabled={busy}
                className={cn(
                  'flex-1 px-3 py-2 rounded-xl text-sm font-medium border',
                  isDark ? 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06]' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50',
                )}
              >
                Keep my version
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                {busy ? 'Pulling…' : 'Pull anyway'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
