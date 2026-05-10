'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/stripe-plans'

const PLAN_META: Record<string, { icon: typeof Zap; color: string; description: string }> = {
  free: { icon: Zap, color: 'from-slate-500 to-slate-600', description: 'Perfect for trying out the platform' },
  starter: { icon: TrendingUp, color: 'from-emerald-500 to-teal-500', description: 'For solo creators getting started' },
  pro: { icon: Crown, color: 'from-violet-500 to-fuchsia-500', description: 'For creators and small businesses' },
  scale: { icon: Rocket, color: 'from-amber-500 to-orange-500', description: 'For growing teams' },
  enterprise: { icon: Gem, color: 'from-rose-500 to-red-500', description: 'For agencies and large orgs' },
}

const PLANS = SUBSCRIPTION_PLANS.map((p) => {
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
  const [loading, setLoading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            WebStew
          </Link>
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build More, Pay Less
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Choose the perfect plan for your needs. Upgrade anytime, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon
            const price = billingPeriod === 'annual' ? Math.floor(plan.annualPrice / 12) : plan.monthlyPrice
            const isCurrentPlan = session?.user && plan.id === 'free' // TODO: Check actual plan

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  plan.popular
                    ? 'border-violet-500 bg-violet-500/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">${price}</span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-slate-400">/mo</span>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase('plan', plan.id)}
                  disabled={loading === `plan-${plan.id}` || isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-violet-600 hover:bg-violet-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
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
      <section className="pb-16 px-6 border-t border-white/10 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">No subscription required</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Or just buy credits</h2>
            <p className="text-slate-400">One-time purchase, never expires. Use anytime.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-6 rounded-2xl border ${
                  pack.popular
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                    Best Value
                  </div>
                )}
                {pack.savings && !pack.popular && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded">
                    SAVE {pack.savings}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{pack.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">${(pack.priceUsd / 100).toFixed(0)}</span>
                  <span className="text-xs text-slate-500">.{((pack.priceUsd % 100) || 0).toString().padStart(2,'0')}</span>
                </div>
                <p className="text-emerald-400 text-sm font-medium mb-4">{pack.credits.toLocaleString()} credits</p>
                <p className="text-xs text-slate-500 mb-4">
                  ≈ {Math.floor(pack.credits / 10)} websites · {Math.floor(pack.credits / 5)} AI images
                </p>
                <button
                  onClick={() => handlePurchase('credits', pack.id)}
                  disabled={loading === `credits-${pack.id}`}
                  className={`w-full py-2.5 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    pack.popular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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
      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Credit Usage</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CREDIT_COSTS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.action} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                  <Icon className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                  <p className="text-white font-medium">{item.action}</p>
                  <p className="text-violet-400 text-sm">{item.cost} credits</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
          <p className="text-slate-400 mb-6">
            Contact us at support@webstew.ai for any questions about plans or billing.
          </p>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition"
          >
            Back to Building
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  )
}
