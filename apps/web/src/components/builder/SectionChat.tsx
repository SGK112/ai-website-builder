'use client'

// SectionChat — floating contextual chat for /workspace. FAB bottom-right;
// tap → bottom-sheet slides up over the canvas. Mobile-first: the canvas
// stays full-bleed and the sheet only covers what it needs. Desktop users
// can keep their existing side panel; this is additive.
//
// Aria-ready architecture: onSubmit takes a structured ChatSubmitPayload so
// the future voice handler can call it with the same shape. Section context
// is structured metadata, not concatenated prompt text — the host decides
// how to render it for the agent.

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, X, Loader2, Mic, MousePointer2, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionContext {
  tagName: string
  textSnippet: string
  outerHtml: string
}

export interface ChatSubmitPayload {
  text: string
  source: 'text' | 'voice'
  sectionContext: SectionContext | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  messages: ChatMessage[]
  isThinking: boolean
  selectedElement: SectionContext | null
  onClearSelection: () => void
  onSubmit: (payload: ChatSubmitPayload) => void
  // Aria status slot — null today, will surface 'listening' | 'speaking' |
  // 'idle' once the bridge lands. Component renders a placeholder dot.
  ariaStatus?: 'idle' | 'listening' | 'speaking' | null
  // Hide the FAB when the host already shows a chat panel (desktop default).
  // Mobile keeps it visible regardless because side panels eat too much space.
  hideFabOnDesktop?: boolean
  // Lets the user enable canvas-pick mode from inside the sheet. Without
  // this, mobile users had to find a toolbar button hidden behind a menu.
  selectMode?: boolean
  onToggleSelectMode?: (next: boolean) => void
  // Screen-space rect of the picked element so the chat floats next to it
  // instead of taking over the bottom of the screen. Null → bottom-right.
  anchor?: { top: number; left: number; width: number; height: number } | null
}

const CARD_W = 360
const EST_H = 420

// Place a compact card next to the element: to its right if there's room,
// else its left, else clamped on-screen. No anchor → bottom-right.
function computePosition(anchor: Props['anchor']): { top: number; left: number } {
  if (typeof window === 'undefined') return { top: 80, left: 80 }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.min(CARD_W, vw - 24)
  if (!anchor) {
    return { top: Math.max(16, vh - EST_H - 88), left: Math.max(12, vw - w - 16) }
  }
  let left = anchor.left + anchor.width + 12
  if (left + w > vw - 12) left = anchor.left - w - 12
  if (left < 12) left = Math.min(Math.max(anchor.left, 12), vw - w - 12)
  const top = Math.min(Math.max(anchor.top, 12), Math.max(12, vh - EST_H - 12))
  return { top, left }
}

const QUICK_PROMPTS = [
  'Make this section more compelling',
  'Add a contact form here',
  'Better spacing + typography',
  'Make this match my brand',
]

