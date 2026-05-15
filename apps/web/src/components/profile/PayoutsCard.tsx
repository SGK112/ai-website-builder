'use client'

// Payouts card for /profile — Stripe Connect Express onboarding entry
// point. Shows current account status (not started / pending / enabled)
// + a button that either kicks off onboarding or refreshes the link.

import { useEffect, useState } from 'react'
import { Wallet, Loader2, AlertCircle, Check, ExternalLink } from 'lucide-react'
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

export function PayoutsCard({ isDark }: Props) {
  const [state, setState] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/stripe/connect/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (alive) setState(d) })
      .catch(() => { if (alive) setError('Could not load payout status') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
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

  let statusBadge = badge('Not set up', 'bg-zinc-500/20 text-zinc-400')
  let cta = 'Set up payouts'
  let helper = 'Connect a bank account to receive payouts when buyers purchase your listings.'
  if (state?.status === 'pending') {
    statusBadge = badge('Onboarding', 'bg-amber-500/20 text-amber-400')
    cta = 'Continue onboarding'
    helper = state?.pendingRequirement
      ? `Stripe still needs: ${state.pendingRequirement.replace(/_/g, ' ')}`
      : 'Finish the steps Stripe requires to enable payouts.'
  }
  if (state?.status === 'restricted') {
    statusBadge = badge('Restricted', 'bg-red-500/20 text-red-400')
    cta = 'Fix account'
    helper = 'Stripe has restricted this account. Open Stripe to resolve.'
  }
  if (state?.status === 'enabled') {
    statusBadge = badge('Payouts enabled', 'bg-emerald-500/20 text-emerald-400')
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
