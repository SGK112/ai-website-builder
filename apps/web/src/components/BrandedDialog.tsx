'use client'

// BrandedDialog — one dialog surface that looks like Webstew.
//
// Every modal in the app was hand-rolled: its own backdrop, its own panel
// styling, its own icon-in-a-violet-square, and none of them used the
// useModalA11y hook that already exists — so no Escape, no focus trap, no
// focus restore. They also carried no brand at all. The signup nudge, the
// moment we ask someone to create an account, was a plain white card with a
// generic sparkle on it; nothing said whose product it was.
//
// This gives that moment an identity: a warm brand band (the stew palette —
// amber through violet), the real wordmark, and a consistent structure for
// title / body / actions / fine print. Built on the existing WebstewLogo and
// useModalA11y rather than around them.

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModalA11y } from '@/hooks/useModalA11y'
import { WebstewLogo } from '@/components/brand/WebstewLogo'

interface Props {
  open: boolean
  isDark: boolean
  /** Short label above the title — the reason we interrupted. */
  eyebrow?: string
  title: string
  children: React.ReactNode
  /** Rendered under the actions, small and quiet. */
  footnote?: React.ReactNode
  /** Emoji shown in the brand band. Defaults to the stew pot. */
  glyph?: string
  /** Dismissible dialogs get an X and close on backdrop click. */
  dismissible?: boolean
  onClose: () => void
  /** Buttons — supply your own so each dialog keeps its own verbs. */
  actions: React.ReactNode
  labelId?: string
}

export function BrandedDialog({
  open, isDark, eyebrow, title, children, footnote,
  glyph = '🍲', dismissible = true, onClose, actions,
  labelId = 'branded-dialog-title',
}: Props) {
  const panelRef = useModalA11y<HTMLDivElement>(open, () => { if (dismissible) onClose() })
  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => dismissible && onClose()}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative max-w-md w-full rounded-3xl border shadow-2xl overflow-hidden',
          isDark
            ? 'bg-zinc-950 border-white/10 shadow-black/60'
            : 'bg-white border-slate-200 shadow-slate-900/15',
        )}
      >
        {/* Brand band — the stew palette, and the mark that says whose this is */}
        <div
          className="relative px-6 pt-5 pb-4 overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(124,58,237,0.20) 100%)'
              : 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(124,58,237,0.13) 100%)',
          }}
        >
          {/* Warm glow behind the glyph — gives the band depth without an image */}
          <div
            aria-hidden="true"
            className="absolute -top-16 -left-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.30) 0%, transparent 70%)' }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <WebstewLogo size="sm" isDark={isDark} />
            {dismissible && (
              <button
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  'p-1.5 rounded-lg transition shrink-0',
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5',
                )}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative mt-4 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #7c3aed 100%)',
                boxShadow: '0 8px 20px -6px rgba(124,58,237,0.55)',
              }}
            >
              <span aria-hidden="true">{glyph}</span>
            </div>
            <div className="min-w-0">
              {eyebrow && (
                <div className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.14em] mb-0.5',
                  isDark ? 'text-amber-300/90' : 'text-amber-700',
                )}>
                  {eyebrow}
                </div>
              )}
              <h3
                id={labelId}
                className={cn(
                  'font-bold leading-tight text-[19px] tracking-[-0.02em]',
                  isDark ? 'text-white' : 'text-slate-900',
                )}
                style={{ fontFamily: 'var(--font-inter-tight), system-ui, sans-serif' }}
              >
                {title}
              </h3>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6">
          <div className={cn('text-sm leading-relaxed mb-5', isDark ? 'text-zinc-400' : 'text-slate-600')}>
            {children}
          </div>
          <div className="space-y-2">{actions}</div>
          {footnote && (
            <p className={cn('mt-5 text-[10px] leading-relaxed', isDark ? 'text-zinc-600' : 'text-slate-500')}>
              {footnote}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/** The filled primary action — one per dialog. */
export function DialogPrimary({
  children, onClick,
}: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold transition-transform hover:scale-[1.015] active:scale-[0.99]"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        boxShadow: '0 10px 24px -8px rgba(124,58,237,0.65)',
      }}
    >
      {children}
    </button>
  )
}

/** Bordered secondary action. */
export function DialogSecondary({
  children, onClick, isDark,
}: { children: React.ReactNode; onClick: () => void; isDark: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition',
        isDark
          ? 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.07]'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

/** Quiet tertiary action ("Maybe later"). */
export function DialogTertiary({
  children, onClick, isDark,
}: { children: React.ReactNode; onClick: () => void; isDark: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-2 rounded-xl text-xs font-medium transition',
        isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  )
}
