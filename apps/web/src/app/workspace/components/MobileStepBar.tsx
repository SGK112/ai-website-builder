'use client'

// MobileStepBar — the easy, accessible, step-by-step build flow for the
// workspace on phones. The full panel set (11 items) lives behind the
// hamburger for power users; this surfaces the 4 stages that 90% of users
// actually walk through, in order, always visible, so nobody has to discover
// a hidden sidebar. Renders below the mobile header (top plane) so it never
// conflicts with the global bottom tab nav (cross-route, bottom plane).

import { Wand2, Eye, Layout, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WorkspaceStep = 'describe' | 'preview' | 'customize' | 'ship'

const STEPS: { id: WorkspaceStep; n: number; label: string; icon: typeof Wand2 }[] = [
  { id: 'describe',  n: 1, label: 'Describe',  icon: Wand2 },
  { id: 'preview',   n: 2, label: 'Preview',   icon: Eye },
  { id: 'customize', n: 3, label: 'Customize', icon: Layout },
  { id: 'ship',      n: 4, label: 'Ship',      icon: Rocket },
]

interface Props {
  current: WorkspaceStep
  onStep: (step: WorkspaceStep) => void
  isDark: boolean
  /** Ship is only meaningful once there's something built. */
  canShip: boolean
}

export function MobileStepBar({ current, onStep, isDark, canShip }: Props) {
  return (
    <nav
      aria-label="Build steps"
      className={cn(
        'flex items-stretch border-b shrink-0',
        isDark ? 'bg-zinc-950/95 border-white/[0.06]' : 'bg-white border-slate-200'
      )}
    >
      {STEPS.map((s) => {
        const active = current === s.id
        const disabled = s.id === 'ship' && !canShip
        const Icon = s.icon
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => { if (!disabled) onStep(s.id) }}
            disabled={disabled}
            aria-current={active ? 'step' : undefined}
            aria-label={`Step ${s.n} of ${STEPS.length}: ${s.label}${disabled ? ' (build something first)' : ''}`}
            title={disabled ? 'Build something first' : s.label}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[52px] relative transition-colors',
              active
                ? (isDark ? 'text-violet-300' : 'text-violet-600')
                : (isDark ? 'text-zinc-500 active:text-zinc-300' : 'text-slate-400 active:text-slate-700'),
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center leading-none',
                  active
                    ? (isDark ? 'bg-violet-500 text-white' : 'bg-violet-600 text-white')
                    : (isDark ? 'bg-white/10 text-zinc-400' : 'bg-slate-200 text-slate-500')
                )}
              >
                {s.n}
              </span>
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-medium tracking-wide">{s.label}</span>
            {active && (
              <span className={cn('absolute bottom-0 left-2 right-2 h-0.5 rounded-full', isDark ? 'bg-violet-400' : 'bg-violet-600')} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
