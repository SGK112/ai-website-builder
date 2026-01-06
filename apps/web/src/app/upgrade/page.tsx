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
  ArrowLeft,
  Sparkles,
  Globe,
  Code,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
} from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out the platform',
    icon: Zap,
    color: 'from-slate-500 to-slate-600',
    features: [
      '50 credits/month',
      '3 AI generations',
      '1 project',
      'Basic templates',
      'Community support',
    ],
    limitations: [
      'WebStew branding',
      'No custom domain',
      'Limited exports',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    period: 'month',
    description: 'For creators and small businesses',
    icon: Crown,
    color: 'from-violet-500 to-fuchsia-500',
    popular: true,
    features: [
      '500 credits/month',
      'Unlimited AI generations',
      '10 projects',
      'All premium templates',
      'Custom domains',
      'Priority support',
      'No branding',
      'Export to Next.js',
    ],
    limitations: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'For teams and agencies',
    icon: Rocket,
    color: 'from-amber-500 to-orange-500',
    features: [
      'Unlimited credits',
      'Unlimited AI generations',
      'Unlimited projects',
      'White-label solution',
      'Custom integrations',
      'API access',
      'Dedicated support',
      'Team collaboration',
      'Analytics dashboard',
    ],
    limitations: [],
  },
]

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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const handleUpgrade = async (planId: string) => {
    if (!session) {
      router.push('/login?redirect=/upgrade')
      return
    }

    if (planId === 'free') return

    setLoading(planId)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingPeriod,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

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
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                billingPeriod === 'yearly'
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
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon
            const price = billingPeriod === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price
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
                  {plan.price > 0 && (
                    <span className="text-slate-400">/{billingPeriod === 'yearly' ? 'mo' : plan.period}</span>
                  )}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-violet-600 hover:bg-violet-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
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
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3 text-sm">
                      <span className="w-4 h-4 text-slate-600 mt-0.5 shrink-0">-</span>
                      <span className="text-slate-500">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
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
