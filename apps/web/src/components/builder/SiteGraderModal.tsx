'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, Award, CheckCircle2, ChevronRight, Loader2,
  Lightbulb, RefreshCw, RotateCcw, TrendingUp, Wand2, X,
} from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

interface GraderResult {
  success?: boolean
  scores: {
    overall: number
    overall_grade: string
    ai_visibility: number
    ai_visibility_grade?: string
    business_essentials?: number
    seo: { meta_tags: number; headings: number; structured_data: number }
    technical: { https: number; mobile: number; speed: number; images: number }
    presence: { social: number; contact: number; content: number }
  }
  issues: string[]
  recommendations: string[]
  details?: any
  error?: string
}

interface Props {
  open: boolean
  onClose: () => void
  html: string
  deployedUrl?: string | null
  isDark?: boolean
  // Returns a Promise that resolves when the agent finishes the fix pass.
  onAutoFix?: (issues: string[], recommendations: string[]) => Promise<void> | void
}

const MAX_ROUNDS = 3

export function SiteGraderModal({ open, onClose, html, deployedUrl, isDark = true, onAutoFix }: Props) {
  const [mode, setMode] = useState<'draft' | 'deployed'>('draft')
  const [result, setResult] = useState<GraderResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fix loop display state
  const [loopPhase, setLoopPhase] = useState<'idle' | 'agent' | 'grading' | 'done'>('idle')
  const [loopRound, setLoopRound] = useState(0)
  const [loopStartScore, setLoopStartScore] = useState(0)
  const loopActiveRef = useRef(false)

  async function run(): Promise<GraderResult | null> {
    setLoading(true); setError(null); setResult(null)
    try {
      const body: any = mode === 'deployed' && deployedUrl
        ? { url: deployedUrl }
        : { html, contextUrl: deployedUrl || 'https://draft.local' }
      const res = await fetch('/api/tools/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResult(data)
      return data as GraderResult
    } catch (e: any) {
      setError(e?.message || 'Grade failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function startFixLoop(initialResult: GraderResult) {
    if (!onAutoFix || mode !== 'draft') return
    loopActiveRef.current = true
    const startScore = initialResult.scores.overall

    setLoopStartScore(startScore)
    setLoopPhase('agent')
    setLoopRound(1)

    let current = initialResult
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      if (!loopActiveRef.current || !current.issues?.length) break

      setLoopRound(round)
      setLoopPhase('agent')

      await onAutoFix(current.issues, current.recommendations ?? [])

      if (!loopActiveRef.current) break

      setLoopPhase('grading')
      const next = await run()
      if (!next || !loopActiveRef.current) break

      const improved = next.scores.overall > current.scores.overall
      current = next

      if (!improved || !current.issues?.length || round === MAX_ROUNDS) break

      // Brief pause so the user can see the new score before the next round
      await new Promise(r => setTimeout(r, 1200))
    }

    loopActiveRef.current = false
    setLoopPhase('done')
  }

  // Auto-run on open; reset loop when mode changes
  useEffect(() => {
    if (open && !result && !loading) void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  // Cancel loop if modal closes mid-run
  useEffect(() => {
    if (!open) loopActiveRef.current = false
  }, [open])

  const panelRef = useModalA11y<HTMLDivElement>(open, onClose)

  if (!open) return null

  const loopInProgress = loopPhase === 'agent' || loopPhase === 'grading'
  const scoreGain = (loopPhase === 'done' || loopInProgress) && result
    ? result.scores.overall - loopStartScore
    : null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-grader-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${
          isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Award className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} />
            <div id="site-grader-title" className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Site grader</div>
            {loopInProgress && (
              <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                <Loader2 className="w-3 h-3 animate-spin" />
                Round {loopRound}/{MAX_ROUNDS} — {loopPhase === 'agent' ? 'agent fixing…' : 're-grading…'}
              </div>
            )}
            {loopPhase === 'done' && scoreGain !== null && (
              <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                scoreGain > 0
                  ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                  : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-500')
              }`}>
                <TrendingUp className="w-3 h-3" />
                {scoreGain > 0 ? `+${scoreGain} pts` : 'No gain'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deployedUrl && !loopInProgress && (
              <div className={`flex rounded-lg p-0.5 border text-[11px] ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'}`}>
                {(['draft', 'deployed'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setResult(null); setLoopPhase('idle') }}
                    className={`px-2 py-1 rounded-md transition ${
                      mode === m
                        ? (isDark ? 'bg-violet-500/20 text-violet-200' : 'bg-violet-100 text-violet-700')
                        : (isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                    }`}
                  >
                    {m === 'draft' ? 'Draft' : 'Live'}
                  </button>
                ))}
              </div>
            )}
            {!loopInProgress && (
              <button
                onClick={() => { setLoopPhase('idle'); void run() }}
                disabled={loading}
                className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="Re-grade"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            )}
            {loopInProgress && (
              <button
                onClick={() => { loopActiveRef.current = false; setLoopPhase('idle') }}
                className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="Stop loop"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {loopPhase === 'grading'
                  ? `Re-grading after round ${loopRound} fixes…`
                  : `Analysing ${mode === 'deployed' ? 'live site' : 'draft HTML'}…`}
              </div>
            </div>
          )}

          {/* Agent-running placeholder */}
          {!loading && loopPhase === 'agent' && (
            <div className="py-10 flex flex-col items-center justify-center gap-3">
              <Wand2 className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              <div className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                Agent is applying fixes — round {loopRound} of {MAX_ROUNDS}
              </div>
              <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Will re-grade automatically when done
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      i < loopRound
                        ? (isDark ? 'bg-violet-500' : 'bg-violet-600')
                        : (isDark ? 'bg-white/10' : 'bg-slate-200')
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700'}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium">Couldn't grade</div>
                <div className="text-xs opacity-80">{error}</div>
              </div>
            </div>
          )}

          {result && !loading && loopPhase !== 'agent' && (
            <>
              <OverallScore result={result} isDark={isDark} scoreGain={loopPhase === 'done' ? scoreGain : null} />
              <BucketRow label="SEO" items={[
                ['Meta tags', result.scores.seo.meta_tags],
                ['Headings', result.scores.seo.headings],
                ['Schema.org', result.scores.seo.structured_data],
              ]} isDark={isDark} />
              <BucketRow label="Technical" items={[
                ['HTTPS', result.scores.technical.https],
                ['Mobile', result.scores.technical.mobile],
                ['Speed', result.scores.technical.speed],
                ['Images', result.scores.technical.images],
              ]} isDark={isDark} />
              <BucketRow label="Presence" items={[
                ['Social', result.scores.presence.social],
                ['Contact', result.scores.presence.contact],
                ['Content', result.scores.presence.content],
              ]} isDark={isDark} />

              {result.issues?.length > 0 && (
                <Section title="Issues" icon={AlertTriangle} color="amber" items={result.issues} isDark={isDark} />
              )}
              {result.recommendations?.length > 0 && (
                <Section title="Recommendations" icon={Lightbulb} color="violet" items={result.recommendations} isDark={isDark} />
              )}

              {loopPhase === 'done' && scoreGain !== null && scoreGain > 0 && !result.issues?.length && (
                <div className={`p-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-sm">All actionable issues resolved. Score improved by {scoreGain} pts.</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {result && !loading && onAutoFix && mode === 'draft' && loopPhase === 'idle' && (result.issues?.length > 0 || result.recommendations?.length > 0) && (
          <div className={`px-5 py-3 border-t flex items-center justify-between gap-3 ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Agent fixes issues then re-grades, up to {MAX_ROUNDS}× — stops when score plateaus.
            </div>
            <button
              onClick={() => result && void startFixLoop(result)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Fix &amp; iterate
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
          </div>
        )}

        {result && !loading && loopPhase === 'done' && (result.issues?.length > 0) && (
          <div className={`px-5 py-3 border-t flex items-center justify-between gap-3 ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {MAX_ROUNDS} rounds complete — remaining issues may need new content from you.
            </div>
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function scoreColor(n: number, isDark: boolean) {
  if (n >= 90) return isDark ? 'text-emerald-300' : 'text-emerald-700'
  if (n >= 75) return isDark ? 'text-violet-300' : 'text-violet-700'
  if (n >= 60) return isDark ? 'text-amber-300' : 'text-amber-700'
  return isDark ? 'text-red-300' : 'text-red-700'
}

function OverallScore({ result, isDark, scoreGain }: { result: GraderResult; isDark: boolean; scoreGain: number | null }) {
  const overall = result.scores.overall
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-end gap-1.5">
        <div className={`text-5xl font-bold tabular-nums ${scoreColor(overall, isDark)}`}>{overall}</div>
        {scoreGain !== null && scoreGain !== 0 && (
          <div className={`text-base font-semibold mb-1 tabular-nums ${
            scoreGain > 0
              ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
              : (isDark ? 'text-red-400' : 'text-red-600')
          }`}>
            {scoreGain > 0 ? `+${scoreGain}` : scoreGain}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className={`text-2xl font-bold ${scoreColor(overall, isDark)}`}>Grade {result.scores.overall_grade}</div>
        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          {result.issues?.length || 0} issues · {result.recommendations?.length || 0} recommendations · AI-visibility {result.scores.ai_visibility}/100
        </div>
      </div>
    </div>
  )
}

function BucketRow({ label, items, isDark }: { label: string; items: Array<[string, number]>; isDark: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
      <div className={`text-[10px] uppercase tracking-wider font-medium mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{label}</div>
      <div className="grid grid-cols-4 gap-2">
        {items.map(([name, n]) => (
          <div key={name} className="text-center">
            <div className={`text-xl font-bold tabular-nums ${scoreColor(n, isDark)}`}>{n}</div>
            <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, color, items, isDark }: { title: string; icon: any; color: 'amber' | 'violet'; items: string[]; isDark: boolean }) {
  const colorCls = color === 'amber'
    ? (isDark ? 'text-amber-300' : 'text-amber-700')
    : (isDark ? 'text-violet-300' : 'text-violet-700')
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-2 ${colorCls}`}>
        <Icon className="w-3.5 h-3.5" />
        <div className="text-xs font-semibold uppercase tracking-wider">{title}</div>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`text-sm flex items-start gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
            <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${colorCls.replace('text-', 'bg-')}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
