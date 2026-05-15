'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Check,
  Zap,
  Crown,
  Rocket,
  Gem,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Globe,
  Code,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  Settings,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/stripe-plans'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { WebstewLogo } from '@/components/brand/WebstewLogo'

const PLAN_META: Record<string, { icon: typeof Zap; color: string; description: string }> = {
  free: { icon: Zap, color: 'from-slate-500 to-slate-600', description: 'Perfect for trying out the platform' },
  starter: { icon: TrendingUp, color: 'from-emerald-500 to-teal-500', description: 'For solo creators getting started' },
  pro: { icon: Crown, color: 'from-violet-500 to-fuchsia-500', description: 'For creators and small businesses' },
  scale: { icon: Rocket, color: 'from-amber-500 to-orange-500', description: 'For growing teams' },
  enterprise: { icon: Gem, color: 'from-rose-500 to-red-500', description: 'For agencies and large orgs' },
}

// Enterprise stays in SUBSCRIPTION_PLANS (for existing subscribers + back-
// channel sales deals via direct checkout URL), but it's filtered out of the
// self-serve grid below — $399/mo is sales-led, not click-to-subscribe. The
// "Contact sales" card at the end is the public CTA.
const PLANS = SUBSCRIPTION_PLANS.filter((p) => p.id !== 'enterprise').map((p) => {
  const meta = PLAN_META[p.id] ?? PLAN_META.pro
  return {
    id: p.id,
    name: p.name,
    monthlyPrice: p.monthlyPrice / 100,
    annualPrice: p.annualPrice / 100,
    popular: p.popular,
    icon: meta.icon,
    color: meta.color,
    description: meta.description,
    features: p.features,
  }
})

const CREDIT_COSTS = [
  { action: 'Generate Website', cost: 10, icon: Globe },
  { action: 'Chat Message', cost: 1, icon: MessageSquare },
  { action: 'AI Image', cost: 5, icon: ImageIcon },
  { action: 'Code Refine', cost: 2, icon: Code },
]

