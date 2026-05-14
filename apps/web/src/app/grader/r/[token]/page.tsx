// Public share page for a saved grader report.
// Anyone with the link can view; nothing here requires auth.
// Renders a stripped, marketing-friendly version with a CTA to grade
// your own site at the bottom.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertCircle, CheckCircle2, Sparkles, Eye } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { token: string }
}

interface SavedReport {
  token: string
  url: string
  result: {
    domain: string
    scores: {
      overall: number
      overall_grade: string
      ai_visibility: number
      ai_visibility_grade?: string
      business_essentials: number
      [k: string]: any
    }
    issues: Array<{ title?: string; description?: string; severity?: string }>
    recommendations: Array<{ title?: string; description?: string }>
    [k: string]: any
  }
  createdAt: string
  views: number
}

async function getReport(token: string, origin: string): Promise<SavedReport | null> {
  try {
    const res = await fetch(`${origin}/api/grader/share/${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as SavedReport
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Best-effort fetch for OG tags. Falls back to generic copy if the
  // request fails (e.g., during build).
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net'
  const report = await getReport(params.token, origin)
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
  const report = await getReport(params.token, origin)
  if (!report) notFound()

  const { result } = report
  const issues = Array.isArray(result?.issues) ? result.issues : []

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

        {/* Issues — full list, public report */}
        {issues.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> Issues
            </h2>
            <ul className="space-y-3">
              {issues.map((iss, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${iss.severity === 'high' ? 'bg-red-400' : iss.severity === 'medium' ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                  <div>
                    <p className="font-medium text-sm">{iss.title || 'Issue'}</p>
                    {iss.description && (
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{iss.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 sm:p-8 text-center">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-300" /> Get a better score in one shot
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
