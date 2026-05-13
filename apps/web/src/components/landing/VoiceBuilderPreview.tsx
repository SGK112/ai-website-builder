'use client'

// Landing-page lead-gen surface for the upcoming voice-driven builder.
// "Talk to Webstew" — collects email for the waitlist. Same pattern as
// the site grader: free taste of the future feature, email capture
// drops them into the funnel when we ship.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Sparkles, Loader2, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isDark: boolean
}

export function VoiceBuilderPreview({ isDark }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setStatus('submitting')
    setError(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          feature: 'voice-builder',
          source: 'landing',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to join waitlist')
      }
      setStatus('success')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="px-6 py-24"
    >
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          "relative rounded-3xl overflow-hidden p-8 md:p-14 border",
          isDark
            ? "bg-gradient-to-br from-violet-900/40 via-zinc-950 to-fuchsia-900/30 border-violet-500/20"
            : "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 border-violet-200"
        )}>
          {/* Decorative pulsing mic — visual cue without a real animation
              dependency. Pure CSS scale + opacity pulse. */}
          <div className="absolute -top-12 -right-12 pointer-events-none">
            <div className={cn(
              "w-64 h-64 rounded-full blur-3xl",
              isDark ? "bg-violet-500/20" : "bg-violet-400/30"
            )} />
          </div>
          <div className="absolute -bottom-16 -left-16 pointer-events-none">
            <div className={cn(
              "w-72 h-72 rounded-full blur-3xl",
              isDark ? "bg-fuchsia-500/20" : "bg-fuchsia-400/25"
            )} />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold",
                isDark ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30" : "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
              )}>
                <Sparkles className="w-3 h-3" />
                Coming soon · Early access
              </span>
            </div>

            <h2 className={cn(
              "text-3xl md:text-5xl font-bold tracking-tight mb-3 max-w-2xl",
              isDark ? "text-white" : "text-slate-900"
            )}>
              Talk to Webstew. <span className={cn(
                "italic",
                isDark ? "text-violet-300" : "text-violet-600"
              )}>Build with your voice.</span>
            </h2>
            <p className={cn(
              "text-base md:text-lg mb-8 max-w-xl leading-relaxed",
              isDark ? "text-zinc-400" : "text-slate-600"
            )}>
              Real-time conversation with the builder. Say <span className="italic">"add a contact form,"</span> watch it appear. <span className="italic">"Make the hero bigger,"</span> done. Powered by our voice agent and the same realtime pipeline that handles thousands of phone calls a day.
            </p>

            {/* Animated mic visual */}
            <div className="flex items-center gap-4 mb-10">
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl",
                  isDark
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/40"
                    : "bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-violet-500/30"
                )}>
                  <Mic className="w-7 h-7 text-white" />
                </div>
                {/* Pulse ring */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl animate-ping",
                  isDark ? "bg-violet-500/30" : "bg-violet-400/40"
                )} style={{ animationDuration: '2.5s' }} />
              </div>
              <div className="flex-1 flex items-center gap-1">
                {/* Pseudo waveform — varied heights, animated via stagger */}
                {[0.5, 0.8, 0.4, 0.95, 0.6, 0.7, 0.35, 0.85, 0.55, 0.9, 0.45, 0.75, 0.6, 0.5].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0.2 }}
                    animate={{ scaleY: [0.3, h, 0.3] }}
                    transition={{
                      duration: 1.2 + (i % 4) * 0.15,
                      repeat: Infinity,
                      delay: i * 0.07,
                      ease: 'easeInOut',
                    }}
                    className={cn(
                      "w-1 origin-center rounded-full",
                      isDark
                        ? "bg-gradient-to-b from-violet-400 to-fuchsia-400"
                        : "bg-gradient-to-b from-violet-500 to-fuchsia-500"
                    )}
                    style={{ height: `${h * 56}px` }}
                  />
                ))}
              </div>
              <Volume2 className={cn(
                "w-6 h-6",
                isDark ? "text-violet-300/60" : "text-violet-600/60"
              )} />
            </div>

            {/* Waitlist form OR success state */}
            {status === 'success' ? (
              <div className={cn(
                "p-5 rounded-2xl border flex items-center gap-3",
                isDark
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-emerald-50 border-emerald-300"
              )}>
                <CheckCircle2 className={cn("w-6 h-6 shrink-0", isDark ? "text-emerald-400" : "text-emerald-600")} />
                <div>
                  <p className={cn("font-semibold text-base", isDark ? "text-white" : "text-slate-900")}>
                    You're on the list.
                  </p>
                  <p className={cn("text-sm mt-0.5", isDark ? "text-emerald-200/80" : "text-emerald-700/90")}>
                    We'll email you the moment voice building goes live.
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className={cn(
                  "flex flex-col sm:flex-row gap-2 p-2 rounded-2xl border backdrop-blur-xl max-w-2xl",
                  isDark
                    ? "bg-white/[0.03] border-white/15"
                    : "bg-white/90 border-violet-200"
                )}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourdomain.com"
                  required
                  disabled={status === 'submitting'}
                  className={cn(
                    "flex-1 bg-transparent px-4 py-3 text-base focus:outline-none disabled:opacity-50",
                    isDark ? "text-white placeholder-zinc-500" : "text-slate-900 placeholder-slate-400"
                  )}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting' || !email.trim()}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold transition shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Get early access
                    </>
                  )}
                </button>
              </form>
            )}

            {error && status === 'error' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <p className={cn(
              "text-xs mt-4",
              isDark ? "text-zinc-500" : "text-slate-500"
            )}>
              Powered by Aria — Webstew's voice agent. We'll only email you about voice access.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
