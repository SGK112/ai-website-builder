'use client'

// BuildTargetModal — the "what kind of app" chooser.
//
// The home page's "App Builder" entry opens this instead of dropping the
// user straight into /workspace (which silently defaults to a website).
// Picking a card routes to /workspace?target=<id>; the workspace reads
// that param on mount and opens already in the chosen build mode.
//
// Website is anon-accessible (one free generation); the app targets ride
// through /signup first, since multi-target generation is gated — the
// caller's onPick handles that routing.

import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Rocket, Layers, Atom, Smartphone, X, ArrowRight } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

export type BuildTargetId = 'website' | 'astro' | 'nextjs' | 'react' | 'expo'

interface TargetOption {
  id: BuildTargetId
  name: string
  icon: typeof Globe
  blurb: string
  tag?: string
}

const TARGETS: TargetOption[] = [
  { id: 'website', name: 'Website',    icon: Globe,      blurb: 'A static HTML site — fast, simple, ships as one page.', tag: 'No sign-in needed' },
  { id: 'astro',   name: 'Astro',      icon: Rocket,     blurb: 'A content site — blog, docs, marketing pages.' },
  { id: 'nextjs',  name: 'Next.js',    icon: Layers,     blurb: 'A full-stack React app with routing and API routes.' },
  { id: 'react',   name: 'React',      icon: Atom,       blurb: 'A single-page React app, built with Vite.' },
  { id: 'expo',    name: 'Mobile app', icon: Smartphone, blurb: 'An iOS & Android app, built with Expo.' },
]

interface BuildTargetModalProps {
  open: boolean
  isDark: boolean
  onClose: () => void
  onPick: (target: BuildTargetId) => void
}

export function BuildTargetModal({ open, isDark, onClose, onPick }: BuildTargetModalProps) {
  const panelRef = useModalA11y<HTMLDivElement>(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="build-target-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={
              'w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ' +
              (isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200')
            }
          >
            {/* Header */}
            <div className={'flex items-center gap-3 px-5 py-4 border-b ' + (isDark ? 'border-white/10' : 'border-slate-200')}>
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div id="build-target-title" className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>
                  What are we building?
                </div>
                <div className={isDark ? 'text-[11px] text-zinc-500' : 'text-[11px] text-slate-500'}>
                  Pick a target — you can change it later in the workspace.
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

            {/* Target cards */}
            <div className="px-4 py-4 flex flex-col gap-2">
              {TARGETS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => onPick(t.id)}
                    className={
                      'group flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl border transition-all ' +
                      (isDark
                        ? 'border-white/10 bg-white/[0.02] hover:border-violet-500/40 hover:bg-violet-500/[0.07]'
                        : 'border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50')
                    }
                  >
                    <div
                      className={
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' +
                        (isDark ? 'bg-white/5 text-violet-300' : 'bg-violet-100 text-violet-600')
                      }
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>
                          {t.name}
                        </span>
                        {t.tag && (
                          <span
                            className={
                              'text-[9px] px-1.5 py-0.5 rounded-full font-semibold ' +
                              (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            }
                          >
                            {t.tag}
                          </span>
                        )}
                      </div>
                      <div className={isDark ? 'text-[11px] text-zinc-500 truncate' : 'text-[11px] text-slate-500 truncate'}>
                        {t.blurb}
                      </div>
                    </div>
                    <ArrowRight
                      className={
                        'w-4 h-4 shrink-0 transition-all opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ' +
                        (isDark ? 'text-violet-300' : 'text-violet-500')
                      }
                    />
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
