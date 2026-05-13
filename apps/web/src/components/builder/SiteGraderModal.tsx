'use client'

// SiteGraderModal — runs the grader against the current draft HTML and
// renders the score + issues. Pure presentation; the workspace toolbar
// button toggles `open`. Re-uses the same /api/tools/grade endpoint the
// agent uses, just with a richer UI presentation.

import { useEffect, useState } from 'react'
import { Loader2, X, CheckCircle, AlertTriangle, Lightbulb, RefreshCw, Award, Wand2 } from 'lucide-react'

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
  // Hand the current grade report off to the agent and let it apply the
  // top actionable fixes. The workspace wires this to handleChatMessage.
  onAutoFix?: (issues: string[], recommendations: string[]) => void
}

export function SiteGraderModal({ open, onClose, html, deployedUrl, isDark = true, onAutoFix }: Props) {
  const [mode, setMode] = useState<'draft' | 'deployed'>('draft')
  const [result, setResult] = useState<GraderResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
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
    } catch (e: any) {
      setError(e?.message || 'Grade failed')
    } finally {
      setLoading(false)
    }
  }

  // Auto-run on open
  useEffect(() => {
    if (open && !result && !loading) void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${
          isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Award className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} />
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Site grader</div>
          </div>
          <div className="flex items-center gap-2">
            {deployedUrl && (
              <div className={`flex rounded-lg p-0.5 border text-[11px] ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'}`}>
                {(['draft', 'deployed'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setResult(null) }}
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
            <button
              onClick={run}
              disabled={loading}
              className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title="Re-grade"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
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
                Analysing {mode === 'deployed' ? 'live site' : 'draft HTML'}…
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

          {result && !loading && !error && (
            <>
              <OverallScore result={result} isDark={isDark} />
              <BucketRow label="SEO"        items={[
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
            </>
          )}
        </div>

        {/* Footer — "Fix issues" hands the report to the agent. Only useful
            when grading the draft (agent edits files, can't reach a live
            URL directly). Hidden when mode === 'deployed' to avoid implying
            it can re-deploy automatically. */}
        {result && !loading && onAutoFix && mode === 'draft' && (result.issues?.length > 0 || result.recommendations?.length > 0) && (
          <div className={`px-5 py-3 border-t flex items-center justify-between gap-3 ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Hand this report to the agent and it will rewrite{' '}
              <span className="font-mono text-[10px]">index.html</span> to fix the actionable items.
            </div>
            <button
              onClick={() => {
                onAutoFix(result.issues || [], result.recommendations || [])
                onClose()
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Fix issues
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

function OverallScore({ result, isDark }: { result: GraderResult; isDark: boolean }) {
  const overall = result.scores.overall
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`text-5xl font-bold tabular-nums ${scoreColor(overall, isDark)}`}>{overall}</div>
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
