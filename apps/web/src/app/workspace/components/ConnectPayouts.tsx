'use client'

import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectStatus {
  connected: boolean
  status?: 'not_started' | 'pending' | 'restricted' | 'enabled' | string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  pendingRequirement?: string | null
}

// Self-contained payout-setup control for store owners. Reuses the same Stripe
// Connect onboarding as the marketplace (/api/stripe/connect/{status,account-link}).
// Until status === 'enabled', storefront checkout is blocked server-side — this
// is how the owner clears that block and starts getting paid.
export function ConnectPayouts({ isDark }: { isDark: boolean }) {
  const [st, setSt] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetch('/api/stripe/connect/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (live) setSt(d) })
      .catch(() => { if (live) setErr('Could not load payout status') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  const ready = st?.status === 'enabled'

  async function connect() {
    setLinking(true)
    setErr(null)
    try {
      const r = await fetch('/api/stripe/connect/account-link', { method: 'POST' })
      const d = await r.json()
      if (!r.ok || !d.url) throw new Error(d.error || 'Could not start payout setup')
      window.location.href = d.url
    } catch (e: any) {
      setErr(e?.message || 'Could not start payout setup')
      setLinking(false)
    }
  }

  return (
    <div className={cn('rounded-lg border p-3', isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200')}>
      <div className={cn('flex items-center gap-1.5 text-xs font-medium mb-1.5', isDark ? 'text-zinc-300' : 'text-slate-700')}>
        <Banknote className="w-3.5 h-3.5" /> Store payouts
      </div>
      {loading ? (
        <div className={cn('flex items-center gap-2 text-[11px]', isDark ? 'text-zinc-500' : 'text-slate-500')}>
          <Loader2 className="w-3 h-3 animate-spin" /> Checking…
        </div>
      ) : ready ? (
        <div className={cn('flex items-center gap-1.5 text-[11px] font-medium', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Connected — store sales pay out to you
        </div>
      ) : (
        <>
          <p className={cn('text-[11px] mb-2 leading-relaxed', isDark ? 'text-zinc-500' : 'text-slate-500')}>
            {st?.connected
              ? 'Finish your Stripe payout setup to start accepting store payments.'
              : 'Connect Stripe to accept payments on your store — money lands in your account, minus a small platform fee. Checkout stays disabled until this is done.'}
            {st?.pendingRequirement ? ` Still needed: ${st.pendingRequirement}.` : ''}
          </p>
          <button
            onClick={connect}
            disabled={linking}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition disabled:opacity-60',
              isDark ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30' : 'bg-emerald-600 text-white hover:bg-emerald-700',
            )}
          >
            {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {st?.connected ? 'Finish payout setup' : 'Connect payouts'}
          </button>
        </>
      )}
      {err && <p className={cn('text-[10px] mt-1.5', isDark ? 'text-red-400' : 'text-red-600')}>{err}</p>}
    </div>
  )
}
