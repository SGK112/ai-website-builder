'use client'

// Skill-aware "what to do next" path: the build -> go live -> custom domain ->
// share -> sell journey, with progress derived from real workspace state. The
// first incomplete step is the call-to-action; earlier steps show a check.
//
// Tiered: beginners (no-code) get the full guided card with descriptions;
// full-stack devs get it collapsed by default (they don't need hand-holding,
// but it stays one click away). Its own module so the workspace page doesn't
// grow another inline widget.

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Sparkles, X } from 'lucide-react'

export type SkillTier = 'no-code' | 'low-code' | 'full-stack'

export interface LearningStep {
  key: string
  label: string
  hint: string
  cta: string
  done: boolean
  onAction: () => void
}

export function LearningPath({
  skillLevel, steps, onDismiss, isDark,
}: {
  skillLevel: SkillTier
  steps: LearningStep[]
  onDismiss: () => void
  isDark: boolean
}) {
  // Devs start collapsed; everyone else expanded.
  const [open, setOpen] = useState(skillLevel !== 'full-stack')

  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length
  if (allDone) return null
  const currentIdx = steps.findIndex(s => !s.done)

  const card = isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
  const muted = isDark ? 'text-zinc-500' : 'text-slate-500'

  return (
    <div className={`rounded-xl border ${card}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Sparkles className={`h-4 w-4 shrink-0 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Your path to live & earning</div>
          <div className={`text-[11px] ${muted}`}>{doneCount} of {steps.length} done</div>
        </div>
        {/* progress dots */}
        <div className="flex items-center gap-1 mr-1">
          {steps.map((s, i) => (
            <span key={s.key} className={`h-1.5 w-1.5 rounded-full ${s.done ? (isDark ? 'bg-violet-400' : 'bg-violet-500') : i === currentIdx ? (isDark ? 'bg-violet-400/50' : 'bg-violet-300') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`} />
          ))}
        </div>
        {open ? <ChevronDown className={`h-4 w-4 ${muted}`} /> : <ChevronRight className={`h-4 w-4 ${muted}`} />}
        <span onClick={(e) => { e.stopPropagation(); onDismiss() }} className={`p-1 -mr-1 rounded ${muted} hover:text-current`} role="button" aria-label="Dismiss">
          <X className="h-3.5 w-3.5" />
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1">
          {steps.map((step, i) => {
            const isCurrent = i === currentIdx
            return (
              <div
                key={step.key}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${isCurrent ? (isDark ? 'bg-violet-500/10' : 'bg-violet-50') : ''}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  step.done
                    ? (isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700')
                    : isCurrent
                      ? (isDark ? 'bg-violet-500 text-white' : 'bg-violet-600 text-white')
                      : (isDark ? 'bg-white/5 text-zinc-600' : 'bg-slate-100 text-slate-400')
                }`}>
                  {step.done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-[13px] ${step.done ? muted : (isDark ? 'text-zinc-200' : 'text-slate-800')} ${step.done ? 'line-through' : ''}`}>{step.label}</div>
                  {isCurrent && skillLevel !== 'full-stack' && (
                    <div className={`text-[11px] ${muted}`}>{step.hint}</div>
                  )}
                </div>
                {!step.done && isCurrent && (
                  <button
                    onClick={step.onAction}
                    className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-500"
                  >
                    {step.cta}
                  </button>
                )}
                {!step.done && !isCurrent && (
                  <button onClick={step.onAction} className={`shrink-0 text-[11px] ${muted} hover:underline`}>{step.cta}</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
