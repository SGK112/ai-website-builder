'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  MessageSquare,
  Code2,
  Star,
  Heart,
  Share2,
  ExternalLink,
  Search,
  Filter,
  Plus,
  Zap,
  Crown,
  Github,
  Twitter,
  Globe,
  Mail,
  UserPlus,
  Trophy,
  Target,
  Sparkles,
  Copy,
  Check,
  X,
  ChevronRight,
  Calendar,
  MapPin,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock community data
const featuredDevelopers = [
  {
    id: 1,
    name: 'Sarah Chen',
    username: '@sarahchen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    role: 'Full Stack Developer',
    location: 'San Francisco, CA',
    company: 'Stripe',
    bio: 'Building beautiful web experiences. Creator of 5 popular templates.',
    templates: 5,
    followers: 1240,
    stars: 3500,
    skills: ['React', 'TypeScript', 'Tailwind'],
    isVerified: true,
    tier: 'gold',
  },
  {
    id: 2,
    name: 'Alex Rivera',
    username: '@alexrivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    role: 'UI/UX Designer',
    location: 'New York, NY',
    company: 'Figma',
    bio: 'Designing intuitive interfaces. Specializing in SaaS and fintech.',
    templates: 8,
    followers: 2100,
    stars: 5200,
    skills: ['UI Design', 'Figma', 'Animation'],
    isVerified: true,
    tier: 'platinum',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    username: '@jordanlee',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    role: 'Frontend Engineer',
    location: 'London, UK',
    company: 'Vercel',
    bio: 'Next.js enthusiast. Building fast, accessible websites.',
    templates: 3,
    followers: 890,
    stars: 2100,
    skills: ['Next.js', 'CSS', 'A11y'],
    isVerified: true,
    tier: 'silver',
  },
  {
    id: 4,
    name: 'Mia Johnson',
    username: '@miajohnson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    role: 'Creative Developer',
    location: 'Austin, TX',
    company: 'Freelance',
    bio: 'Bringing creative visions to life. Expert in animations and interactions.',
    templates: 6,
    followers: 1560,
    stars: 4100,
    skills: ['GSAP', 'Three.js', 'Framer'],
    isVerified: false,
    tier: 'gold',
  },
]

const recentDiscussions = [
  {
    id: 1,
    title: 'Best practices for responsive hero sections?',
    author: 'david_kim',
    replies: 23,
    likes: 45,
    category: 'Design',
    time: '2h ago',
  },
  {
    id: 2,
    title: 'How to integrate Stripe payments in templates?',
    author: 'emma_wilson',
    replies: 15,
    likes: 32,
    category: 'Development',
    time: '4h ago',
  },
  {
    id: 3,
    title: 'Tips for creating accessible color schemes',
    author: 'marcus_brown',
    replies: 8,
    likes: 28,
    category: 'Accessibility',
    time: '6h ago',
  },
  {
    id: 4,
    title: 'Showcase: My new SaaS template collection',
    author: 'lisa_chen',
    replies: 42,
    likes: 89,
    category: 'Showcase',
    time: '12h ago',
  },
]

const upcomingEvents = [
  {
    id: 1,
    title: 'Template Design Workshop',
    date: 'Jan 15, 2025',
    time: '2:00 PM PST',
    host: 'Sarah Chen',
    attendees: 156,
    type: 'Workshop',
  },
  {
    id: 2,
    title: 'AI-Powered Web Design Webinar',
    date: 'Jan 20, 2025',
    time: '10:00 AM PST',
    host: 'Alex Rivera',
    attendees: 320,
    type: 'Webinar',
  },
  {
    id: 3,
    title: 'Community Hackathon: Build in 48h',
    date: 'Feb 1-2, 2025',
    time: 'All Day',
    host: 'Vibe Code Team',
    attendees: 89,
    type: 'Hackathon',
  },
]

