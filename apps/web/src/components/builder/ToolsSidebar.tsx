'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Rocket,
  Loader2,
  Check,
  Download,
  ChevronRight,
  Layout,
  Type,
  CreditCard,
  MessageSquare,
  Target,
  Users,
  BarChart3,
  HelpCircle,
  Grid3X3,
  Star,
  ExternalLink,
  Send,
  Heart,
  Eye,
  Share2,
  Copy,
  TrendingUp,
  Clock,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolsSidebarProps {
  isOpen: boolean
  onClose: () => void
  theme: 'light' | 'dark'
  html: string
  projectName?: string
  onInsertComponent?: (html: string) => void
  initialTab?: Tab
}

type Tab = 'components' | 'images' | 'stock' | 'community' | 'deploy'

interface Component {
  id: string
  name: string
  category: string
  description: string
  preview: string
  html: string
}

interface CommunityPost {
  _id: string
  type: 'template' | 'website' | 'component' | 'ad' | 'blog'
  title: string
  description: string
  thumbnail?: string
  author: { name: string; username: string; avatar?: string }
  likes: number
  views: number
  downloads: number
  tags: string[]
}

interface ChatMessage {
  _id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  createdAt: string
}

interface StockImage {
  id: string
  url: string
  thumbnail: string
  tags: string[]
  author: string
}

interface AIImage {
  url: string
  provider: string
  revised_prompt?: string
}

const COMPONENT_CATEGORIES = [
  { id: 'hero', icon: Layout, label: 'Hero Sections' },
  { id: 'features', icon: Grid3X3, label: 'Features' },
  { id: 'pricing', icon: CreditCard, label: 'Pricing' },
  { id: 'testimonials', icon: MessageSquare, label: 'Testimonials' },
  { id: 'cta', icon: Target, label: 'Call to Action' },
  { id: 'contact', icon: Users, label: 'Contact' },
  { id: 'stats', icon: BarChart3, label: 'Stats' },
  { id: 'faq', icon: HelpCircle, label: 'FAQ' },
]

