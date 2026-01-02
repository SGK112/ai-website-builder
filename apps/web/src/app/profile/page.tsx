'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  CreditCard,
  Package,
  Clock,
  Zap,
  Check,
  ChevronRight,
  Settings,
  Bell,
  Shield,
  Key,
  LogOut,
  Home,
  Crown,
  Sparkles,
  TrendingUp,
  BarChart3,
  FileCode,
  Download,
  ExternalLink,
  Calendar,
  Star,
  Gift,
  ArrowRight,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  Palette,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { StarryNight, SunriseBackground } from '@/components/landing/BackgroundEffects'
import { WebStewNav } from '@/components/shared/WebStewNav'

interface PricingPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
  current?: boolean
}

interface UsageStats {
  buildsUsed: number
  buildsLimit: number
  storageUsed: number
  storageLimit: number
  apiCalls: number
  apiLimit: number
}

interface BillingHistory {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  invoice: string
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '5 website builds per month',
      'Basic templates',
      'Community support',
      '1GB storage',
      'WebStew branding',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    popular: true,
    features: [
      'Unlimited website builds',
      'Premium templates',
      'Priority support',
      '10GB storage',
      'No branding',
      'Custom domains',
      'Analytics dashboard',
      'AI chat assistance',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 49,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Team collaboration',
      '5 team members',
      '50GB storage',
      'API access',
      'White-label exports',
      'Custom integrations',
      'Dedicated support',
    ],
  },
]

