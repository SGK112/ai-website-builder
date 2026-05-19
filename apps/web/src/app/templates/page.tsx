'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Loader2,
  Eye,
  Sparkles,
  ShoppingBag,
  Briefcase,
  Palette,
  Utensils,
  Code,
  BookOpen,
  Rocket,
  Crown,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Lock,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTemplateById } from '@/lib/templates'
import { WebStewNav } from '@/components/shared/WebStewNav'

interface Template {
  id: string
  name: string
  description: string
  category: string
  industry?: string
  thumbnail_url: string
  preview_url?: string
  is_premium: boolean
  price_credits: number
  // Per-template Stripe price in USD cents. Set ONLY for is_premium
  // templates that are buyable individually. MUST match the
  // TEMPLATE_USD_CENTS map in /api/templates/checkout/[id]/route.ts —
  // the server map is authoritative for billing; this is the display
  // copy. If they drift, the server wins and the user sees the right
  // amount on Stripe Checkout, but the card shows stale price first.
  priceUsdCents?: number
  // What the user actually gets — surface on the card + preview modal
  // so the purchase is transparent ("X full pages, drag-drop edit, etc.")
  includes?: string[]
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Sparkles },
  { id: 'ecommerce', name: 'E-Commerce', icon: ShoppingBag },
  { id: 'saas', name: 'SaaS', icon: Code },
  { id: 'agency', name: 'Agency', icon: Briefcase },
  { id: 'portfolio', name: 'Portfolio', icon: Palette },
  { id: 'restaurant', name: 'Restaurant', icon: Utensils },
  { id: 'blog', name: 'Blog', icon: BookOpen },
  { id: 'landing', name: 'Landing Page', icon: Rocket },
]

// Built-in templates from the lib
const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'luxe-ecommerce',
    name: 'Luxe E-Commerce',
    description: 'Premium dark theme e-commerce template with product showcases',
    category: 'ecommerce',
    thumbnail_url: 'https://www.webstew.net/api/media?q=ecommerce&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'agency-portfolio',
    name: 'Agency Portfolio',
    description: 'Creative agency portfolio with project showcases',
    category: 'agency',
    thumbnail_url: 'https://www.webstew.net/api/media?q=agency&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'saas-landing',
    name: 'SaaS Landing',
    description: 'Modern SaaS landing page with gradient effects',
    category: 'saas',
    thumbnail_url: 'https://www.webstew.net/api/media?q=saas&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'restaurant-modern',
    name: 'Modern Restaurant',
    description: 'Elegant restaurant template with menu sections — coming soon',
    category: 'restaurant',
    thumbnail_url: 'https://www.webstew.net/api/media?q=restaurant&w=800&h=600',
    // No real HTML in lib/templates yet — kept off the paid list. Buyer
    // would land on "Template not found" otherwise. When the HTML ships,
    // flip is_premium back to true + re-add to TEMPLATE_USD_CENTS in the
    // checkout route.
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'photography-portfolio',
    name: 'Photography Portfolio',
    description: 'Minimal photography portfolio with gallery grid',
    category: 'portfolio',
    thumbnail_url: 'https://www.webstew.net/api/media?q=photography&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'tech-blog',
    name: 'Tech Blog',
    description: 'Clean tech blog template with article layouts — coming soon',
    category: 'blog',
    thumbnail_url: 'https://www.webstew.net/api/media?q=techblog&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'startup-landing',
    name: 'Startup Landing',
    description: 'Bold startup landing page with pricing tables',
    category: 'landing',
    thumbnail_url: 'https://www.webstew.net/api/media?q=startup&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'fitness-gym',
    name: 'Fitness Gym',
    description: 'Energy-filled gym and fitness template — coming soon',
    category: 'landing',
    thumbnail_url: 'https://www.webstew.net/api/media?q=fitness&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'fashion-store',
    name: 'Fashion Store',
    description: 'Bold modern fashion store with dynamic layouts and shopping cart',
    category: 'ecommerce',
    thumbnail_url: 'https://www.webstew.net/api/media?q=fashion&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menu',
    description: 'Elegant restaurant with menu sections and reservation system',
    category: 'restaurant',
    thumbnail_url: 'https://www.webstew.net/api/media?q=dining&w=800&h=600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'saas-multipage',
    name: 'SaaS Complete',
    description: 'Full-featured SaaS with pricing, features, testimonials, and FAQ',
    category: 'saas',
    thumbnail_url: 'https://www.webstew.net/api/media?q=dashboard&w=800&h=600',
    is_premium: true,
    price_credits: 15,
    priceUsdCents: 2900,
    includes: [
      'Marketing home + pricing + features',
      'Customer testimonials grid',
      'FAQ accordion + CTAs',
      'Dashboard layout sample',
      'Login + signup forms',
      'Multi-page navigation',
    ],
  },
]

