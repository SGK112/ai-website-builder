'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, XCircle, AlertTriangle, Info, Terminal, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConsoleLog, ConsoleLogType } from '../types'

function consoleIcon(type: ConsoleLogType) {
  switch (type) {
    case 'error': return <XCircle className="w-3.5 h-3.5 text-red-400" />
    case 'warn': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
    case 'info': return <Info className="w-3.5 h-3.5 text-blue-400" />
    case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    default: return <Terminal className="w-3.5 h-3.5 text-zinc-400" />
  }
}

const FILTERS = ['all', 'log', 'info', 'warn', 'error', 'success'] as const

interface ConsolePanelProps {
  isDark: boolean
  logs: ConsoleLog[]
  filter: ConsoleLogType | 'all'
  onFilterChange: (filter: ConsoleLogType | 'all') => void
  onClear: () => void
}

export function ConsolePanel({ isDark, logs, filter, onFilterChange, onClear }: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Pin to the newest log. The effect only runs while the console is mounted
  // (i.e. its panel is active), so we don't scroll a hidden node.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter)

  return (
    <motion.div
      key="console"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b',
        isDark ? 'border-white/[0.08]' : 'border-slate-200',
      )}>
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] transition-colors',
                filter === f
                  ? isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900'
                  : isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={onClear}
          className={cn(
            'p-1 rounded',
            isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900',
          )}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5',
          // High-contrast bg per theme so logs pop. Black-on-white
          // in light, light-on-near-black in dark.
          isDark ? 'bg-zinc-950' : 'bg-white',
        )}
      >
        {filteredLogs.map((log, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-2 px-2 py-1 rounded',
              log.type === 'error' && (isDark ? 'bg-red-500/10' : 'bg-red-50'),
              log.type === 'warn' && (isDark ? 'bg-amber-500/10' : 'bg-amber-50'),
            )}
          >
            {consoleIcon(log.type)}
            <span className={cn(
              'flex-1',
              // Use the darker (-700/-800) variants in light theme
              // so colored log lines hit WCAG-AA on white.
              log.type === 'error' && (isDark ? 'text-red-300' : 'text-red-800'),
              log.type === 'warn'  && (isDark ? 'text-amber-300' : 'text-amber-800'),
              log.type === 'info'  && (isDark ? 'text-blue-300' : 'text-blue-800'),
              log.type === 'success' && (isDark ? 'text-emerald-300' : 'text-emerald-700'),
              log.type === 'log'   && (isDark ? 'text-zinc-200' : 'text-slate-900'),
            )}>
              {log.message}
            </span>
            <span className={cn('text-[9px]', isDark ? 'text-zinc-600' : 'text-slate-400')}>
              {log.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
