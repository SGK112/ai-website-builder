'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users,
  MessageSquare,
  Heart,
  Bookmark,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Eye,
  ExternalLink,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Palette,
  ShoppingBag,
  Briefcase,
  Music,
  Camera,
  Globe,
  Plus,
  Crown,
  Trophy,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { StarryNight, SunriseBackground } from '@/components/landing/BackgroundEffects'
import { WebstewLogo } from '@/components/brand/WebstewLogo'
import { FeedbackBoard } from '@/components/community/FeedbackBoard'
import { DEMO_SITES } from '@/lib/demo-sites'

interface Project {
  id: string
  title: string
  description: string
  author: {
    name: string
    username?: string   // links to /u/<username>; missing for legacy demo data
    avatar: string       // letter for demo data, URL for real listings
    avatarUrl?: string   // real avatar URL when available
    badge?: 'pro' | 'top' | 'new'
  }
  thumbnail: string
  category: string
  likes: number
  views: number
  comments: number
  createdAt: string
  featured?: boolean
}

interface Category {
  id: string
  name: string
  icon: typeof Globe
  count: number
}

const categories: Category[] = [
  { id: 'all', name: 'All', icon: Globe, count: 1234 },
  { id: 'portfolio', name: 'Portfolio', icon: Briefcase, count: 342 },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingBag, count: 189 },
  { id: 'landing', name: 'Landing Pages', icon: Zap, count: 456 },
  { id: 'blog', name: 'Blogs', icon: MessageSquare, count: 127 },
  { id: 'creative', name: 'Creative', icon: Palette, count: 98 },
  { id: 'music', name: 'Music', icon: Music, count: 45 },
  { id: 'photography', name: 'Photography', icon: Camera, count: 67 },
]

// Demo projects derive from the same DEMO_SITES the landing iframe cycles
// through. Every entry is a REAL working template — clicking the card lands
// on /showcase/<slug> which iframes the actual HTML, and the author chip
// links to /u/webstew (the synthesized Webstew Team profile). No fake
// people, no dead loops. Drops out entirely once realProjects ≥ 6.
const DEMO_THUMBS: Record<string, string> = {
  saas: '/api/media?q=analytics%20dashboard%20saas&w=600&h=400',
  portfolio: '/api/media?q=creative%20portfolio%20designer&w=600&h=400',
  mobile: '/api/media?q=mobile%20app%20phone%20product&w=600&h=400',
  ecommerce: '/api/media?q=fashion%20ecommerce%20shop&w=600&h=400',
  blog: '/api/media?q=editorial%20magazine%20writing&w=600&h=400',
  restaurant: '/api/media?q=restaurant%20interior%20food&w=600&h=400',
}
const DEMO_CATEGORY: Record<string, string> = {
  saas: 'landing',
  portfolio: 'portfolio',
  mobile: 'landing',
  ecommerce: 'ecommerce',
  blog: 'blog',
  restaurant: 'landing',
}
const mockProjects: Project[] = DEMO_SITES.map((d, i) => ({
  id: d.id,
  title: d.label,
  description: d.prompt,
  author: {
    name: 'Webstew Team',
    username: 'webstew',
    avatar: 'W',
    badge: 'pro',
  },
  thumbnail: DEMO_THUMBS[d.id] || `https://picsum.photos/seed/${d.id}/600/400`,
  category: DEMO_CATEGORY[d.id] || 'landing',
  likes: 80 + i * 37,
  views: 720 + i * 213,
  comments: 4 + i * 3,
  createdAt: new Date(Date.now() - (i + 1) * 86400000 * 6).toISOString().slice(0, 10),
  featured: i === 0 || i === 3,
}))

// "Featured Templates" — replaces the fake top-creators leaderboard.
// Real links into /showcase/<slug>, sourced from DEMO_SITES so this stays
// in sync with whatever the landing iframe is showing today.
const featuredTemplates = DEMO_SITES.map((d) => ({
  slug: d.id,
  label: d.label,
  category: DEMO_CATEGORY[d.id] || 'landing',
}))