type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

// Plans that have access to premium templates. Anything below "starter"
// hits the upgrade modal instead of being able to use the template.
// `custom` is a legacy admin-grandfather plan; treat as full access.
const PREMIUM_TEMPLATE_PLANS = new Set(['starter', 'pro', 'scale', 'enterprise', 'custom'])

export default function TemplatesPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const userPlan = (session?.user as any)?.plan as string | undefined
  const hasPremiumAccess = !!userPlan && PREMIUM_TEMPLATE_PLANS.has(userPlan.toLowerCase())

  const [templates, setTemplates] = useState<Template[]>(BUILTIN_TEMPLATES)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')
  // Paywall modal — fires when a premium template has no individual
  // Stripe price configured (or Stripe is unavailable). Surfaces the
  // plan-upgrade path as the fallback.
  const [paywallTemplate, setPaywallTemplate] = useState<Template | null>(null)
  // Per-template purchase entitlements. Populated from /api/templates/owned
  // on mount. Treated alongside hasPremiumAccess as a positive grant.
  const [ownedTemplates, setOwnedTemplates] = useState<string[]>([])

  // Get the full template HTML if available.
  // Order: local builtin > API-returned html_content (Supabase templates).
  // Falls through to null if neither — the preview area then shows the
  // thumbnail with a "live preview unavailable" hint instead of a blank
  // white iframe.
  const previewHtml = useMemo(() => {
    if (!previewTemplate) return null
    const builtin = getTemplateById(previewTemplate.id)
    if (builtin?.html) return builtin.html
    const supabaseHtml = (previewTemplate as any).html_content
    if (typeof supabaseHtml === 'string' && supabaseHtml.length > 0) return supabaseHtml
    return null
  }, [previewTemplate])

  useEffect(() => {
    loadTemplates()
  }, [])

  // Load per-template purchase entitlements once the session resolves.
  // Anonymous users get { owned: [] } silently.
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return
    let alive = true
    fetch('/api/templates/owned', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { owned: [] }))
      .then((data) => { if (alive && Array.isArray(data?.owned)) setOwnedTemplates(data.owned) })
      .catch(() => { /* silent — paywall fallback handles the rest */ })
    return () => { alive = false }
  }, [sessionStatus])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        if (data.templates && data.templates.length > 0) {
          setTemplates([...BUILTIN_TEMPLATES, ...data.templates])
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const useTemplate = async (template: Template) => {
    // PURCHASE GATE — premium templates require either:
    //  (a) a paid plan that includes premium templates, OR
    //  (b) an explicit per-template Stripe Checkout purchase.
    // Anonymous users get bounced through /signup so they can authenticate.
    if (template.is_premium) {
      if (sessionStatus === 'loading') return
      if (!session?.user) {
        const back = `/templates`
        router.push(`/signup?next=${encodeURIComponent(back)}&reason=premium_template`)
        return
      }
      // Plan tier or prior purchase grants access. ownedTemplates is
      // populated on mount by /api/templates/owned.
      if (!hasPremiumAccess && !ownedTemplates.includes(template.id)) {
        // Start a Stripe Checkout for this single template. The webhook at
        // /api/webhooks/stripe ('webstew-template' source) writes the
        // template_purchases row when the session completes; the workspace
        // success_url re-routes the user with ?template=<id>&purchased=true.
        try {
          const res = await fetch(`/api/templates/checkout/${encodeURIComponent(template.id)}`, { method: 'POST' })
          const data = await res.json().catch(() => ({} as any))
          if (res.ok && data?.alreadyOwned && data?.redirect) {
            router.push(data.redirect)
            return
          }
          if (res.ok && data?.url) {
            window.location.href = data.url
            return
          }
          // 404 ("not for sale" — i.e. template doesn't have a USD price set):
          // fall back to the plan-tier paywall modal so the user can still
          // upgrade to a plan that bundles all premium templates.
          if (res.status === 404 || res.status === 503) {
            setPaywallTemplate(template)
            return
          }
          throw new Error(data?.error || `HTTP ${res.status}`)
        } catch (e) {
          console.error('[templates] checkout failed:', e)
          setPaywallTemplate(template)
          return
        }
      }
    }
    // Anonymous users hitting free templates can still try them — workspace
    // itself enforces credits, and free tier has 100 demo credits.
    router.push(`/workspace?template=${template.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Unified Navigation */}
      <WebStewNav />

      {/* Hero */}
      <section className="py-12 px-6 text-center border-b border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Template Library
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Start with a professionally designed template and customize it with AI
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-6 px-6 border-b border-white/10 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition',
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400">No templates found matching your criteria</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-violet-500/50 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Broken thumbnail → swap for a deterministic
                        // picsum.photos seed derived from the template id
                        // so the card stays presentable instead of showing
                        // the broken-image icon. Same fallback applies to
                        // both builtin and Supabase-sourced templates.
                        const img = e.currentTarget
                        const seed = encodeURIComponent(template.id || template.name || 'template')
                        const fallback = `https://www.webstew.net/api/media?q=${seed}/800/600`
                        if (img.src !== fallback) img.src = fallback
                        else img.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Price / Owned / Free Badge — clear pricing up-front so
                        users know what they're committing to before they click. */}
                    {template.is_premium ? (
                      ownedTemplates.includes(template.id) ? (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-500/90 rounded-full">
                          <Crown className="w-3 h-3 text-white" />
                          <span className="text-xs font-medium text-white">Owned</span>
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-amber-500/95 rounded-full shadow-lg">
                          <Crown className="w-3 h-3 text-white" />
                          <span className="text-xs font-bold text-white">
                            {template.priceUsdCents
                              ? `$${(template.priceUsdCents / 100).toFixed(0)}`
                              : 'Pro plan'}
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/80 rounded-full">
                        <span className="text-xs font-medium text-white">Free</span>
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => useTemplate(template)}
                        className="px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium transition flex items-center gap-2"
                      >
                        {template.is_premium && !ownedTemplates.includes(template.id) && !hasPremiumAccess
                          ? <><Crown className="w-4 h-4" />Buy {template.priceUsdCents ? `$${(template.priceUsdCents / 100).toFixed(0)}` : ''}</>
                          : <><Sparkles className="w-4 h-4" />Use Template</>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-slate-400 capitalize">
                        {template.category}
                      </span>
                      {template.includes && template.includes.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-slate-400">
                          {template.includes.length} sections
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Preview Modal */}
      {previewTemplate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewTemplate(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-6xl max-h-[95vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold text-white">{previewTemplate.name}</h3>
                  <p className="text-sm text-slate-400">{previewTemplate.description}</p>
                </div>
                {previewTemplate.is_premium && (
                  ownedTemplates.includes(previewTemplate.id) ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold">
                      <Crown className="w-3 h-3" />
                      Owned
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/95 text-white rounded-full text-xs font-bold shadow-lg">
                      <Crown className="w-3 h-3" />
                      {previewTemplate.priceUsdCents
                        ? `$${(previewTemplate.priceUsdCents / 100).toFixed(0)} one-time`
                        : 'Pro plan'}
                    </span>
                  )
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Device Toggle */}
                <div className="hidden sm:flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={cn(
                      'p-2 rounded-md transition',
                      previewDevice === 'desktop' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={cn(
                      'p-2 rounded-md transition',
                      previewDevice === 'tablet' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={cn(
                      'p-2 rounded-md transition',
                      previewDevice === 'mobile' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => useTemplate(previewTemplate)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Use Template
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-800 to-slate-900 flex items-start justify-center p-4">
              <div
                className={cn(
                  'bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300',
                  previewDevice === 'desktop' && 'w-full',
                  previewDevice === 'tablet' && 'w-[768px] max-w-full',
                  previewDevice === 'mobile' && 'w-[375px]'
                )}
              >
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className={cn(
                      'w-full border-0 block',
                      previewDevice === 'desktop' && 'h-[800px]',
                      previewDevice === 'tablet' && 'h-[600px]',
                      previewDevice === 'mobile' && 'h-[667px]'
                    )}
                    title={`Preview: ${previewTemplate.name}`}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className={cn(
                    'w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 px-6',
                    previewDevice === 'desktop' && 'h-[800px]',
                    previewDevice === 'tablet' && 'h-[600px]',
                    previewDevice === 'mobile' && 'h-[667px]'
                  )}>
                    <img
                      src={previewTemplate.thumbnail_url}
                      alt={previewTemplate.name}
                      className="max-w-full max-h-[60%] object-cover rounded-lg"
                      onError={(e) => {
                        const img = e.currentTarget
                        const seed = encodeURIComponent(previewTemplate.id || previewTemplate.name || 'template')
                        const fallback = `https://www.webstew.net/api/media?q=${seed}/800/600`
                        if (img.src !== fallback) img.src = fallback
                        else img.style.display = 'none'
                      }}
                    />
                    <p className="text-sm text-center">Live preview unavailable — click <span className="text-violet-300">Use Template</span> to open in the builder.</p>
                  </div>
                )}
              </div>

              {/* What you get — purchase transparency. Shown for any template
                  with an `includes` list so users know exactly what's in the
                  package before they click Buy / Use. */}
              {previewTemplate.includes && previewTemplate.includes.length > 0 && (
                <div className="px-4 py-4 border-t border-white/10 bg-slate-900/60">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white">What's included</div>
                      <div className="text-[11px] text-slate-400">
                        {previewTemplate.includes.length} section{previewTemplate.includes.length === 1 ? '' : 's'}
                        {previewTemplate.is_premium && previewTemplate.priceUsdCents && !ownedTemplates.includes(previewTemplate.id) && (
                          <> · <span className="text-amber-300 font-medium">${(previewTemplate.priceUsdCents / 100).toFixed(0)} one-time, lifetime access</span></>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => useTemplate(previewTemplate)}
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold flex items-center gap-2"
                    >
                      {previewTemplate.is_premium && !ownedTemplates.includes(previewTemplate.id) && !hasPremiumAccess
                        ? <><Crown className="w-3.5 h-3.5" />Buy ${(previewTemplate.priceUsdCents || 0) / 100}</>
                        : <><Sparkles className="w-3.5 h-3.5" />Use Template</>
                      }
                    </button>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {previewTemplate.includes.map((item, i) => (
                      <li key={i} className="text-[12px] text-slate-300 flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Paywall Modal — fires when a free-tier user clicks a premium
          template. Surfaces upgrade CTA + lets them either upgrade or
          back out. */}
      <AnimatePresence>
        {paywallTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setPaywallTemplate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/9] bg-slate-800 overflow-hidden">
                <img
                  src={paywallTemplate.thumbnail_url}
                  alt={paywallTemplate.name}
                  className="w-full h-full object-cover opacity-60"
                  onError={(e) => {
                    const img = e.currentTarget
                    const seed = encodeURIComponent(paywallTemplate.id || paywallTemplate.name || 'template')
                    const fallback = `https://www.webstew.net/api/media?q=${seed}/800/600`
                    if (img.src !== fallback) img.src = fallback
                    else img.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                  <Crown className="w-3 h-3" /> Premium template
                </div>
                <button
                  onClick={() => setPaywallTemplate(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2 text-violet-300 text-xs uppercase tracking-[0.2em] font-semibold">
                  <Lock className="w-3 h-3" /> Upgrade required
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {paywallTemplate.name} is a premium template
                </h3>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                  Premium templates are deeper, more polished, and tuned by our team. They unlock on
                  the <span className="text-white font-semibold">Starter plan</span> and above —
                  along with more credits, faster models, and priority generation.
                </p>
                <div className="space-y-2 mb-6">
                  {[
                    'All premium templates',
                    'More monthly credits',
                    'Faster premium models (Claude Opus, GPT-4)',
                    'Priority generation queue',
                  ].map((perk) => (
                    <div key={perk} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-2.5 h-2.5 text-violet-300" />
                      </div>
                      {perk}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaywallTemplate(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition"
                  >
                    Not now
                  </button>
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5" /> Upgrade
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
