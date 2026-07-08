'use client'

// StartDashboard — the workspace's no-project empty state. Replaces the
// two-pane IDE with a single calm, centered focal point (build input) the way
// Lovable's dashboard does: one greeting, one input, a few starters, recipes
// below the fold. Once the user builds something, page.tsx swaps back to the
// two-pane workspace. Purely presentational — all state + handlers are props.
//
// DESIGN: one accent (violet) + neutrals, generous whitespace, one radius.

import type { ComponentType, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Plus, Sparkles, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StartRecipe {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  isPremade?: boolean
}

interface StartDashboardProps {
  isDark: boolean
  userName?: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  /** Starter chips + recipe tiles seed the prompt (then the user hits build). */
  onSeedPrompt: (text: string) => void
  recipes: StartRecipe[]
  onPickRecipe: (id: string) => void
  /** Opens the Connectors panel. */
  onOpenConnectors?: () => void
  busy?: boolean
}

const STARTER_CHIPS = [
  'Portfolio site',
  'Online store',
  'SaaS landing page',
  'Restaurant menu',
  'Mobile app',
]

export function StartDashboard({
  isDark,
  userName,
  value,
  onChange,
  onSubmit,
  onSeedPrompt,
  recipes,
  onPickRecipe,
  onOpenConnectors,
  busy,
}: StartDashboardProps) {
  const first = (userName || '').trim().split(/\s+/)[0]
  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !busy) onSubmit()
    }
  }

  return (
    <div className={cn('relative flex-1 min-h-0 overflow-y-auto', isDark ? 'bg-zinc-950' : 'bg-[#FBF9F6]')}>
      {/* soft warm→violet wash confined to the top, fading out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[58%]"
        style={{
          background:
            'radial-gradient(120% 90% at 72% -18%, color-mix(in srgb, #7C3AED 18%, transparent), transparent 60%), radial-gradient(90% 70% at 22% -12%, color-mix(in srgb, #F59E0B 12%, transparent), transparent 62%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 34%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 34%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 pt-[7vh] pb-16">
        {/* Connectors pill — real intent, opens the Connectors panel */}
        {onOpenConnectors && (
          <button
            onClick={onOpenConnectors}
            className={cn(
              'inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[13px] font-medium mb-7 transition-colors',
              isDark ? 'bg-white/[0.04] border-white/10 text-zinc-200 hover:bg-white/[0.07]' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Connect your tools
            <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>→</span>
          </button>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'text-center font-semibold tracking-[-0.03em] leading-[1.03] text-[clamp(28px,4vw,44px)] mb-7',
            isDark ? 'text-white' : 'text-slate-900'
          )}
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          Let's cook something{first ? <>, <span className="text-violet-600 dark:text-violet-400">{first}</span></> : ''}
        </motion.h1>

        {/* The one focal object — build input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="w-full max-w-2xl"
        >
          <div
            className={cn(
              'rounded-[20px] border p-4 transition-shadow focus-within:ring-4',
              isDark
                ? 'bg-zinc-900 border-white/10 focus-within:border-violet-500/50 focus-within:ring-violet-500/15'
                : 'bg-white border-slate-200 shadow-[0_2px_4px_rgba(28,25,23,0.05),0_18px_40px_-16px_rgba(28,25,23,0.2)] focus-within:border-violet-300 focus-within:ring-violet-100'
            )}
          >
            <textarea
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe the site or app you want — the chef will cook it."
              className={cn(
                'w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none min-h-[46px]',
                isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
              )}
            />
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={cn(
                  'w-8 h-8 rounded-lg border grid place-items-center',
                  isDark ? 'border-white/10 text-zinc-400' : 'border-slate-200 text-slate-400'
                )}
                aria-hidden
              >
                <Plus className="w-4 h-4" />
              </span>
              <div className="flex-1" />
              <span className={cn('hidden sm:flex items-center gap-1.5 text-[13px]', isDark ? 'text-zinc-400' : 'text-slate-500')} aria-hidden>
                <Mic className="w-4 h-4" />
              </span>
              <button
                onClick={onSubmit}
                disabled={!value.trim() || busy}
                aria-label="Build it"
                className={cn(
                  'w-9 h-9 rounded-full grid place-items-center shrink-0 transition-all',
                  value.trim() && !busy
                    ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 hover:scale-105'
                    : isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-400'
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* starter chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {STARTER_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => onSeedPrompt(`Build a ${c.toLowerCase()}`)}
                className={cn(
                  'text-[12.5px] rounded-full border px-3.5 py-1.5 transition-colors',
                  isDark
                    ? 'border-white/10 text-zinc-400 hover:text-white hover:border-violet-400/40'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-violet-300 bg-white/70'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* recipes — below the fold */}
        {recipes.length > 0 && (
          <div className="w-full max-w-3xl mt-14">
            <p className={cn('text-[10.5px] font-semibold uppercase tracking-[0.09em] mb-3', isDark ? 'text-zinc-500' : 'text-slate-500')}>
              Start from a recipe
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recipes.slice(0, 4).map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    onClick={() => onPickRecipe(r.id)}
                    className={cn(
                      'group relative text-left rounded-2xl border p-3.5 transition-all',
                      isDark
                        ? 'bg-white/[0.03] border-white/[0.06] hover:border-violet-400/40 hover:bg-violet-500/[0.06]'
                        : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-md'
                    )}
                  >
                    {r.isPremade && (
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 text-[8px] font-bold tracking-wider rounded bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30">
                        INSTANT
                      </span>
                    )}
                    <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 grid place-items-center mb-2.5">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className={cn('block text-[13px] font-medium', isDark ? 'text-white' : 'text-slate-800')}>{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
