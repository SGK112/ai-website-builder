// Public share page for a saved grader report.
// Anyone with the link can view; nothing here requires auth.
// Renders a stripped, marketing-friendly version with a CTA to grade
// your own site at the bottom.
//
// Catch-all ([...token]) on purpose: share targets (SMS, X, native share
// sheets) often append the marketing text — which contains "98/100" — onto the
// URL, turning the path into multiple segments. A single [token] segment would
// 404 on those. We take the FIRST segment and strip anything after the first
// non-token character, so a garbled link still resolves to the real report.

import Link from 'next/link'
import { ArrowLeft, AlertCircle, Sparkles, Eye, ListChecks } from 'lucide-react'
import type { Metadata } from 'next'
import { NotAvailable } from '@/components/NotAvailable'
import type { GraderResult } from '@/lib/grader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { token: string[] }
}

// The result is whatever lib/grader.ts produced, so use THAT type rather than
// a local guess. This page previously declared issues/recommendations as
// Array<{title, description}> and cast the fetch response to it — but the
// grader emits string[]. Nothing type-checked the lie, so every issue rendered
// as the literal word "Issue" with no text, and all 8 recommendations were
// dropped on the floor.
interface SavedReport {
  token: string
  url: string
  result: GraderResult
  createdAt: string
  views: number
}

// First path segment, trimmed to the valid token charset — survives share
// targets that glue the share text onto the URL.
function cleanToken(seg: string[] | string | undefined): string {
  const first = Array.isArray(seg) ? (seg[0] || '') : (seg || '')
  return decodeURIComponent(first).split(/[^A-Za-z0-9_-]/)[0] || ''
}

async function getReport(token: string, origin: string): Promise<SavedReport | null> {
  if (!token) return null
  try {
    const res = await fetch(`${origin}/api/grader/share/${encodeURIComponent(token)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as SavedReport
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net'
  const report = await getReport(cleanToken(params.token), origin)
  if (!report) {
    return { title: 'Site grade · Webstew' }
  }
  const domain = report.result?.domain || report.url
  const score = report.result?.scores?.overall
  const grade = report.result?.scores?.overall_grade
  return {
    title: `${domain} scored ${score}/100 (${grade}) · Webstew`,
    description: `See the full SEO + AI-visibility report for ${domain}, plus what to fix. Free site grader from Webstew.`,
    openGraph: {
      title: `${domain} · ${score}/100`,
      description: `Free site audit from Webstew.`,
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  }
}

function gradeColor(grade?: string): string {
  if (!grade) return 'text-zinc-400'
  if (grade.startsWith('A')) return 'text-emerald-400'
  if (grade.startsWith('B')) return 'text-lime-400'
  if (grade.startsWith('C')) return 'text-amber-400'
  if (grade.startsWith('D')) return 'text-orange-400'
  return 'text-red-400'
}

export default async function GraderSharePage({ params }: PageProps) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net'
  const report = await getReport(cleanToken(params.token), origin)
  if (!report) {
    // No hard 404 — this is a link someone clicked. Offer a way forward.
    return (
      <NotAvailable
        title="This grader report isn’t available"
        message="The report may have expired or been removed — or the share link got garbled. Run a fresh grade in seconds."
        primaryHref="/grader"
        primaryLabel="Grade your site free"
        secondaryHref="/"
        secondaryLabel="Go to Webstew"
      />
    )
  }

  const { result } = report
  // Defensive: old reports were saved before the shape was pinned down, and a
  // string[] is what the grader emits today.
  const issues = (Array.isArray(result?.issues) ? result.issues : []).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  const recommendations = (Array.isArray(result?.recommendations) ? result.recommendations : []).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        <Link href="/grader" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Grade another site
        </Link>

        {/* Hero score card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold break-all">{result.domain || report.url}</h1>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                Graded {new Date(report.createdAt).toLocaleDateString()}
                <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {report.views} views</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-6xl font-bold leading-none ${gradeColor(result.scores?.overall_grade)}`}>
                {result.scores?.overall_grade || '—'}
              </p>
              <p className="text-sm text-zinc-400 mt-1">{result.scores?.overall ?? 0}/100</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">AI visibility</p>
              <p className="text-2xl font-bold">{result.scores?.ai_visibility ?? 0}<span className="text-sm font-normal text-zinc-500">/100</span></p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Business essentials</p>
              <p className="text-2xl font-bold">{result.scores?.business_essentials ?? 0}<span className="text-sm font-normal text-zinc-500">/100</span></p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Issues found</p>
              <p className={`text-2xl font-bold ${issues.length > 5 ? 'text-red-400' : issues.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{issues.length}</p>
            </div>
          </div>
        </div>

        {/* Sub-scores — the grader produces seo / technical / presence
            breakdowns that this page was collecting and never showing. */}
        {(result.scores?.seo || result.scores?.technical || result.scores?.presence) && (
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {([
              ['SEO', result.scores?.seo],
              ['Technical', result.scores?.technical],
              ['Presence', result.scores?.presence],
            ] as Array<[string, Record<string, number> | undefined]>).map(([label, group]) => group && (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">{label}</p>
                <ul className="space-y-2">
                  {Object.entries(group).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 capitalize flex-1">{k.replace(/_/g, ' ')}</span>
                      <span className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden shrink-0">
                        <span
                          className={`block h-full rounded-full ${v >= 80 ? 'bg-emerald-400' : v >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                        />
                      </span>
                      <span className="text-xs font-semibold tabular-nums w-8 text-right">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Issues — the grader emits plain strings, one per finding. */}
        {issues.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> {issues.length} issue{issues.length === 1 ? '' : 's'} found
            </h2>
            <ul className="space-y-2.5">
              {issues.map((iss, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-sm leading-relaxed text-zinc-200">{iss}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations — stored on every report and never rendered until now. */}
        {recommendations.length > 0 && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-400" /> How to fix it
            </h2>
            <ul className="space-y-2.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <p className="text-sm leading-relaxed text-zinc-200">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What we measured — the details block, also previously unused. */}
        {result.details && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-4">What we measured</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Load time</dt>
                <dd className="font-semibold">{result.details.load_time != null ? `${(result.details.load_time / 1000).toFixed(2)}s` : '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Word count</dt>
                <dd className="font-semibold">{result.details.word_count ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Schema types</dt>
                <dd className="font-semibold">{result.details.schema_types?.length ? result.details.schema_types.join(', ') : 'None found'}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Social profiles</dt>
                <dd className="font-semibold">{result.details.social_platforms?.length ? result.details.social_platforms.join(', ') : 'None found'}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 sm:p-8 text-center">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-700 dark:text-violet-300" /> Get a better score in one shot
          </h3>
          <p className="text-sm text-zinc-400 mb-5">Webstew rebuilds your site with the fixes baked in — better SEO, AI-ready structure, mobile-first. Free to try.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href={`/signup?next=${encodeURIComponent(`/workspace?prompt=${encodeURIComponent(`Build a better version of ${result.domain || report.url} with the fixes from my grader report`)}`)}`}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium text-sm">
              Rebuild for free
            </Link>
            <Link href="/grader" className="px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded-lg font-medium text-sm">
              Grade your own site
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