export function ToolsSidebar({
  isOpen,
  onClose,
  theme,
  html,
  projectName = 'My Website',
  onInsertComponent,
  initialTab,
}: ToolsSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'components')

  // Update tab when initialTab changes
  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab)
    }
  }, [initialTab, isOpen])
  const [searchQuery, setSearchQuery] = useState('')
  const isDark = theme === 'dark'

  // Components state
  const [components, setComponents] = useState<Component[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('hero')
  const [loadingComponents, setLoadingComponents] = useState(false)

  // Stock images state
  const [stockImages, setStockImages] = useState<StockImage[]>([])
  const [stockQuery, setStockQuery] = useState('business')
  const [loadingStock, setLoadingStock] = useState(false)

  // AI image state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState('photorealistic')
  const [aiProvider, setAiProvider] = useState<'auto' | 'flux' | 'dalle'>('auto')
  const [availableProviders, setAvailableProviders] = useState<{ flux: boolean; dalle: boolean }>({ flux: false, dalle: false })
  const [generatingAi, setGeneratingAi] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<AIImage | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Deploy state
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{ success: boolean; url?: string; message?: string } | null>(null)

  // Community state
  const [communityTab, setCommunityTab] = useState<'feed' | 'chat'>('feed')
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [loadingCommunity, setLoadingCommunity] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [communityFilter, setCommunityFilter] = useState<'recent' | 'popular' | 'trending'>('recent')

  // Mock user for demo - in production, get from auth
  const currentUser = {
    id: 'user123',
    name: 'John Doe',
    username: 'johndoe',
    avatar: null,
  }

  // Load components
  useEffect(() => {
    loadComponents()
  }, [])

  // Check available AI providers
  useEffect(() => {
    const checkProviders = async () => {
      try {
        const res = await fetch('/api/ai/generate-image')
        if (res.ok) {
          const data = await res.json()
          setAvailableProviders(data.providers || { flux: false, dalle: false })
        }
      } catch (error) {
        console.error('Failed to check AI providers:', error)
      }
    }
    checkProviders()
  }, [])

  const loadComponents = async () => {
    setLoadingComponents(true)
    try {
      const res = await fetch('/api/components')
      if (res.ok) {
        const data = await res.json()
        setComponents(data.components || [])
      }
    } catch (error) {
      console.error('Failed to load components:', error)
    } finally {
      setLoadingComponents(false)
    }
  }

  // Search stock photos
  const searchStockPhotos = async (query: string) => {
    if (!query.trim()) return
    setLoadingStock(true)
    try {
      const res = await fetch(`/api/media/pixabay?q=${encodeURIComponent(query)}&per_page=20`)
      if (res.ok) {
        const data = await res.json()
        setStockImages(data.images || [])
      }
    } catch (error) {
      console.error('Stock search failed:', error)
    } finally {
      setLoadingStock(false)
    }
  }

  // Load community posts
  const loadCommunityPosts = async () => {
    setLoadingCommunity(true)
    try {
      const res = await fetch(`/api/community/posts?sort=${communityFilter}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setCommunityPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to load community posts:', error)
    } finally {
      setLoadingCommunity(false)
    }
  }

  // Load chat messages
  const loadChatMessages = async () => {
    try {
      const res = await fetch('/api/community/chat?roomId=global&limit=50')
      if (res.ok) {
        const data = await res.json()
        setChatMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load chat:', error)
    }
  }

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || sendingChat) return
    setSendingChat(true)
    try {
      const res = await fetch('/api/community/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'global',
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          message: chatInput,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages(prev => [...prev, data.message])
        setChatInput('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingChat(false)
    }
  }

  // Share current HTML as template
  const shareAsTemplate = async () => {
    if (!html) return
    const title = prompt('Template name:')
    if (!title) return

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'template',
          title,
          description: `Shared from ${projectName}`,
          html,
          author: currentUser,
          tags: ['template'],
          category: 'general',
        }),
      })
      if (res.ok) {
        alert('Template shared successfully!')
        loadCommunityPosts()
      }
    } catch (error) {
      console.error('Failed to share template:', error)
    }
  }

  // Load community data when tab opens
  useEffect(() => {
    if (activeTab === 'community') {
      if (communityTab === 'feed') {
        loadCommunityPosts()
      } else {
        loadChatMessages()
      }
    }
  }, [activeTab, communityTab, communityFilter])

  // Generate AI image
  const generateAiImage = async () => {
    if (!aiPrompt.trim()) return
    setGeneratingAi(true)
    setGeneratedImage(null)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle,
          aspectRatio: '16:9',
          provider: aiProvider,
        }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setGeneratedImage(data)
      } else {
        setAiError(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      setAiError('Network error - please try again')
    } finally {
      setGeneratingAi(false)
    }
  }

  // Deploy to Render
  const deployToRender = async () => {
    if (!html) return
    setDeploying(true)
    setDeployResult(null)
    try {
      const res = await fetch('/api/deploy/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          projectName,
        }),
      })
      const data = await res.json()
      setDeployResult({
        success: data.success,
        url: data.gistUrl || data.rawUrl,
        message: data.message,
      })
    } catch (error) {
      setDeployResult({ success: false, message: 'Deployment failed' })
    } finally {
      setDeploying(false)
    }
  }

  const filteredComponents = components.filter(
    (c) => c.category === selectedCategory &&
      (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  )

  const tabs = [
    { id: 'components' as const, icon: Layers, label: 'Components' },
    { id: 'images' as const, icon: Sparkles, label: 'AI Images' },
    { id: 'stock' as const, icon: ImageIcon, label: 'Stock' },
    { id: 'community' as const, icon: Users, label: 'Community' },
    { id: 'deploy' as const, icon: Rocket, label: 'Deploy' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 h-full w-[420px] z-50 flex flex-col shadow-2xl",
              isDark ? "bg-zinc-900" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between px-4 h-14 border-b shrink-0",
              isDark ? "border-zinc-800" : "border-gray-200"
            )}>
              <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                Builder Tools
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className={cn(
              "flex border-b shrink-0",
              isDark ? "border-zinc-800" : "border-gray-200"
            )}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                    activeTab === tab.id
                      ? isDark ? "text-violet-400 border-b-2 border-violet-400" : "text-violet-600 border-b-2 border-violet-600"
                      : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Components Tab */}
              {activeTab === 'components' && (
                <div className="p-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                      isDark ? "text-zinc-500" : "text-gray-400"
                    )} />
                    <input
                      type="text"
                      placeholder="Search components..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500",
                        isDark ? "bg-zinc-800 text-white placeholder-zinc-500" : "bg-gray-100 text-gray-900 placeholder-gray-400"
                      )}
                    />
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {COMPONENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          selectedCategory === cat.id
                            ? "bg-violet-600 text-white"
                            : isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Component Grid */}
                  {loadingComponents ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredComponents.map((component) => (
                        <button
                          key={component.id}
                          onClick={() => onInsertComponent?.(component.html)}
                          className={cn(
                            "group text-left p-3 rounded-xl border transition-all hover:shadow-lg hover:scale-[1.02]",
                            isDark
                              ? "bg-zinc-800 border-zinc-700 hover:border-violet-500"
                              : "bg-gray-50 border-gray-200 hover:border-violet-500"
                          )}
                        >
                          <div
                            className={cn(
                              "h-24 rounded-lg mb-2 overflow-hidden",
                              isDark ? "bg-zinc-700" : "bg-gray-200"
                            )}
                            dangerouslySetInnerHTML={{ __html: component.preview }}
                          />
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            {component.name}
                          </p>
                          <p className={cn(
                            "text-xs truncate",
                            isDark ? "text-zinc-500" : "text-gray-500"
                          )}>
                            {component.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!loadingComponents && filteredComponents.length === 0 && (
                    <div className={cn(
                      "text-center py-12",
                      isDark ? "text-zinc-500" : "text-gray-500"
                    )}>
                      No components found
                    </div>
                  )}
                </div>
              )}

              {/* AI Images Tab */}
              {activeTab === 'images' && (
                <div className="p-4 space-y-4">
                  {/* Provider Status */}
                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-xs",
                    isDark ? "bg-zinc-800/50" : "bg-gray-100"
                  )}>
                    <span className={isDark ? "text-zinc-400" : "text-gray-500"}>Available:</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      availableProviders.flux
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-zinc-700 text-zinc-500"
                    )}>
                      FLUX {availableProviders.flux ? '✓' : '✗'}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      availableProviders.dalle
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-zinc-700 text-zinc-500"
                    )}>
                      DALL-E {availableProviders.dalle ? '✓' : '✗'}
                    </span>
                  </div>

                  <div className={cn(
                    "p-4 rounded-xl",
                    isDark ? "bg-zinc-800" : "bg-gray-50"
                  )}>
                    <h3 className={cn(
                      "font-medium mb-3 flex items-center gap-2",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      Generate with AI
                    </h3>
                    <textarea
                      placeholder="Describe the image you want to generate..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={3}
                      className={cn(
                        "w-full p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500",
                        isDark ? "bg-zinc-700 text-white placeholder-zinc-500" : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200"
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <select
                        value={aiStyle}
                        onChange={(e) => setAiStyle(e.target.value)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500",
                          isDark ? "bg-zinc-700 text-white" : "bg-white text-gray-900 border border-gray-200"
                        )}
                      >
                        <option value="photorealistic">Photorealistic</option>
                        <option value="illustration">Illustration</option>
                        <option value="minimal">Minimal</option>
                        <option value="artistic">Artistic</option>
                      </select>
                      <select
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value as 'auto' | 'flux' | 'dalle')}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500",
                          isDark ? "bg-zinc-700 text-white" : "bg-white text-gray-900 border border-gray-200"
                        )}
                      >
                        <option value="auto">Auto (FLUX → DALL-E)</option>
                        <option value="flux" disabled={!availableProviders.flux}>RunPod FLUX</option>
                        <option value="dalle" disabled={!availableProviders.dalle}>DALL-E 3</option>
                      </select>
                    </div>
                    <button
                      onClick={generateAiImage}
                      disabled={!aiPrompt.trim() || generatingAi || (!availableProviders.flux && !availableProviders.dalle)}
                      className={cn(
                        "w-full mt-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        aiPrompt.trim() && !generatingAi && (availableProviders.flux || availableProviders.dalle)
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                          : isDark ? "bg-zinc-700 text-zinc-500" : "bg-gray-200 text-gray-400"
                      )}
                    >
                      {generatingAi ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Image
                        </>
                      )}
                    </button>
                  </div>

                  {/* Error Display */}
                  {aiError && (
                    <div className={cn(
                      "p-3 rounded-lg text-sm",
                      isDark ? "bg-red-500/20 text-red-300" : "bg-red-50 text-red-600"
                    )}>
                      {aiError}
                    </div>
                  )}

                  {/* Generated Image */}
                  {generatedImage && (
                    <div className={cn(
                      "p-4 rounded-xl",
                      isDark ? "bg-zinc-800" : "bg-gray-50"
                    )}>
                      <div className="relative group">
                        <img
                          src={generatedImage.url}
                          alt="Generated"
                          className="w-full rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = generatedImage.url
                              a.download = 'ai-generated.png'
                              a.click()
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                          >
                            <Download className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                      <p className={cn(
                        "text-xs mt-2",
                        isDark ? "text-zinc-500" : "text-gray-500"
                      )}>
                        Generated with {generatedImage.provider}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Photos Tab */}
              {activeTab === 'stock' && (
                <div className="p-4 space-y-4">
                  {/* Search */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                        isDark ? "text-zinc-500" : "text-gray-400"
                      )} />
                      <input
                        type="text"
                        placeholder="Search free stock photos..."
                        value={stockQuery}
                        onChange={(e) => setStockQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchStockPhotos(stockQuery)}
                        className={cn(
                          "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500",
                          isDark ? "bg-zinc-800 text-white placeholder-zinc-500" : "bg-gray-100 text-gray-900 placeholder-gray-400"
                        )}
                      />
                    </div>
                    <button
                      onClick={() => searchStockPhotos(stockQuery)}
                      disabled={loadingStock}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium"
                    >
                      {loadingStock ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {/* Quick tags */}
                  <div className="flex flex-wrap gap-2">
                    {['business', 'technology', 'nature', 'people', 'abstract', 'office'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => { setStockQuery(tag); searchStockPhotos(tag) }}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Results */}
                  {loadingStock ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {stockImages.map((img) => (
                        <div
                          key={img.id}
                          className="group relative rounded-lg overflow-hidden cursor-pointer"
                        >
                          <img
                            src={img.thumbnail}
                            alt={img.tags?.join(', ') || 'Stock photo'}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(img.url)}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                              title="Copy URL"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </button>
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                            >
                              <ExternalLink className="w-4 h-4 text-white" />
                            </a>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white/80 truncate">by {img.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loadingStock && stockImages.length === 0 && (
                    <div className={cn(
                      "text-center py-12",
                      isDark ? "text-zinc-500" : "text-gray-500"
                    )}>
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Search for free stock photos</p>
                      <p className="text-xs mt-1">Powered by Pixabay</p>
                    </div>
                  )}
                </div>
              )}

              {/* Community Tab */}
              {activeTab === 'community' && (
                <div className="flex flex-col h-full">
                  {/* Community Sub-tabs */}
                  <div className={cn(
                    "flex items-center gap-1 p-2 border-b shrink-0",
                    isDark ? "border-zinc-800" : "border-gray-200"
                  )}>
                    {[
                      { id: 'feed' as const, label: 'Templates', icon: Grid3X3 },
                      { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setCommunityTab(tab.id)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                          communityTab === tab.id
                            ? isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"
                            : isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Feed View */}
                  {communityTab === 'feed' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Share Button */}
                      {html && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={shareAsTemplate}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium",
                            isDark
                              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                              : "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                          )}
                        >
                          <Share2 className="w-4 h-4" />
                          Share Your Template
                        </motion.button>
                      )}

                      {/* Filter */}
                      <div className="flex items-center gap-2">
                        {[
                          { id: 'recent' as const, label: 'Recent', icon: Clock },
                          { id: 'popular' as const, label: 'Popular', icon: Heart },
                          { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setCommunityFilter(filter.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                              communityFilter === filter.id
                                ? isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"
                                : isDark ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            <filter.icon className="w-3 h-3" />
                            {filter.label}
                          </button>
                        ))}
                      </div>

                      {/* Posts Grid */}
                      {loadingCommunity ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        </div>
                      ) : communityPosts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {communityPosts.map((post) => (
                            <div
                              key={post._id}
                              className={cn(
                                "rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-lg",
                                isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"
                              )}
                            >
                              <div className={cn(
                                "h-24 relative",
                                isDark
                                  ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                                  : "bg-gradient-to-br from-orange-100 to-pink-100"
                              )}>
                                {post.thumbnail && (
                                  <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 right-2">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                    isDark ? "bg-black/50 text-white" : "bg-white/80 text-gray-700"
                                  )}>
                                    {post.type}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3">
                                <p className="font-medium text-sm truncate">{post.title}</p>
                                <p className={cn("text-xs truncate mb-2", isDark ? "text-zinc-500" : "text-gray-500")}>
                                  by @{post.author.username}
                                </p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className={cn("flex items-center gap-1", isDark ? "text-zinc-400" : "text-gray-500")}>
                                    <Heart className="w-3 h-3" /> {post.likes}
                                  </span>
                                  <span className={cn("flex items-center gap-1", isDark ? "text-zinc-400" : "text-gray-500")}>
                                    <Eye className="w-3 h-3" /> {post.views}
                                  </span>
                                  <span className={cn("flex items-center gap-1", isDark ? "text-zinc-400" : "text-gray-500")}>
                                    <Download className="w-3 h-3" /> {post.downloads}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn(
                          "text-center py-12",
                          isDark ? "text-zinc-500" : "text-gray-500"
                        )}>
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No templates shared yet</p>
                          <p className="text-xs mt-1">Be the first to share!</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chat View */}
                  {communityTab === 'chat' && (
                    <div className="flex flex-col flex-1 min-h-0">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length > 0 ? (
                          chatMessages.map((msg) => (
                            <div
                              key={msg._id}
                              className={cn(
                                "flex gap-3",
                                msg.userId === currentUser.id ? "flex-row-reverse" : ""
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                isDark ? "bg-violet-500" : "bg-orange-500",
                                "text-white"
                              )}>
                                {msg.userName.charAt(0)}
                              </div>
                              <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                msg.userId === currentUser.id
                                  ? isDark ? "bg-violet-600" : "bg-orange-500"
                                  : isDark ? "bg-zinc-800" : "bg-gray-100",
                                msg.userId === currentUser.id ? "text-white" : ""
                              )}>
                                <p className={cn(
                                  "text-xs font-medium mb-1",
                                  msg.userId === currentUser.id
                                    ? "text-white/70"
                                    : isDark ? "text-zinc-400" : "text-gray-500"
                                )}>
                                  {msg.userName}
                                </p>
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={cn(
                            "text-center py-12",
                            isDark ? "text-zinc-500" : "text-gray-500"
                          )}>
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No messages yet</p>
                            <p className="text-xs mt-1">Start the conversation!</p>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className={cn(
                        "p-3 border-t shrink-0",
                        isDark ? "border-zinc-800" : "border-gray-200"
                      )}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                            placeholder="Type a message..."
                            className={cn(
                              "flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2",
                              isDark
                                ? "bg-zinc-800 text-white placeholder-zinc-500 focus:ring-violet-500"
                                : "bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-orange-500"
                            )}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim() || sendingChat}
                            className={cn(
                              "p-2.5 rounded-xl transition-colors",
                              chatInput.trim() && !sendingChat
                                ? isDark
                                  ? "bg-violet-600 text-white"
                                  : "bg-orange-500 text-white"
                                : isDark
                                  ? "bg-zinc-800 text-zinc-500"
                                  : "bg-gray-200 text-gray-400"
                            )}
                          >
                            {sendingChat ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Deploy Tab */}
              {activeTab === 'deploy' && (
                <div className="p-4 space-y-4">
                  <div className={cn(
                    "p-6 rounded-xl text-center",
                    isDark ? "bg-zinc-800" : "bg-gray-50"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                      isDark ? "bg-violet-500/20" : "bg-violet-100"
                    )}>
                      <Rocket className={cn("w-8 h-8", isDark ? "text-violet-400" : "text-violet-600")} />
                    </div>
                    <h3 className={cn(
                      "text-lg font-semibold mb-2",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Deploy Your Website
                    </h3>
                    <p className={cn(
                      "text-sm mb-6",
                      isDark ? "text-zinc-400" : "text-gray-500"
                    )}>
                      Publish your website to the web instantly. Get a shareable link in seconds.
                    </p>

                    {!html ? (
                      <p className={cn(
                        "text-sm",
                        isDark ? "text-zinc-500" : "text-gray-400"
                      )}>
                        Build your website first to deploy
                      </p>
                    ) : deployResult ? (
                      <div className={cn(
                        "p-4 rounded-xl text-left",
                        deployResult.success
                          ? isDark ? "bg-emerald-500/20" : "bg-emerald-50"
                          : isDark ? "bg-red-500/20" : "bg-red-50"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {deployResult.success ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                          <span className={cn(
                            "font-medium",
                            deployResult.success ? "text-emerald-600" : "text-red-600"
                          )}>
                            {deployResult.success ? 'Deployed Successfully!' : 'Deployment Failed'}
                          </span>
                        </div>
                        {deployResult.url && (
                          <a
                            href={deployResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-violet-500 hover:underline"
                          >
                            View your site <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => setDeployResult(null)}
                          className="mt-3 text-xs text-gray-500 hover:underline"
                        >
                          Deploy again
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={deployToRender}
                        disabled={deploying}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-medium transition-all hover:shadow-lg"
                      >
                        {deploying ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-5 h-5" />
                            Deploy Now
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Export options */}
                  <div className={cn(
                    "p-4 rounded-xl",
                    isDark ? "bg-zinc-800" : "bg-gray-50"
                  )}>
                    <h4 className={cn(
                      "font-medium mb-3",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Export Options
                    </h4>
                    <div className="space-y-2">
                      <button
                        disabled={!html}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                          html
                            ? isDark ? "hover:bg-zinc-700" : "hover:bg-gray-100"
                            : "opacity-50 cursor-not-allowed",
                          isDark ? "text-zinc-300" : "text-gray-700"
                        )}
                      >
                        <Download className="w-5 h-5" />
                        <div>
                          <p className="font-medium text-sm">Download HTML</p>
                          <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-500")}>
                            Get a single file you can host anywhere
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
