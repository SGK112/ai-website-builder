'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap,
  Check,
  Sparkles,
  ArrowRight,
  CreditCard,
  Loader2,
  Crown,
  Gift,
  Coins,
  ChevronLeft,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    name: '100 Credits',
    credits: 100,
    price: 9.99,
    popular: false,
  },
  {
    id: 'credits_500',
    name: '500 Credits',
    credits: 500,
    price: 39.99,
    popular: true,
    savings: '20%',
  },
  {
    id: 'credits_1500',
    name: '1,500 Credits',
    credits: 1500,
    price: 99.99,
    popular: false,
    savings: '33%',
  },
]

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 100,
    features: [
      '3 projects',
      '100 starting credits',
      'All integrations',
      'Community support',
      'Export code',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    credits: 500,
    popular: true,
    features: [
      'Unlimited projects',
      '500 credits/month',
      'Priority AI models',
      'Priority support',
      'Custom domains',
      'Remove branding',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 49,
    credits: 2000,
    features: [
      'Everything in Pro',
      '2,000 credits/month',
      'Team collaboration',
      'SSO & SAML',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans')
  const [loading, setLoading] = useState<string | null>(null)
  const [credits, setCredits] = useState(0)
  const [currentPlan, setCurrentPlan] = useState('free')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits')
      const data = await res.json()
      if (res.ok) {
        setCredits(data.credits)
        setCurrentPlan(data.plan)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  const handlePurchaseCredits = async (packageId: string) => {
    setLoading(packageId)
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {canceled && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <X className="w-5 h-5 text-amber-400" />
            <p className="text-amber-400 text-sm">Checkout was canceled. You can try again anytime.</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Upgrade Your Plan</h1>
            <p className="text-slate-400 mt-1">
              Get more credits and unlock premium features
            </p>
          </div>
        </div>

        {/* Credits Display */}
        <div className="mt-8 p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] inline-flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Your Credits</p>
            <p className="text-2xl font-bold text-white">{credits.toLocaleString()}</p>
          </div>
          <div className="h-10 w-px bg-white/10 mx-2" />
          <div>
            <p className="text-sm text-slate-400">Current Plan</p>
            <p className="text-lg font-semibold text-white capitalize">{currentPlan}</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] mb-10 w-fit">
        <button
          onClick={() => setActiveTab('plans')}
          className={cn(
            'px-6 py-3 rounded-xl text-sm font-medium transition-all',
            activeTab === 'plans'
              ? 'bg-white text-black'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          )}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={cn(
            'px-6 py-3 rounded-xl text-sm font-medium transition-all',
            activeTab === 'credits'
              ? 'bg-white text-black'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          )}
        >
          <Gift className="w-4 h-4 inline mr-2" />
          Buy Credits
        </button>
      </div>

      {/* Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'group relative rounded-3xl transition-all duration-300',
                plan.popular ? 'scale-105 z-10' : 'hover:scale-[1.02]'
              )}
            >
              {/* Glow for popular */}
              {plan.popular && (
                <div className="absolute -inset-[2px] bg-gradient-to-b from-purple-500/50 via-blue-500/30 to-transparent rounded-[26px] blur-sm" />
              )}

              <div
                className={cn(
                  'relative h-full p-7 rounded-3xl backdrop-blur-xl border',
                  plan.popular
                    ? 'bg-white/[0.06] border-white/[0.15]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                )}
              >
                {/* Glass highlight */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="relative">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-5">
                    <span className="text-5xl font-bold text-white">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-slate-400 text-lg">/mo</span>
                    )}
                  </div>
                  <p className="text-purple-400 text-sm mt-2">
                    {plan.credits.toLocaleString()} credits/month
                  </p>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    disabled={plan.id === currentPlan || plan.id === 'free'}
                    className={cn(
                      'w-full mt-8 h-12 rounded-xl font-semibold transition-all',
                      plan.id === currentPlan
                        ? 'bg-slate-600 text-white cursor-not-allowed'
                        : plan.popular
                        ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10'
                        : 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white'
                    )}
                  >
                    {plan.id === currentPlan ? 'Current Plan' : plan.id === 'free' ? 'Free' : 'Upgrade'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credit Packages */}
      {activeTab === 'credits' && (
        <div>
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <p className="text-slate-300">
                Credits are used for AI generation, image creation, and more.
                <span className="text-white font-medium ml-1">
                  1 chat message = 1 credit, 1 website generation = 10 credits
                </span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  'group relative rounded-3xl transition-all duration-300',
                  pkg.popular ? 'scale-105 z-10' : 'hover:scale-[1.02]'
                )}
              >
                {/* Glow for popular */}
                {pkg.popular && (
                  <div className="absolute -inset-[2px] bg-gradient-to-b from-orange-500/50 via-amber-500/30 to-transparent rounded-[26px] blur-sm" />
                )}

                <div
                  className={cn(
                    'relative h-full p-7 rounded-3xl backdrop-blur-xl border',
                    pkg.popular
                      ? 'bg-white/[0.06] border-white/[0.15]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                  )}
                >
                  {/* Glass highlight */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />

                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                      Best Value
                    </div>
                  )}

                  {pkg.savings && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg">
                      Save {pkg.savings}
                    </div>
                  )}

                  <div className="relative text-center pt-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
                      <Coins className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
                    <p className="text-4xl font-bold text-white mt-4">
                      ${pkg.price}
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      ${(pkg.price / pkg.credits * 100).toFixed(1)}¢ per credit
                    </p>

                    <Button
                      onClick={() => handlePurchaseCredits(pkg.id)}
                      disabled={loading === pkg.id}
                      className={cn(
                        'w-full mt-8 h-12 rounded-xl font-semibold transition-all',
                        pkg.popular
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10'
                      )}
                    >
                      {loading === pkg.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Buy Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              q: 'What are credits used for?',
              a: 'Credits are consumed when you use AI features like generating websites, chat messages, image generation, and more.',
            },
            {
              q: 'Do credits expire?',
              a: 'No, purchased credits never expire. Monthly credits from subscriptions reset each billing cycle.',
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes, you can cancel anytime. You\'ll keep your credits and access until the end of your billing period.',
            },
            {
              q: 'How do refunds work?',
              a: 'We offer a 7-day money-back guarantee on subscriptions. Credit purchases are non-refundable.',
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]"
            >
              <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