// Appearance Settings Component
function AppearanceSettings() {
  const { theme, setTheme, isTransitioning } = useTheme()
  const isDark = theme === 'dark'

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Bright and clean interface' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
  ]

  return (
    <div className={cn(
      'p-6 rounded-2xl border',
      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
    )}>
      <div className="flex items-center gap-3 mb-6">
        <Palette className={isDark ? 'w-5 h-5 text-violet-400' : 'w-5 h-5 text-orange-500'} />
        <h3 className="text-lg font-semibold">Appearance</h3>
      </div>

      {/* Theme Selection */}
      <div className="mb-6">
        <label className={cn('text-sm font-medium mb-3 block', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
          Theme
        </label>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id as 'light' | 'dark')}
              disabled={isTransitioning}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all text-left',
                theme === option.id
                  ? isDark
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-orange-500 bg-orange-50'
                  : isDark
                    ? 'border-white/10 hover:border-white/20 bg-white/5'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50',
                isTransitioning && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Selected indicator */}
              {theme === option.id && (
                <div className={cn(
                  'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
                  isDark ? 'bg-violet-500' : 'bg-orange-500'
                )}>
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Theme preview */}
              <div className={cn(
                'w-full h-20 rounded-lg mb-3 overflow-hidden border',
                option.id === 'dark'
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'bg-gradient-to-b from-orange-50 to-white border-zinc-200'
              )}>
                <div className={cn(
                  'h-4 flex items-center gap-1 px-2',
                  option.id === 'dark' ? 'bg-zinc-800' : 'bg-white border-b border-zinc-200'
                )}>
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    option.id === 'dark' ? 'bg-red-500' : 'bg-red-400'
                  )} />
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    option.id === 'dark' ? 'bg-yellow-500' : 'bg-yellow-400'
                  )} />
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    option.id === 'dark' ? 'bg-green-500' : 'bg-green-400'
                  )} />
                </div>
                <div className="p-2 space-y-1.5">
                  <div className={cn(
                    'h-2 rounded w-3/4',
                    option.id === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'
                  )} />
                  <div className={cn(
                    'h-2 rounded w-1/2',
                    option.id === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'
                  )} />
                  <div className={cn(
                    'h-3 rounded w-1/3 mt-2',
                    option.id === 'dark' ? 'bg-violet-500/50' : 'bg-orange-400/50'
                  )} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <option.icon className={cn(
                  'w-4 h-4',
                  theme === option.id
                    ? isDark ? 'text-violet-400' : 'text-orange-500'
                    : isDark ? 'text-zinc-400' : 'text-zinc-500'
                )} />
                <span className="font-medium">{option.label}</span>
              </div>
              <p className={cn('text-xs mt-1', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                {option.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* System preference info */}
      <div className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        isDark ? 'bg-white/5' : 'bg-zinc-50'
      )}>
        <Monitor className={cn('w-4 h-4 mt-0.5', isDark ? 'text-zinc-500' : 'text-zinc-400')} />
        <p className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
          Your theme preference is saved and will be applied across all pages including the landing page.
        </p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'usage' | 'settings'>('profile')
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [credits, setCredits] = useState<number | null>(null)

  // Fetch credits on mount
  useEffect(() => {
    if (session?.user) {
      fetch('/api/credits')
        .then(res => res.json())
        .then(data => setCredits(data.credits))
        .catch(() => setCredits(0))
    }
  }, [session?.user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  // User data from session
  const user = {
    name: session?.user?.name || 'User',
    email: session?.user?.email || '',
    avatar: session?.user?.image || null,
    plan: 'free',
    joinedDate: new Date().toISOString().split('T')[0],
  }

  // Usage stats from credits
  const [usage] = useState<UsageStats>({
    buildsUsed: credits !== null ? Math.max(0, 100 - credits) / 10 : 0,
    buildsLimit: 10,
    storageUsed: 0.2,
    storageLimit: 1,
    apiCalls: 150,
    apiLimit: 500,
  })

  // Billing history
  const [billingHistory] = useState<BillingHistory[]>([])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-500',
      isDark ? 'bg-[#0a0a0b] text-white' : 'bg-gradient-to-b from-orange-50 to-white text-zinc-900'
    )}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isDark ? <StarryNight /> : <SunriseBackground />}
      </div>

      {/* Unified Navigation */}
      <WebStewNav />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            {/* User Card */}
            <div className={cn(
              'p-6 rounded-2xl border mb-6',
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
            )}>
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4',
                  isDark
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                    : 'bg-gradient-to-br from-orange-400 to-pink-500 text-white'
                )}>
                  {user.name.charAt(0)}
                </div>
                <h2 className="font-semibold text-lg">{user.name}</h2>
                <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>{user.email}</p>
                <div className={cn(
                  'flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium',
                  user.plan === 'free'
                    ? 'bg-zinc-500/20 text-zinc-400'
                    : user.plan === 'pro'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-amber-500/20 text-amber-400'
                )}>
                  {user.plan === 'pro' && <Crown className="w-3 h-3" />}
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'bg-orange-100 text-orange-600'
                      : isDark
                        ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Upgrade CTA */}
            {user.plan === 'free' && (
              <div className={cn(
                'mt-6 p-4 rounded-2xl border',
                isDark
                  ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20'
                  : 'bg-gradient-to-br from-orange-50 to-pink-50 border-orange-200'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={isDark ? 'w-4 h-4 text-violet-400' : 'w-4 h-4 text-orange-500'} />
                  <span className="text-sm font-semibold">Upgrade to Pro</span>
                </div>
                <p className={cn('text-xs mb-3', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                  Unlock unlimited builds and premium features.
                </p>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={cn(
                    'w-full py-2 rounded-lg text-xs font-medium transition-all',
                    isDark
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                      : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                  )}
                >
                  View Plans
                </button>
              </div>
            )}
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  )}>
                    <h3 className="text-lg font-semibold mb-6">Personal Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <label className={cn('text-sm font-medium mb-2 block', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          defaultValue={user.name}
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm transition-all',
                            isDark
                              ? 'bg-white/5 border-white/10 focus:border-violet-500/50'
                              : 'bg-zinc-50 border-zinc-200 focus:border-orange-500/50'
                          )}
                        />
                      </div>
                      <div>
                        <label className={cn('text-sm font-medium mb-2 block', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          defaultValue={user.email}
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm transition-all',
                            isDark
                              ? 'bg-white/5 border-white/10 focus:border-violet-500/50'
                              : 'bg-zinc-50 border-zinc-200 focus:border-orange-500/50'
                          )}
                        />
                      </div>
                    </div>
                    <button className={cn(
                      'mt-6 px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isDark
                        ? 'bg-violet-500 text-white hover:bg-violet-600'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    )}>
                      Save Changes
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Websites Built', value: '12', icon: FileCode },
                      { label: 'Total Exports', value: '8', icon: Download },
                      { label: 'Member Since', value: 'Jan 2024', icon: Calendar },
                      { label: 'Current Streak', value: '5 days', icon: TrendingUp },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className={cn(
                          'p-4 rounded-xl border',
                          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                        )}
                      >
                        <stat.icon className={cn('w-5 h-5 mb-2', isDark ? 'text-violet-400' : 'text-orange-500')} />
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-600')}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Current Plan */}
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Current Plan</h3>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        'bg-emerald-500/20 text-emerald-400'
                      )}>
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        isDark ? 'bg-violet-500/20' : 'bg-orange-100'
                      )}>
                        <Package className={isDark ? 'w-6 h-6 text-violet-400' : 'w-6 h-6 text-orange-500'} />
                      </div>
                      <div>
                        <p className="font-semibold">{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan</p>
                        <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          {user.plan === 'free' ? 'Free forever' : '$19/month'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Toggle */}
                  <div className="flex justify-center">
                    <div className={cn(
                      'inline-flex p-1 rounded-xl',
                      isDark ? 'bg-white/5' : 'bg-zinc-100'
                    )}>
                      <button
                        onClick={() => setBillingInterval('month')}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          billingInterval === 'month'
                            ? isDark ? 'bg-white/10 text-white' : 'bg-white text-zinc-900 shadow-sm'
                            : isDark ? 'text-zinc-400' : 'text-zinc-600'
                        )}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingInterval('year')}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                          billingInterval === 'year'
                            ? isDark ? 'bg-white/10 text-white' : 'bg-white text-zinc-900 shadow-sm'
                            : isDark ? 'text-zinc-400' : 'text-zinc-600'
                        )}
                      >
                        Yearly
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                          Save 20%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {plans.map(plan => (
                      <div
                        key={plan.id}
                        className={cn(
                          'relative p-6 rounded-2xl border transition-all',
                          plan.popular
                            ? isDark
                              ? 'bg-gradient-to-b from-violet-500/10 to-fuchsia-500/10 border-violet-500/30'
                              : 'bg-gradient-to-b from-orange-50 to-pink-50 border-orange-300'
                            : isDark
                              ? 'bg-white/5 border-white/10 hover:border-white/20'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm',
                          user.plan === plan.id && 'ring-2 ring-violet-500'
                        )}
                      >
                        {plan.popular && (
                          <div className={cn(
                            'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium',
                            isDark
                              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                              : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white'
                          )}>
                            Most Popular
                          </div>
                        )}
                        <h4 className="font-semibold text-lg mb-2">{plan.name}</h4>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-bold">
                            ${billingInterval === 'year' ? Math.floor(plan.price * 0.8) : plan.price}
                          </span>
                          <span className={isDark ? 'text-zinc-500' : 'text-zinc-600'}>/mo</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map(feature => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className={cn('w-4 h-4 mt-0.5 shrink-0', isDark ? 'text-violet-400' : 'text-orange-500')} />
                              <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          className={cn(
                            'w-full py-3 rounded-xl text-sm font-medium transition-all',
                            user.plan === plan.id
                              ? 'bg-zinc-500/20 text-zinc-400 cursor-default'
                              : plan.popular
                                ? isDark
                                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                                  : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                                : isDark
                                  ? 'bg-white/10 text-white hover:bg-white/20'
                                  : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                          )}
                          disabled={user.plan === plan.id}
                        >
                          {user.plan === plan.id ? 'Current Plan' : 'Upgrade'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Billing History */}
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  )}>
                    <h3 className="text-lg font-semibold mb-4">Billing History</h3>
                    {billingHistory.length === 0 ? (
                      <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                        No billing history yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {billingHistory.map(item => (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-center justify-between p-4 rounded-xl',
                              isDark ? 'bg-white/5' : 'bg-zinc-50'
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                              )}>
                                <Check className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div>
                                <p className="font-medium">{item.invoice}</p>
                                <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                                  {new Date(item.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${item.amount.toFixed(2)}</p>
                              <button className={cn(
                                'text-xs',
                                isDark ? 'text-violet-400 hover:text-violet-300' : 'text-orange-500 hover:text-orange-600'
                              )}>
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Usage Tab */}
              {activeTab === 'usage' && (
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  )}>
                    <h3 className="text-lg font-semibold mb-6">Usage This Month</h3>
                    <div className="space-y-6">
                      {/* Builds */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                            Website Builds
                          </span>
                          <span className="text-sm font-medium">
                            {usage.buildsUsed} / {usage.buildsLimit}
                          </span>
                        </div>
                        <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-zinc-200')}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(usage.buildsUsed / usage.buildsLimit) * 100}%` }}
                            className={cn(
                              'h-full rounded-full',
                              isDark
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                : 'bg-gradient-to-r from-orange-400 to-pink-500'
                            )}
                          />
                        </div>
                      </div>

                      {/* Storage */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                            Storage Used
                          </span>
                          <span className="text-sm font-medium">
                            {usage.storageUsed}GB / {usage.storageLimit}GB
                          </span>
                        </div>
                        <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-zinc-200')}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(usage.storageUsed / usage.storageLimit) * 100}%` }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                      </div>

                      {/* API Calls */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                            API Calls
                          </span>
                          <span className="text-sm font-medium">
                            {usage.apiCalls} / {usage.apiLimit}
                          </span>
                        </div>
                        <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-zinc-200')}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(usage.apiCalls / usage.apiLimit) * 100}%` }}
                            className="h-full rounded-full bg-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage Tips */}
                  <div className={cn(
                    'p-4 rounded-2xl border',
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-amber-50 border-amber-200'
                  )}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-500">Running low on builds?</p>
                        <p className={cn('text-sm mt-1', isDark ? 'text-amber-400/80' : 'text-amber-700')}>
                          Upgrade to Pro for unlimited website builds and more storage.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Appearance */}
                  <AppearanceSettings />

                  {/* Notifications */}
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  )}>
                    <div className="flex items-center gap-3 mb-6">
                      <Bell className={isDark ? 'w-5 h-5 text-violet-400' : 'w-5 h-5 text-orange-500'} />
                      <h3 className="text-lg font-semibold">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Email notifications', desc: 'Receive updates about your projects' },
                        { label: 'Marketing emails', desc: 'News, tips, and special offers' },
                        { label: 'Build alerts', desc: 'Get notified when builds complete' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                              {item.desc}
                            </p>
                          </div>
                          <button className={cn(
                            'w-12 h-6 rounded-full transition-colors',
                            isDark ? 'bg-violet-500' : 'bg-orange-500'
                          )}>
                            <div className="w-5 h-5 bg-white rounded-full ml-auto mr-0.5 shadow-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security */}
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  )}>
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className={isDark ? 'w-5 h-5 text-violet-400' : 'w-5 h-5 text-orange-500'} />
                      <h3 className="text-lg font-semibold">Security</h3>
                    </div>
                    <div className="space-y-4">
                      <button className={cn(
                        'w-full flex items-center justify-between p-4 rounded-xl transition-all',
                        isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-zinc-50 hover:bg-zinc-100'
                      )}>
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-zinc-500" />
                          <div className="text-left">
                            <p className="font-medium">Change Password</p>
                            <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                              Update your password
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>
                      <button className={cn(
                        'w-full flex items-center justify-between p-4 rounded-xl transition-all',
                        isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-zinc-50 hover:bg-zinc-100'
                      )}>
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-zinc-500" />
                          <div className="text-left">
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                              Add an extra layer of security
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className={cn(
                    'p-6 rounded-2xl border',
                    'bg-red-500/5 border-red-500/20'
                  )}>
                    <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delete Account</p>
                        <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
