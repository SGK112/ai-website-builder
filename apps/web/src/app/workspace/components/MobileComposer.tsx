'use client'

// Mobile composer — one minimal floating pill at the bottom of the canvas.
// Text or voice flow the same: the action button is a mic when empty, a send
// when there's text. No hero, no chips, no logo — just the way in. Stays out of
// the way so the building canvas behind it is the focus.

import { Mic, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isDark: boolean
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onVoice: () => void
  isGenerating: boolean
}

export function MobileComposer({ isDark, value, onChange, onSubmit, onVoice, isGenerating }: Props) {
  const hasText = value.trim().length > 0
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-3 pt-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent">
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-1.5 rounded-full border pl-4 pr-1.5 py-1.5 shadow-xl backdrop-blur-xl',
          isDark ? 'bg-zinc-900/80 border-white/10' : 'bg-white/90 border-slate-200'
        )}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
          placeholder="Describe it, or tap to talk…"
          disabled={isGenerating}
          enterKeyHint="send"
          className={cn(
            'flex-1 min-w-0 bg-transparent py-2 text-[15px] outline-none',
            isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
          )}
        />
        <button
          onClick={hasText ? onSubmit : onVoice}
          disabled={isGenerating}
          aria-label={hasText ? 'Send' : 'Talk'}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 active:scale-95 transition disabled:opacity-60"
        >
          {hasText ? <ArrowUp className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