export function SectionChat({
  messages,
  isThinking,
  selectedElement,
  onClearSelection,
  onSubmit,
  ariaStatus = null,
  hideFabOnDesktop = false,
  selectMode = false,
  onToggleSelectMode,
  anchor = null,
}: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 80, left: 80 })
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  // Track which element we last auto-opened for. Without this, closing the
  // panel while an element is still selected re-fired the auto-open on the
  // next render — the "won't close" bug. Now we open ONCE per new selection.
  const lastSelRef = useRef<string | null>(null)

  useEffect(() => {
    const key = selectedElement?.outerHtml ?? null
    if (key && key !== lastSelRef.current) {
      lastSelRef.current = key
      setOpen(true)
    }
    if (!key) lastSelRef.current = null
  }, [selectedElement])

  // Position the compact card next to the element each time it opens / the
  // selection moves. Recompute on resize while open.
  useEffect(() => {
    if (!open) return
    const update = () => setPos(computePosition(anchor))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
    // anchor is a fresh object each render — depend on its primitive coords.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anchor?.top, anchor?.left, anchor?.width])

  // Esc closes — a guaranteed escape hatch regardless of selection state.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Focus input after open animation settles.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 220)
      return () => clearTimeout(t)
    }
  }, [open])

  // Auto-scroll on new message.
  useEffect(() => {
    if (!scrollerRef.current) return
    scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, isThinking])

  const submit = (text: string, source: 'text' | 'voice' = 'text') => {
    const t = text.trim()
    if (!t || isThinking) return
    onSubmit({
      text: t,
      source,
      sectionContext: selectedElement,
    })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  const visibleMessages = messages.slice(-12)

  return (
    <>
      {/* FAB — closed state. Bottom offset accounts for the mobile bottom
          tab nav (56px on phones, 0 on desktop via the --bottom-nav-h
          CSS var) + iPhone home-indicator safe area. Without this the
          FAB was hidden behind the tab bar. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={() => setOpen(true)}
            style={{
              bottom: 'calc(16px + env(safe-area-inset-bottom, 0px) + var(--bottom-nav-h, 0px))',
            }}
            className={cn(
              'fixed right-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-2xl',
              'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm',
              'shadow-violet-500/40 hover:shadow-violet-500/60 transition-shadow',
              hideFabOnDesktop && 'lg:hidden'
            )}
            aria-label="Open AI chat"
          >
            <Sparkles className="w-4 h-4" />
            <span>Edit with AI</span>
            {selectedElement && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] tracking-wider uppercase">
                1
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom sheet — open state */}
      <AnimatePresence>
        {open && (
          <>
            {/* Light backdrop — tap anywhere to dismiss; canvas stays visible */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />

            {/* Compact card — floats next to the picked element. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{ top: pos.top, left: pos.left, width: `min(${CARD_W}px, calc(100vw - 24px))` }}
              className={cn(
                'fixed z-50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden',
                'bg-zinc-950/98 backdrop-blur-xl border border-white/10',
                'flex flex-col max-h-[min(70vh,520px)]'
              )}
            >
              {/* Header — clear close button (the panel was un-closable before) */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ChefHat className="w-4 h-4 text-orange-400" />
                  Ask the chef
                </div>
                <div className="flex items-center gap-2">
                  <AriaIndicator status={ariaStatus} />
                  <button
                    onClick={() => setOpen(false)}
                    className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10"
                    aria-label="Close chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section context pill */}
              {selectedElement && (
                <div className="px-4 pt-3">
                  <div className="flex items-center gap-2 rounded-lg bg-violet-500/15 border border-violet-500/30 px-3 py-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wider text-violet-300/80 font-semibold">
                        Editing &lt;{selectedElement.tagName.toLowerCase()}&gt;
                      </div>
                      <div className="text-xs text-zinc-300 truncate">
                        {selectedElement.textSnippet || 'Selected element'}
                      </div>
                    </div>
                    <button
                      onClick={onClearSelection}
                      className="text-zinc-500 hover:text-white shrink-0 p-1"
                      aria-label="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message stream */}
              <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[140px]">
                {visibleMessages.length === 0 && !isThinking && (
                  <div className="text-center py-6">
                    <div className="text-sm text-zinc-400 mb-3">
                      {selectedElement
                        ? 'Tell me what to change about this section.'
                        : selectMode
                          ? 'Tap any section on the canvas — the sheet will reopen with it pinned.'
                          : 'Describe a change below, or pick a section on the canvas first.'}
                    </div>
                    {!selectedElement && onToggleSelectMode && (
                      <button
                        onClick={() => {
                          const next = !selectMode
                          onToggleSelectMode(next)
                          // When entering pick-mode, close the sheet so the
                          // user can see the canvas. selectedElement change
                          // will auto-reopen it.
                          if (next) setOpen(false)
                        }}
                        className={cn(
                          'inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors mb-3',
                          selectMode
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10'
                        )}
                      >
                        <MousePointer2 className="w-3.5 h-3.5" />
                        {selectMode ? 'Cancel · tap a section' : 'Pick a section on the canvas'}
                      </button>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => submit(p)}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {visibleMessages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[88%]',
                      m.role === 'user'
                        ? 'ml-auto bg-violet-600 text-white'
                        : 'mr-auto bg-white/5 text-zinc-200 border border-white/5'
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                {isThinking && (
                  <div className="mr-auto flex items-center gap-2 rounded-xl px-3 py-2 bg-white/5 text-zinc-400 text-sm border border-white/5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking…
                  </div>
                )}
              </div>

              {/* Input row */}
              <div className="border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2 rounded-xl bg-white/5 border border-white/10 px-2 py-1.5">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      selectedElement
                        ? `Change the ${selectedElement.tagName.toLowerCase()}…`
                        : 'Describe a change…'
                    }
                    disabled={isThinking}
                    rows={1}
                    className="flex-1 bg-transparent border-0 resize-none text-sm text-white placeholder:text-zinc-500 focus:outline-none px-2 py-1.5 min-h-[36px] max-h-[120px]"
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement
                      t.style.height = 'auto'
                      t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                    }}
                  />
                  <button
                    onClick={() => submit(input)}
                    disabled={!input.trim() || isThinking}
                    className={cn(
                      'p-2 rounded-lg shrink-0 transition-all',
                      input.trim() && !isThinking
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30'
                        : 'bg-white/5 text-zinc-500'
                    )}
                    aria-label="Send"
                  >
                    {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Placeholder for the Aria status indicator — renders a tinted dot today
// and will plug into the actual voice-bridge connection state once the
// Aria adapter lands.
function AriaIndicator({ status }: { status: 'idle' | 'listening' | 'speaking' | null }) {
  if (!status) {
    return (
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold inline-flex items-center gap-1.5">
        <Mic className="w-3 h-3 opacity-40" />
        Voice soon
      </span>
    )
  }
  const dot =
    status === 'listening' ? 'bg-emerald-400 animate-pulse' : status === 'speaking' ? 'bg-violet-400 animate-pulse' : 'bg-zinc-500'
  const label = status === 'listening' ? 'Listening' : status === 'speaking' ? 'Aria…' : 'Idle'
  return (
    <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-semibold inline-flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full', dot)} />
      {label}
    </span>
  )
}

export default SectionChat
