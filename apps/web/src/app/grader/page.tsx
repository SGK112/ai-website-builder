'use client'

// /grader — dedicated grader page that any user can bookmark. The interactive
// SiteGraderWidget is the tool; everything around it is real, crawlable SEO
// content (H1, what-we-grade, how-it-works, FAQ, CTA) so the page can actually
// rank for "free website grader" / "website score checker" instead of being a
// thin client shell. The SEO content lives OUTSIDE the widget's <Suspense>
// boundary so it server-renders even though the widget reads ?url=.

import { Suspense } from 'react'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { ArrowLeft, Search, Gauge, Smartphone, Eye, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiteGraderWidget } from '@/components/landing/SiteGraderWidget'
import { WebstewLogo } from '@/components/brand/WebstewLogo'
import { COMPETITORS } from '@/lib/competitors'

const GRADE_CRITERIA = [
  {
    icon: Search,
    title: 'SEO & meta',
    body: 'Title tags, meta descriptions, headings, canonical URLs, sitemap, robots, and structured data — everything Google reads first.',
  },
  {
    icon: Gauge,
    title: 'Performance & speed',
    body: 'Core Web Vitals, load time, and page weight. Slow pages lose rankings and visitors before they ever see your content.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-friendliness',
    body: 'Responsive layout, tap targets, and viewport setup. Google indexes the mobile version of your site first.',
  },
  {
    icon: Eye,
    title: 'Accessibility',
    body: 'Color contrast, alt text, and semantic markup — so every visitor (and every crawler) can use your site.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & trust',
    body: 'HTTPS, valid certificates, and safe-browsing signals that tell visitors and search engines your site is legitimate.',
  },
  {
    icon: Sparkles,
    title: 'AI discoverability',
    body: 'Whether ChatGPT, Claude, Perplexity, and Grok can read and cite your pages — the new front door to your business.',
  },
]

const STEPS = [
  { n: '1', title: 'Paste your URL', body: 'Drop in any website address. No account, no credit card, no install.' },
  { n: '2', title: 'Get your score', body: 'In seconds you get a report card across SEO, speed, mobile, accessibility, security, and AI readiness.' },
  { n: '3', title: 'Fix what matters', body: 'Each issue comes with a plain-English fix — or let Webstew rebuild the page for you in one prompt.' },
]

const FAQS = [
  {
    q: 'Is the website grader free?',
    a: 'Yes. You can grade any website and see your overall score plus your top issues for free, with no signup. Create a free account to unlock the full issue-by-issue report and track a site over time.',
  },
  {
    q: 'What does the website grader check?',
    a: 'It scores six areas: SEO and meta tags, performance and page speed, mobile-friendliness, accessibility, security (HTTPS), and AI discoverability — whether assistants like ChatGPT and Perplexity can read your pages.',
  },
  {
    q: 'What is a good website score?',
    a: 'Anything 90 or above is strong, 70–89 is solid with room to improve, and below 70 means there are issues actively costing you rankings or visitors. The grader shows exactly which category is dragging your score down.',
  },
  {
    q: 'How do I improve my website score?',
    a: 'Start with the highest-impact fixes the grader flags — usually missing meta tags, slow-loading images, no HTTPS, or no structured data. Each result includes a specific recommendation. With Webstew you can also regenerate a faster, SEO-ready version of the page from a single prompt.',
  },
  {
    q: 'Does grading my site store my data?',
    a: 'No. We run the audit and show your results — nothing about the graded URL is stored unless you sign up to save reports and monitor changes over time.',
  },
  {
    q: 'Can I grade any website, or only my own?',
    a: 'Any public website. Grade your own site, a competitor’s, or a client’s to benchmark where you stand and spot quick wins.',
  },
]

