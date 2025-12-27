'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  User,
  CreditCard,
  Coins,
  ChevronLeft,
  Sparkles,
  Check,
  Zap,
  Crown,
  Star,
  Mail,
  Shield,
  Bell,
  LogOut,
  Camera,
  Globe,
  Twitter,
  Github,
  Linkedin,
  MapPin,
  Briefcase,
  Calendar,
  Link2,
  Edit3,
  Save,
  X,
  Users,
  Heart,
  Eye,
  Share2,
  Plug,
  Key,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Bot,
  Loader2,
  FolderGit2,
  Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

// AI Providers
const aiProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4 Turbo, o1 models',
    logo: '🤖',
    color: 'from-emerald-500 to-teal-500',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'o1-preview', 'o1-mini'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus',
    logo: '🧠',
    color: 'from-orange-500 to-amber-500',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Ultra',
    logo: '✨',
    color: 'from-blue-500 to-indigo-500',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPrefix: 'AI',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
  },
]

// Token packages
const tokenPackages = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: 100,
    price: 9,
    popular: false,
    description: 'Perfect for trying out',
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 500,
    price: 39,
    popular: true,
    description: 'Best value for builders',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tokens: 2000,
    price: 129,
    popular: false,
    description: 'For power users',
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'account' | 'billing'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Provider settings
  const [selectedProvider, setSelectedProvider] = useState('anthropic')
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    google: '',
  })
  const [keyVisibility, setKeyVisibility] = useState<Record<string, boolean>>({})
  const [savingKeys, setSavingKeys] = useState(false)
  const [keySaveStatus, setKeySaveStatus] = useState<Record<string, 'saved' | 'error' | null>>({})

  // GitHub connection
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState('')

  // Mock user data - in production, fetch from API
  const [user, setUser] = useState({
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    avatar: null as string | null,
    bio: 'Full-stack developer passionate about creating beautiful web experiences. Love building tools that help others succeed.',
    location: 'San Francisco, CA',
    company: 'TechStartup Inc.',
    website: 'https://johndoe.dev',
    twitter: 'johndoe',
    github: 'johndoe',
    linkedin: 'johndoe',
    plan: 'Pro',
    tokensRemaining: 342,
    tokensTotal: 500,
    joinedDate: 'December 2024',
    projectsCount: 12,
    followersCount: 234,
    followingCount: 89,
    likesReceived: 567,
  })

  return (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 80% 80% at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(ellipse 80% 80% at 50% 0%, rgba(251, 146, 60, 0.08) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 backdrop-blur-xl border-b",
        isDark
          ? "bg-slate-900/80 border-white/5"
          : "bg-white/80 border-slate-200/50"
      )}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                isDark ? "hover:bg-white/5" : "hover:bg-slate-100"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>
          </div>

          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

          <div className="w-24" />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className={cn(
          "flex items-center gap-1 p-1 rounded-xl mb-8 w-fit",
          isDark ? "bg-white/5" : "bg-slate-100"
        )}>
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'integrations', label: 'AI & Integrations', icon: Plug },
            { id: 'account', label: 'Account', icon: Shield },
            { id: 'billing', label: 'Billing', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? isDark
                    ? "bg-white/10 text-white"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Header Card */}
            <div className={cn(
              "rounded-2xl border overflow-hidden",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              {/* Cover Image */}
              <div className={cn(
                "h-32 relative",
                isDark
                  ? "bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-pink-600/30"
                  : "bg-gradient-to-r from-orange-400/30 via-pink-400/30 to-purple-400/30"
              )}>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-16 mb-4">
                  <div className={cn(
                    "w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-bold border-4 relative group cursor-pointer",
                    isDark
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 border-slate-900"
                      : "bg-gradient-to-br from-orange-400 to-pink-500 border-white"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-white">{user.name.charAt(0)}</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const url = URL.createObjectURL(file)
                        setUser(prev => ({ ...prev, avatar: url }))
                      }
                    }}
                  />
                </div>

                {/* Name & Username */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                      @{user.username}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      isEditing
                        ? "bg-emerald-500 text-white"
                        : isDark
                          ? "bg-white/10 hover:bg-white/20"
                          : "bg-slate-100 hover:bg-slate-200"
                    )}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Bio */}
                {isEditing ? (
                  <textarea
                    value={user.bio}
                    onChange={(e) => setUser(prev => ({ ...prev, bio: e.target.value }))}
                    className={cn(
                      "w-full p-3 rounded-xl text-sm resize-none h-24 focus:outline-none focus:ring-2",
                      isDark
                        ? "bg-white/5 border border-white/10 focus:ring-violet-500/50"
                        : "bg-slate-50 border border-slate-200 focus:ring-orange-500/50"
                    )}
                  />
                ) : (
                  <p className={cn("text-sm mb-4", isDark ? "text-slate-300" : "text-slate-600")}>
                    {user.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-t border-b my-4"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  {[
                    { label: 'Projects', value: user.projectsCount, icon: Briefcase },
                    { label: 'Followers', value: user.followersCount, icon: Users },
                    { label: 'Following', value: user.followingCount, icon: Heart },
                    { label: 'Likes', value: user.likesReceived, icon: Star },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <stat.icon className={cn("w-4 h-4", isDark ? "text-violet-400" : "text-orange-500")} />
                      <span className="font-semibold">{stat.value}</span>
                      <span className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: MapPin, label: 'Location', value: user.location, field: 'location' },
                    { icon: Briefcase, label: 'Company', value: user.company, field: 'company' },
                    { icon: Globe, label: 'Website', value: user.website, field: 'website', isLink: true },
                    { icon: Calendar, label: 'Joined', value: user.joinedDate, field: null },
                  ].map((item) => (
                    <div key={item.label} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      isDark ? "bg-white/5" : "bg-slate-50"
                    )}>
                      <item.icon className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-500")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{item.label}</p>
                        {isEditing && item.field ? (
                          <input
                            type="text"
                            value={(user as any)[item.field]}
                            onChange={(e) => setUser(prev => ({ ...prev, [item.field!]: e.target.value }))}
                            className={cn(
                              "w-full bg-transparent text-sm font-medium focus:outline-none",
                              isDark ? "text-white" : "text-slate-900"
                            )}
                          />
                        ) : item.isLink ? (
                          <a href={item.value} target="_blank" rel="noopener noreferrer"
                            className={cn("text-sm font-medium truncate block hover:underline",
                              isDark ? "text-violet-400" : "text-orange-600")}>
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm font-medium truncate">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <h3 className="font-semibold mb-4">Social Links</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Twitter, label: 'Twitter', value: user.twitter, field: 'twitter', prefix: 'twitter.com/' },
                  { icon: Github, label: 'GitHub', value: user.github, field: 'github', prefix: 'github.com/' },
                  { icon: Linkedin, label: 'LinkedIn', value: user.linkedin, field: 'linkedin', prefix: 'linkedin.com/in/' },
                ].map((social) => (
                  <div key={social.label} className={cn(
                    "flex items-center gap-3 p-4 rounded-xl",
                    isDark ? "bg-white/5" : "bg-slate-50"
                  )}>
                    <social.icon className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-slate-500")} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs mb-1", isDark ? "text-slate-500" : "text-slate-400")}>{social.label}</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(user as any)[social.field]}
                          onChange={(e) => setUser(prev => ({ ...prev, [social.field]: e.target.value }))}
                          placeholder="username"
                          className={cn(
                            "w-full bg-transparent text-sm font-medium focus:outline-none",
                            isDark ? "text-white placeholder-slate-600" : "text-slate-900 placeholder-slate-400"
                          )}
                        />
                      ) : (
                        <p className="text-sm font-medium truncate">@{(user as any)[social.field]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Shared Templates */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">My Shared Templates</h3>
                <button className={cn(
                  "text-sm font-medium",
                  isDark ? "text-violet-400 hover:text-violet-300" : "text-orange-600 hover:text-orange-500"
                )}>
                  View All
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'SaaS Landing', views: 234, likes: 45 },
                  { name: 'Portfolio Dark', views: 189, likes: 32 },
                  { name: 'Restaurant Menu', views: 156, likes: 28 },
                ].map((template, i) => (
                  <div key={i} className={cn(
                    "rounded-xl overflow-hidden border",
                    isDark ? "border-white/10" : "border-slate-200"
                  )}>
                    <div className={cn(
                      "h-24",
                      isDark
                        ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                        : "bg-gradient-to-br from-orange-100 to-pink-100"
                    )} />
                    <div className="p-3">
                      <p className="font-medium text-sm mb-2">{template.name}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={cn("flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
                          <Eye className="w-3 h-3" /> {template.views}
                        </span>
                        <span className={cn("flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
                          <Heart className="w-3 h-3" /> {template.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* AI Provider Selection */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDark
                    ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                    : "bg-gradient-to-br from-orange-100 to-pink-100"
                )}>
                  <Bot className={cn("w-5 h-5", isDark ? "text-violet-400" : "text-orange-600")} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Provider</h2>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                    Choose which AI model powers your website generation
                  </p>
                </div>
              </div>

              {/* Provider Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {aiProviders.map((provider) => (
                  <motion.button
                    key={provider.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedProvider(provider.id)
                      setSelectedModel(provider.models[0])
                    }}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all",
                      selectedProvider === provider.id
                        ? isDark
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-orange-500 bg-orange-50"
                        : isDark
                          ? "border-white/10 hover:border-white/20 bg-white/5"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50"
                    )}
                  >
                    {selectedProvider === provider.id && (
                      <div className={cn(
                        "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center",
                        isDark ? "bg-violet-500" : "bg-orange-500"
                      )}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3",
                      `bg-gradient-to-br ${provider.color} bg-opacity-20`
                    )}>
                      {provider.logo}
                    </div>
                    <h3 className="font-semibold mb-1">{provider.name}</h3>
                    <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                      {provider.description}
                    </p>
                  </motion.button>
                ))}
              </div>

              {/* Model Selection */}
              <div className={cn(
                "p-4 rounded-xl",
                isDark ? "bg-white/5" : "bg-slate-50"
              )}>
                <label className={cn("text-sm font-medium block mb-2", isDark ? "text-slate-400" : "text-slate-500")}>
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2",
                    isDark
                      ? "bg-slate-800 border-white/10 focus:ring-violet-500/50"
                      : "bg-white border-slate-200 focus:ring-orange-500/50"
                  )}
                >
                  {aiProviders.find(p => p.id === selectedProvider)?.models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* API Keys Configuration */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDark ? "bg-amber-500/20" : "bg-amber-100"
                )}>
                  <Key className={cn("w-5 h-5", isDark ? "text-amber-400" : "text-amber-600")} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">API Keys</h2>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                    Use your own API keys for AI generation (optional)
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex items-start gap-2 p-3 rounded-lg mb-6",
                isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"
              )}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Your API keys are encrypted and stored securely. Using your own keys gives you unlimited generations.
                </p>
              </div>

              <div className="space-y-4">
                {aiProviders.map((provider) => (
                  <div key={provider.id} className={cn(
                    "p-4 rounded-xl",
                    isDark ? "bg-white/5" : "bg-slate-50"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{provider.logo}</span>
                        <span className="font-medium text-sm">{provider.name}</span>
                        {keySaveStatus[provider.id] === 'saved' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <CheckCircle2 className="w-3 h-3" /> Saved
                          </span>
                        )}
                      </div>
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isDark ? "text-violet-400 hover:text-violet-300" : "text-orange-600 hover:text-orange-500"
                        )}
                      >
                        Get API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={keyVisibility[provider.id] ? "text" : "password"}
                        value={apiKeys[provider.id]}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                        placeholder={`${provider.keyPrefix}...`}
                        className={cn(
                          "w-full px-4 py-2.5 pr-20 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2",
                          isDark
                            ? "bg-slate-800 border-white/10 focus:ring-violet-500/50"
                            : "bg-white border-slate-200 focus:ring-orange-500/50"
                        )}
                      />
                      <button
                        onClick={() => setKeyVisibility(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs",
                          isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {keyVisibility[provider.id] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSavingKeys(true)
                    // Simulate API call
                    setTimeout(() => {
                      setSavingKeys(false)
                      setKeySaveStatus(Object.fromEntries(
                        Object.entries(apiKeys).filter(([_, v]) => v).map(([k]) => [k, 'saved'])
                      ))
                    }, 1000)
                  }}
                  disabled={savingKeys}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50",
                    isDark
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      : "bg-gradient-to-r from-orange-500 to-pink-500"
                  )}
                >
                  {savingKeys ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save API Keys
                </motion.button>
              </div>
            </div>

            {/* GitHub Integration */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDark ? "bg-slate-700" : "bg-slate-100"
                )}>
                  <FolderGit2 className={cn("w-5 h-5", isDark ? "text-slate-300" : "text-slate-600")} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">GitHub Integration</h2>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                    Connect your GitHub account to deploy and manage repositories
                  </p>
                </div>
              </div>

              {githubConnected ? (
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-xl",
                  isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Github className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">@{githubUsername || 'username'}</p>
                      <p className={cn("text-xs", isDark ? "text-emerald-400" : "text-emerald-600")}>
                        Connected
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGithubConnected(false)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium",
                      isDark ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"
                    )}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setGithubConnected(true)
                    setGithubUsername('johndoe')
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all",
                    isDark
                      ? "border-white/10 hover:border-white/20 hover:bg-white/5"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">Connect GitHub Account</span>
                </motion.button>
              )}
            </div>

            {/* Code Editor Preferences */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDark ? "bg-cyan-500/20" : "bg-cyan-100"
                )}>
                  <Code2 className={cn("w-5 h-5", isDark ? "text-cyan-400" : "text-cyan-600")} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Code Editor Preferences</h2>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                    Customize your coding experience
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-xl", isDark ? "bg-white/5" : "bg-slate-50")}>
                  <label className={cn("text-sm font-medium block mb-2", isDark ? "text-slate-400" : "text-slate-500")}>
                    Editor Theme
                  </label>
                  <select className={cn(
                    "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2",
                    isDark
                      ? "bg-slate-800 border-white/10 focus:ring-violet-500/50"
                      : "bg-white border-slate-200 focus:ring-orange-500/50"
                  )}>
                    <option value="vs-dark">VS Code Dark</option>
                    <option value="github-dark">GitHub Dark</option>
                    <option value="monokai">Monokai</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div className={cn("p-4 rounded-xl", isDark ? "bg-white/5" : "bg-slate-50")}>
                  <label className={cn("text-sm font-medium block mb-2", isDark ? "text-slate-400" : "text-slate-500")}>
                    Font Size
                  </label>
                  <select className={cn(
                    "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2",
                    isDark
                      ? "bg-slate-800 border-white/10 focus:ring-violet-500/50"
                      : "bg-white border-slate-200 focus:ring-orange-500/50"
                  )}>
                    <option value="12">12px</option>
                    <option value="14">14px (Default)</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <h2 className="text-lg font-semibold mb-6">Profile</h2>

              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold",
                  isDark
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                    : "bg-gradient-to-br from-orange-400 to-pink-500"
                )}>
                  {user.name.charAt(0)}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className={cn(
                      "text-sm font-medium block mb-2",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>Name</label>
                    <input
                      type="text"
                      defaultValue={user.name}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2",
                        isDark
                          ? "bg-white/5 border-white/10 focus:ring-violet-500/50"
                          : "bg-slate-50 border-slate-200 focus:ring-orange-500/50"
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn(
                      "text-sm font-medium block mb-2",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>Email</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2",
                        isDark
                          ? "bg-white/5 border-white/10 focus:ring-violet-500/50"
                          : "bg-slate-50 border-slate-200 focus:ring-orange-500/50"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-medium text-white",
                    isDark
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      : "bg-gradient-to-r from-orange-500 to-pink-500"
                  )}
                >
                  Save Changes
                </motion.button>
              </div>
            </div>

            {/* Preferences */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <h2 className="text-lg font-semibold mb-6">Preferences</h2>

              <div className="space-y-4">
                {[
                  { icon: Bell, label: 'Email notifications', description: 'Receive updates about your projects' },
                  { icon: Shield, label: 'Two-factor authentication', description: 'Add an extra layer of security' },
                ].map((pref, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl",
                      isDark ? "bg-white/5" : "bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isDark ? "bg-white/5" : "bg-white"
                      )}>
                        <pref.icon className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-slate-500")} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{pref.label}</p>
                        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                          {pref.description}
                        </p>
                      </div>
                    </div>
                    <button className={cn(
                      "w-12 h-7 rounded-full transition-colors relative",
                      isDark ? "bg-violet-500" : "bg-orange-500"
                    )}>
                      <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className={cn(
              "rounded-2xl border p-6",
              "border-red-500/20 bg-red-500/5"
            )}>
              <h2 className="text-lg font-semibold mb-4 text-red-500">Danger Zone</h2>
              <p className={cn("text-sm mb-4", isDark ? "text-slate-400" : "text-slate-500")}>
                Once you delete your account, there is no going back.
              </p>
              <button className="px-4 py-2 rounded-xl border border-red-500/50 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors">
                Delete Account
              </button>
            </div>
          </motion.div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Current Plan & Tokens */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Your Plan</h2>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                    Manage your subscription and tokens
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  isDark
                    ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400"
                    : "bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600"
                )}>
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-semibold">{user.plan}</span>
                </div>
              </div>

              {/* Token Usage */}
              <div className={cn(
                "p-4 rounded-xl mb-6",
                isDark ? "bg-white/5" : "bg-slate-50"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Coins className={cn("w-5 h-5", isDark ? "text-violet-400" : "text-orange-500")} />
                    <span className="font-medium">Token Balance</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {user.tokensRemaining}
                    <span className={cn("text-sm font-normal ml-1", isDark ? "text-slate-500" : "text-slate-400")}>
                      / {user.tokensTotal}
                    </span>
                  </span>
                </div>
                <div className={cn(
                  "h-3 rounded-full overflow-hidden",
                  isDark ? "bg-white/10" : "bg-slate-200"
                )}>
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isDark
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        : "bg-gradient-to-r from-orange-500 to-pink-500"
                    )}
                    style={{ width: `${(user.tokensRemaining / user.tokensTotal) * 100}%` }}
                  />
                </div>
                <p className={cn("text-xs mt-2", isDark ? "text-slate-500" : "text-slate-400")}>
                  1 token = 1 website generation or 10 edits
                </p>
              </div>
            </div>

            {/* Buy Tokens */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <h2 className="text-lg font-semibold mb-6">Buy Tokens</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tokenPackages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={cn(
                      "relative rounded-2xl border p-6 cursor-pointer transition-all",
                      pkg.popular
                        ? isDark
                          ? "border-violet-500/50 bg-violet-500/5"
                          : "border-orange-500/50 bg-orange-50"
                        : isDark
                          ? "border-white/10 hover:border-white/20"
                          : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {pkg.popular && (
                      <div className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold",
                        isDark
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                          : "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                      )}>
                        Most Popular
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="font-semibold mb-1">{pkg.name}</h3>
                      <p className={cn("text-xs mb-4", isDark ? "text-slate-500" : "text-slate-400")}>
                        {pkg.description}
                      </p>

                      <div className="flex items-center justify-center gap-1 mb-4">
                        <Coins className={cn("w-5 h-5", isDark ? "text-violet-400" : "text-orange-500")} />
                        <span className="text-2xl font-bold">{pkg.tokens}</span>
                        <span className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>tokens</span>
                      </div>

                      <div className="mb-4">
                        <span className="text-3xl font-bold">${pkg.price}</span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full py-2.5 rounded-xl text-sm font-medium transition-all",
                          pkg.popular
                            ? isDark
                              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                              : "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                            : isDark
                              ? "bg-white/10 hover:bg-white/20 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        )}
                      >
                        Buy Now
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            <div className={cn(
              "rounded-2xl border p-6",
              isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white border-slate-200"
            )}>
              <h2 className="text-lg font-semibold mb-6">Payment History</h2>

              <div className="space-y-3">
                {[
                  { date: 'Dec 15, 2024', amount: '$39.00', tokens: 500, status: 'Completed' },
                  { date: 'Nov 20, 2024', amount: '$9.00', tokens: 100, status: 'Completed' },
                ].map((payment, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl",
                      isDark ? "bg-white/5" : "bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                      )}>
                        <Check className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.tokens} Tokens</p>
                        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                          {payment.date}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">{payment.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
