'use client'

// StewPlannerWizard — the clarifying interview as a focused, card-by-card
// step, shown BEFORE the workspace is revealed.
//
// The planner used to run inside the chat panel of an already-open workspace:
// you'd land on the full builder UI — sidebar, preview, toolbar, tabs — and
// only then get asked what you actually wanted. The questions competed with
// every other control on screen for attention, and the answer box was the same
// chat input you'd just used, so it read as "the build failed and it's asking
// again" rather than "we're setting up".
//
// One question per card, a real sense of progress, one-tap answers. The
// workspace stays behind this until the plan is submitted.
//
// Deliberately presentational: all planner state and the /api/builder/clarify
// round-trip stay in the workspace, so this and the inline StewPlannerChat
// remain two views of the same conversation.

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, ArrowLeft, ArrowRight, Loader2, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  isDark: boolean
  /** The question on the current card — the planner's latest ask. */
  question: string | null
  /** How many questions the user has already answered (for "Question N"). */
  answered: number
  /** Planner's own 0–100 read on how complete the plan is. */
  completeness: number
  isThinking: boolean
  suggestedReplies: string[]
  canGoBack: boolean
  onAnswer: (text: string) => void
  onBack: () => void
  onSkip: () => void
}

export function StewPlannerWizard({
  open, isDark, question, answered, completeness,
  isThinking, suggestedReplies, canGoBack, onAnswer, onBack, onSkip,
}: Props) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Clear the box for each new question, and put the caret where the user is
  // about to type — on desktop only, so a phone doesn't pop the keyboard over
  // the question they still have to read.
  useEffect(() => {
    setDraft('')
    if (question && window.matchMedia('(min-width: 768px)').matches) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [question])

  if (!open) return null

  const submit = (text: string) => {
    const value = text.trim()
    if (!value || isThinking) return
    onAnswer(value)
    setDraft('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Above every workspace layer (toasts sit at 300) — the point is that the
      // builder behind this is not yet available to touch.
      className={cn(
        'fixed inset-0 z-[400] flex flex-col items-center justify-center px-5 py-8 overflow-y-auto',
        isDark ? 'bg-zinc-950' : 'bg-white',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Setting up your build"
    >
      <div className="w-full max-w-xl">
        {/* Header — who's asking, and how far along */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Prepping your stew
            </div>
            <div className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-slate-500')}>
              {answered === 0 ? 'A few quick questions first' : `Question ${answered + 1}`}
            </div>
          </div>
          <button
            onClick={onSkip}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition shrink-0',
              isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
            )}
          >
            <SkipForward className="w-3.5 h-3.5" /> Skip
          </button>
        </div>

        {/* Progress */}
        <div className={cn('h-1 rounded-full overflow-hidden mb-9', isDark ? 'bg-white/[0.07]' : 'bg-slate-200')}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(6, Math.min(100, completeness))}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>

        {/* The card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question || 'thinking'}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22 }}
          >
            {isThinking && !question ? (
              <div className={cn('flex items-center gap-2.5 text-sm', isDark ? 'text-zinc-400' : 'text-slate-500')}>
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking about what to ask…
              </div>
            ) : (
              <>
                <h2 className={cn('display-card mb-6', isDark ? 'text-white' : 'text-slate-900')}>
                  {question}
                </h2>

                {/* One-tap answers — most questions are answerable without typing */}
                {suggestedReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {suggestedReplies.map((reply) => (
                      <button
                        key={reply}
                        disabled={isThinking}
                        onClick={() => submit(reply)}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-50',
                          isDark
                            ? 'bg-white/[0.03] border-white/10 text-zinc-200 hover:bg-white/[0.08] hover:border-orange-500/40'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300',
                        )}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(draft) }
                  }}
                  rows={3}
                  placeholder={suggestedReplies.length ? 'Or answer in your own words…' : 'Type your answer…'}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border resize-none outline-none transition-colors',
                    isDark
                      ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-500/50'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-400',
                  )}
                />

                <div className="flex items-center gap-3 mt-5">
                  {canGoBack && (
                    <button
                      onClick={onBack}
                      disabled={isThinking}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-40',
                        isDark ? 'border-white/10 text-zinc-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  <button
                    onClick={() => submit(draft)}
                    disabled={isThinking || !draft.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {isThinking ? 'Thinking…' : 'Continue'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
