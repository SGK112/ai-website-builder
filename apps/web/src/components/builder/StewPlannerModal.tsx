'use client'

// StewPlannerModal — the plan-review step of the Stew Planner.
//
// Shown once the clarifying agent has enough to build. It lays out the
// assembled "stew" (pages, style, content mode, integrations) and the final
// build prompt in an editable textarea, so the user can tweak before
// committing. "Go build it" hands the prompt straight to the existing
// generation path — the builders are not touched.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChefHat, FileText, Layers, Palette, Plug, Sparkles, X } from 'lucide-react'
import type { StewPlan } from '@/lib/types/stew-planner'
import { useModalA11y } from '@/hooks/useModalA11y'

interface StewPlannerModalProps {
  open: boolean
  plan: StewPlan
  assembledPrompt: string
  isDark?: boolean
  onGo: (prompt: string, plan: StewPlan) => void
  onClose: () => void
}

export function StewPlannerModal({
  open,
  plan,
  assembledPrompt,
  isDark = true,
  onGo,
  onClose,
}: StewPlannerModalProps) {
  const [editedPrompt, setEditedPrompt] = useState(assembledPrompt)
  const panelRef = useModalA11y<HTMLDivElement>(open, onClose)

  // Re-sync when a new plan flows in (the modal instance is reused).
  useEffect(() => {
    if (open) setEditedPrompt(assembledPrompt)
  }, [open, assembledPrompt])

  const contentModeLabel =
    plan.contentMode === 'real'
      ? 'Your own content'
      : plan.contentMode === 'mixed'
        ? 'Mix of real + placeholder'
        : 'Professional placeholders'

  const card = isDark
    ? 'bg-zinc-900 border-white/10'
    : 'bg-white border-slate-200'
  const chip = isDark
    ? 'bg-white/5 text-zinc-300 border-white/10'
    : 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stew-planner-title"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ' + card}
          >
            {/* Header */}
            <div className={'flex items-center gap-3 px-5 py-4 border-b ' + (isDark ? 'border-white/10' : 'border-slate-200')}>
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div id="stew-planner-title" className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>
                  Your stew is ready
                </div>
                <div className={isDark ? 'text-[11px] text-zinc-500' : 'text-[11px] text-slate-500'}>
                  {plan.businessName ? plan.businessName : 'Review the recipe, then build it.'}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className={
                  'w-7 h-7 rounded-md flex items-center justify-center transition-all shrink-0 ' +
                  (isDark ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')
                }
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ingredient summary */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <PlanRow icon={<Layers className="w-3.5 h-3.5" />} label="Pages" isDark={isDark}>
                {Array.isArray(plan.pages) && plan.pages.length ? (
                  <div className="flex flex-wrap gap-1">
                    {plan.pages.map((p, i) => (
                      <span key={i} className={'px-1.5 py-0.5 rounded text-[10px] border ' + chip}>{p}</span>
                    ))}
                  </div>
                ) : (
                  <Muted isDark={isDark}>AI will choose sensible pages</Muted>
                )}
              </PlanRow>

              <PlanRow icon={<Palette className="w-3.5 h-3.5" />} label="Style" isDark={isDark}>
                <span className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-slate-700'}>
                  {plan.visualStyle || 'Clean and modern'}
                  {plan.colorScheme ? ` · ${plan.colorScheme}` : ''}
                </span>
              </PlanRow>

              <PlanRow icon={<FileText className="w-3.5 h-3.5" />} label="Content" isDark={isDark}>
                <span className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-slate-700'}>{contentModeLabel}</span>
              </PlanRow>

              <PlanRow icon={<Plug className="w-3.5 h-3.5" />} label="Integrations" isDark={isDark}>
                {Array.isArray(plan.integrations) && plan.integrations.length ? (
                  <div className="flex flex-wrap gap-1">
                    {plan.integrations.map((it, i) => (
                      <span key={i} className={'px-1.5 py-0.5 rounded text-[10px] border ' + chip}>{it}</span>
                    ))}
                  </div>
                ) : (
                  <Muted isDark={isDark}>None</Muted>
                )}
              </PlanRow>

              {/* Editable build prompt */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className={isDark ? 'text-[10px] font-medium uppercase tracking-wide text-zinc-500' : 'text-[10px] font-medium uppercase tracking-wide text-slate-500'}>
                  The prompt we&apos;ll build from — edit anything
                </div>
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={5}
                  className={
                    'w-full rounded-lg border px-3 py-2 text-xs leading-relaxed resize-y focus:outline-none focus:border-orange-500/50 ' +
                    (isDark
                      ? 'bg-white/5 border-white/10 text-zinc-200 placeholder-zinc-600'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400')
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div className={'flex items-center gap-2 px-5 py-4 border-t ' + (isDark ? 'border-white/10' : 'border-slate-200')}>
              <button
                onClick={onClose}
                className={
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all ' +
                  (isDark ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200')
                }
              >
                Keep tweaking
              </button>
              <button
                onClick={() => onGo(editedPrompt.trim() || assembledPrompt, plan)}
                disabled={!editedPrompt.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Go — build it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PlanRow({
  icon,
  label,
  isDark,
  children,
}: {
  icon: React.ReactNode
  label: string
  isDark: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={
          'w-6 h-6 rounded-md flex items-center justify-center shrink-0 ' +
          (isDark ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500')
        }
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={isDark ? 'text-[10px] font-medium uppercase tracking-wide text-zinc-500 mb-0.5' : 'text-[10px] font-medium uppercase tracking-wide text-slate-500 mb-0.5'}>
          {label}
        </div>
        {children}
      </div>
    </div>
  )
}

function Muted({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return <span className={isDark ? 'text-xs text-zinc-600 italic' : 'text-xs text-slate-400 italic'}>{children}</span>
}
