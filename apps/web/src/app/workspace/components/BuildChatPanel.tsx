'use client'

import type { ComponentType, RefObject, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Loader2, Check, Sparkles, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LearningPath, type LearningStep } from '@/components/LearningPath'
import { MessageFeedback } from '@/components/MessageFeedback'
import { StewPlannerChat } from '@/components/builder/StewPlannerChat'
import type { ClarifyTurn, StewPlan } from '@/lib/types/stew-planner'
import type { BuildPhase, BuildStep, SkillLevel, BuildTarget } from '../types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
  source?: 'bridge' | 'api'
  permission?: {
    permissionId: string
    action: string
    approveLabel: string
    denyLabel: string
    resolved?: 'approved' | 'denied'
  }
}

interface QuickStartItem {
  id: string
  icon: ComponentType<{ className?: string }>
  label: string
  gradient: string
  isPremade?: boolean
}

// Lightweight inline markdown: **bold**, "• "/"- " bullets, and "1." numbered
// lists. Returns one <div> per line. dangerouslySetInnerHTML is scoped to the
// bold span we generate from the model's own reply.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function renderRichText(content: string, isDark: boolean): ReactNode {
  return content.split('\n').map((line, i) => {
    // Escape first so model/CMS content can't inject raw HTML, THEN apply the
    // **bold** → <strong> transform on the already-escaped string.
    const bold = escapeHtml(line).replace(/\*\*([^*]+)\*\*/g, `<strong class="${isDark ? 'text-white' : 'text-slate-900'} font-semibold">$1</strong>`)
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-violet-400">•</span>
          <span dangerouslySetInnerHTML={{ __html: bold.replace(/^[•-]\s*/, '') }} />
        </div>
      )
    }
    if (/^\d+\.\s/.test(line)) {
      return (
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-violet-400">{line.match(/^\d+/)?.[0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: bold.replace(/^\d+\.\s*/, '') }} />
        </div>
      )
    }
    return <div key={i} dangerouslySetInnerHTML={{ __html: bold }} />
  })
}

