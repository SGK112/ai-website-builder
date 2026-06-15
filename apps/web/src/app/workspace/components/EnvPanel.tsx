'use client'

import { motion } from 'framer-motion'
import { Variable, Lock, Unlock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnvVar } from '../types'

interface EnvPanelProps {
  isDark: boolean
  envVars: EnvVar[]
  onUpdateVar: (index: number, patch: Partial<EnvVar>) => void
  onToggleSecret: (index: number) => void
  onRemove: (index: number) => void
  newEnvKey: string
  onNewEnvKeyChange: (value: string) => void
  newEnvValue: string
  onNewEnvValueChange: (value: string) => void
  onAdd: () => void
}

export function EnvPanel({
  isDark,
  envVars,
  onUpdateVar,
  onToggleSecret,
  onRemove,
  newEnvKey,
  onNewEnvKeyChange,
  newEnvValue,
  onNewEnvValueChange,
  onAdd,
}: EnvPanelProps) {
  return (
    <motion.div
      key="env"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-3 space-y-3"
    >
      <div className={cn('flex items-center gap-2 text-xs', isDark ? 'text-zinc-400' : 'text-slate-700 font-medium')}>
        <Variable className="w-3.5 h-3.5" />
        <span>Environment Variables</span>
      </div>

      <div className="space-y-2">
        {envVars.map((envVar, i) => (
          <div key={i} className={cn(
            'p-2.5 rounded-lg border space-y-2',
            isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200',
          )}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={envVar.key}
                onChange={(e) => onUpdateVar(i, { key: e.target.value })}
                className={cn(
                  'flex-1 bg-transparent text-xs font-mono focus:outline-none',
                  isDark ? 'text-violet-300' : 'text-violet-700',
                )}
                placeholder="KEY"
              />
              <button
                onClick={() => onToggleSecret(i)}
                className={cn(
                  'p-1 rounded',
                  isDark ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-slate-200 text-slate-500',
                )}
              >
                {envVar.isSecret ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onRemove(i)}
                className={cn(
                  'p-1 rounded hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400',
                  isDark ? 'text-zinc-500' : 'text-slate-500',
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <input
              type={envVar.isSecret ? 'password' : 'text'}
              value={envVar.value}
              onChange={(e) => onUpdateVar(i, { value: e.target.value })}
              className={cn(
                'w-full rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-violet-500/50',
                // Dark code-block in dark theme, high-contrast white-bg + black text in light.
                isDark ? 'bg-zinc-900 text-white' : 'bg-white border border-slate-300 text-slate-900',
              )}
              placeholder="value"
            />
          </div>
        ))}
      </div>

      <div className={cn(
        'p-2.5 rounded-lg border border-dashed space-y-2',
        isDark ? 'bg-white/[0.02] border-white/[0.1]' : 'bg-slate-50 border-slate-300',
      )}>
        <input
          type="text"
          value={newEnvKey}
          onChange={(e) => onNewEnvKeyChange(e.target.value.toUpperCase())}
          className={cn(
            'w-full bg-transparent text-xs font-mono focus:outline-none',
            isDark ? 'text-zinc-300 placeholder-zinc-600' : 'text-slate-900 placeholder-slate-400',
          )}
          placeholder="NEW_VARIABLE"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newEnvValue}
            onChange={(e) => onNewEnvValueChange(e.target.value)}
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-mono focus:outline-none',
              isDark ? 'bg-zinc-900 text-white' : 'bg-white border border-slate-300 text-slate-900',
            )}
            placeholder="value"
          />
          <button
            onClick={onAdd}
            disabled={!newEnvKey.trim()}
            className={cn(
              'px-3 py-1.5 rounded text-xs disabled:opacity-50',
              isDark
                ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                : 'bg-violet-600 text-white hover:bg-violet-500',
            )}
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  )
}
