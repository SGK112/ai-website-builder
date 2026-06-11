'use client'

// LivePreviewPlayer — the landing showcase, reimagined as a self-contained
// auto-playing "commercial" that lives in NORMAL page flow. No scroll-jacking
// pin, no scroll-driven device morph — the old 340vh takeover broke the
// instant a visitor got scroll-happy (the iframe morphed mid-load, images
// popped, the deck got out of order). This plays itself like a product reel:
//
//   type/show the prompt + what's being built  →  reveal the finished live
//   site  →  hold  →  next.  In order, at a readable pace.
//
// Robustness by design:
//  • The iframe is pointer-events-none, so wheel/touch scroll passes straight
//    through to the page — a visitor can scroll past at any time and nothing
//    traps or breaks. It's a demonstration, not an interactive frame.
//  • The build overlay covers the iframe while the NEW demo loads, so a
//    half-painted site / loading images are never shown — we only reveal when
//    it's ready. That kills the "images break / renders before the text" bug.
//  • Plays only while on screen (IntersectionObserver); pauses on hover, a
//    hidden tab, and prefers-reduced-motion.

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { DEMO_SITES } from '@/lib/demo-sites'
import { cn } from '@/lib/utils'

const GEN_MS = 2800 // building beat — long enough to read the description
const HOLD_MS = 5200 // dwell on the finished, live site