export default function UpgradePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [monthCreditsUsed, setMonthCreditsUsed] = useState<number | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  // Pull the user's actual plan + credit usage so we can label the current
  // plan card and decide whether to show "Manage subscription".
  useEffect(() => {
    if (!session?.user) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/usage')
        if (!r.ok) return
        const d = await r.json()
        if (cancelled) return
        setCurrentPlan(d?.user?.plan ?? 'free')
        setCreditsRemaining(d?.user?.credits ?? 0)
        setMonthCreditsUsed(d?.month?.credits ?? 0)
      } catch {
        /* non-fatal — page still works without the badge */
      }
    })()
    return () => { cancelled = true }
  }, [session?.user])

  const openBillingPortal = async () => {
    setErrorMsg(null)
    setPortalLoading(true)
    try {
      const r = await fetch('/api/billing/portal', { method: 'POST' })
      const d = await r.json()
      if (d.url) {
        window.location.href = d.url
        return
      }
      setErrorMsg(d.error || `Portal failed (HTTP ${r.status})`)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Network error')
    } finally {
      setPortalLoading(false)
    }
  }

  // Unified handler for both subscription plan and one-time credit pack purchases.
  // mode='plan' sends planId; mode='credits' sends packageId.
  const handlePurchase = async (mode: 'plan' | 'credits', id: string) => {
    setErrorMsg(null)
    if (!session) {
      router.push('/login?next=/upgrade')
      return
    }
    if (mode === 'plan' && id === 'free') return

    setLoading(`${mode}-${id}`)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'plan'
            ? { planId: id, billingPeriod }
            : { packageId: id }
        ),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
        return
      }
      // Surface the real error so we can fix the actual problem (Stripe not
      // configured, missing price ID, auth issue, etc.) instead of a vague alert.
      const reason = data.error || `Checkout failed (HTTP ${res.status})`
      setErrorMsg(reason)
      console.error('Upgrade error:', reason)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Network error'
      setErrorMsg(msg)
      console.error('Upgrade error:', error)
    } finally {
      setLoading(null)
    }
  }

  // Backwards-compat name used in older inline calls
  const handleUpgrade = (planId: string) => handlePurchase('plan', planId)

  return (
    <div className={cn(
      'min-h-screen transition-colors',
      isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-white to-slate-50'
    )}>
      {/* Header */}
      <header className={cn(
        'border-b backdrop-blur-xl sticky top-0 z-50',
        isDark ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/90'
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/workspace" className={cn(
            'flex items-center gap-2 transition',
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          )}>
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
          <WebstewLogo href="/" size="sm" isDark={isDark} />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-sm font-medium">Upgrade Your Plan</span>
          </div>
          <h1 className={cn(
            'text-4xl md:text-5xl font-bold mb-4',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Build More, Pay Less
          </h1>
          <p className={cn(
            'text-xl mb-8',
            isDark ? 'text-slate-400' : 'text-slate-600'
          )}>
            Choose the perfect plan for your needs. Upgrade anytime, cancel anytime.
          </p>

          {/* Current plan / credit status — only when signed in */}
          {session?.user && currentPlan && (
            <div className={cn(
              'max-w-xl mx-auto mb-6 px-4 py-3 rounded-xl border flex flex-wrap items-center justify-center gap-3 text-sm',
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            )}>
              <span className={cn(isDark ? 'text-slate-400' : 'text-slate-600')}>Current plan:</span>
              <span className={cn('font-medium capitalize', isDark ? 'text-white' : 'text-slate-900')}>{currentPlan}</span>
              {creditsRemaining !== null && (
                <>
                  <span className={cn(isDark ? 'text-slate-600' : 'text-slate-300')}>·</span>
                  <span className={cn(isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {creditsRemaining.toLocaleString()} credits
                    {monthCreditsUsed !== null && monthCreditsUsed > 0 && (
                      <span className={cn(isDark ? 'text-slate-500' : 'text-slate-500')}> ({monthCreditsUsed} used this month)</span>
                    )}
                  </span>
                </>
              )}
              {currentPlan !== 'free' && (
                <>
                  <span className={cn(isDark ? 'text-slate-600' : 'text-slate-300')}>·</span>
                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    className={cn(
                      'inline-flex items-center gap-1.5 disabled:opacity-50',
                      isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
                    )}
                  >
                    {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                    Manage subscription
                  </button>
                </>
              )}
            </div>
          )}

          {/* Billing Toggle */}
          <div className={cn(
            'inline-flex items-center gap-3 p-1 rounded-xl border',
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          )}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition',
                billingPeriod === 'monthly'
                  ? 'bg-violet-600 text-white'
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
                billingPeriod === 'annual'
                  ? 'bg-violet-600 text-white'
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Yearly
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              )}>
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon
            const price = billingPeriod === 'annual' ? Math.floor(plan.annualPrice / 12) : plan.monthlyPrice
            const isCurrentPlan = !!session?.user && currentPlan === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative p-6 rounded-2xl border',
                  plan.popular
                    ? isDark
                      ? 'border-violet-500 bg-violet-500/5'
                      : 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10'
                    : isDark
                      ? 'border-white/10 bg-white/[0.02]'
                      : 'border-slate-200 bg-white shadow-sm'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className={cn('text-xl font-bold mb-1', isDark ? 'text-white' : 'text-slate-900')}>{plan.name}</h3>
                <p className={cn('text-sm mb-4', isDark ? 'text-slate-400' : 'text-slate-600')}>{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className={cn('text-4xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>${price}</span>
                  {plan.monthlyPrice > 0 && (
                    <span className={cn(isDark ? 'text-slate-400' : 'text-slate-500')}>/mo</span>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase('plan', plan.id)}
                  disabled={loading === `plan-${plan.id}` || isCurrentPlan}
                  className={cn(
                    'w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    plan.popular
                      ? 'bg-violet-600 hover:bg-violet-500 text-white'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                  )}
                >
                  {loading === `plan-${plan.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.monthlyPrice === 0 ? (
                    'Get Started'
                  ) : (
                    'Upgrade Now'
                  )}
                </button>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className={cn('w-4 h-4 mt-0.5 shrink-0', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                      <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Contact sales row — Enterprise tier is sales-led, not self-serve.
            Mailto keeps it dependency-free; swap to a real form whenever you
            want lead capture. */}
        <div className="max-w-6xl mx-auto mt-6">
          <div className={cn(
            'p-6 rounded-2xl border bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-amber-500/5 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between',
            isDark ? 'border-white/10' : 'border-slate-200'
          )}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Need more? Enterprise &amp; custom plans</h3>
                <p className={cn('text-sm mt-0.5', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  10,000+ credits/month, SSO/SAML, dedicated support, white-label, custom SLA.
                </p>
              </div>
            </div>
            <a
              href="mailto:sales@webstew.net?subject=Webstew%20Enterprise%20inquiry"
              className={cn(
                'shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition',
                isDark
                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              Contact sales
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </a>
          </div>
        </div>
      </section>

      {/* Inline error surfaced from /api/checkout failures */}
      {errorMsg && (
        <section className="px-6 -mt-4 mb-4">
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-red-400 text-sm font-medium mb-1">Checkout failed</div>
                <div className="text-red-400/80 text-xs font-mono break-words">{errorMsg}</div>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400/60 hover:text-red-400 text-xs">Dismiss</button>
            </div>
          </div>
        </section>
      )}

      {/* One-time Credit Packs — for users who don't want to subscribe */}
      <section className={cn(
        'pb-16 px-6 border-t pt-16',
        isDark ? 'border-white/10' : 'border-slate-200'
      )}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-2 border rounded-full mb-4',
              isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            )}>
              <Zap className={cn('w-4 h-4', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
              <span className={cn('text-sm font-medium', isDark ? 'text-emerald-400' : 'text-emerald-700')}>No subscription required</span>
            </div>
            <h2 className={cn('text-3xl font-bold mb-2', isDark ? 'text-white' : 'text-slate-900')}>Or just buy credits</h2>
            <p className={cn(isDark ? 'text-slate-400' : 'text-slate-600')}>One-time purchase, never expires. Use anytime.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'relative p-6 rounded-2xl border',
                  pack.popular
                    ? isDark
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10'
                    : isDark
                      ? 'border-white/10 bg-white/[0.02]'
                      : 'border-slate-200 bg-white shadow-sm'
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                    Best Value
                  </div>
                )}
                {pack.savings && !pack.popular && (
                  <div className={cn(
                    'absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded',
                    isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                  )}>
                    SAVE {pack.savings}
                  </div>
                )}
                <h3 className={cn('text-lg font-bold mb-1', isDark ? 'text-white' : 'text-slate-900')}>{pack.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>${(pack.priceUsd / 100).toFixed(0)}</span>
                  <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>.{((pack.priceUsd % 100) || 0).toString().padStart(2,'0')}</span>
                </div>
                <p className={cn('text-sm font-medium mb-4', isDark ? 'text-emerald-400' : 'text-emerald-600')}>{pack.credits.toLocaleString()} credits</p>
                <p className={cn('text-xs mb-4', isDark ? 'text-slate-500' : 'text-slate-500')}>
                  ≈ {Math.floor(pack.credits / 10)} websites · {Math.floor(pack.credits / 5)} AI images
                </p>
                <button
                  onClick={() => handlePurchase('credits', pack.id)}
                  disabled={loading === `credits-${pack.id}`}
                  className={cn(
                    'w-full py-2.5 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    pack.popular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                  )}
                >
                  {loading === `credits-${pack.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Buy credits'
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Costs Reference */}
      <section className={cn('py-16 px-6 border-t', isDark ? 'border-white/10' : 'border-slate-200')}>
        <div className="max-w-4xl mx-auto">
          <h2 className={cn('text-2xl font-bold text-center mb-8', isDark ? 'text-white' : 'text-slate-900')}>Credit Usage</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CREDIT_COSTS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.action} className={cn(
                  'p-4 rounded-xl border text-center',
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                )}>
                  <Icon className={cn('w-6 h-6 mx-auto mb-2', isDark ? 'text-violet-400' : 'text-violet-600')} />
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-slate-900')}>{item.action}</p>
                  <p className={cn('text-sm', isDark ? 'text-violet-400' : 'text-violet-600')}>{item.cost} credits</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={cn('py-16 px-6 border-t', isDark ? 'border-white/10' : 'border-slate-200')}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={cn('text-2xl font-bold mb-4', isDark ? 'text-white' : 'text-slate-900')}>Questions?</h2>
          <p className={cn('mb-6', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Contact us at support@webstew.net for any questions about plans or billing.
          </p>
          <Link
            href="/workspace"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition',
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            )}
          >
            Back to Building
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </section>

      {/* Legal footer — consistent surface across logged-in pages */}
      <footer className={cn('py-8 px-6 border-t', isDark ? 'border-white/5' : 'border-slate-200')}>
        <div className={cn(
          'max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs',
          isDark ? 'text-slate-500' : 'text-slate-500'
        )}>
          <div className="flex items-center gap-2">
            <WebstewLogo size="sm" isDark={isDark} />
            <span>· © {new Date().getFullYear()} Remodely LLC</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/terms" className={cn('transition-colors', isDark ? 'hover:text-slate-200' : 'hover:text-slate-800')}>Terms</Link>
            <Link href="/privacy" className={cn('transition-colors', isDark ? 'hover:text-slate-200' : 'hover:text-slate-800')}>Privacy</Link>
            <a href="mailto:support@webstew.net" className={cn('transition-colors', isDark ? 'hover:text-slate-200' : 'hover:text-slate-800')}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
