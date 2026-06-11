'use client'

// Landing-page lead-gen surface for the upcoming voice-driven builder.
// "Talk to Webstew" — collects email for the waitlist. Same pattern as
// the site grader: free taste of the future feature, email capture
// drops them into the funnel when we ship.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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
      <div className="max-w-xl mx-auto text-center">
        <p className={cn(
          "text-xs uppercase tracking-[0.25em] mb-3 font-semibold",
          isDark ? "text-violet-300/80" : "text-violet-600/80"
        )}>
          Voice · Coming soon
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Soon, just <span className={isDark ? "text-violet-300" : "text-violet-600"}>say it</span>.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mb-7 max-w-md mx-auto">
          Talk to the builder like a person. <span className="text-foreground">&ldquo;Add a contact form.&rdquo;</span> Done.
        </p>

        {/* A quiet waveform — the one bit of motion, restrained. */}
        <div className="flex items-center justify-center gap-[3px] mb-8" aria-hidden>
          {[0.4, 0.7, 0.3, 0.85, 0.5, 0.65, 0.35, 0.8, 0.45, 0.6, 0.4, 0.75].map((h, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.35, h, 0.35] }}
              transition={{ duration: 1.5 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
              className={cn("w-0.5 origin-center rounded-full", isDark ? "bg-violet-400/45" : "bg-violet-500/45")}
              style={{ height: '22px' }}
            />
          ))}
        </div>

        {status === 'success' ? (
          <div className={cn(
            "inline-flex items-center gap-2 px-5 py-3 rounded-full border max-w-md mx-auto",
            isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-700"
          )}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">You&rsquo;re on the list — we&rsquo;ll email you when voice goes live.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 rounded-full border pl-5 pr-2 py-2 max-w-md mx-auto transition-all",
              isDark ? "bg-white/[0.04] border-white/10 focus-within:border-violet-500/50" : "bg-white border-slate-200 shadow-sm focus-within:border-violet-400"
            )}
          >
            <Mic className={cn("w-4 h-4 shrink-0", isDark ? "text-violet-300" : "text-violet-500")} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              disabled={status === 'submitting'}
              className={cn(
                "flex-1 bg-transparent text-sm sm:text-base focus:outline-none min-w-0 disabled:opacity-50",
                isDark ? "text-white placeholder-zinc-500" : "text-slate-900 placeholder-slate-400"
              )}
            />
            <button
              type="submit"
              disabled={status === 'submitting' || !email.trim()}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                email.trim()
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : isDark ? "bg-white/10 text-zinc-500" : "bg-slate-100 text-slate-400"
              )}
            >
              {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get early access'}
            </button>
          </form>
        )}

        {error && status === 'error' && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <p className={cn("text-xs mt-4", isDark ? "text-zinc-500" : "text-slate-500")}>
          Powered by Aria — Webstew&rsquo;s voice agent.
        </p>
      </div>
    </motion.section>
  )
}
