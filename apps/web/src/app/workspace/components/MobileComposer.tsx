'use client'

// Mobile composer — one minimal floating pill at the bottom of the canvas.
// Text or voice flow the same: the action button is a mic when empty, a send
// when there's text. No hero, no chips, no logo — just the way in. Stays out of
// the way so the building canvas behind it is the focus.

import { Mic, ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isDark: boolean
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  // Toggle voice: start listening / stop+transcribe. STT happens in the
  // background — the transcript just lands in the chat as your message.
  onVoice: () => void
  isListening?: boolean
  isGenerating: boolean
}

export function MobileComposer({ isDark, value, onChange, onSubmit, onVoice, isListening, isGenerating }: Props) {
  const hasText = value.trim().length > 0
  const showSend = hasText && !isListening
  const onTap = isListening ? onVoice : showSend ? onSubmit : onVoice
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-3 pt-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent">
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-1.5 rounded-full border pl-4 pr-1.5 py-1.5 shadow-xl backdrop-blur-xl transition',
          isListening
            ? 'border-rose-400/40 ' + (isDark ? 'bg-zinc-900/85' : 'bg-white/95')
            : isDark ? 'bg-zinc-900/80 border-white/10' : 'bg-white/90 border-slate-200'
        )}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
          placeholder={isListening ? 'Listening…' : 'Describe it, or tap to talk…'}
          disabled={isGenerating || isListening}
          enterKeyHint="send"
          className={cn(
            'flex-1 min-w-0 bg-transparent py-2 text-[15px] outline-none',
            isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
          )}
        />
        <button
          onClick={onTap}
          disabled={isGenerating}
          aria-label={isListening ? 'Stop & send' : showSend ? 'Send' : 'Talk'}
          className={cn(
            'w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition disabled:opacity-60',
            isListening
              ? 'bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-rose-500/40 animate-pulse'
              : 'bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-violet-600/30'
          )}
        >
          {isListening ? <Square className="w-4 h-4 fill-current" /> : showSend ? <ArrowUp className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