// Live "it's working" state for the in-progress assistant bubble — so the
// chef bubble is never a stagnant "…". Cooking metaphor, cycling phrases, the
// chat-side cousin of the preview's loading spinner.
const COOKING_PHRASES = [
  'Reading your site…',
  'Cooking up the changes…',
  'Adding ingredients…',
  'Stewing…',
  'Simmering…',
  'Plating it up…',
]
function CookingIndicator({ isDark }: { isDark: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % COOKING_PHRASES.length), 1900)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-2 py-0.5">
      <motion.span
        animate={{ rotate: [0, -10, 10, -6, 0], y: [0, -1, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className={isDark ? 'text-orange-300' : 'text-orange-500'}
      >
        <ChefHat className="w-4 h-4" />
      </motion.span>
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className={cn('text-[13px] font-medium bg-gradient-to-r bg-clip-text text-transparent',
            isDark ? 'from-violet-200 to-fuchsia-200' : 'from-violet-600 to-fuchsia-600')}
        >
          {COOKING_PHRASES[i]}
        </motion.span>
      </AnimatePresence>
      <span className="flex gap-1">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1 h-1 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </div>
  )
}

function ChatMessageBubble({
  msg, index, isDark, isMobile, isStreaming, prevUserPrompt, projectId, buildTarget, onSendMessage, onResolvePermission,
}: {
  msg: ChatMessage
  index: number
  isDark: boolean
  isMobile?: boolean
  isStreaming?: boolean
  prevUserPrompt?: string
  projectId?: string
  buildTarget: BuildTarget
  onSendMessage: (text: string) => void
  onResolvePermission: (permissionId: string, approved: boolean) => void
}) {
  // The active bubble has nothing to say yet (placeholder "…") — show the
  // animated cooking state instead of a frozen ellipsis.
  const bodyText = msg.content.trim()
  const isWaitingPlaceholder = isStreaming && (bodyText === '' || bodyText === '…' || bodyText === '...')
  const showFeedback =
    msg.role === 'assistant' && !msg.suggestions && !msg.permission &&
    index > 0 && msg.content.trim().length > 8

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn('flex gap-2 items-end', msg.role === 'user' ? 'justify-end' : 'justify-start')}
    >
      {msg.role === 'assistant' && (
        <div className={cn(
          'w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/30',
          isStreaming && 'ring-2 ring-violet-400/50'
        )}>
          {isStreaming
            ? <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}><Sparkles className="w-3.5 h-3.5 text-white" /></motion.span>
            : <Bot className="w-4 h-4 text-white" />}
        </div>
      )}
      {/* Floating bubble: lifted off the canvas with a soft shadow (+ colored glow
          on the user side), glass on the assistant side — so the thread reads as
          a clear, legible conversation rather than flat panels. */}
      <div className={cn(
        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-lg',
        msg.role === 'user'
          ? 'bg-violet-500 text-white rounded-br-md shadow-violet-500/30'
          : isDark
            ? 'bg-zinc-800/70 text-zinc-100 rounded-bl-md border border-white/10 shadow-black/30 backdrop-blur-sm'
            : 'bg-white/90 text-slate-800 rounded-bl-md border border-slate-200/80 shadow-slate-300/60 backdrop-blur-sm'
      )}>
        <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
          {isWaitingPlaceholder
            ? <CookingIndicator isDark={isDark} />
            : renderRichText(msg.content, isDark)}
        </div>

        {msg.suggestions && msg.suggestions.length > 0 && !isMobile && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border">
            {msg.suggestions.map((suggestion, sIdx) => (
              <button
                key={sIdx}
                onClick={() => onSendMessage(suggestion)}
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-all shadow-sm dark:bg-violet-500/25 dark:text-violet-100 dark:hover:bg-violet-500/40 dark:border dark:border-violet-400/40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {msg.source && (
          <div className="mt-2 flex items-center gap-1">
            {msg.source === 'bridge' ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-orange-400/70 font-medium">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                chef
              </span>
            ) : (
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', isDark ? 'text-zinc-400' : 'text-slate-500')}>api</span>
            )}
          </div>
        )}

        {msg.permission && (
          <div className="mt-3 pt-2 border-t border-white/10">
            {msg.permission.resolved ? (
              <span className={cn('text-xs font-medium', msg.permission.resolved === 'approved' ? 'text-emerald-400' : 'text-zinc-500')}>
                {msg.permission.resolved === 'approved' ? '✓ Approved' : '✗ Denied'}
              </span>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onResolvePermission(msg.permission!.permissionId, false)}
                  className={cn('flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border', isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')}
                >
                  {msg.permission.denyLabel}
                </button>
                <button
                  onClick={() => onResolvePermission(msg.permission!.permissionId, true)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 hover:brightness-110 text-white text-xs font-semibold transition"
                >
                  {msg.permission.approveLabel}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Thumbs up/down on real AI replies — a down-vote's note trains this
            user's future builds. */}
        {showFeedback && (
          <MessageFeedback
            messageKey={`${projectId || 'draft'}:${index}`}
            prompt={prevUserPrompt}
            projectId={projectId}
            target={buildTarget}
            isDark={isDark}
          />
        )}
      </div>
      {msg.role === 'user' && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  )
}

interface BuildChatPanelProps {
  isDark: boolean
  isMobile?: boolean
  skillLevel: SkillLevel
  buildPhase: BuildPhase
  currentSteps: BuildStep[]
  conversationIntent: string | null
  chatContainerRef: RefObject<HTMLDivElement>
  onChatScroll?: () => void
  chatMessages: ChatMessage[]
  isThinking: boolean
  isGenerating: boolean
  chatSuggestions: string[]
  hasHtml: boolean
  currentProjectId?: string
  buildTarget: BuildTarget
  onSendMessage: (text: string) => void
  onResolvePermission: (permissionId: string, approved: boolean) => void
  learnPath: { steps: LearningStep[]; dismissed: boolean; dismiss: () => void }
  // Stew Planner
  plannerActive: boolean
  plannerMessages: ClarifyTurn[]
  plannerPlan: Partial<StewPlan>
  plannerThinking: boolean
  plannerSuggestions: string[]
  onPlannerSubmit: (text: string) => void
  onPlannerSkip: () => void
  // Empty-state quick start
  quickStartTemplates: QuickStartItem[]
  onLoadInlineTemplate: (id: string) => void
}

export function BuildChatPanel({
  isDark,
  isMobile,
  skillLevel,
  buildPhase,
  currentSteps,
  conversationIntent,
  chatContainerRef,
  onChatScroll,
  chatMessages,
  isThinking,
  isGenerating,
  chatSuggestions,
  hasHtml,
  currentProjectId,
  buildTarget,
  onSendMessage,
  onResolvePermission,
  learnPath,
  plannerActive,
  plannerMessages,
  plannerPlan,
  plannerThinking,
  plannerSuggestions,
  onPlannerSubmit,
  onPlannerSkip,
  quickStartTemplates,
  onLoadInlineTemplate,
}: BuildChatPanelProps) {
  // On mobile keep it minimal — chat, voice, tools only. No quick-start card
  // grid (it's the bulk of the "way too much" clutter on a phone).
  const showQuickStart = !plannerActive && (chatMessages.length === 1 || !hasHtml) && !isGenerating && !isMobile
  // The "Thinking…" pill is only the *pre-reply* wait. Once an assistant
  // bubble exists it streams its own live tool status ("Editing index.html…"),
  // so showing both was the confusing double-bubble. Gate on "last turn is the
  // user's" — i.e. we're still waiting for the assistant to start.
  const awaitingReply = chatMessages.length > 0 && chatMessages[chatMessages.length - 1]?.role === 'user'

  return (
    <motion.div
      key="build"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      {/* Build Progress */}
      <AnimatePresence>
        {buildPhase !== 'idle' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("px-3 py-2 border-b", isDark ? "border-white/[0.08] bg-violet-500/5" : "border-slate-200 bg-violet-50")}
          >
            <div className="flex items-center justify-center gap-3">
              {currentSteps.map((step, i) => (
                <div key={step.phase} className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center transition-all text-[10px]',
                    step.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                    step.status === 'active' ? 'bg-violet-500/20 text-violet-400' :
                    isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-slate-200 text-slate-400'
                  )}>
                    {step.status === 'complete' ? <Check className="w-3 h-3" />
                      : step.status === 'active' ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <step.icon className="w-2.5 h-2.5" />}
                  </div>
                  {i < currentSteps.length - 1 && (
                    <div className={cn('w-4 h-0.5 rounded-full', step.status === 'complete' ? 'bg-emerald-500/50' : isDark ? 'bg-zinc-800' : 'bg-slate-200')} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversational Chat Interface */}
      <div
        ref={chatContainerRef}
        onScroll={onChatScroll}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-track-transparent",
          isDark ? "scrollbar-thumb-zinc-700" : "scrollbar-thumb-slate-300"
        )}
      >
        {/* Skill-aware learning path — build → live → domain → share → sell. */}
        {!plannerActive && !learnPath.dismissed && (
          <div className="mb-3">
            <LearningPath skillLevel={skillLevel} steps={learnPath.steps} onDismiss={learnPath.dismiss} isDark={isDark} />
          </div>
        )}

        {/* Chat messages — hidden while the Stew Planner owns the conversation. */}
        {!plannerActive && chatMessages.map((msg, i) => (
          <ChatMessageBubble
            key={i}
            msg={msg}
            index={i}
            isDark={isDark}
            isMobile={isMobile}
            // The last assistant bubble is "live" while a request is in flight
            // — drives the cooking animation so it never looks frozen.
            isStreaming={msg.role === 'assistant' && i === chatMessages.length - 1 && (isThinking || isGenerating)}
            prevUserPrompt={(() => { const u = [...chatMessages.slice(0, i)].reverse().find(m => m.role === 'user'); return typeof u?.content === 'string' ? u.content : undefined })()}
            projectId={currentProjectId}
            buildTarget={buildTarget}
            onSendMessage={onSendMessage}
            onResolvePermission={onResolvePermission}
          />
        ))}

        {/* Pre-reply "Thinking…" — Webstew-branded (gradient avatar + chip),
            shown only while we await the assistant's first bubble. */}
        {isThinking && !isGenerating && awaitingReply && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-500/30">
              <motion.span animate={{ scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </motion.span>
            </div>
            <div className={cn(
              "rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-2 border shadow-lg backdrop-blur-sm",
              isDark
                ? "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 border-violet-400/20 shadow-violet-500/10"
                : "bg-violet-50 border-violet-200 shadow-violet-200/50"
            )}>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className={cn(
                "text-sm font-medium bg-gradient-to-r bg-clip-text text-transparent",
                isDark ? "from-violet-200 to-fuchsia-200" : "from-violet-600 to-fuchsia-600"
              )}>
                Thinking…
              </span>
            </div>
          </motion.div>
        )}

        {/* Generation progress */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/30">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className={cn(
              "rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-lg backdrop-blur-sm border",
              isDark ? "bg-zinc-800/70 border-white/10 shadow-black/30" : "bg-white/90 border-slate-200/80 shadow-slate-300/60"
            )}>
              <div className={cn("flex items-center gap-2 text-sm", isDark ? "text-violet-300" : "text-violet-600")}>
                <span className="animate-pulse">Creating your {conversationIntent || 'content'}...</span>
              </div>
              <div className="mt-2 space-y-1">
                {currentSteps.map((step) => (
                  <div key={step.phase} className="flex items-center gap-2 text-[11px]">
                    {step.status === 'complete' ? <Check className="w-3 h-3 text-emerald-400" />
                      : step.status === 'active' ? <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                      : <div className={cn("w-3 h-3 rounded-full border", isDark ? "border-zinc-600" : "border-slate-300")} />}
                    <span className={cn(
                      step.status === 'complete' ? 'text-emerald-400' :
                      step.status === 'active' ? 'text-violet-300' : 'text-zinc-500'
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick action suggestions */}
        {chatSuggestions.length > 0 && !isGenerating && chatMessages.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-1.5 pt-2">
            {chatSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(suggestion)}
                className="px-3 py-1.5 text-xs font-medium rounded-full transition-all bg-card text-foreground border border-border hover:bg-violet-100 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-500/20 dark:hover:text-violet-200 dark:hover:border-violet-400/40"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}

        {/* Stew Planner — clarifying agent, in place of the quick-start grid. */}
        {plannerActive && (
          <StewPlannerChat
            messages={plannerMessages}
            plan={plannerPlan}
            isThinking={plannerThinking}
            suggestedReplies={plannerSuggestions}
            isDark={isDark}
            onSubmit={({ text }) => onPlannerSubmit(text)}
            onSkip={onPlannerSkip}
          />
        )}

        {/* Quick Start templates — initial empty state only */}
        {showQuickStart && (
          <div className="pt-4 space-y-4">
            <div>
              <p className={cn("text-[10px] uppercase tracking-wider mb-2", isDark ? "text-zinc-500" : "text-slate-500")}>Quick Start</p>
              <div className="grid grid-cols-2 gap-2">
                {quickStartTemplates.slice(0, 4).map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      onClick={() => onLoadInlineTemplate(template.id)}
                      className={cn(
                        "group relative p-3 rounded-xl transition-colors text-left overflow-hidden border",
                        isDark
                          ? "bg-white/[0.03] border-white/[0.06] hover:border-violet-400/40 hover:bg-violet-500/[0.06]"
                          : "bg-white border-slate-200 hover:border-violet-300 hover:shadow-md"
                      )}
                    >
                      {template.isPremade && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold tracking-wider bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30 rounded">
                          INSTANT
                        </span>
                      )}
                      {/* One accent — the tiles used to each carry a different
                          gradient (violet/blue/emerald…), five accents in a 2×2. */}
                      <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 flex items-center justify-center mb-2">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={cn("text-xs font-medium", isDark ? "text-white" : "text-slate-800")}>{template.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