function AuthorAvatar({
  avatarUrl,
  fallback,
  isDark,
  size = 'md',
}: {
  avatarUrl?: string
  fallback: string
  isDark: boolean
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fallback}
        className={cn(dim, 'rounded-full object-cover')}
        onError={(e) => {
          const img = e.currentTarget
          // Hide broken avatar; container shows the letter fallback via the
          // next render if we toggle state — for simplicity just hide.
          img.style.display = 'none'
        }}
      />
    )
  }
  return (
    <div className={cn(
      dim,
      'rounded-full flex items-center justify-center font-medium',
      isDark ? 'bg-white/10' : 'bg-zinc-100'
    )}>
      {fallback}
    </div>
  )
}

export default function CommunityPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()
  const router = useRouter()
  // Top-level community tab — Projects (default) or Feedback. Deep-linkable
  // via ?tab=feedback so /feedback redirect can land here.
  const [tab, setTab] = useState<'projects' | 'feedback'>(
    searchParams.get('tab') === 'feedback' ? 'feedback' : 'projects'
  )
  const switchTab = (next: 'projects' | 'feedback') => {
    setTab(next)
    const sp = new URLSearchParams(searchParams.toString())
    if (next === 'feedback') sp.set('tab', 'feedback')
    else sp.delete('tab')
    const q = sp.toString()
    router.replace(`/community${q ? `?${q}` : ''}`, { scroll: false })
  }
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'recent' | 'popular'>('trending')
  const [likedProjects, setLikedProjects] = useState<string[]>([])
  const [savedProjects, setSavedProjects] = useState<string[]>([])
  // Real listings from /api/community/posts (replaces the legacy mockProjects
  // demo data that used to live here as a placeholder). Mock list is kept as
  // a tail fallback only so the page doesn't go empty during the first hours
  // post-launch while we're below ~6 approved listings.
  const [realProjects, setRealProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  // Pagination — start with 12, "Load more" reveals another 12 at a time.
  // Was previously a button with no onClick. Resets to 12 whenever the
  // category/search/sort changes so we're not stuck on page N of the wrong feed.
  const [visibleCount, setVisibleCount] = useState(12)
  useEffect(() => { setVisibleCount(12) }, [activeCategory, searchQuery, sortBy])

  // Map a CommunityPost from /api/community/posts → the local Project shape
  // this UI was built around. Adapter so we didn't have to rewrite the card.
  const adaptPost = (post: any): Project => {
    const username: string = post?.author?.username || ''
    const name: string = post?.author?.name || username || 'Anonymous'
    return {
      id: String(post._id),
      title: post.title || 'Untitled',
      description: post.description || '',
      author: {
        name,
        username,
        avatar: (name[0] || username[0] || '?').toUpperCase(),
        avatarUrl: post?.author?.avatar,
      },
      thumbnail: post.thumbnail || `https://picsum.photos/seed/${post._id}/600/400`,
      category: post.category || 'general',
      likes: post.likes || 0,
      views: post.views || 0,
      comments: post.comments || 0,
      createdAt: post.createdAt
        ? new Date(post.createdAt).toLocaleDateString()
        : '',
      featured: false,
    }
  }

  useEffect(() => {
    let alive = true
    setLoadingProjects(true)
    const params = new URLSearchParams()
    if (activeCategory !== 'all') params.set('category', activeCategory)
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    params.set('sort', sortBy === 'recent' ? 'recent' : sortBy === 'popular' ? 'popular' : 'trending')
    params.set('limit', '60')
    fetch(`/api/community/posts?${params.toString()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!alive) return
        const posts: any[] = Array.isArray(data?.posts) ? data.posts : []
        const items: Project[] = posts.map(adaptPost)
        setRealProjects(items)
        // Hydrate the like/save state from the server so the heart and
        // bookmark icons render in the right state on first paint.
        const likedIds = posts.filter((p) => p.viewerLiked).map((p) => String(p._id))
        const savedIds = posts.filter((p) => p.viewerSaved).map((p) => String(p._id))
        setLikedProjects((prev) => Array.from(new Set([...prev, ...likedIds])))
        setSavedProjects((prev) => Array.from(new Set([...prev, ...savedIds])))
      })
      .catch(() => { if (alive) setRealProjects([]) })
      .finally(() => { if (alive) setLoadingProjects(false) })
    return () => { alive = false }
  }, [activeCategory, searchQuery, sortBy])

  // Combined feed: real listings first, demo data as filler ONLY when the
  // feed would otherwise feel empty. As real volume picks up, drop the demo
  // tail entirely — that's a one-line change.
  const SHOW_DEMOS_BELOW = 6
  const combined: Project[] =
    realProjects.length >= SHOW_DEMOS_BELOW
      ? realProjects
      : [...realProjects, ...mockProjects]

  const filteredProjects = combined.filter(project => {
    if (activeCategory !== 'all' && project.category !== activeCategory) return false
    if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Real category counts derived from the actual feed. Previously hardcoded
  // ("Portfolio: 342") which lied to users when only 1-2 items existed.
  const categoryCounts: Record<string, number> = { all: combined.length }
  for (const p of combined) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
  }
  const visibleProjects = filteredProjects.slice(0, visibleCount)
  const hasMoreToShow = filteredProjects.length > visibleCount

  // Optimistic toggle — flips local state immediately, then calls the
  // server. If the server rejects (e.g. anon, 401), we route the user to
  // signup and roll back the local state. Likes & saves are one-per-user
  // server-side (set semantics) so spam clicks can't inflate counts.
  const toggleLike = async (id: string) => {
    const willLike = !likedProjects.includes(id)
    setLikedProjects(prev => willLike ? [...prev, id] : prev.filter(p => p !== id))
    try {
      const res = await fetch(`/api/community/posts/${id}/like`, { method: 'POST' })
      if (res.status === 401) {
        // Roll back + walk anon to signup
        setLikedProjects(prev => willLike ? prev.filter(p => p !== id) : [...prev, id])
        window.location.href = `/signup?next=${encodeURIComponent('/community')}`
        return
      }
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      // Network error — roll back to keep state honest
      setLikedProjects(prev => willLike ? prev.filter(p => p !== id) : [...prev, id])
    }
  }

  const toggleSave = async (id: string) => {
    const willSave = !savedProjects.includes(id)
    setSavedProjects(prev => willSave ? [...prev, id] : prev.filter(p => p !== id))
    try {
      const res = await fetch(`/api/community/posts/${id}/save`, { method: 'POST' })
      if (res.status === 401) {
        setSavedProjects(prev => willSave ? prev.filter(p => p !== id) : [...prev, id])
        window.location.href = `/signup?next=${encodeURIComponent('/community')}`
        return
      }
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setSavedProjects(prev => willSave ? prev.filter(p => p !== id) : [...prev, id])
    }
  }

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-500',
      isDark ? 'bg-[#0a0a0b] text-white' : 'bg-gradient-to-b from-orange-50 to-white text-zinc-900'
    )}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isDark ? <StarryNight /> : <SunriseBackground />}
      </div>

      {/* Header */}
      <header className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-xl',
        isDark ? 'bg-black/50 border-white/10' : 'bg-white/80 border-zinc-200'
      )}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <WebstewLogo href="/" size="sm" isDark={isDark} />
            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
            <div className="flex items-center gap-2">
              <Users className={isDark ? 'w-4 h-4 text-violet-400' : 'w-4 h-4 text-orange-500'} />
              <span className="font-medium">Community</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                isDark
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                  : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
              )}
            >
              <Plus className="w-4 h-4" />
              Create
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={cn(
        "relative z-10 py-12 border-b",
        isDark ? "border-white/10" : "border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className={cn(
                'bg-clip-text text-transparent',
                isDark
                  ? 'bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400'
                  : 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500'
              )}>
                Community Showcase
              </span>
            </h1>
            <p className={cn('text-lg max-w-2xl mx-auto', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
              Discover amazing websites built by our community — and publish your own to earn from every sale.
            </p>
          </motion.div>

          {/* Publish & earn path — three-step explainer.
              Visible above the fold so creators see the monetization path
              before they scroll into the showcase. Webstew takes 30%; the
              rest goes straight to the creator's Stripe Connect account. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="max-w-3xl mx-auto mt-8"
          >
            <div className={cn(
              'rounded-2xl border p-5',
              isDark
                ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border-violet-500/30'
                : 'bg-gradient-to-br from-orange-50 to-pink-50 border-orange-200'
            )}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isDark ? 'bg-violet-500/20' : 'bg-orange-100'
                  )}>
                    <Crown className={cn('w-5 h-5', isDark ? 'text-violet-300' : 'text-orange-600')} />
                  </div>
                  <div className="text-left">
                    <div className={cn('text-sm font-semibold mb-1', isDark ? 'text-white' : 'text-zinc-900')}>
                      Sell your sites & templates
                    </div>
                    <div className={cn('text-xs leading-relaxed', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                      Build → Publish from <span className="font-mono">/library</span> → Set a price.
                      You keep 70%, paid out to your Stripe account. Free listings also welcome.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/library"
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      isDark
                        ? 'bg-violet-500 hover:bg-violet-400 text-white'
                        : 'bg-orange-500 hover:bg-orange-400 text-white'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Publish a site
                  </Link>
                  <Link
                    href="/seller"
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      isDark
                        ? 'bg-white/10 hover:bg-white/15 text-white'
                        : 'bg-white border border-zinc-200 hover:border-orange-300 text-zinc-900'
                    )}
                  >
                    My earnings
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-xl mx-auto mt-8"
          >
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl border',
              isDark
                ? 'bg-white/5 border-white/10 focus-within:border-violet-500/50'
                : 'bg-white border-zinc-200 focus-within:border-orange-500/50 shadow-sm'
            )}>
              <Search className="w-5 h-5 text-slate-500 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
              )}>
                <Filter className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-8 mt-8"
          >
            {[
              { label: 'Projects', value: '12.4K' },
              { label: 'Creators', value: '5.2K' },
              { label: 'Likes', value: '89K' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-zinc-900')}>
                  {stat.value}
                </p>
                <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tab switcher — Projects (showcase) vs Feedback (bugs/features/team replies).
          Deep-linkable via ?tab=feedback. */}
      <div className={cn(
        'relative z-10 border-b',
        isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white/60'
      )}>
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
          <button
            onClick={() => switchTab('projects')}
            aria-pressed={tab === 'projects'}
            className={cn(
              'relative px-4 py-3 text-sm font-semibold transition-colors',
              tab === 'projects'
                ? isDark ? 'text-white' : 'text-zinc-900'
                : isDark ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Projects
            {tab === 'projects' && (
              <span className={cn(
                'absolute left-3 right-3 -bottom-px h-0.5 rounded',
                isDark ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400' : 'bg-gradient-to-r from-orange-400 to-pink-500'
              )} />
            )}
          </button>
          <button
            onClick={() => switchTab('feedback')}
            aria-pressed={tab === 'feedback'}
            className={cn(
              'relative px-4 py-3 text-sm font-semibold transition-colors',
              tab === 'feedback'
                ? isDark ? 'text-white' : 'text-zinc-900'
                : isDark ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Feedback
            {tab === 'feedback' && (
              <span className={cn(
                'absolute left-3 right-3 -bottom-px h-0.5 rounded',
                isDark ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400' : 'bg-gradient-to-r from-orange-400 to-pink-500'
              )} />
            )}
          </button>
        </div>
      </div>

      {/* Feedback tab body */}
      {tab === 'feedback' && (
        <section className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          <FeedbackBoard isDark={isDark} />
        </section>
      )}

      {/* Projects tab body — existing showcase grid + filters */}
      {tab === 'projects' && (
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            {/* Categories */}
            <div className={cn(
              'p-4 rounded-2xl border mb-6',
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
            )}>
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                      activeCategory === cat.id
                        ? isDark
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-orange-100 text-orange-600'
                        : isDark
                          ? 'text-zinc-400 hover:bg-white/5'
                          : 'text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      isDark ? 'bg-white/10' : 'bg-zinc-100'
                    )}>
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Templates — sourced from DEMO_SITES, each card is
                a real link into /showcase/<slug>. Replaces the fake-name
                "Top Creators" leaderboard until we have enough real
                community traffic to populate a genuine one. */}
            <div className={cn(
              'p-4 rounded-2xl border',
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className={isDark ? 'w-4 h-4 text-amber-400' : 'w-4 h-4 text-amber-500'} />
                <h3 className="font-semibold">Featured Templates</h3>
              </div>
              <div className="space-y-1">
                {featuredTemplates.map((tpl) => {
                  const Icon = categories.find((c) => c.id === tpl.category)?.icon || Globe
                  return (
                    <Link
                      key={tpl.slug}
                      href={`/showcase/${tpl.slug}`}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-all',
                        isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-orange-100 text-orange-600'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tpl.label}</p>
                        <p className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                          by Webstew Team
                        </p>
                      </div>
                      <ChevronRight className={cn('w-4 h-4', isDark ? 'text-zinc-600' : 'text-zinc-400')} />
                    </Link>
                  )
                })}
              </div>
              <Link
                href="/u/webstew"
                className={cn(
                  'mt-3 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors',
                  isDark ? 'text-violet-300 hover:bg-white/5' : 'text-orange-600 hover:bg-orange-50'
                )}
              >
                View all team templates →
              </Link>
            </div>
          </aside>

          {/* Projects Grid */}
          <div className="flex-1">
            {/* Sort Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className={cn(
                'inline-flex p-1 rounded-xl',
                isDark ? 'bg-white/5' : 'bg-zinc-100'
              )}>
                {[
                  { id: 'trending', label: 'Trending', icon: Flame },
                  { id: 'recent', label: 'Recent', icon: Clock },
                  { id: 'popular', label: 'Popular', icon: TrendingUp },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSortBy(tab.id as typeof sortBy)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      sortBy === tab.id
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-white text-zinc-900 shadow-sm'
                        : isDark
                          ? 'text-zinc-400'
                          : 'text-zinc-600'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                {filteredProjects.length} projects
              </span>
            </div>

            {/* Featured Projects */}
            {sortBy === 'trending' && (
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Star className={isDark ? 'w-5 h-5 text-amber-400' : 'w-5 h-5 text-amber-500'} />
                  Featured
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredProjects.filter(p => p.featured).map(project => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'group relative rounded-2xl border overflow-hidden',
                        isDark
                          ? 'bg-gradient-to-b from-amber-500/10 to-orange-500/10 border-amber-500/20'
                          : 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-200'
                      )}
                    >
                      <Link
                        href={
                          /^[a-f0-9]{24}$/i.test(project.id)
                            ? `/listings/${project.id}`
                            : `/showcase/${project.id}`
                        }
                        className="block aspect-video relative overflow-hidden"
                      >
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
                            Featured
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h4 className="font-semibold text-white">{project.title}</h4>
                          <p className="text-sm text-white/80 line-clamp-1">{project.description}</p>
                        </div>
                      </Link>
                      <div className="p-4 flex items-center justify-between">
                        {project.author.username ? (
                          <Link
                            href={`/u/${project.author.username}`}
                            className="flex items-center gap-2 group/author hover:opacity-80 transition"
                          >
                            <AuthorAvatar
                              avatarUrl={project.author.avatarUrl}
                              fallback={project.author.avatar}
                              isDark={isDark}
                            />
                            <span className="text-sm font-medium group-hover/author:underline">{project.author.name}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AuthorAvatar
                              avatarUrl={project.author.avatarUrl}
                              fallback={project.author.avatar}
                              isDark={isDark}
                            />
                            <span className="text-sm font-medium">{project.author.name}</span>
                          </div>
                        )}
                        <div className={cn('flex items-center gap-3 text-sm', isDark ? 'text-zinc-500' : 'text-slate-600')}>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {project.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {project.views}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All Projects */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'group rounded-2xl border overflow-hidden transition-all',
                    isDark
                      ? 'bg-white/5 border-white/10 hover:border-violet-500/30'
                      : 'bg-white border-zinc-200 hover:border-orange-300 shadow-sm'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleSave(project.id)}
                        className={cn(
                          'p-2 rounded-lg backdrop-blur-sm transition-colors',
                          savedProjects.includes(project.id)
                            ? 'bg-violet-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/50'
                        )}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
                        isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-white'
                      )}>
                        {categories.find(c => c.id === project.category)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Content. Title is the click target → listing detail
                      page. MongoId-shaped ids hit /listings/<id> (real
                      community posts). Demo entries (DEMO_SITES slugs)
                      hit /showcase/<slug> which iframes the real HTML. */}
                  <div className="p-4">
                    <Link
                      href={
                        /^[a-f0-9]{24}$/i.test(project.id)
                          ? `/listings/${project.id}`
                          : `/showcase/${project.id}`
                      }
                      className="block"
                    >
                      <h4 className="font-semibold mb-1 line-clamp-1 hover:underline">{project.title}</h4>
                    </Link>
                    <p className={cn(
                      'text-sm line-clamp-2 mb-4',
                      isDark ? 'text-zinc-400' : 'text-zinc-600'
                    )}>
                      {project.description}
                    </p>

                    {/* Author & Stats */}
                    <div className="flex items-center justify-between">
                      {(() => {
                        const inner = (
                          <>
                            <div className="relative">
                              <AuthorAvatar
                                avatarUrl={project.author.avatarUrl}
                                fallback={project.author.avatar}
                                isDark={isDark}
                                size="sm"
                              />
                              {project.author.badge && (
                                <div className={cn(
                                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center',
                                  project.author.badge === 'pro'
                                    ? 'bg-violet-500'
                                    : project.author.badge === 'top'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                )}>
                                  {project.author.badge === 'pro' ? (
                                    <Crown className="w-2 h-2 text-white" />
                                  ) : project.author.badge === 'top' ? (
                                    <Star className="w-2 h-2 text-white" />
                                  ) : (
                                    <Zap className="w-2 h-2 text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-sm">{project.author.name}</span>
                          </>
                        )
                        return project.author.username ? (
                          <Link
                            href={`/u/${project.author.username}`}
                            className="flex items-center gap-2 hover:opacity-80 transition"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">{inner}</div>
                        )
                      })()}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleLike(project.id)}
                          className={cn(
                            'flex items-center gap-1 text-sm transition-colors',
                            likedProjects.includes(project.id)
                              ? 'text-red-500'
                              : isDark
                                ? 'text-zinc-500 hover:text-red-400'
                                : 'text-zinc-500 hover:text-red-500'
                          )}
                        >
                          <Heart className={cn('w-4 h-4', likedProjects.includes(project.id) && 'fill-current')} />
                          {project.likes + (likedProjects.includes(project.id) ? 1 : 0)}
                        </button>
                        <span className={cn(
                          'flex items-center gap-1 text-sm',
                          isDark ? 'text-zinc-500' : 'text-zinc-500'
                        )}>
                          <MessageCircle className="w-4 h-4" />
                          {project.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More — only renders when there's actually more to show.
                Previously was a button with no onClick. */}
            {hasMoreToShow && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((n) => n + 12)}
                  className={cn(
                    'px-6 py-3 rounded-xl text-sm font-medium transition-all',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200'
                  )}
                >
                  Load more ({filteredProjects.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      )}

      {/* Footer CTA */}
      <section className={cn(
        'relative z-10 py-16 border-t',
        isDark ? 'border-white/10' : 'border-zinc-200'
      )}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Share Your Creation?</h2>
          <p className={cn('text-lg mb-8', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
            Build something amazing and showcase it to the community.
          </p>
          <Link
            href="/workspace"
            className={cn(
              'inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold transition-all',
              isDark
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
            )}
          >
            <Sparkles className="w-5 h-5" />
            Start Building
          </Link>
        </div>
      </section>
    </div>
  )
}
