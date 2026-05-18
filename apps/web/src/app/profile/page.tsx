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
  Share2,
  Copy,
  Trash2,
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
import { PayoutsCard } from '@/components/profile/PayoutsCard'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe-plans'
import { DeployCredentialsCard } from '@/components/profile/DeployCredentialsCard'

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
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'usage' | 'previews' | 'settings'>('profile')
  const [credits, setCredits] = useState<number | null>(null)
  const [actualPlan, setActualPlan] = useState<string>('free')
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  // Preview links — lazy-loaded when the tab opens.
  interface PreviewLink {
    id: string
    token: string
    url: string
    name: string | null
    createdAt: string
    expiresAt: string
  }
  const [previews, setPreviews] = useState<PreviewLink[] | null>(null)
  const [previewsLoading, setPreviewsLoading] = useState(false)
  const [previewsError, setPreviewsError] = useState<string | null>(null)
  const [deletingPreviewId, setDeletingPreviewId] = useState<string | null>(null)
  const [copiedPreviewId, setCopiedPreviewId] = useState<string | null>(null)
  // Public profile (bio + tagline) — surfaces on /u/<username> and the
  // community author cards. Username is derived from email and shown
  // read-only for now.
  const [bio, setBio] = useState('')
  const [tagline, setTagline] = useState('')
  const [publicUsername, setPublicUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaveMsg, setProfileSaveMsg] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab !== 'previews' || !session?.user) return
    if (previews !== null) return // cached after first load
    setPreviewsLoading(true)
    fetch('/api/preview')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to load previews')
        setPreviews(d.previews || [])
      })
      .catch((e) => setPreviewsError(e.message))
      .finally(() => setPreviewsLoading(false))
  }, [activeTab, session?.user, previews])

  const copyPreviewUrl = async (p: PreviewLink) => {
    try {
      await navigator.clipboard.writeText(p.url)
      setCopiedPreviewId(p.id)
      setTimeout(() => setCopiedPreviewId((cur) => (cur === p.id ? null : cur)), 1500)
    } catch {
      // Clipboard API can fail under insecure contexts; fall back to selecting the text.
      window.prompt('Copy this link:', p.url)
    }
  }

  const deletePreview = async (id: string) => {
    setDeletingPreviewId(id)
    try {
      const r = await fetch(`/api/preview/delete/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to delete')
      }
      setPreviews((prev) => (prev ? prev.filter((p) => p.id !== id) : prev))
    } catch (e: any) {
      setPreviewsError(e.message || 'Failed to delete')
    } finally {
      setDeletingPreviewId(null)
    }
  }

  // Fetch credits + real plan on mount. /api/usage is the canonical source
  // for user.plan + credits — same endpoint /upgrade uses.
  useEffect(() => {
    if (session?.user) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => {
          setCredits(data?.user?.credits ?? 0)
          setActualPlan(data?.user?.plan ?? 'free')
        })
        .catch(() => setCredits(0))
    }
  }, [session?.user])

  const openBillingPortal = async () => {
    setPortalError(null)
    setPortalLoading(true)
    try {
      const r = await fetch('/api/billing/portal', { method: 'POST' })
      const d = await r.json()
      if (d.url) {
        window.location.href = d.url
        return
      }
      setPortalError(d.error || `Portal failed (HTTP ${r.status})`)
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setPortalLoading(false)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch public profile (bio/tagline/derived username) once we have a session.
  useEffect(() => {
    if (status !== 'authenticated') return
    let alive = true
    fetch('/api/user/profile', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        if (!alive) return
        const p = data?.profile || {}
        setBio(p.bio || '')
        setTagline(p.tagline || '')
        setPublicUsername(p.username || '')
      })
      .catch(() => { /* leave fields empty on failure */ })
    return () => { alive = false }
  }, [status])

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileSaveMsg(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio.slice(0, 600), tagline: tagline.slice(0, 80) }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setProfileSaveMsg('Saved')
      setTimeout(() => setProfileSaveMsg(null), 2200)
    } catch (e: any) {
      setProfileSaveMsg(`Save failed: ${e?.message || 'unknown'}`)
    } finally {
      setSavingProfile(false)
    }
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  // User data from session — plan resolved against /api/usage so the Current
  // Plan card + Upgrade button states match what the rest of the app sees.
  const user = {
    name: session?.user?.name || 'User',
    email: session?.user?.email || '',
    avatar: session?.user?.image || null,
    plan: actualPlan,
    joinedDate: new Date().toISOString().split('T')[0],
  }
  const currentPlanMeta = SUBSCRIPTION_PLANS.find((p) => p.id === actualPlan)
  const currentPlanPriceLabel = !currentPlanMeta || currentPlanMeta.monthlyPrice === 0
    ? 'Free forever'
    : `$${(currentPlanMeta.monthlyPrice / 100).toFixed(0)}/month`

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
    { id: 'previews', label: 'Preview links', icon: Share2 },
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
                <Link
                  href="/upgrade"
                  className={cn(
                    'block w-full py-2 rounded-lg text-xs font-medium text-center transition-all',
                    isDark
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                      : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                  )}
                >
                  View Plans
                </Link>
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
                      {publicUsername && (
                        <div>
                          <label className={cn('text-sm font-medium mb-2 block', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                            Your public page
                          </label>
                          <div className={cn(
                            'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm',
                            isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          )}>
                            <span className="opacity-60">webstew.net</span>
                            <a
                              href={`/u/${publicUsername}`}
                              target="_blank"
                              rel="noopener"
                              className={cn(
                                'font-mono font-semibold hover:underline',
                                isDark ? 'text-violet-300' : 'text-violet-700'
                              )}
                            >
                              /u/{publicUsername}
                            </a>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className={cn('text-sm font-medium mb-2 block', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          Tagline <span className="opacity-50 font-normal">(80 chars · one-liner under your name)</span>
                        </label>
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value.slice(0, 80))}
                          maxLength={80}
                          placeholder="Designer & maker · Brooklyn"
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm transition-all',
                            isDark
                              ? 'bg-white/5 border-white/10 focus:border-violet-500/50 placeholder:text-zinc-600'
                              : 'bg-zinc-50 border-zinc-200 focus:border-orange-500/50 placeholder:text-zinc-400'
                          )}
                        />
                        <p className={cn('text-[11px] mt-1 text-right', isDark ? 'text-zinc-600' : 'text-zinc-400')}>
                          {tagline.length} / 80
                        </p>
                      </div>
                      <div>
                        <label className={cn('text-sm font-medium mb-2 block', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          Bio <span className="opacity-50 font-normal">(600 chars · shown on /u/{publicUsername || 'username'})</span>
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value.slice(0, 600))}
                          maxLength={600}
                          rows={4}
                          placeholder="A short paragraph about you, your work, what you're building."
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none',
                            isDark
                              ? 'bg-white/5 border-white/10 focus:border-violet-500/50 placeholder:text-zinc-600'
                              : 'bg-zinc-50 border-zinc-200 focus:border-orange-500/50 placeholder:text-zinc-400'
                          )}
                        />
                        <p className={cn('text-[11px] mt-1 text-right', isDark ? 'text-zinc-600' : 'text-zinc-400')}>
                          {bio.length} / 600
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className={cn(
                          'px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50',
                          isDark
                            ? 'bg-violet-500 text-white hover:bg-violet-600'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        )}
                      >
                        {savingProfile ? 'Saving…' : 'Save Changes'}
                      </button>
                      {profileSaveMsg && (
                        <span className={cn(
                          'text-sm',
                          profileSaveMsg === 'Saved'
                            ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                            : (isDark ? 'text-red-400' : 'text-red-600')
                        )}>
                          {profileSaveMsg}
                        </span>
                      )}
                    </div>
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
                  {/* Current Plan — single source of truth lives on /upgrade.
                      This card just summarizes + deep-links there for any
                      change. Stripe Billing Portal handles cancel / swap
                      card / view invoices for paid users. */}
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
                    <div className="flex flex-wrap items-center gap-4 mb-5">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        isDark ? 'bg-violet-500/20' : 'bg-orange-100'
                      )}>
                        <Package className={isDark ? 'w-6 h-6 text-violet-400' : 'w-6 h-6 text-orange-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan</p>
                        <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          {currentPlanPriceLabel}
                          {credits !== null && (
                            <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>
                              {' · '}{credits.toLocaleString()} credits remaining
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/upgrade"
                        className={cn(
                          'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition',
                          isDark
                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                            : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                        )}
                      >
                        <Sparkles className="w-4 h-4" />
                        {user.plan === 'free' ? 'View plans' : 'Change plan'}
                      </Link>
                      {user.plan !== 'free' && (
                        <button
                          onClick={openBillingPortal}
                          disabled={portalLoading}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50',
                            isDark
                              ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                              : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                          )}
                        >
                          {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                          Manage subscription
                        </button>
                      )}
                    </div>
                    {portalError && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                        {portalError}
                      </div>
                    )}
                  </div>

                  {/* Payouts — Stripe Connect onboarding for sellers */}
                  <PayoutsCard isDark={isDark} />

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

              {/* Preview links Tab */}
              {activeTab === 'previews' && (
                <motion.div
                  key="previews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={cn(
                    'rounded-2xl p-6 backdrop-blur-xl',
                    isDark ? 'bg-zinc-900/50 border border-white/10' : 'bg-white/80 border border-zinc-200 shadow-sm'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">Preview links</h3>
                      <span className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                        Auto-delete after 7 days
                      </span>
                    </div>
                    <p className={cn('text-sm mb-6', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                      Shareable snapshots of sites you built with Webstew. Anyone with the link can view; nothing is indexed by search engines.
                    </p>

                    {previewsError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                        {previewsError}
                      </div>
                    )}

                    {previewsLoading && (
                      <div className={cn('flex items-center gap-2 text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading preview links…
                      </div>
                    )}

                    {!previewsLoading && previews && previews.length === 0 && (
                      <div className={cn(
                        'rounded-xl p-8 text-center',
                        isDark ? 'bg-white/[0.02] border border-white/5' : 'bg-zinc-50 border border-zinc-200'
                      )}>
                        <Share2 className={cn('w-8 h-8 mx-auto mb-3', isDark ? 'text-zinc-600' : 'text-zinc-400')} />
                        <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                          No preview links yet. Build a site, then click <span className="font-medium">Share preview link</span> in the workspace deploy panel.
                        </p>
                      </div>
                    )}

                    {!previewsLoading && previews && previews.length > 0 && (
                      <ul className="space-y-2">
                        {previews.map((p) => {
                          const expiresAt = new Date(p.expiresAt)
                          const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
                          return (
                            <li
                              key={p.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border',
                                isDark
                                  ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                  : 'bg-white border-zinc-200 hover:bg-zinc-50'
                              )}
                            >
                              <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                                <Share2 className="w-4 h-4 text-violet-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-zinc-900')}>
                                  {p.name || 'Untitled preview'}
                                </div>
                                <div className={cn('text-xs truncate', isDark ? 'text-zinc-500' : 'text-zinc-500')}>
                                  {p.url.replace(/^https?:\/\//, '')} · expires in {daysLeft}d
                                </div>
                              </div>
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  'p-2 rounded-lg transition',
                                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                                )}
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => copyPreviewUrl(p)}
                                className={cn(
                                  'p-2 rounded-lg transition',
                                  copiedPreviewId === p.id
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                                )}
                                title={copiedPreviewId === p.id ? 'Copied!' : 'Copy link'}
                              >
                                {copiedPreviewId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deletePreview(p.id)}
                                disabled={deletingPreviewId === p.id}
                                className={cn(
                                  'p-2 rounded-lg transition',
                                  deletingPreviewId === p.id
                                    ? 'opacity-50'
                                    : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                                )}
                                title="Delete preview"
                              >
                                {deletingPreviewId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
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

                  {/* Deploy credentials — BYO Render + GitHub keys so deploys
                      use the user's own accounts instead of the platform's. */}
                  <DeployCredentialsCard isDark={isDark} />

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