function GraderInner() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const card = cn(
    'rounded-2xl border p-5 sm:p-6 transition-colors',
    isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white'
  )
  const muted = isDark ? 'text-zinc-400' : 'text-slate-600'

  return (
    <main
      className={cn(
        'min-h-screen transition-colors',
        isDark ? 'bg-[#09090b] text-white' : 'bg-gradient-to-b from-white to-slate-50 text-slate-900'
      )}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-16">
        <Link
          href="/"
          className={cn(
            'inline-flex items-center gap-2 text-sm mb-6 sm:mb-8 transition-colors',
            isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <WebstewLogo size="sm" isDark={isDark} />
        </Link>

        {/* Hero — the H1 and intro are the primary ranking content */}
        <div className="text-center mb-6">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold',
              isDark ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
            )}
          >
            Free site audit
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.08] text-center max-w-3xl mx-auto">
          Free Website Grader
        </h1>
        <p className={cn('mt-4 text-base sm:text-lg text-center max-w-2xl mx-auto', muted)}>
          Check any website&rsquo;s score for SEO, speed, mobile-friendliness, accessibility,
          security, and AI discoverability — instantly, and free. Paste a URL and get a report
          card with the exact issues holding your site back.
        </p>

        {/* The tool. Kept in its own Suspense boundary because it reads ?url=;
            the SEO content above and below renders server-side regardless. */}
        <div className="mt-8">
          <Suspense fallback={<div className="h-40" aria-hidden />}>
            <SiteGraderWidget isDark={isDark} />
          </Suspense>
        </div>

        {/* What we grade */}
        <section className="mt-16 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            What the website grader checks
          </h2>
          <p className={cn('mt-3 text-center max-w-2xl mx-auto', muted)}>
            We grade against the same signals Google and AI assistants use to rank and cite pages.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GRADE_CRITERIA.map(({ icon: Icon, title, body }) => (
              <div key={title} className={card}>
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3',
                    isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className={cn('mt-1.5 text-sm leading-relaxed', muted)}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className={card}>
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded-full font-bold mb-3',
                    isDark ? 'bg-white/10 text-white' : 'bg-slate-900 text-white'
                  )}
                >
                  {n}
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className={cn('mt-1.5 text-sm leading-relaxed', muted)}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ — visible, crawlable long-tail content */}
        <section className="mt-16 sm:mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            Website grader FAQ
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className={cn('group rounded-2xl border p-5 transition-colors', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white')}>
                <summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-4">
                  {q}
                  <span className={cn('shrink-0 transition-transform group-open:rotate-45', muted)}>+</span>
                </summary>
                <p className={cn('mt-3 text-sm leading-relaxed', muted)}>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related — internal-link cluster into the comparison pages */}
        <section className="mt-16 text-center text-sm">
          <p className={muted}>
            Choosing a builder?{' '}
            {Object.values(COMPETITORS).map((o, i, arr) => (
              <span key={o.slug}>
                <Link
                  href={`/compare/${o.slug}`}
                  className={cn(
                    'underline-offset-2 hover:underline',
                    isDark ? 'text-violet-300 hover:text-white' : 'text-violet-700 hover:text-violet-900'
                  )}
                >
                  Webstew vs {o.name}
                </Link>
                {i < arr.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </section>

        {/* CTA */}
        <section className="mt-12 sm:mt-16">
          <div
            className={cn(
              'rounded-3xl border p-8 sm:p-12 text-center',
              isDark ? 'border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] to-transparent' : 'border-violet-200 bg-gradient-to-b from-violet-50 to-transparent'
            )}
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Low score? Rebuild it in one prompt.
            </h2>
            <p className={cn('mt-3 max-w-xl mx-auto', muted)}>
              Webstew turns a single prompt into a fast, SEO-ready website — Next.js, Astro, or
              a mobile app — and deploys it for you. Start free, no credit card.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-full font-semibold bg-violet-600 text-white hover:opacity-90 transition-opacity"
            >
              Build my website free
            </Link>
          </div>
        </section>

        <p className={cn('mt-12 text-center text-xs', isDark ? 'text-zinc-500' : 'text-slate-500')}>
          We grade against the same metrics Google + ChatGPT use to rank pages: SEO meta,
          mobile-friendliness, HTTPS, structured data, social signals, AI-discoverability. No
          data is stored unless you sign up.
        </p>
      </div>
    </main>
  )
}

export default function GraderPage() {
  return <GraderInner />
}
