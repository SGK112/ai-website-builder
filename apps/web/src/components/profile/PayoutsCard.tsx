'use client'

// Payouts card for /profile — Stripe Connect Express onboarding entry
// point. Shows current account status (not started / pending / enabled)
// + a button that either kicks off onboarding or refreshes the link.

import { useEffect, useState } from 'react'
import { Wallet, Loader2, AlertCircle, Check, ExternalLink, DollarSign, History, TrendingUp } from 'lucide-react'
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
  balance: { credits: number; usdCents: number }
  config: { centsPerCredit: number; minPayoutCents: number; minPayoutCredits: number }
  payoutsReady: boolean
  lifetime: { salesCount: number; creditsEarned: number }
  recentPayouts: Array<{ _id: string; credits: number; amountCents: number; status: string; createdAt: string }>
  recentSales: Array<{ _id: string; listingTitle: string; priceCredits: number; purchasedAt: string }>
}

export function PayoutsCard({ isDark }: Props) {
  const [state, setState] = useState<ConnectStatus | null>(null)
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [cashingOut, setCashingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const loadAll = () => {
    return Promise.all([
      fetch('/api/stripe/connect/status', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/marketplace/earnings', { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([s, e]) => {
      setState(s)
      setEarnings(e?.balance ? e : null)
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

  const cashOut = async () => {
    if (!earnings) return
    if (!confirm(`Cash out ${earnings.balance.credits} credits ($${(earnings.balance.usdCents / 100).toFixed(2)}) to your Stripe account?`)) return
    setCashingOut(true)
    setError(null)
    setFlash(null)
    try {
      const res = await fetch('/api/marketplace/payout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setFlash(`Sent $${data.amountUsd.toFixed(2)} to your Stripe account. Transfer ID: ${data.transferId.slice(0, 12)}…`)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Payout failed')
    } finally {
      setCashingOut(false)
    }
  }

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

  // Light-mode text colors are darkened (amber-800, red-800, etc.) so the
  // status pills stay readable on the white profile/seller backgrounds. The
  // dark-mode 400 variants are preserved via dark: prefixes.
  let statusBadge = badge('Not set up', 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-400')
  let cta = 'Set up payouts'
  let helper = 'Connect a bank account to receive payouts when buyers purchase your listings.'
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
    helper = 'You\'re fully set up. Earnings from sales transfer to your bank automatically.'
  }
  if (state?.status === 'stripe_unconfigured') {
    statusBadge = badge('Coming soon', 'bg-zinc-500/20 text-zinc-400')
    helper = 'Payouts aren\'t available yet. We\'ll email you when Stripe Connect goes live.'
  }

  return (
    <div className={cn(
      'p-6 rounded-2xl border',
      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Get paid for your work
        </h3>
        {statusBadge}
      </div>

      <p className={cn('text-sm mb-4', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
        {helper}
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {flash && (
        <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-sm text-emerald-300">
          <Check className="w-4 h-4 mt-0.5 shrink-0" /> {flash}
        </div>
      )}

      {/* Earnings + cashout — only renders when connected. Lifetime stats
          always show so empty sellers see "0 sales · $0" not nothing. */}
      {earnings && (
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Balance</p>
            <p className="text-lg font-bold">${(earnings.balance.usdCents / 100).toFixed(2)}</p>
            <p className="text-[10px] text-zinc-600">{earnings.balance.credits.toLocaleString()} credits</p>
          </div>
          <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Lifetime sales</p>
            <p className="text-lg font-bold">{earnings.lifetime.salesCount}</p>
            <p className="text-[10px] text-zinc-600">{earnings.lifetime.creditsEarned.toLocaleString()} earned</p>
          </div>
          <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Min payout</p>
            <p className="text-lg font-bold">${(earnings.config.minPayoutCents / 100).toFixed(0)}</p>
            <p className="text-[10px] text-zinc-600">{earnings.config.minPayoutCredits} credits</p>
          </div>
        </div>
      )}

      {/* Cashout button — only when payouts ready AND there's enough balance. */}
      {earnings && earnings.payoutsReady && earnings.balance.usdCents >= earnings.config.minPayoutCents && (
        <button
          onClick={cashOut}
          disabled={cashingOut}
          className={cn(
            'mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition',
            'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-60'
          )}
        >
          {cashingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          Cash out ${(earnings.balance.usdCents / 100).toFixed(2)}
        </button>
      )}

      {/* Recent activity — sales + payouts side-by-side. */}
      {earnings && (earnings.recentSales.length > 0 || earnings.recentPayouts.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {earnings.recentSales.length > 0 && (
            <details className={cn('rounded-xl border p-3', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
              <summary className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Recent sales ({earnings.recentSales.length})
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {earnings.recentSales.slice(0, 8).map((s) => (
                  <li key={s._id} className="flex justify-between gap-2">
                    <span className="truncate">{s.listingTitle}</span>
                    <span className="font-mono shrink-0">+{s.priceCredits}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {earnings.recentPayouts.length > 0 && (
            <details className={cn('rounded-xl border p-3', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200')}>
              <summary className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Recent payouts ({earnings.recentPayouts.length})
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {earnings.recentPayouts.slice(0, 8).map((p) => (
                  <li key={p._id} className="flex justify-between gap-2">
                    <span className="truncate">{new Date(p.createdAt).toLocaleDateString()} · {p.status}</span>
                    <span className="font-mono shrink-0">${(p.amountCents / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      ) : state?.status === 'stripe_unconfigured' ? (
        <p className="text-xs text-zinc-500">Stripe Connect not configured on this deploy.</p>
      ) : state?.status === 'enabled' ? (
        <div className="flex items-center gap-3 text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
            Connected · charges {state.chargesEnabled ? 'on' : 'off'} · payouts {state.payoutsEnabled ? 'on' : 'off'}
          </span>
        </div>
      ) : (
        <button
          onClick={startOnboarding}
          disabled={linking}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition',
            'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-60'
          )}
        >
          {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          {cta}
        </button>
      )}
    </div>
  )
}
