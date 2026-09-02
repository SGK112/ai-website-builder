'use client'

// Seller payouts card for /profile — Stripe Connect Express. Sales are paid
// DIRECTLY to the seller's connected Stripe account by the marketplace checkout
// (a Connect destination charge), so there is NO webstew-held balance and NO
// manual cash-out. This card shows: Connect status + onboarding, lifetime
// earnings (what actually landed in their Stripe account, net of the platform
// fee), and recent sales.

import { useEffect, useState } from 'react'
import { Wallet, Loader2, AlertCircle, Check, ExternalLink, TrendingUp, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectStatus {
  connected: boolean
  status: 'not_started' | 'pending' | 'restricted' | 'enabled' | 'error' | 'stripe_unconfigured'
  accountId?: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  pendingRequirement?: string | null
  error?: string
}

interface Props {
  isDark: boolean
}

interface Earnings {
  config: { centsPerCredit: number; platformFeePct: number }
  payoutsReady: boolean
  needsOnboarding: boolean
  lifetime: { salesCount: number; creditsEarned: number; grossUsdCents: number; netUsdCents: number }
  recentSales: Array<{ _id: string; listingTitle: string; priceCredits: number; purchasedAt: string }>
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function PayoutsCard({ isDark }: Props) {
  const [state, setState] = useState<ConnectStatus | null>(null)
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = () => {
    return Promise.all([
      fetch('/api/stripe/connect/status', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/marketplace/earnings', { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([s, e]) => {
      setState(s)
      setEarnings(e?.lifetime ? e : null)
    })
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    loadAll()
      .catch(() => { if (alive) setError('Could not load payout status') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startOnboarding = async () => {
    setLinking(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect/account-link', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || `HTTP ${res.status}`)
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message || 'Failed to start onboarding')
      setLinking(false)
    }
  }

  const badge = (label: string, color: string) => (
    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', color)}>{label}</span>
  )

  const keepPct = earnings ? Math.round(100 - earnings.config.platformFeePct) : 97
  // Net per sale (what landed in the seller's Stripe account after the fee).
  const saleNetCents = (s: { priceCredits: number }) =>
    earnings ? Math.round(s.priceCredits * earnings.config.centsPerCredit * (1 - earnings.config.platformFeePct / 100)) : 0

  let statusBadge = badge('Not set up', 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-400')
  let cta = 'Set up payouts'
  let helper = `Connect a Stripe account to get paid. You keep ${keepPct}% of every sale, deposited straight to your bank — no payout step.`
  if (state?.status === 'pending') {
    statusBadge = badge('Onboarding', 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300')
    cta = 'Continue onboarding'
    helper = state?.pendingRequirement
      ? `Stripe still needs: ${state.pendingRequirement.replace(/_/g, ' ')}`
      : 'Finish the steps Stripe requires to enable payouts.'
  }
  if (state?.status === 'restricted') {
    statusBadge = badge('Restricted', 'bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300')
    cta = 'Fix account'
    helper = 'Stripe has restricted this account. Open Stripe to resolve.'
  }
  if (state?.status === 'enabled') {
    statusBadge = badge('Payouts enabled', 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300')
    cta = 'Manage in Stripe'
    helper = `You're set up. Every sale deposits ${keepPct}% straight to your bank automatically — nothing to claim.`
  }
  if (state?.status === 'stripe_unconfigured') {
    statusBadge = badge('Coming soon', 'bg-zinc-500/20 text-zinc-400')
    helper = 'Payouts aren\'t available yet. We\'ll email you when Stripe Connect goes live.'
  }

  return (
    <div className={cn('p-6 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Get paid for your work
        </h3>
        {statusBadge}
      </div>

      <p className={cn('text-sm mb-4', isDark ? 'text-zinc-400' : 'text-zinc-600')}>{helper}</p>

      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {/* Lifetime earnings — what actually reached the seller's Stripe account.
          Always shown so empty sellers see "$0 · 0 sales", not nothing. */}
      {earnings && (
        <div className="mb-4 grid grid-cols-2 gap-3 text-center">
          <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Earned (net)</p>
            <p className="text-xl font-bold">{usd(earnings.lifetime.netUsdCents)}</p>
            <p className="text-[10px] text-zinc-600">to your Stripe account</p>
          </div>
          <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Sales</p>
            <p className="text-xl font-bold">{earnings.lifetime.salesCount}</p>
            <p className="text-[10px] text-zinc-600">lifetime</p>
          </div>
        </div>
      )}

      {/* How payouts work — kills the old "balance / cash out" confusion. */}
      {earnings && (
        <div className={cn('mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs', isDark ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-zinc-300' : 'bg-emerald-50 border-emerald-200 text-zinc-700')}>
          <Banknote className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
          <span>Sales pay out <strong>automatically</strong> to your connected Stripe account — there's no balance to claim. You keep {keepPct}%; Webstew keeps {Math.round(earnings.config.platformFeePct)}%.</span>
        </div>
      )}

      {/* Recent sales, with the net amount that hit the seller's account. */}
      {earnings && earnings.recentSales.length > 0 && (
        <details className={cn('mb-4 rounded-xl border p-3', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
          <summary className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Recent sales ({earnings.recentSales.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {earnings.recentSales.slice(0, 8).map((s) => (
              <li key={s._id} className="flex justify-between gap-2">
                <span className="truncate">{s.listingTitle || 'Listing'}</span>
                <span className="font-mono shrink-0 text-emerald-500">+{usd(saleNetCents(s))}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {loading ? (
        <div className="flex items-center text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      ) : state?.status === 'stripe_unconfigured' ? (
        <p className="text-xs text-zinc-500">Stripe Connect not configured on this deploy.</p>
      ) : state?.status === 'enabled' ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>Connected · payouts {state.payoutsEnabled ? 'on' : 'off'}</span>
          </span>
          <button onClick={startOnboarding} disabled={linking} className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-700 dark:text-violet-300 disabled:opacity-60">
            {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />} Manage in Stripe
          </button>
        </div>
      ) : (
        <button
          onClick={startOnboarding}
          disabled={linking}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition',
            'bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-60'
          )}
        >
          {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          {cta}
        </button>
      )}
    </div>
  )
}
