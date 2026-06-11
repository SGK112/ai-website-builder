'use client'

// Theme-aware presentation for /compare/[slug]. The page (server component)
// owns metadata + structured data + static params; this renders the actual
// comparison. It's a client component for theme styling, but uses no
// useSearchParams, so all the comparison copy server-renders for crawlers.

import Link from 'next/link'
import { ArrowLeft, Check, X, Minus } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { WebstewLogo } from '@/components/brand/WebstewLogo'
import type { Competitor } from '@/lib/competitors'

// A row value that's a clear win/loss renders an icon; otherwise plain text.
function cellTone(value: string) {
  if (/^Yes/i.test(value)) return 'yes'
  if (/^No\b/i.test(value)) return 'no'
  return 'neutral'
}

export function CompareView({ competitor: c }: { competitor: Competitor }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const muted = isDark ? 'text-zinc-400' : 'text-slate-600'
  const card = cn(
    'rounded-2xl border p-5 sm:p-6',
    isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white'
  )

  const ToneIcon = ({ value, accent }: { value: string; accent: boolean }) => {
    const tone = cellTone(value)
    if (tone === 'yes')
      return <Check className={cn('w-4 h-4 shrink-0', accent ? 'text-emerald-400' : isDark ? 'text-emerald-400/80' : 'text-emerald-600')} />
    if (tone === 'no') return <X className={cn('w-4 h-4 shrink-0', isDark ? 'text-rose-400/70' : 'text-rose-500')} />
    return <Minus className={cn('w-4 h-4 shrink-0', muted)} />
  }

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
              'inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold',
              isDark ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30' : 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
            )}
          >
            Comparison
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.08] text-center">
          Webstew vs {c.name}
        </h1>
        <p className={cn('mt-2 text-center font-medium', isDark ? 'text-violet-300' : 'text-violet-700')}>
          {c.tagline}
        </p>
        <p className={cn('mt-4 text-base sm:text-lg text-center max-w-2xl mx-auto', muted)}>{c.intro}</p>

        {/* Comparison table */}
        <section className="mt-12">
          <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'border-white/10' : 'border-slate-200')}>
            {/* Header row */}
            <div className={cn('grid grid-cols-[1.4fr_1fr_1fr] text-sm font-semibold', isDark ? 'bg-white/[0.04]' : 'bg-slate-50')}>
              <div className="p-3 sm:p-4" />
              <div className={cn('p-3 sm:p-4 text-center border-l', isDark ? 'border-white/10' : 'border-slate-200')}>
                <span className={cn('bg-clip-text text-transparent bg-gradient-to-r', isDark ? 'from-white via-violet-200 to-fuchsia-200' : 'from-orange-600 via-pink-600 to-purple-600')}>
                  Webstew
                </span>
              </div>
              <div className={cn('p-3 sm:p-4 text-center border-l', isDark ? 'border-white/10' : 'border-slate-200')}>{c.name}</div>
            </div>
            {/* Rows */}
            {c.rows.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  'grid grid-cols-[1.4fr_1fr_1fr] text-sm border-t',
                  isDark ? 'border-white/10' : 'border-slate-200',
                  i % 2 === 1 ? (isDark ? 'bg-white/[0.015]' : 'bg-slate-50/60') : ''
                )}
              >
                <div className={cn('p-3 sm:p-4 font-medium', isDark ? 'text-zinc-200' : 'text-slate-800')}>{row.label}</div>
                <div
                  className={cn(
                    'p-3 sm:p-4 flex items-start gap-2 border-l',
                    isDark ? 'border-white/10' : 'border-slate-200',
                    row.webstewWins ? (isDark ? 'bg-emerald-500/[0.06]' : 'bg-emerald-50/70') : ''
                  )}
                >
                  <ToneIcon value={row.webstew} accent={!!row.webstewWins} />
                  <span className={isDark ? 'text-zinc-200' : 'text-slate-700'}>{row.webstew}</span>
                </div>
                <div className={cn('p-3 sm:p-4 flex items-start gap-2 border-l', isDark ? 'border-white/10' : 'border-slate-200')}>
                  <ToneIcon value={row.them} accent={false} />
                  <span className={muted}>{row.them}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Honest split — where each wins */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h2 className="font-semibold text-lg">Where Webstew wins</h2>
            <ul className="mt-3 space-y-2">
              {c.webstewWins.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                  <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={card}>
            <h2 className="font-semibold text-lg">Where {c.name} wins</h2>
            <ul className="mt-3 space-y-2">
              {c.themWins.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm">
                  <Check className={cn('w-4 h-4 mt-0.5 shrink-0', isDark ? 'text-zinc-500' : 'text-slate-400')} />
                  <span className={muted}>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-center">Webstew vs {c.name} FAQ</h2>
          <div className="mt-6 space-y-3">
            {c.faqs.map(({ q, a }) => (
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

        {/* CTA */}
        <section className="mt-12">
          <div
            className={cn(
              'rounded-3xl border p-8 sm:p-12 text-center',
              isDark ? 'border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] to-transparent' : 'border-violet-200 bg-gradient-to-b from-violet-50 to-transparent'
            )}
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">See it for yourself</h2>
            <p className={cn('mt-3 max-w-xl mx-auto', muted)}>
              Describe your site in one prompt and watch Webstew build a real, deployable project — free to start, no credit card.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-opacity"
            >
              Build my website free
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
