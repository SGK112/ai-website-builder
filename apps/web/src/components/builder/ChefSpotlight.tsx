'use client'

// ChefDock — glassmorphic chat for /workspace, anchored center-bottom of
// the canvas. Two states for the SAME bar:
//   • collapsed → tiny pill ("Chat")
//   • expanded  → wider single-row bar with an input + send button
// The bar expands HORIZONTALLY only; height stays constant. Messages don't
// live inside the bar — they float ABOVE it as a stack of glass bubbles,
// like iMessage taps from a voice assistant. No second box.
//
// ⌘J toggles expand/collapse so the chat is one keypress away from
// anywhere in the workspace.
//
// Aria-ready: onSubmit takes the same payload shape SectionChat uses
// (see feedback_aria_in_workspace_north_star.md).

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion'
import { ChefHat, Send, Loader2, X, Sparkles, Command } from 'lucide-react'
import { cn } from '@/lib/utils'

const POSITION_KEY = 'webstew-chef-dock-position'

export interface ChefSelectedElement {
  tagName: string
  textSnippet: string
  outerHtml: string
}

export interface ChefSubmitPayload {
  text: string
  source: 'text' | 'voice'
  sectionContext: ChefSelectedElement | null
}

export interface ChefMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  visible: boolean
  expanded: boolean
  onToggle: (next: boolean) => void
  messages: ChefMessage[]
  isThinking: boolean
  selectedElement: ChefSelectedElement | null
  onClearSelection: () => void
  onSubmit: (payload: ChefSubmitPayload) => void
}

// Only the last two messages float above the bar — the dock should hint
// at conversation, not occupy the canvas. As a third arrives the oldest
// fades out fast so the workspace breathes. The side panel is for full
// thread review.
const VISIBLE_HISTORY = 2

