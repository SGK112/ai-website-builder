'use client'

// StewPlannerChat — the inline conversational surface for the Stew Planner.
//
// Renders in the chat area in place of the quick-start grid while the
// clarifying agent is interviewing the user. It has NO input of its own —
// the workspace's existing chat input is routed to the planner while
// plannerActive is true. This component only renders the conversation, the
// progress bar, one-tap suggested replies, and the skip link.
//
// Input-source-abstracted: onSubmit carries a ClarifySubmitPayload with a
// `source` field, so a voice assistant (Aria) can later drive the same
// planner by emitting source:'voice' — no logic here changes.

import { ChefHat, Loader2, Sparkles } from 'lucide-react'
import type { ClarifyTurn, StewPlan, ClarifySubmitPayload } from '@/lib/types/stew-planner'

interface StewPlannerChatProps {
  messages: ClarifyTurn[]
  plan: Partial<StewPlan>
  isThinking: boolean
  suggestedReplies: string[]
  isDark?: boolean
  onSubmit: (payload: ClarifySubmitPayload) => void
  onSkip: () => void
}

export function StewPlannerChat({
  messages,
  plan,
  isThinking,
  suggestedReplies,
  isDark = true,
  onSubmit,
  onSkip,
}: StewPlannerChatProps) {
  const completeness = Math.max(0, Math.min(100, plan.completeness ?? 0))

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header + progress — shows the planner is gathering ingredients */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={isDark ? 'text-xs font-semibold text-white' : 'text-xs font-semibold text-slate-900'}>
            Prepping your stew
          </div>
          <div className={isDark ? 'text-[10px] text-zinc-500' : 'text-[10px] text-slate-500'}>
            A few quick questions so the build comes out right.
          </div>
        </div>
        <button
          onClick={onSkip}
          className={
            'text-[10px] font-medium px-2 py-1 rounded-md transition-all shrink-0 ' +
            (isDark
              ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')
          }
        >
          Skip — just build
        </button>
      </div>
      <div className={'h-1 rounded-full overflow-hidden ' + (isDark ? 'bg-white/5' : 'bg-slate-200')}>
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
          style={{ width: `${completeness}%` }}
        />
      </div>

      {/* Conversation */}
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ' +
                (m.role === 'user'
                  ? 'bg-violet-500 text-white'
                  : isDark
                    ? 'bg-white/5 text-zinc-200 border border-white/10'
                    : 'bg-slate-100 text-slate-800 border border-slate-200')
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div
              className={
                'rounded-xl px-3 py-2 flex items-center gap-2 ' +
                (isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200')
              }
            >
              <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
              <span className={isDark ? 'text-[10px] text-zinc-400' : 'text-[10px] text-slate-500'}>
                Thinking…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* One-tap suggested replies for the latest question */}
      {!isThinking && suggestedReplies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestedReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => onSubmit({ text: reply, source: 'text' })}
              className={
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ' +
                (isDark
                  ? 'bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20'
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100')
              }
            >
              <Sparkles className="w-2.5 h-2.5" />
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
