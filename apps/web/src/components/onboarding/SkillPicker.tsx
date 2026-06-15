'use client'

// SkillPicker — the first thing a new user sees. Instead of asking people to
// self-classify into jargon tiers ("full-stack"?), it asks two plain-language
// questions about where they actually are — with AI, and with building things —
// and maps the answers to a skill level. The level drives which sidebar tabs,
// tools, and tour variant show up, and is persisted to profile + localStorage.
// Defaults bias toward the simplest (no-code) experience, since most users are
// non-technical; they can step up anytime. A manual override is one tap away.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Code2, Layers, ArrowRight, Check, Bot, Hammer } from 'lucide-react'

type SkillLevel = 'no-code' | 'low-code' | 'full-stack'
type AiExp = 'new' | 'some' | 'lots'
type BuildExp = 'never' | 'builders' | 'code'

const TIERS = [
  {
    id: 'no-code' as SkillLevel,
    icon: Sparkles,
    label: 'Creator',
    tagline: 'Build by describing',
    description: "No coding needed. Tell the AI what you want in plain words and it builds it for you.",
    bullets: ['Visual point-and-click editing', 'AI generates everything', 'Templates to start fast', 'One-click publish'],
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
    tagline: 'A bit more control',
    description: "Comfortable with settings and configs — you want more control without writing code.",
    bullets: ['Everything in Creator', 'CMS content management', 'Plugin & embed setup', 'Environment variables'],
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
    tagline: 'Full access',
    description: "Everything unlocked — code editor, console, local Claude Bridge, full API & env access.",
    bullets: ['Everything in Builder', 'Code editor + console', 'Local Claude Bridge', 'Full API / env access'],
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    border: 'border-emerald-300 dark:border-emerald-500/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500',
  },
]

function recommendLevel(ai: AiExp, build: BuildExp): SkillLevel {
  if (build === 'code') return 'full-stack'        // they write code → full access
  if (build === 'builders' || ai === 'lots') return 'low-code' // some tech comfort
  return 'no-code'                                  // true beginner default
}

const AI_OPTIONS: { id: AiExp; label: string; hint: string }[] = [
  { id: 'new',  label: "I'm new to it",        hint: "Haven't really used AI tools" },
  { id: 'some', label: 'A little',             hint: 'I’ve tried ChatGPT or similar' },
  { id: 'lots', label: 'I use them a lot',     hint: 'AI is part of my routine' },
]
const BUILD_OPTIONS: { id: BuildExp; label: string; hint: string }[] = [
  { id: 'never',    label: 'This is my first', hint: 'Never built a site or app' },
  { id: 'builders', label: 'A bit',            hint: 'Used Wix, Squarespace, etc.' },
  { id: 'code',     label: 'I write code',     hint: 'I’m a developer' },
]

interface Props {
  isOpen: boolean
  onComplete: (level: SkillLevel) => void
}

// Module-level so it isn't re-created on every keystroke (which would remount
// the fieldsets and drop focus). Pure-props.
function OptionRow({
  options, value, onPick, icon: Icon, question,
}: {
  options: { id: string; label: string; hint: string }[]
  value: string | null
  onPick: (id: string) => void
  icon: typeof Bot
  question: string
}) {
  return (
    <fieldset className="mb-5">
      <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
        <Icon className="w-4 h-4 text-violet-500" aria-hidden="true" />
        {question}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((o) => {
          const sel = value === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              aria-pressed={sel}
              className={`text-left rounded-xl border-2 p-3 min-h-[60px] transition-all ${
                sel
                  ? 'border-violet-400 bg-violet-500/10 ring-1 ring-violet-500'
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{o.label}</span>
              <span className="block text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">{o.hint}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function SkillPicker({ isOpen, onComplete }: Props) {
  const [ai, setAi] = useState<AiExp | null>(null)
  const [build, setBuild] = useState<BuildExp | null>(null)
  const [phase, setPhase] = useState<'ask' | 'result'>('ask')
  const [manual, setManual] = useState<SkillLevel | null>(null)
  const [confirming, setConfirming] = useState(false)

  const recommended = ai && build ? recommendLevel(ai, build) : null
  const chosen = manual ?? recommended
  const chosenTier = TIERS.find((t) => t.id === chosen) || TIERS[0]

  const handleConfirm = async () => {
    if (!chosen) return
    setConfirming(true)
    await new Promise((r) => setTimeout(r, 350))
    onComplete(chosen)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="skillpicker-title"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="w-full max-w-2xl my-auto bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-7 pt-7 pb-5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3 h-3" />
                Welcome to Webstew
              </div>
              <h1 id="skillpicker-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                {phase === 'ask' ? "Let's set things up for you" : `You're all set`}
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {phase === 'ask'
                  ? "Two quick questions — there are no wrong answers, and you can change this anytime."
                  : 'We tuned the workspace to match. You can switch levels whenever you like.'}
              </p>
            </div>

            {phase === 'ask' ? (
              <>
                <div className="px-7 pb-2">
                  <OptionRow options={AI_OPTIONS} value={ai} onPick={(v) => setAi(v as AiExp)} icon={Bot} question="How much have you used AI tools?" />
                  <OptionRow options={BUILD_OPTIONS} value={build} onPick={(v) => setBuild(v as BuildExp)} icon={Hammer} question="Have you built a website or app before?" />
                </div>
                <div className="px-7 pb-7 pt-1">
                  <button
                    onClick={() => setPhase('result')}
                    disabled={!ai || !build}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                      ai && build
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg hover:brightness-110'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Recommended (or manually-chosen) tier */}
                <div className="px-7 pb-2">
                  {manual === null && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">
                      Based on your answers, we recommend:
                    </p>
                  )}
                  <div className={`rounded-2xl border-2 ${chosenTier.border} ${chosenTier.bg} p-5`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${chosenTier.gradient} flex items-center justify-center shadow-md`}>
                        <chosenTier.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${chosenTier.text}`}>{chosenTier.label}</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{chosenTier.tagline}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{chosenTier.description}</p>
                      </div>
                    </div>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {chosenTier.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400">
                          <Check className={`w-3 h-3 shrink-0 ${chosenTier.text}`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Manual override — pick a different level */}
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 mb-1.5">Prefer a different level?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TIERS.map((t) => {
                        const sel = chosen === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setManual(t.id)}
                            aria-pressed={sel}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                              sel ? `${t.border} ${t.bg} ${t.text}` : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-7 pb-7 pt-3 flex items-center gap-3">
                  <button
                    onClick={() => { setPhase('ask'); setManual(null) }}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirming || !chosen}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${chosenTier.gradient} text-white shadow-lg hover:brightness-110 disabled:opacity-70`}
                  >
                    {confirming ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, ease: 'linear', repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <>Start building<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
