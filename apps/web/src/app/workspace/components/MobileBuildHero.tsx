'use client'

// Mobile blank-state hero — the first thing a phone visitor sees. Minimalist +
// branded: the Webstew wordmark, an on-brand "cook it up" hook, a soft animated
// gradient glow (the viral/shareable graphic), then the single composer with a
// mic-morphs-to-send button and tap-to-fill example prompts. Extracted from
// page.tsx so the 14k-line workspace page stays thin (OWL).

import { motion } from 'framer-motion'
import { Mic, Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WebstewLogo } from '@/components/brand/WebstewLogo'

const EXAMPLES = [
  'A coffee shop landing page',
  'A photographer portfolio',
  'A barber booking site',
]

interface Props {
  isDark: boolean
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onVoice: () => void
  isGenerating: boolean
}

export function MobileBuildHero({ isDark, value, onChange, onSubmit, onVoice, isGenerating }: Props) {
  const hasText = value.trim().length > 0
  return (
    <div className={cn('relative w-full h-full flex flex-col px-5 pb-4 pt-12 overflow-hidden', isDark ? 'bg-zinc-950' : 'bg-slate-50')}>
      {/* Viral graphic: a soft, slowly-breathing gradient glow behind the hero. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[130%] h-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(139,92,246,0.40), rgba(217,70,239,0.16), transparent)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Brand + hook */}
      <div className="relative shrink-0 flex flex-col items-center text-center pt-1 pb-6">
        <WebstewLogo size="lg" showTagline isDark={isDark} />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={cn('mt-5 text-[26px] font-extrabold leading-[1.1] tracking-tight', isDark ? 'text-white' : 'text-slate-900')}
          style={{ fontFamily: 'var(--font-inter-tight), system-ui, sans-serif' }}
        >
          What should we<br />
          <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">cook up today?</span>
        </motion.h1>
        <p className={cn('mt-2 text-[13px]', isDark ? 'text-zinc-400' : 'text-slate-500')}>
          Describe it or talk — your site builds itself.
        </p>
      </div>

      {/* Composer */}
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className={cn(
          'relative flex-1 flex flex-col rounded-3xl border overflow-hidden shadow-[0_0_50px_-16px_rgba(139,92,246,0.4)]',
          isDark ? 'bg-zinc-900/70 border-violet-500/20 backdrop-blur-sm' : 'bg-white border-slate-200'
        )}>
          <div className="h-[3px] shrink-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
            placeholder="Describe your website or app…"
            disabled={isGenerating}
            className={cn(
              'flex-1 w-full resize-none bg-transparent px-5 pt-5 text-[17px] leading-relaxed outline-none',
              isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
            )}
          />
          <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
            <span className={cn('inline-flex items-center gap-1 pl-1 text-[11px] font-medium', isDark ? 'text-zinc-600' : 'text-slate-400')}>
              <Sparkles className="w-3 h-3" /> Free to start
            </span>
            {hasText ? (
              <button
                onClick={onSubmit}
                disabled={isGenerating}
                aria-label="Send"
                className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 active:scale-95 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onVoice}
                aria-label="Talk to build"
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition active:scale-95',
                  isDark ? 'bg-white/[0.08] text-zinc-200 active:bg-white/15' : 'bg-slate-200 text-slate-600 active:bg-slate-300'
                )}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tap-to-fill example prompts — only while the composer is empty. */}
        {!hasText && !isGenerating && (
          <div className="shrink-0 flex flex-wrap justify-center gap-2 pt-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => onChange(ex)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[12px] font-medium border transition active:scale-95',
                  isDark ? 'bg-white/[0.04] border-white/10 text-zinc-300 active:bg-white/10' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-100'
                )}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