export function LivePreviewPlayer({ isDark }: { isDark: boolean }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'building' | 'live'>('building')
  const [stepIdx, setStepIdx] = useState(0)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const demo = DEMO_SITES[idx]

  // Play only while on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // The deck. Re-runs per demo (idx in deps): build → reveal → hold → advance.
  // Advancing idx re-triggers this effect for the next slide.
  useEffect(() => {
    if (!inView || paused) return
    if (reduced) { setPhase('live'); return }
    let cancelled = false
    let t: ReturnType<typeof setTimeout>
    setPhase('building')
    setStepIdx(0)
    t = setTimeout(() => {
      if (cancelled) return
      setPhase('live')
      t = setTimeout(() => {
        if (cancelled) return
        setIdx((i) => (i + 1) % DEMO_SITES.length)
      }, HOLD_MS)
    }, GEN_MS)
    return () => { cancelled = true; clearTimeout(t) }
  }, [inView, paused, idx, reduced])

  // Cycle the build steps while "building".
  useEffect(() => {
    if (phase !== 'building' || reduced) return
    const t = setInterval(() => setStepIdx((s) => (s + 1) % demo.steps.length), 720)
    return () => clearInterval(t)
  }, [phase, idx, demo.steps.length, reduced])

  const go = useCallback((d: number) => {
    setIdx((i) => (i + d + DEMO_SITES.length) % DEMO_SITES.length)
  }, [])

  return (
    <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-24">
      {/* Header — static + descriptive, so the showcase explains itself. */}
      <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
        <p className={cn(
          'text-[11px] sm:text-xs uppercase tracking-[0.28em] font-semibold mb-3',
          isDark ? 'text-violet-300/80' : 'text-violet-600/80'
        )}>
          Made with Webstew
        </p>
        <h2 className={cn(
          'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Real sites, built from a sentence.
        </h2>
        <p className={cn('mt-3 text-sm sm:text-base', isDark ? 'text-slate-400' : 'text-slate-500')}>
          Each one below started as one line of text. Watch them go from prompt to live.
        </p>
      </div>

      {/* The player */}
      <div
        ref={rootRef}
        className="max-w-5xl mx-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Halo */}
        <div className="relative">
          <div aria-hidden className={cn(
            'absolute -inset-6 sm:-inset-10 rounded-[2rem] blur-[80px] -z-10 opacity-70',
            isDark
              ? 'bg-gradient-to-br from-violet-600/25 via-fuchsia-500/20 to-amber-400/15'
              : 'bg-gradient-to-br from-violet-400/25 via-pink-300/20 to-amber-300/15'
          )} />

          {/* Browser window */}
          <div className={cn(
            'relative rounded-2xl overflow-hidden border shadow-2xl',
            isDark ? 'bg-slate-950 border-slate-800 shadow-black/50' : 'bg-white border-slate-200 shadow-slate-400/30'
          )}>
            {/* Chrome bar — traffic lights · "Built from: <prompt>" · Live */}
            <div className={cn(
              'h-10 flex items-center px-3 gap-3 border-b',
              isDark ? 'bg-slate-900/90 border-white/10' : 'bg-slate-50 border-slate-200'
            )}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-red-400/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
              </div>
              <div className={cn(
                'flex-1 max-w-lg mx-auto h-6 rounded-md flex items-center justify-center gap-1.5 text-[11px] truncate px-3',
                isDark ? 'bg-white/10 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'
              )}>
                <Sparkles className={cn('w-3 h-3 shrink-0', isDark ? 'text-violet-300' : 'text-violet-500')} />
                <span className="opacity-60 shrink-0">Built from:</span>
                <span className={cn('truncate italic', isDark ? 'text-slate-200' : 'text-slate-700')}>
                  &ldquo;{demo.prompt}&rdquo;
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  {phase === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', phase === 'live' ? 'bg-emerald-500' : 'bg-slate-500')} />
                </span>
                <span className={cn(
                  'text-[9px] uppercase tracking-[0.18em] font-bold',
                  phase === 'live' ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : (isDark ? 'text-slate-500' : 'text-slate-400')
                )}>
                  {phase === 'live' ? 'Live' : 'Building'}
                </span>
              </div>
            </div>

            {/* Stage */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-white dark:bg-slate-950">
              {/* The site. pointer-events-none → scroll passes through to the
                  page; key remounts srcDoc per demo so it loads fresh under
                  the overlay. */}
              <iframe
                key={idx}
                srcDoc={demo.html}
                title={`Demo: ${demo.label}`}
                sandbox="allow-scripts"
                loading="lazy"
                scrolling="no"
                className="absolute inset-0 w-full h-full border-0 pointer-events-none select-none"
              />

              {/* Build overlay — covers the iframe while it loads, then fades
                  to reveal a fully-painted site. */}
              <AnimatePresence>
                {phase === 'building' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      'absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 backdrop-blur-xl',
                      isDark ? 'bg-slate-950/92' : 'bg-white/92'
                    )}
                  >
                    {/* Prompt */}
                    <div className={cn(
                      'inline-flex items-center gap-2 mb-4 px-4 py-2.5 rounded-2xl border shadow-lg max-w-[90%]',
                      isDark ? 'bg-white/[0.06] border-white/[0.12] text-slate-100' : 'bg-white border-slate-200 text-slate-700'
                    )}>
                      <Sparkles className={cn('w-4 h-4 shrink-0', isDark ? 'text-violet-300' : 'text-violet-500')} />
                      <span className="text-sm sm:text-base font-semibold italic truncate">
                        &ldquo;{demo.prompt}&rdquo;
                      </span>
                    </div>

                    {/* Richer description — what's actually being built */}
                    <p className={cn('max-w-md text-sm sm:text-[15px] leading-relaxed mb-5', isDark ? 'text-slate-300' : 'text-slate-600')}>
                      {demo.description}
                    </p>

                    {/* Cycling build step */}
                    <div className="flex items-center gap-2.5 mb-2 h-5">
                      <span className="flex gap-1">
                        {[0, 0.15, 0.3].map((d, i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                          />
                        ))}
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={stepIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className={cn('text-sm font-medium', isDark ? 'text-violet-200' : 'text-violet-600')}
                        >
                          {demo.steps[stepIdx % demo.steps.length]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className={cn('text-xs font-mono', isDark ? 'text-slate-500' : 'text-slate-400')}>
                      Building with Claude…
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reveal flash — a soft sweep the moment the site goes live. */}
              <AnimatePresence>
                {phase === 'live' && (
                  <motion.div
                    initial={{ opacity: 0.5, x: '-100%' }}
                    animate={{ opacity: 0, x: '100%' }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    aria-hidden
                    className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Controls — dots (one per demo) + prev/next + play/pause. Manual,
            optional; the deck auto-advances on its own. */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => go(-1)}
            aria-label="Previous example"
            className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {DEMO_SITES.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setIdx(i)}
                aria-label={`Show ${d.label}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === idx
                    ? 'w-7 bg-gradient-to-r from-violet-500 to-fuchsia-500'
                    : isDark ? 'w-2 bg-white/20 hover:bg-white/40' : 'w-2 bg-slate-300 hover:bg-slate-400'
                )}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            aria-label="Next example"
            className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play' : 'Pause'}
            className={cn('ml-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100')}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Current example label */}
        <p className={cn('text-center mt-3 text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
          {demo.label} · {idx + 1} of {DEMO_SITES.length}
        </p>
      </div>
    </section>
  )
}

export default LivePreviewPlayer
