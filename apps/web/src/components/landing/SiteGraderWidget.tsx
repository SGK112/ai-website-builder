'use client'

// Landing-page lead-gen widget. User types their existing site URL,
// we run the grader, show overall score + top issues inline (view-only,
// no signup), and the "Rebuild with Webstew" action gates through
// /signup before landing in the workspace. RemodelyAi pattern: report
// is free to view, ACTIONS require an account.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, AlertCircle, Award, Sparkles, ArrowRight, CheckCircle2, XCircle, Share2, Check, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface GraderResult {
  success: boolean
  url: string
  domain: string
  scores: {
    overall: number
    overall_grade: string
    ai_visibility: number
    ai_visibility_grade: string
    business_essentials: number
  }
  issues: string[]
  recommendations: string[]
  // Server-stamped quota state — UI shows "X of N free" / "X left today"
  quota?: {
    remaining: number
    limit: number
    scope: 'anon-lifetime' | 'daily'
    plan?: string
  }
}

interface Props {
  isDark: boolean
}

export function SiteGraderWidget({ isDark }: Props) {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GraderResult | null>(null)

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/tools/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      // Map HTTP status to a friendly message BEFORE trying to parse the body
      // — the body might not be JSON for some failure modes (CF block pages,
      // 502s, etc.) and bubbling "Unexpected token < in JSON" looks broken.
      if (res.status === 429) {
        // Hit the per-IP anon AI cap. Surface the retry hint from
        // Retry-After if present, otherwise a generic "give it a minute."
        const retry = res.headers.get('retry-after')
        const wait = retry ? Math.ceil(Number(retry) / 60) : null
        setError(
          wait && wait > 0
            ? `You've hit the free hourly limit. Sign up free for higher limits, or try again in ~${wait} min.`
            : "You've hit the free hourly limit. Sign up free for higher limits, or try again in a minute."
        )
        return
      }
      // 402 = anon cookie cap exhausted. 401/403 = bot/abuse guard blocked.
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || "You've used your 3 free grades. Sign up free for 3 a day.")
        return
      }
      if (res.status === 401 || res.status === 403) {
        setError(
          "Sign up free (no card) to continue grading sites."
        )
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.success === false) {
        // Generic upstream failure — keep it human, not "HTTP 500".
        setError(
          typeof data?.error === 'string' && data.error.length < 140
            ? data.error
            : "Couldn't analyze that site. The URL might be unreachable, or our scorer is busy — try again in a moment."
        )
        return
      }
      setResult(data)
    } catch (err: any) {
      // Network error or JSON parse blew up — both feel the same to the user.
      setError("Network hiccup — please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRebuildCta = () => {
    if (!result) return
    // Pre-fill the rebuild prompt. Gate via /signup for anon (they get the
    // free trial + credits AFTER signing up, then the prompt auto-fires in
    // workspace). Signed-in users skip the signup hop.
    const prompt = `Build a better version of ${result.domain} — clean modern design, fast load, mobile-friendly, real content sections.`
    const workspaceUrl = `/workspace?prompt=${encodeURIComponent(prompt)}`
    if (sessionStatus === 'authenticated') {
      router.push(workspaceUrl)
    } else {
      router.push(`/signup?next=${encodeURIComponent(workspaceUrl)}`)
    }
  }

  // Share button state — token returned by /api/grader/share + transient
  // "Copied!" affordance.
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (!result || !url.trim() || sharing) return
    // Sharing is signup-walled (intentional: it's a value-add of having an
    // account). Don't even hit the API for anon — send them straight to
    // signup with a next= that reopens the report when they return.
    if (sessionStatus !== 'authenticated') {
      const next = `/grader?url=${encodeURIComponent(url.trim())}`
      router.push(`/signup?next=${encodeURIComponent(next)}`)
      return
    }
    setSharing(true)
    try {
      let finalUrl = shareUrl
      // Mint a token the first time. After that, reuse the same URL for
      // this session so repeat-clicks don't create dupes.
      if (!finalUrl) {
        const res = await fetch('/api/grader/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), result }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.shareUrl) {
          setError(typeof data?.error === 'string' ? data.error : 'Could not generate a share link.')
          return
        }
        finalUrl = data.shareUrl
        setShareUrl(finalUrl)
      }
      // Native share on mobile, clipboard fallback elsewhere.
      const shareText = `${result.domain} scored ${result.scores.overall}/100 on Webstew — see the full report`
      const nav = typeof navigator !== 'undefined' ? (navigator as any) : null
      if (nav && typeof nav.share === 'function') {
        try {
          await nav.share({ title: 'Site grade · Webstew', text: shareText, url: finalUrl! })
        } catch {
          /* user cancelled the share sheet — silent */
        }
      } else if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(finalUrl!)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2200)
      }
    } catch {
      setError('Could not generate a share link.')
    } finally {
      setSharing(false)
    }
  }

  const gradeColor = (grade: string) => {
    if (grade === 'A') return 'text-emerald-500'
    if (grade === 'B') return 'text-lime-500'
    if (grade === 'C') return 'text-amber-500'
    if (grade === 'D') return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="px-6 py-24"
    >
      <div className="max-w-3xl mx-auto">
        <p className={cn(
          "text-center text-xs uppercase tracking-[0.25em] mb-3 font-semibold",
          isDark ? "text-emerald-300/80" : "text-emerald-600/80"
        )}>
          Free site audit
        </p>
        <h2 className={cn(
          "text-center text-3xl md:text-5xl font-bold tracking-tight mb-3",
          isDark ? "text-white" : "text-slate-900"
        )}>
          How does your current site stack up?
        </h2>
        <p className={cn(
          "text-center text-base md:text-lg mb-10 max-w-xl mx-auto",
          isDark ? "text-zinc-400" : "text-slate-600"
        )}>
          Drop your URL — we'll score SEO, AI-visibility, mobile, speed, and the rest in about 10 seconds. Free, no signup.
        </p>

        <form
          onSubmit={handleGrade}
          className={cn(
            "flex flex-col sm:flex-row gap-2 p-2 rounded-2xl border backdrop-blur-xl",
            isDark
              ? "bg-white/[0.03] border-white/10"
              : "bg-white border-slate-300"
          )}
        >
          <div className="flex items-center gap-2 flex-1 px-3">
            <Search className={cn("w-4 h-4 shrink-0", isDark ? "text-zinc-500" : "text-slate-400")} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourcurrentsite.com"
              disabled={loading}
              className={cn(
                "w-full bg-transparent py-3 text-base focus:outline-none disabled:opacity-50",
                isDark ? "text-white placeholder-zinc-500" : "text-slate-900 placeholder-slate-400"
              )}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Grading…
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                Grade my site
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "mt-6 rounded-2xl border backdrop-blur-xl overflow-hidden",
                isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200 shadow-xl shadow-slate-900/5"
              )}
            >
              {/* Score header */}
              <div className={cn(
                "p-6 border-b",
                isDark ? "border-white/10" : "border-slate-200"
              )}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className={cn("text-xs uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-slate-500")}>
                      Audited
                    </p>
                    <h3 className={cn("text-lg font-semibold break-all", isDark ? "text-white" : "text-slate-900")}>
                      {result.domain}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className={cn("text-6xl font-bold leading-none", gradeColor(result.scores.overall_grade))}>
                      {result.scores.overall_grade}
                    </span>
                    <span className={cn("text-2xl font-medium", isDark ? "text-zinc-400" : "text-slate-500")}>
                      {result.scores.overall}/100
                    </span>
                  </div>
                </div>

                {/* Sub-scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                  <div className={cn("p-3 rounded-xl", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-slate-500")}>
                      AI visibility
                    </p>
                    <p className={cn("text-2xl font-bold", gradeColor(result.scores.ai_visibility_grade))}>
                      {result.scores.ai_visibility}<span className={cn("text-sm font-normal", isDark ? "text-zinc-500" : "text-slate-500")}>/100</span>
                    </p>
                  </div>
                  <div className={cn("p-3 rounded-xl", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-slate-500")}>
                      Business essentials
                    </p>
                    <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {result.scores.business_essentials}<span className={cn("text-sm font-normal", isDark ? "text-zinc-500" : "text-slate-500")}>/100</span>
                    </p>
                  </div>
                  <div className={cn("p-3 rounded-xl col-span-2 sm:col-span-1", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-zinc-500" : "text-slate-500")}>
                      Issues found
                    </p>
                    <p className={cn("text-2xl font-bold", result.issues.length > 5 ? "text-red-500" : result.issues.length > 0 ? "text-amber-500" : "text-emerald-500")}>
                      {result.issues.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Issue-list teaser — anon sees only the FIRST two issues with
                  the rest blurred / locked. Full list + recommendations +
                  "Rebuild with Webstew" all gate behind signup. Early lead
                  capture: a real-feeling free trial unlock, not a paywall. */}
              {result.issues.length > 0 && (
                <div className={cn("p-6 border-b", isDark ? "border-white/10" : "border-slate-200")}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={cn("text-xs uppercase tracking-wider font-semibold", isDark ? "text-zinc-400" : "text-slate-600")}>
                      Issues we found
                    </p>
                    {sessionStatus !== 'authenticated' && (
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full",
                        isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700"
                      )}>
                        Preview · {Math.min(2, result.issues.length)} of {result.issues.length}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {result.issues
                      .slice(0, sessionStatus === 'authenticated' ? result.issues.length : 2)
                      .map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500/70" />
                        <span className={cn(isDark ? "text-zinc-300" : "text-slate-700")}>{issue}</span>
                      </li>
                    ))}
                  </ul>
                  {sessionStatus !== 'authenticated' && result.issues.length > 2 && (
                    <div className={cn(
                      "mt-4 p-3 rounded-xl border-2 border-dashed flex items-center justify-between gap-3",
                      isDark ? "border-violet-500/30 bg-violet-500/5" : "border-violet-300 bg-violet-50/50"
                    )}>
                      <p className={cn("text-sm", isDark ? "text-zinc-300" : "text-slate-700")}>
                        <span className="font-semibold">{result.issues.length - 2} more issues</span> + {result.recommendations.length} actionable recommendations
                      </p>
                      <button
                        onClick={handleRebuildCta}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
                      >
                        Unlock — sign up free
                      </button>
                    </div>
                  )}
                  {sessionStatus === 'authenticated' && result.recommendations.length > 0 && (
                    <div className="mt-5">
                      <p className={cn("text-xs uppercase tracking-wider mb-2 font-semibold", isDark ? "text-zinc-400" : "text-slate-600")}>
                        Recommendations
                      </p>
                      <ul className="space-y-2">
                        {result.recommendations.slice(0, 8).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500/70" />
                            <span className={cn(isDark ? "text-zinc-300" : "text-slate-700")}>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action CTA — always gated for anon, signed-in users skip
                  the signup hop and land in workspace with the rebuild
                  prompt pre-fired. */}
              <div className={cn(
                "p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                isDark ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10" : "bg-gradient-to-r from-violet-50 to-fuchsia-50"
              )}>
                <div className="flex-1">
                  <p className={cn("font-semibold text-base", isDark ? "text-white" : "text-slate-900")}>
                    {sessionStatus === 'authenticated' ? 'Ready to rebuild?' : 'Rebuild it better with Webstew'}
                  </p>
                  <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-slate-600")}>
                    {sessionStatus === 'authenticated'
                      ? `We'll generate a fresh, AI-visible, mobile-fast version of ${result.domain} in 60 seconds.`
                      : `Sign up free to unlock the full report and let Webstew generate a fresh, AI-visible version of ${result.domain}. 100 credits/month, no card.`}
                  </p>
                </div>
                <button
                  onClick={handleRebuildCta}
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold transition shadow-lg shadow-violet-500/30"
                >
                  <Sparkles className="w-4 h-4" />
                  {sessionStatus === 'authenticated' ? 'Rebuild now' : 'Sign up & rebuild'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Share — anon goes to /signup, authed mints a permalink
                  and uses native-share on mobile, clipboard on desktop. */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition",
                    isDark
                      ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  )}
                  title={sessionStatus === 'authenticated' ? undefined : 'Sign up free to share reports'}
                >
                  {sharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : shareCopied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  {sharing
                    ? 'Generating link…'
                    : shareCopied
                      ? 'Link copied!'
                      : sessionStatus === 'authenticated'
                        ? 'Share report'
                        : 'Sign up to share'}
                </button>
                {shareUrl && !shareCopied && (
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs",
                      isDark ? "text-zinc-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <Link2 className="w-3 h-3" /> Open shareable page
                  </a>
                )}
              </div>

              {/* Quota indicator — server stamps the response with usage
                  state so the user always knows where they stand. */}
              {result.quota && (
                <p className={cn(
                  "mt-3 text-xs",
                  isDark ? "text-zinc-500" : "text-slate-500"
                )}>
                  {result.quota.scope === 'daily'
                    ? (result.quota.limit < 0
                        ? `Unlimited grades on your ${result.quota.plan || 'enterprise'} plan.`
                        : `${result.quota.remaining} of ${result.quota.limit} grades left today.`)
                    : result.quota.remaining > 0
                      ? `${result.quota.remaining} of ${result.quota.limit} free grades left on this browser. Sign up free for 3/day.`
                      : `Last free grade used on this browser. Sign up free for 3/day.`}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust line below the form */}
        {!result && !loading && (
          <div className={cn(
            "flex items-center justify-center gap-4 mt-5 text-xs",
            isDark ? "text-zinc-500" : "text-slate-500"
          )}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              No signup
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              No credit card
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Results in ~10 seconds
            </div>
          </div>
        )}
      </div>
    </motion.section>
  )
}
