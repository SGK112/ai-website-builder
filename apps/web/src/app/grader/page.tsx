'use client'

// /grader — dedicated grader page that any user can bookmark. Same SiteGraderWidget
// component as the landing, but laid out for the page (centered, more spacious)
// with a deep-link friendly ?url= param so reports can be shared. Anon users see
// the same 2-issue teaser → signup wall. Signed-in users see the full report.

import { Suspense } from 'react'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiteGraderWidget } from '@/components/landing/SiteGraderWidget'

function GraderInner() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <main className={cn(
      'min-h-screen transition-colors',
      isDark ? 'bg-[#09090b] text-white' : 'bg-gradient-to-b from-white to-slate-50 text-slate-900'
    )}>
      <div className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <Link
          href="/"
          className={cn(
            'inline-flex items-center gap-2 text-sm mb-8 transition-colors',
            isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Webstew
        </Link>

        <div className="text-center mb-4">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold',
            isDark ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
          )}>
            Free site audit
          </span>
        </div>

        <SiteGraderWidget isDark={isDark} />

        <div className={cn(
          'mt-12 text-center text-xs',
          isDark ? 'text-zinc-500' : 'text-slate-500'
        )}>
          We grade against the same metrics Google + ChatGPT use to rank pages: SEO meta, mobile-friendliness, HTTPS, structured data, social signals, AI-discoverability. No data is stored unless you sign up.
        </div>
      </div>
    </main>
  )
}

export default function GraderPage() {
  return (
    <Suspense fallback={null}>
      <GraderInner />
    </Suspense>
  )
}
