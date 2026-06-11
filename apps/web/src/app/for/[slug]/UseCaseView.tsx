'use client'

// Theme-aware presentation for /for/[slug]. The page (server component) owns
// metadata + structured data + static params; this renders the content. No
// useSearchParams, so all the copy server-renders for crawlers.

import Link from 'next/link'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { WebstewLogo } from '@/components/brand/WebstewLogo'
import { USE_CASES, type UseCase } from '@/lib/use-cases'

export function UseCaseView({ useCase: u }: { useCase: UseCase }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const muted = isDark ? 'text-zinc-400' : 'text-slate-600'
  const card = cn('rounded-2xl border p-5 sm:p-6', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white')
  const others = Object.values(USE_CASES).filter((x) => x.slug !== u.slug)
  const linkCls = isDark ? 'text-violet-300 hover:text-white underline-offset-2 hover:underline' : 'text-violet-700 hover:text-violet-900 underline-offset-2 hover:underline'

  return (
    <main
      className={cn(
        'min-h-screen transition-colors',
        isDark ? 'bg-[#09090b] text-white' : 'bg-gradient-to-b from-white to-slate-50 text-slate-900'
      )}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-16">
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

        {/* Hero */}
        <div className="text-center mb-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold',
              isDark ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30' : 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
            )}
          >
            <Sparkles className="w-3 h-3" /> For {u.audience}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.08] text-center max-w-3xl mx-auto">
          {u.h1}
        </h1>
        <p className={cn('mt-4 text-base sm:text-lg text-center max-w-2xl mx-auto', muted)}>{u.intro}</p>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-opacity"
          >
            Build my site free
          </Link>
        </div>

        {/* Pains */}
        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">Sound familiar?</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto">
            {u.pains.map((p) => (
              <div key={p} className={cn('rounded-xl border px-4 py-3 text-sm', isDark ? 'border-white/10 bg-white/[0.02] text-zinc-300' : 'border-slate-200 bg-white text-slate-700')}>
                {p}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">How Webstew helps</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {u.features.map((f) => (
              <div key={f.title} className={card}>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className={cn('mt-1.5 text-sm leading-relaxed', muted)}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What's included */}
        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">What your site includes</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto">
            {u.includes.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-center">{u.audience} website FAQ</h2>
          <div className="mt-6 space-y-3">
            {u.faqs.map(({ q, a }) => (
              <details key={q} className={cn('group rounded-2xl border p-5', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white')}>
                <summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-4">
                  {q}
                  <span className={cn('shrink-0 transition-transform group-open:rotate-45', muted)}>+</span>
                </summary>
                <p className={cn('mt-3 text-sm leading-relaxed', muted)}>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related — internal-link cluster across use cases + grader */}
        <section className="mt-12 text-center text-sm">
          <p className={muted}>
            Also for:{' '}
            {others.map((o, i) => (
              <span key={o.slug}>
                <Link href={`/for/${o.slug}`} className={linkCls}>
                  {o.audience}
                </Link>
                {i < others.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
          <p className={cn('mt-2', muted)}>
            Already have a site?{' '}
            <Link href="/grader" className={linkCls}>
              Grade it free
            </Link>
            .
          </p>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div
            className={cn(
              'rounded-3xl border p-8 sm:p-12 text-center',
              isDark ? 'border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] to-transparent' : 'border-violet-200 bg-gradient-to-b from-violet-50 to-transparent'
            )}
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Your {u.audience.toLowerCase()} site, in one prompt
            </h2>
            <p className={cn('mt-3 max-w-xl mx-auto', muted)}>
              Describe your business and Webstew builds a fast, SEO-ready site and deploys it — free to start, no credit card.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-opacity"
            >
              Build my site free
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
