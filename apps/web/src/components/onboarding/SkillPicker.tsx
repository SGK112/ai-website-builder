'use client'

// SkillPicker — shown to first-time users before the workspace tour.
// Sets skillLevel which drives which sidebar tabs, tools, and tour variant
// are shown throughout the session (and persisted to profile/localStorage).

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Code2, Layers, ArrowRight, Check } from 'lucide-react'

type SkillLevel = 'no-code' | 'low-code' | 'full-stack'

const TIERS = [
  {
    id: 'no-code' as SkillLevel,
    icon: Sparkles,
    label: 'Creator',
    tagline: 'I want to build websites',
    description: 'No coding needed. Describe what you want and AI builds it for you.',
    bullets: ['Visual point-and-click editing', 'AI generates everything', 'Templates to start fast', 'One-click publish'],
    color: 'violet',
    gradient: 'from-violet-500 to-fuchsia-500',
    bg: 'bg-violet-500/10 dark:bg-violet-500/10',
    border: 'border-violet-300 dark:border-violet-500/40',
    text: 'text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-500',
  },
  {
    id: 'low-code' as SkillLevel,
    icon: Layers,
    label: 'Builder',
    tagline: 'I know a little tech',
    description: 'Comfortable with settings and configs. You want control without writing code.',
    bullets: ['All Creator features', 'CMS content management', 'Plugin & embed setup', 'Environment variables'],
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/10',
    border: 'border-blue-300 dark:border-blue-500/40',
    text: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-500',
  },
  {
    id: 'full-stack' as SkillLevel,
    icon: Code2,
    label: 'Developer',
    tagline: 'I write code',
    description: 'Full access to everything. Code editor, console, Bridge, env vars — all of it.',
    bullets: ['All Builder features', 'Code editor + console', 'Local Claude Bridge', 'Full API / env access'],
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    border: 'border-emerald-300 dark:border-emerald-500/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500',
  },
]

interface Props {
  isOpen: boolean
  onComplete: (level: SkillLevel) => void
}

export function SkillPicker({ isOpen, onComplete }: Props) {
  const [selected, setSelected] = useState<SkillLevel | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    if (!selected) return
    setConfirming(true)
    // Small delay so the checkmark animation completes
    await new Promise(r => setTimeout(r, 400))
    onComplete(selected)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="w-full max-w-3xl bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-4">
                <Sparkles className="w-3 h-3" />
                Welcome to Webstew
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                How do you want to build?
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                We'll tailor the workspace to match your experience. You can change this anytime.
              </p>
            </div>

            {/* Tier cards */}
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIERS.map((tier) => {
                const Icon = tier.icon
                const isSelected = selected === tier.id
                return (
                  <motion.button
                    key={tier.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(tier.id)}
                    className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                      isSelected
                        ? `${tier.border} ${tier.bg} ring-2 ${tier.ring} ring-offset-2 ring-offset-white dark:ring-offset-zinc-950`
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    {/* Selected check */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center`}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center mb-3 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${tier.text}`}>
                      {tier.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {tier.tagline}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed">
                      {tier.description}
                    </p>

                    <ul className="space-y-1">
                      {tier.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400">
                          <span className={`w-1 h-1 rounded-full bg-gradient-to-br ${tier.gradient} shrink-0`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                )
              })}
            </div>

            {/* Confirm */}
            <div className="px-6 pb-6">
              <button
                onClick={handleConfirm}
                disabled={!selected || confirming}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  selected
                    ? `bg-gradient-to-r ${TIERS.find(t => t.id === selected)?.gradient} text-white shadow-lg hover:brightness-110`
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                {confirming ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Start building
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 dark:text-zinc-600 mt-2">
                You can always change this in Settings
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
