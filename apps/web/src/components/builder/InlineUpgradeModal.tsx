'use client'

import { useState } from 'react'
import { Check, Loader2, Sparkles, X, Zap } from 'lucide-react'
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/stripe-plans'
import { cn } from '@/lib/utils'
import { useModalA11y } from '@/hooks/useModalA11y'

interface Props {
  open: boolean
  onClose: () => void
  isDark?: boolean
  currentPlan?: string
  trigger?: 'low_credits' | 'out_of_credits' | 'manual'
}

const DISPLAY_PLANS = SUBSCRIPTION_PLANS.filter((p) => p.id !== 'free' && p.id !== 'enterprise')
const DISPLAY_PACKS = CREDIT_PACKAGES.slice(0, 4) // mini, starter, professional, enterprise

export function InlineUpgradeModal({ open, onClose, isDark = true, currentPlan, trigger }: Props) {
  const [tab, setTab] = useState<'plans' | 'credits'>('plans')
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useModalA11y<HTMLDivElement>(open, onClose)

  if (!open) return null

  async function checkout(type: 'plan' | 'pack', id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const body = type === 'plan'
        ? { planId: id, billingPeriod: period }
        : { packageId: id }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
      setLoadingId(null)
    }
  }

  const annualSavingsPct = 17

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inline-upgrade-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden',
          isDark ? 'bg-zinc-950 border-white/10' : 'bg-white border-slate-200'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b',
          isDark ? 'border-white/[0.06]' : 'border-slate-100'
        )}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div id="inline-upgrade-title" className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                {trigger === 'out_of_credits' ? 'Out of credits' : trigger === 'low_credits' ? 'Running low' : 'Upgrade Webstew'}
              </div>
              <div className={cn('text-[11px]', isDark ? 'text-zinc-500' : 'text-slate-400')}>
                {trigger === 'out_of_credits'
                  ? 'Top up to keep building — no work is lost.'
                  : trigger === 'low_credits'
                  ? 'Keep momentum — top up or upgrade now.'
                  : 'Unlock more credits, projects, and AI models.'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn('p-1.5 rounded-lg', isDark ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className={cn('flex gap-0 px-5 pt-3', isDark ? '' : '')}>
          {(['plans', 'credits'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2',
                tab === t
                  ? isDark
                    ? 'text-white border-violet-500'
                    : 'text-violet-700 border-violet-500'
                  : isDark
                  ? 'text-zinc-500 border-transparent hover:text-zinc-300'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              )}
            >
              {t === 'plans' ? 'Subscription plans' : 'Buy credits (one-time)'}
            </button>
          ))}
        </div>

        <div className={cn('h-px', isDark ? 'bg-white/[0.06]' : 'bg-slate-100')} />

        {/* Plans tab */}
        {tab === 'plans' && (
          <div className="p-5 space-y-4">
            {/* Monthly / Annual toggle */}
            <div className="flex items-center justify-center gap-2">
              <span className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-slate-500')}>Monthly</span>
              <button
                onClick={() => setPeriod(p => p === 'monthly' ? 'annual' : 'monthly')}
                aria-label={`Switch to ${period === 'annual' ? 'monthly' : 'annual'} billing`}
                className={cn(
                  // Wider container + matching knob travel so the knob can't
                  // visually escape the pill in any browser zoom/font setting.
                  'relative w-11 h-6 rounded-full transition-colors shrink-0',
                  period === 'annual'
                    ? 'bg-violet-600'
                    : isDark ? 'bg-zinc-700' : 'bg-slate-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  period === 'annual' ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
              <span className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-slate-500')}>
                Annual
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                  -{annualSavingsPct}%
                </span>
              </span>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-3 gap-3">
              {DISPLAY_PLANS.map((plan) => {
                const price = period === 'annual'
                  ? Math.round(plan.annualPrice / 12 / 100)
                  : Math.round(plan.monthlyPrice / 100)
                const isCurrent = currentPlan === plan.id
                const isLoading = loadingId === plan.id

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative flex flex-col rounded-xl border p-3.5 transition-all',
                      plan.popular
                        ? isDark
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : 'border-violet-400 bg-violet-50'
                        : isDark
                        ? 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                      isCurrent && (isDark ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-emerald-400 bg-emerald-50')
                    )}
                  >
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold whitespace-nowrap">
                        Most popular
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold whitespace-nowrap">
                        Current plan
                      </div>
                    )}

                    <div className={cn('text-xs font-semibold mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                      {plan.name}
                    </div>
                    <div className="flex items-baseline gap-0.5 mb-2">
                      <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>${price}</span>
                      <span className={cn('text-[10px]', isDark ? 'text-zinc-500' : 'text-slate-400')}>/mo</span>
                    </div>
                    <div className={cn('text-[10px] mb-3', isDark ? 'text-zinc-400' : 'text-slate-500')}>
                      {plan.monthlyCredits.toLocaleString()} credits/mo
                    </div>

                    <ul className="space-y-1 mb-4 flex-1">
                      {plan.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className={cn('w-3 h-3 mt-0.5 shrink-0', isDark ? 'text-violet-400' : 'text-violet-600')} />
                          <span className={cn('text-[10px]', isDark ? 'text-zinc-400' : 'text-slate-500')}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !isCurrent && checkout('plan', plan.id)}
                      disabled={isCurrent || isLoading || loadingId !== null}
                      className={cn(
                        'w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all',
                        isCurrent
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-emerald-100 text-emerald-700 cursor-default'
                          : plan.popular
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-sm'
                          : isDark
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white',
                        (loadingId !== null && loadingId !== plan.id) && 'opacity-50'
                      )}
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {isCurrent ? 'Active' : isLoading ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Credits tab */}
        {tab === 'credits' && (
          <div className="p-5">
            <p className={cn('text-[11px] mb-4', isDark ? 'text-zinc-500' : 'text-slate-400')}>
              Credits never expire. Use them for any AI generation.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {DISPLAY_PACKS.map((pack) => {
                const isLoading = loadingId === pack.id
                const priceWhole = Math.floor(pack.priceUsd / 100)
                const priceCents = (pack.priceUsd % 100).toString().padStart(2, '0')

                return (
                  <button
                    key={pack.id}
                    onClick={() => checkout('pack', pack.id)}
                    disabled={loadingId !== null}
                    className={cn(
                      'relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all',
                      pack.popular
                        ? isDark
                          ? 'border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20'
                          : 'border-violet-400 bg-violet-50 hover:bg-violet-100'
                        : isDark
                        ? 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      loadingId !== null && loadingId !== pack.id && 'opacity-50'
                    )}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-bold">
                        Best value
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap className={cn('w-3.5 h-3.5', pack.popular ? 'text-violet-400' : isDark ? 'text-zinc-400' : 'text-slate-500')} />
                      <span className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {pack.credits.toLocaleString()} credits
                      </span>
                    </div>
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                        ${priceWhole}
                      </span>
                      <span className={cn('text-[10px]', isDark ? 'text-zinc-500' : 'text-slate-400')}>
                        .{priceCents}
                      </span>
                    </div>
                    {pack.savings && (
                      <span className="text-[10px] text-emerald-400 font-medium">{pack.savings} off</span>
                    )}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-5 pb-3">
            <p className="text-xs text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className={cn('px-5 py-3 border-t text-center', isDark ? 'border-white/[0.06]' : 'border-slate-100')}>
          <p className={cn('text-[10px]', isDark ? 'text-zinc-600' : 'text-slate-400')}>
            Payments secured by Stripe · Cancel anytime · Credits never expire
          </p>
        </div>
      </div>
    </div>
  )
}
