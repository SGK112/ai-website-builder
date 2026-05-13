'use client'

import { useState } from 'react'
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

interface Project {
  id: string
  title: string
  description: string
  author: {
    name: string
    avatar: string
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

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Modern SaaS Landing Page',
    description: 'A clean, conversion-focused landing page with animated hero section and pricing tables.',
    author: { name: 'Sarah Chen', avatar: 'S', badge: 'pro' },
    thumbnail: 'https://picsum.photos/seed/saas1/600/400',
    category: 'landing',
    likes: 234,
    views: 1892,
    comments: 18,
    createdAt: '2024-12-28',
    featured: true,
  },
  {
    id: '2',
    title: 'E-commerce Store Template',
    description: 'Full-featured online store with cart, checkout, and product galleries.',
    author: { name: 'Mike Johnson', avatar: 'M', badge: 'top' },
    thumbnail: 'https://picsum.photos/seed/ecom1/600/400',
    category: 'ecommerce',
    likes: 189,
    views: 1456,
    comments: 12,
    createdAt: '2024-12-27',
  },
  {
    id: '3',
    title: 'Creative Portfolio',
    description: 'Stunning portfolio showcasing creative work with smooth animations.',
    author: { name: 'Alex Rivera', avatar: 'A' },
    thumbnail: 'https://picsum.photos/seed/port1/600/400',
    category: 'portfolio',
    likes: 156,
    views: 987,
    comments: 8,
    createdAt: '2024-12-26',
  },
  {
    id: '4',
    title: 'Tech Startup Website',
    description: 'Modern startup website with team section, features, and testimonials.',
    author: { name: 'Emma Wilson', avatar: 'E', badge: 'new' },
    thumbnail: 'https://picsum.photos/seed/tech1/600/400',
    category: 'landing',
    likes: 98,
    views: 654,
    comments: 5,
    createdAt: '2024-12-25',
    featured: true,
  },
  {
    id: '5',
    title: 'Music Artist Page',
    description: 'Dynamic music artist landing with embedded player and tour dates.',
    author: { name: 'DJ Nova', avatar: 'D' },
    thumbnail: 'https://picsum.photos/seed/music1/600/400',
    category: 'music',
    likes: 312,
    views: 2341,
    comments: 24,
    createdAt: '2024-12-24',
  },
  {
    id: '6',
    title: 'Photography Portfolio',
    description: 'Minimal gallery layout perfect for showcasing photography work.',
    author: { name: 'Lisa Park', avatar: 'L', badge: 'pro' },
    thumbnail: 'https://picsum.photos/seed/photo1/600/400',
    category: 'photography',
    likes: 267,
    views: 1876,
    comments: 15,
    createdAt: '2024-12-23',
  },
]

const topCreators = [
  { name: 'Sarah Chen', projects: 45, followers: 1234, avatar: 'S', badge: 'pro' },
  { name: 'Mike Johnson', projects: 38, followers: 987, avatar: 'M', badge: 'top' },
  { name: 'Emma Wilson', projects: 32, followers: 756, avatar: 'E' },
  { name: 'Alex Rivera', projects: 28, followers: 654, avatar: 'A' },
  { name: 'Lisa Park', projects: 25, followers: 543, avatar: 'L', badge: 'pro' },
]

export default function CommunityPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'trending' | 'recent' | 'popular'>('trending')
  const [likedProjects, setLikedProjects] = useState<string[]>([])
  const [savedProjects, setSavedProjects] = useState<string[]>([])

  const filteredProjects = mockProjects.filter(project => {
    if (activeCategory !== 'all' && project.category !== activeCategory) return false
    if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const toggleLike = (id: string) => {
    setLikedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleSave = (id: string) => {
    setSavedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
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
            <Link href="/" className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isDark
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                  : 'bg-gradient-to-br from-orange-400 to-pink-500'
              )}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Webstew</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
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
              Discover amazing websites built by our community. Get inspired, remix, and share your own creations.
            </p>
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
              <Search className="w-5 h-5 text-zinc-500" />
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
                <Filter className="w-4 h-4 text-zinc-500" />
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

      {/* Main Content */}
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
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Creators */}
            <div className={cn(
              'p-4 rounded-2xl border',
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className={isDark ? 'w-4 h-4 text-amber-400' : 'w-4 h-4 text-amber-500'} />
                <h3 className="font-semibold">Top Creators</h3>
              </div>
              <div className="space-y-3">
                {topCreators.map((creator, index) => (
                  <div
                    key={creator.name}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer',
                      isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                    )}
                  >
                    <div className="relative">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-medium',
                        index === 0
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                          : index === 1
                            ? 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-white'
                            : index === 2
                              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                              : isDark
                                ? 'bg-white/10 text-white'
                                : 'bg-zinc-100 text-zinc-700'
                      )}>
                        {creator.avatar}
                      </div>
                      {creator.badge && (
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
                          creator.badge === 'pro'
                            ? 'bg-violet-500'
                            : creator.badge === 'top'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        )}>
                          {creator.badge === 'pro' ? (
                            <Crown className="w-2.5 h-2.5 text-white" />
                          ) : creator.badge === 'top' ? (
                            <Star className="w-2.5 h-2.5 text-white" />
                          ) : (
                            <Zap className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{creator.name}</p>
                      <p className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                        {creator.projects} projects
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium',
                      index < 3 ? 'text-amber-500' : isDark ? 'text-zinc-500' : 'text-zinc-600'
                    )}>
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
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
                      <div className="aspect-video relative overflow-hidden">
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
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                            isDark ? 'bg-white/10' : 'bg-zinc-100'
                          )}>
                            {project.author.avatar}
                          </div>
                          <span className="text-sm font-medium">{project.author.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
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
              {filteredProjects.map((project, index) => (
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

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="font-semibold mb-1 line-clamp-1">{project.title}</h4>
                    <p className={cn(
                      'text-sm line-clamp-2 mb-4',
                      isDark ? 'text-zinc-400' : 'text-zinc-600'
                    )}>
                      {project.description}
                    </p>

                    {/* Author & Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                            isDark ? 'bg-white/10' : 'bg-zinc-100'
                          )}>
                            {project.author.avatar}
                          </div>
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
                      </div>
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

            {/* Load More */}
            <div className="flex justify-center mt-8">
              <button className={cn(
                'px-6 py-3 rounded-xl text-sm font-medium transition-all',
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
              )}>
                Load More Projects
              </button>
            </div>
          </div>
        </div>
      </main>

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
