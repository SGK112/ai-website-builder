'use client'

// /seller — single-page dashboard for creators selling on the Webstew
// marketplace. Centerpiece is PayoutsCard (Stripe Connect status + balance
// + cashout); flanked by quick links to publish a new listing and browse
// the user's authored work. The card itself does all the data fetching.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Package, ShoppingBag, ArrowRight, ChevronLeft } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { WebstewLogo } from '@/components/brand/WebstewLogo'
import { PayoutsCard } from '@/components/profile/PayoutsCard'
import { cn } from '@/lib/utils'

interface AuthoredSummary {
  authoredCount: number
  totalRevenueCents: number
}

export default function SellerDashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { status } = useSession()
  const router = useRouter()
  const [authored, setAuthored] = useState<AuthoredSummary | null>(null)

  // Anonymous users can't have sales — redirect to sign-in with a return path.
  // BUT only after the session has truly settled. useSession can briefly report
  // 'unauthenticated' during hydration before the cookie-backed session warms
  // up; redirecting on that flash bounced authenticated users to /login (which
  // full-page-reloads back here), so the page "wouldn't open" without several
  // clicks. Defer 700ms and cancel if we settle to authenticated.
  useEffect(() => {
    if (status !== 'unauthenticated') return
    const t = setTimeout(() => { router.replace('/login?callbackUrl=/seller') }, 700)
    return () => clearTimeout(t)
  }, [status, router])

  // Pull authored count from /api/library — same endpoint /library uses.
  // We only need the count + revenue summary here; the actual list lives at
  // /library so we don't duplicate the rendering surface.
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/library', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        const list = Array.isArray(data.authored) ? data.authored : []
        const cents = list.reduce(
          (sum: number, l: any) => sum + Number(l.lifetimeRevenueCents || 0),
          0,
        )
        setAuthored({ authoredCount: list.length, totalRevenueCents: cents })
      })
      .catch(() => { /* PayoutsCard surfaces real errors; this is just the summary */ })
  }, [status])

  return (
    <div className={cn(
      'min-h-screen',
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900',
    )}>
      {/* Header */}
      <header className={cn(
        'sticky top-0 z-30 border-b backdrop-blur-md',
        isDark ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-slate-200',
      )}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WebstewLogo href="/" size="sm" isDark={isDark} />
            <span className={cn('text-xs', isDark ? 'text-zinc-600' : 'text-slate-400')}>/</span>
            <span className="text-sm font-medium">Seller dashboard</span>
          </div>
          <Link
            href="/community"
            className={cn(
              'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors',
              isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Community
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold mb-1">Earnings & payouts</h1>
          <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-slate-500')}>
            You keep 70% of every sale. Webstew takes 30% to cover Stripe + hosting.
            Payouts go straight to your connected Stripe account.
          </p>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/workspace"
            className={cn(
              'group flex items-center gap-3 p-4 rounded-xl border transition-all',
              isDark
                ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border-violet-500/30 hover:border-violet-400'
                : 'bg-gradient-to-br from-orange-50 to-pink-50 border-orange-200 hover:border-orange-400',
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-orange-100 text-orange-600',
            )}>
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-0.5">Build a new site</div>
              <div className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-slate-500')}>
                Then publish from /library
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/library"
            className={cn(
              'group flex items-center gap-3 p-4 rounded-xl border transition-all',
              isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/30' : 'bg-white border-slate-200 hover:border-slate-300',
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
            )}>
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-0.5">
                My listings {authored ? `(${authored.authoredCount})` : ''}
              </div>
              <div className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-slate-500')}>
                Edit, unpublish, set prices
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/community"
            className={cn(
              'group flex items-center gap-3 p-4 rounded-xl border transition-all',
              isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/30' : 'bg-white border-slate-200 hover:border-slate-300',
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600',
            )}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-0.5">Browse marketplace</div>
              <div className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-slate-500')}>
                See what's selling
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Payouts card — Stripe Connect status + balance + cashout button */}
        <div id="payouts">
          <PayoutsCard isDark={isDark} />
        </div>
      </main>
    </div>
  )
}
