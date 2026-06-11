'use client'

// Shared Webstew wordmark — replaces ad-hoc renders that drifted between
// pages. Stew-pot emoji + "Webstew" (Inter Tight 800, gradient) stacked
// over a small "Ai Website Builder" tagline. Theme-aware: gradient stops
// flip on dark/light to match the page background's accent palette.
//
// Variants:
//   - 'lg' — primary header use on /landing, /community, /signup hero
//   - 'md' — sub-page headers, /grader, /upgrade, /profile
//   - 'sm' — footers, dropdown headers, navbar slot
//
// Pass `href` to wrap in a link; omit for a non-clickable mark.

import Link from 'next/link'
import { cn } from '@/lib/utils'

type Size = 'lg' | 'md' | 'sm'

interface Props {
  size?: Size
  href?: string
  isDark?: boolean
  className?: string
  showTagline?: boolean
  // Hide the 🍲 emoji prefix — for places where the wordmark must sit
  // tight without a leading icon (e.g. footers that pair their own icon).
  hideIcon?: boolean
}

const SIZE_CFG: Record<Size, {
  emoji: string
  wordmark: string
  tagline: string
  taglineMargin: string
  gap: string
}> = {
  lg: {
    emoji: 'text-3xl sm:text-5xl',
    wordmark: 'text-2xl sm:text-4xl',
    tagline: 'text-[9px] sm:text-[10px]',
    taglineMargin: 'mt-1',
    gap: 'gap-1.5 sm:gap-2',
  },
  md: {
    emoji: 'text-2xl sm:text-3xl',
    wordmark: 'text-lg sm:text-2xl',
    tagline: 'text-[8px] sm:text-[9px]',
    taglineMargin: 'mt-0.5',
    gap: 'gap-1.5',
  },
  sm: {
    emoji: 'text-base',
    wordmark: 'text-base',
    tagline: 'text-[8px]',
    taglineMargin: 'mt-0.5',
    gap: 'gap-1.5',
  },
}

export function WebstewLogo({
  size = 'md',
  href,
  isDark,
  className,
  showTagline = false,
  hideIcon = false,
}: Props) {
  // If isDark isn't passed, infer from prefers-color-scheme via Tailwind's
  // dark: variant. Caller-controlled is preferred so the gradient matches
  // the page's accent palette exactly.
  const dark = isDark ?? true
  const cfg = SIZE_CFG[size]

  const content = (
    <span className={cn('inline-flex items-center', cfg.gap, className)}>
      {!hideIcon && (
        <span className={cn(cfg.emoji, 'leading-none select-none shrink-0')} aria-hidden="true">
          🍲
        </span>
      )}
      <span className="inline-flex flex-col items-center leading-none min-w-0">
        <span
          className={cn(
            cfg.wordmark,
            'tracking-tight truncate',
            dark
              ? 'bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent'
          )}
          style={{
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          Webstew
        </span>
        {showTagline && (
          <span
            className={cn(
              cfg.tagline,
              cfg.taglineMargin,
              'uppercase tracking-[0.22em] font-semibold whitespace-nowrap',
              dark ? 'text-slate-400' : 'text-slate-500'
            )}
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            <span className={dark ? 'text-violet-400 font-bold' : 'text-violet-500 font-bold'}>Ai</span>{' '}
            Website Builder
          </span>
        )}
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    )
  }
  return content
}

export default WebstewLogo