const leaderboard = [
  { rank: 1, name: 'Alex Rivera', points: 15200, templates: 8, avatar: '🏆' },
  { rank: 2, name: 'Sarah Chen', points: 12800, templates: 5, avatar: '🥈' },
  { rank: 3, name: 'Mia Johnson', points: 11500, templates: 6, avatar: '🥉' },
  { rank: 4, name: 'Jordan Lee', points: 9200, templates: 3, avatar: '4' },
  { rank: 5, name: 'David Kim', points: 8100, templates: 4, avatar: '5' },
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'developers' | 'discussions' | 'events' | 'leaderboard'>('developers')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  const referralLink = 'https://vibecode.ai/invite/abc123'

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const tierColors = {
    platinum: 'from-purple-500 to-indigo-500',
    gold: 'from-amber-500 to-orange-500',
    silver: 'from-slate-400 to-slate-500',
    bronze: 'from-orange-700 to-amber-800',
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Community</h1>
              <p className="text-slate-400 text-sm">
                Connect with developers, share templates, and grow together
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition shadow-lg shadow-purple-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Invite Developer
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-2xl font-bold text-white">12.5K</p>
          <p className="text-xs text-slate-400">Developers</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-2xl font-bold text-white">2.3K</p>
          <p className="text-xs text-slate-400">Templates</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-2xl font-bold text-white">45K</p>
          <p className="text-xs text-slate-400">Discussions</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-2xl font-bold text-white">890</p>
          <p className="text-xs text-slate-400">Online Now</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 mb-8 rounded-xl bg-white/[0.02] border border-white/[0.06] w-fit">
        {[
          { id: 'developers', label: 'Developers', icon: Users },
          { id: 'discussions', label: 'Discussions', icon: MessageSquare },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
              activeTab === tab.id
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Developers Tab */}
      {activeTab === 'developers' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search developers by name, skill, or company..."
                className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] text-slate-300 hover:bg-white/[0.06] transition">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Featured Developers */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Featured Developers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredDevelopers.map((dev) => (
                <motion.div
                  key={dev.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={dev.avatar}
                        alt={dev.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      {dev.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{dev.name}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r text-white",
                          tierColors[dev.tier as keyof typeof tierColors]
                        )}>
                          {dev.tier.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{dev.username}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {dev.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {dev.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mt-3 line-clamp-2">{dev.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {dev.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-lg bg-white/[0.05] text-xs text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5" />
                        {dev.templates} templates
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {dev.followers.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        {dev.stars.toLocaleString()}
                      </span>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition">
                      Follow
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Discussions</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition text-sm">
              <Plus className="w-4 h-4" />
              New Discussion
            </button>
          </div>

          <div className="space-y-3">
            {recentDiscussions.map((discussion) => (
              <motion.div
                key={discussion.id}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      discussion.category === 'Design' && "bg-pink-500/20 text-pink-400",
                      discussion.category === 'Development' && "bg-blue-500/20 text-blue-400",
                      discussion.category === 'Accessibility' && "bg-green-500/20 text-green-400",
                      discussion.category === 'Showcase' && "bg-amber-500/20 text-amber-400"
                    )}>
                      {discussion.category}
                    </span>
                    <span className="text-xs text-slate-500">{discussion.time}</span>
                  </div>
                  <h3 className="font-medium text-white group-hover:text-purple-400 transition truncate">
                    {discussion.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    by @{discussion.author}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {discussion.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {discussion.likes}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition text-sm">
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 transition"
              >
                <span className={cn(
                  "inline-block px-2 py-1 rounded-lg text-xs font-medium mb-3",
                  event.type === 'Workshop' && "bg-blue-500/20 text-blue-400",
                  event.type === 'Webinar' && "bg-green-500/20 text-green-400",
                  event.type === 'Hackathon' && "bg-purple-500/20 text-purple-400"
                )}>
                  {event.type}
                </span>
                <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.date} at {event.time}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Hosted by {event.host}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {event.attendees} attending
                  </span>
                  <button className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition">
                    RSVP
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Top Contributors</h2>
                <p className="text-sm text-slate-400">This month's leading creators</p>
              </div>
            </div>

            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div
                  key={user.rank}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition",
                    index < 3 ? "bg-white/[0.05]" : "bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold",
                      user.rank === 1 && "bg-amber-500/20 text-amber-400",
                      user.rank === 2 && "bg-slate-400/20 text-slate-300",
                      user.rank === 3 && "bg-orange-700/20 text-orange-500",
                      user.rank > 3 && "bg-white/[0.05] text-slate-400"
                    )}>
                      {user.avatar}
                    </span>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.templates} templates published</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{user.points.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn Points */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              How to Earn Points
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02]">
                <p className="text-2xl font-bold text-purple-400 mb-1">+500</p>
                <p className="text-sm text-white">Publish a Template</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02]">
                <p className="text-2xl font-bold text-green-400 mb-1">+100</p>
                <p className="text-sm text-white">Template Sale</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02]">
                <p className="text-2xl font-bold text-blue-400 mb-1">+50</p>
                <p className="text-sm text-white">Help in Discussions</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-[#0c0c14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Invite a Developer</h3>
                        <p className="text-sm text-slate-400">Earn $10 for each signup</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Referral Link */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Your Referral Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white font-mono text-sm focus:outline-none"
                      />
                      <button
                        onClick={copyReferralLink}
                        className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition flex items-center gap-2"
                      >
                        {inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Share Options */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">Share via</label>
                    <div className="grid grid-cols-4 gap-3">
                      <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition">
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] text-slate-400">Twitter</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition">
                        <Github className="w-5 h-5 text-slate-300" />
                        <span className="text-[10px] text-slate-400">GitHub</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition">
                        <Mail className="w-5 h-5 text-green-400" />
                        <span className="text-[10px] text-slate-400">Email</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition">
                        <Share2 className="w-5 h-5 text-purple-400" />
                        <span className="text-[10px] text-slate-400">More</span>
                      </button>
                    </div>
                  </div>

                  {/* Rewards Info */}
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-400 font-medium mb-1">Referral Rewards</p>
                    <ul className="text-xs text-green-400/70 space-y-1">
                      <li>• $10 when your friend signs up</li>
                      <li>• $25 bonus when they publish their first template</li>
                      <li>• 10% of their earnings for 6 months</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