export function ChefDock({
  visible,
  expanded,
  onToggle,
  messages,
  isThinking,
  selectedElement,
  onClearSelection,
  onSubmit,
}: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  // Drag setup. wrapperRef bounds the drag to the viewport; dragControls
  // lets us start drag programmatically from the bar's pointerdown (so
  // pointer-events-none on the outer wrapper still allows dragging via
  // an inner child). Position persists via localStorage.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Restore last-dragged position from localStorage on first mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POSITION_KEY)
      if (raw) {
        const pos = JSON.parse(raw)
        if (typeof pos?.x === 'number') x.set(pos.x)
        if (typeof pos?.y === 'number') y.set(pos.y)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus input on expand.
  useEffect(() => {
    if (!expanded) return
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [expanded])

  // Escape collapses (only when expanded).
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onToggle(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, onToggle])

  const submit = useCallback(
    (text: string, source: 'text' | 'voice' = 'text') => {
      const t = text.trim()
      if (!t || isThinking) return
      onSubmit({ text: t, source, sectionContext: selectedElement })
      setInput('')
    },
    [isThinking, onSubmit, selectedElement]
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  if (!visible) return null

  // Most-recent N messages, oldest first so they stack naturally above the bar.
  const recent = messages.slice(-VISIBLE_HISTORY)

  // Drag-end persist. Reads from motion values so we get the LIVE
  // post-drag position even if React state hasn't synced.
  const persistPosition = () => {
    try {
      localStorage.setItem(
        POSITION_KEY,
        JSON.stringify({ x: x.get(), y: y.get() })
      )
    } catch {}
  }

  // Decide whether a pointerdown on the bar should start a drag. Inputs,
  // buttons, and the chat textarea bubble up here too — we don't want
  // them to trigger drag (would block typing + clicks).
  const maybeStartDrag = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('input, textarea, button')) return
    dragControls.start(e)
  }

  return (
    // Outer wrapper covers the viewport; the motion child sits at its
    // flex-end (bottom-center) by default. Inset padding (left/right/top/
    // bottom) gives the dock room to grow when expanded without escaping
    // the wrapper. dragElastic 0.08 adds a tiny rubber-band feel at the
    // edges so dragging into a corner feels smooth instead of hard-stopping.
    <div
      ref={wrapperRef}
      className="fixed inset-x-2 inset-y-2 z-[100] pointer-events-none flex items-end justify-center"
    >
      <motion.div
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={wrapperRef}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
        whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
        onDragEnd={persistPosition}
        style={{ x, y }}
        className="flex flex-col items-center gap-2 mb-10 pointer-events-none touch-none"
      >
      {/* Floating message stack — sits above the bar. Each bubble is its
          own glass pill, max-width capped so long replies wrap. Animates
          from below (new messages slide up into place). */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="stack"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-stretch gap-1.5 w-[min(560px,calc(100vw-32px))] pointer-events-auto"
          >
            {/* Selected-element chip */}
            {selectedElement && (
              <div className="flex items-center gap-2 rounded-full bg-violet-500/15 backdrop-blur-2xl border border-violet-500/30 px-3 py-1.5 self-center">
                <Sparkles className="w-3 h-3 text-violet-300 shrink-0" />
                <span className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">
                  Editing &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </span>
                <span className="text-[11px] text-foreground/80 truncate max-w-[180px]">
                  {selectedElement.textSnippet || ''}
                </span>
                <button
                  onClick={onClearSelection}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Clear selection"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {recent.map((m, i) => {
                // With 2 visible the ramp lands at 0.4 (older) and 1.0
                // (newest) — older message is a ghost, newer is crisp.
                const ageStep = (recent.length - 1 - i) / Math.max(recent.length - 1, 1)
                const fade = 1 - ageStep * 0.6
                const globalIdx = messages.length - recent.length + i
                return (
                  <motion.div
                    key={globalIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: fade, y: 0 }}
                    // Fast exit — when a third arrives the oldest is
                    // gone in ~120ms so the canvas reclaims the space.
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'flex',
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap break-words backdrop-blur-2xl',
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-orange-500/95 to-amber-500/95 text-white rounded-br-md shadow-lg shadow-orange-500/20'
                          : 'bg-zinc-950/70 text-foreground border border-border rounded-bl-md'
                      )}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-bl-md bg-zinc-950/70 backdrop-blur-2xl border border-border px-3 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse [animation-delay:240ms]" />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The bar itself — same DOM node, same height, only width changes.
          Horizontal CSS transition on width + border-radius; no scale, no
          smoosh. Inner content shifts via display + opacity. Also the
          drag handle — pointerdown on bar chrome triggers parent drag,
          but bubbles up from input/buttons get filtered in maybeStartDrag. */}
      <div
        onClick={!expanded ? () => onToggle(true) : undefined}
        onPointerDown={maybeStartDrag}
        className={cn(
          'pointer-events-auto h-10 flex items-center select-none touch-none',
          'bg-white/[0.07] backdrop-blur-2xl border border-border',
          'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] overflow-hidden',
          'transition-[width,border-radius] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          expanded
            ? 'w-[min(560px,calc(100vw-32px))] rounded-full cursor-grab active:cursor-grabbing'
            : 'w-[112px] rounded-full cursor-pointer hover:bg-white/[0.12] hover:border-white/25 group'
        )}
        role={expanded ? 'dialog' : 'button'}
        aria-label={expanded ? 'Chef chat' : 'Open chef chat (⌘J)'}
      >
        {/* Chef icon — always visible, anchored left. */}
        <div className="pl-2 pr-1.5 shrink-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400/90 to-amber-500/90 flex items-center justify-center shadow-inner">
            {isThinking ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
            ) : (
              <ChefHat className="w-3.5 h-3.5 text-foreground" />
            )}
          </div>
        </div>

        {/* Collapsed-only label + shortcut hint */}
        {!expanded && (
          <>
            <span className="text-xs font-medium text-foreground/90 tracking-tight pr-3">
              Chat
            </span>
            <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[10px] text-foreground/50 font-mono pr-3 border-l border-border pl-2">
              <Command className="w-2.5 h-2.5" />J
            </span>
          </>
        )}

        {/* Expanded-only input + actions. Filled in only when expanded so
            the collapsed pill stays a small fixed size. */}
        {expanded && (
          <>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                selectedElement ? 'What should the chef do with this?' : 'What are we cooking?'
              }
              disabled={isThinking}
              className={cn(
                'flex-1 bg-transparent text-[13px] text-white placeholder:text-muted-foreground',
                'focus:outline-none disabled:opacity-60 min-w-0 px-1'
              )}
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || isThinking}
              className={cn(
                'mr-1 w-7 h-7 rounded-full flex items-center justify-center transition shrink-0',
                input.trim() && !isThinking
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:brightness-110'
                  : 'bg-muted text-muted-foreground'
              )}
              aria-label="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggle(false)}
              className="mr-1.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
              aria-label="Collapse chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      </motion.div>
    </div>
  )
}
