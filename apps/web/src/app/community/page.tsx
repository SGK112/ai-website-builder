'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  MessageSquare,
  Heart,
  Bookmark,
  Search,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Eye,
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
import { SitePreview } from '@/components/community/SitePreview'
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
  html?: string         // the real site markup → live preview on the card
  category: string
  likes: number
  views: number
  comments: number
  createdAt: string
  featured?: boolean
  // Marketplace fields — carried from the API so the GRID card can show a
  // price / "for sale" badge instead of hiding it until the detail page.
  priceCredits?: number   // 1 credit = 1¢; 0 / undefined = free
  isPremium?: boolean
  type?: string
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
// Compact stat formatting: 1234 -> "1.2K", 89000 -> "89K".
function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

// Real listings carry a Mongo ObjectId (24 hex). Demo/showcase cards use a slug
// id (e.g. "saas") — POSTing those to the like/save API 400s. So we route demo
// interactions to a LOCAL bookmark (localStorage) instead of silently failing.
const isRealId = (id: string) => /^[a-f0-9]{24}$/i.test(id)
const LS_SAVED = 'webstew_community_saved_local'
const LS_LIKED = 'webstew_community_liked_local'
function readLocalSet(key: string): string[] {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function writeLocalSet(key: string, ids: string[]) {
  try { localStorage.setItem(key, JSON.stringify(ids.filter(id => !isRealId(id)))) } catch { /* storage blocked — non-fatal */ }
}

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
  // Broken avatar URLs flip to the letter fallback below instead of leaving a
  // display:none gap where the avatar should be.
  const [errored, setErrored] = useState(false)
  if (avatarUrl && !errored) {
    return (
      <img
        src={avatarUrl}
        alt={fallback}
        className={cn(dim, 'rounded-full object-cover')}
        onError={() => setErrored(true)}
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
  // Top-level community tab — Projects (default) or Feedback. Deep-linkable via
  // ?tab=feedback. We read the query AFTER mount (window.location) instead of
  // useSearchParams: the hook forces the WHOLE page to client-render, so the
  // marketplace grid (and its price/save badges) shipped a blank server shell —
  // bad for first paint + SEO. Same fix the profile page already uses.
  const [tab, setTab] = useState<'projects' | 'feedback'>('projects')
  useEffect(() => {
    const apply = () => {
      const t = new URLSearchParams(window.location.search).get('tab')
      setTab(t === 'feedback' ? 'feedback' : 'projects')
    }
    apply()
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
  }, [])
  const switchTab = (next: 'projects' | 'feedback') => {
    setTab(next)
    const sp = new URLSearchParams(window.location.search)
    if (next === 'feedback') sp.set('tab', 'feedback')
    else sp.delete('tab')
    const q = sp.toString()
    window.history.replaceState(null, '', `/community${q ? `?${q}` : ''}`)
  }
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'recent' | 'popular'>('trending')
  const [likedProjects, setLikedProjects] = useState<string[]>([])
  const [savedProjects, setSavedProjects] = useState<string[]>([])
  // Brief, honest feedback for like/save (replaces the old SILENT rollback that
  // made the buttons feel broken). Shows e.g. "Saved" / "Couldn't save — retry".
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  // Real listings from /api/community/posts (replaces the legacy mockProjects
  // demo data that used to live here as a placeholder). Mock list is kept as
  // a tail fallback only so the page doesn't go empty during the first hours
  // post-launch while we're below ~6 approved listings.
  const [realProjects, setRealProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  // Real showcase stats (replaces the fabricated 12.4K/5.2K/89K). Derived from
  // the API total + the loaded page; the bar is hidden entirely when there's
  // no real volume yet, rather than showing fake or sad-zero numbers.
  const [stats, setStats] = useState<{ projects: number; creators: number; likes: number }>({ projects: 0, creators: 0, likes: 0 })
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
      thumbnail: post.thumbnail || '',
      html: typeof post.html === 'string' ? post.html : undefined,
      category: post.category || 'general',
      likes: post.likes || 0,
      views: post.views || 0,
      comments: post.comments || 0,
      createdAt: post.createdAt
        ? new Date(post.createdAt).toLocaleDateString()
        : '',
      featured: false,
      priceCredits: Number(post.price_credits) || 0,
      isPremium: !!post.isPremium || (Number(post.price_credits) || 0) > 0,
      type: post.type,
    }
  }

  // Hydrate local (demo) likes/saves once on mount so the bookmark + heart
  // render filled for items the user marked while signed-out or on demo cards.
  useEffect(() => {
    const s = readLocalSet(LS_SAVED), l = readLocalSet(LS_LIKED)
    if (s.length) setSavedProjects(prev => Array.from(new Set([...prev, ...s])))
    if (l.length) setLikedProjects(prev => Array.from(new Set([...prev, ...l])))
  }, [])

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
        // Real stats from this response. projects uses the server's full count;
        // creators/likes are derived from the loaded page (a floor, not a lie).
        const total = Number(data?.pagination?.total) || items.length
        const creators = new Set(posts.map((p) => p?.author?.username || p?.author?.name).filter(Boolean)).size
        const likes = posts.reduce((s, p) => s + (Number(p?.likes) || 0), 0)
        setStats({ projects: total, creators, likes })
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
  // Flash a short status line, auto-clearing. Gives the buttons honest feedback
  // (the old code rolled back silently on any failure, which read as "broken").
  const flash = (msg: string) => { setActionMsg(msg); window.setTimeout(() => setActionMsg(m => (m === msg ? null : m)), 1800) }

  const toggleLike = async (id: string) => {
    const willLike = !likedProjects.includes(id)
    const next = willLike ? [...likedProjects, id] : likedProjects.filter(p => p !== id)
    setLikedProjects(next)
    // Demo/showcase card → local-only like (persists across reloads).
    if (!isRealId(id)) { writeLocalSet(LS_LIKED, next); return }
    try {
      const res = await fetch(`/api/community/posts/${id}/like`, { method: 'POST' })
      if (res.status === 401) {
        setLikedProjects(prev => willLike ? prev.filter(p => p !== id) : [...prev, id])
        window.location.href = `/signup?next=${encodeURIComponent('/community')}`
        return
      }
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setLikedProjects(prev => willLike ? prev.filter(p => p !== id) : [...prev, id])
      flash('Couldn’t update like — try again')
    }
  }

  const toggleSave = async (id: string) => {
    const willSave = !savedProjects.includes(id)
    const next = willSave ? [...savedProjects, id] : savedProjects.filter(p => p !== id)
    setSavedProjects(next)
    // Demo/showcase card → local-only bookmark (persists across reloads) so the
    // button actually works instead of 400-ing on a non-ObjectId id.
    if (!isRealId(id)) { writeLocalSet(LS_SAVED, next); flash(willSave ? 'Saved' : 'Removed'); return }
    try {
      const res = await fetch(`/api/community/posts/${id}/save`, { method: 'POST' })
      if (res.status === 401) {
        setSavedProjects(prev => willSave ? prev.filter(p => p !== id) : [...prev, id])
        window.location.href = `/signup?next=${encodeURIComponent('/community')}`
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      flash(willSave ? 'Saved to your library' : 'Removed')
    } catch {
      setSavedProjects(prev => willSave ? prev.filter(p => p !== id) : [...prev, id])
      flash('Couldn’t save — try again')
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

      {/* Like/save feedback — honest, transient confirmation so the buttons
          never feel dead (replaces the old silent rollback). */}
      {actionMsg && (
        <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/95 border border-white/15 text-white text-sm shadow-xl flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-violet-300" /> {actionMsg}
        </div>
      )}

      {/* No local header — the global WorkspaceNav (from ClientLayout) already
          provides nav + Create. The hero below labels the page, so a second
          sticky bar with its own Create button was pure duplication. */}

      {/* Hero Section */}
      <section className={cn(
        "relative z-10 py-6 sm:py-12 border-b",
        isDark ? "border-white/10" : "border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="display-page mb-3 sm:mb-4">
              <span className={cn(
                'bg-clip-text text-transparent',
                isDark
                  ? 'bg-gradient-to-r from-violet-400 to-pink-400'
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
              before they scroll into the showcase. Webstew takes 3%; the
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
                      You keep 97%, paid out to your Stripe account. Free listings also welcome.
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
            </div>
          </motion.div>

          {/* Stats — real numbers; hidden until there's genuine volume so we
              never show fabricated counts. */}
          {stats.projects > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-8 mt-8"
          >
            {[
              { label: 'Projects', value: formatStat(stats.projects) },
              { label: 'Creators', value: formatStat(stats.creators) },
              { label: 'Likes', value: formatStat(stats.likes) },
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
          )}
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
                isDark ? 'bg-violet-400' : 'bg-gradient-to-r from-orange-400 to-pink-500'
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
                isDark ? 'bg-violet-400' : 'bg-gradient-to-r from-orange-400 to-pink-500'
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
                        <SitePreview html={project.html} thumbnail={project.thumbnail} title={project.title} />
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

            {/* All Projects — empty state when a search/category yields no
                matches (mirrors the /library empty-state pattern). */}
            {!loadingProjects && filteredProjects.length === 0 ? (
              <div className={cn(
                'rounded-2xl border border-dashed p-10 text-center',
                isDark ? 'border-white/10' : 'border-zinc-300'
              )}>
                <Search className={cn('w-8 h-8 mx-auto mb-3', isDark ? 'text-zinc-600' : 'text-zinc-400')} />
                <p className={cn('mb-1', isDark ? 'text-zinc-300' : 'text-zinc-700')}>No projects match</p>
                <p className={cn('text-sm mb-4', isDark ? 'text-zinc-500' : 'text-zinc-500')}>
                  Try a different search or category.
                </p>
                {(searchQuery || activeCategory !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveCategory('all') }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isDark ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'
                    )}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
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
                    <SitePreview html={project.html} thumbnail={project.thumbnail} title={project.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Quick Actions. Save was hover-only, so on a phone —
                        where most of this gallery gets browsed — there was no
                        way to bookmark a community site at all. Visible on
                        touch, hover-revealed from md up. */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleSave(project.id)}
                        aria-label={savedProjects.includes(project.id) ? `Unsave ${project.title}` : `Save ${project.title}`}
                        className={cn(
                          'p-2 rounded-lg backdrop-blur-sm transition-colors',
                          savedProjects.includes(project.id)
                            ? 'bg-violet-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/50'
                        )}
                      >
                        <Bookmark className="w-4 h-4" />
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

                    {/* For-sale / price badge — makes the marketplace obvious
                        right in the grid (premium → price, otherwise "Free"). */}
                    <div className="absolute top-3 left-3">
                      {project.isPremium && project.priceCredits ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-amber-500/90 text-white shadow-sm">
                          <ShoppingBag className="w-3 h-3" /> ${(project.priceCredits / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm bg-emerald-500/80 text-white">
                          Free
                        </span>
                      )}
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
                          {project.likes}
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
            )}

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
          <h2 className="display-section mb-4">Ready to Share Your Creation?</h2>
          <p className={cn('text-lg mb-8', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
            Build something amazing and showcase it to the community.
          </p>
          <Link
            href="/workspace"
            className={cn(
              'inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold transition-all',
              isDark
                ? 'bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
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
