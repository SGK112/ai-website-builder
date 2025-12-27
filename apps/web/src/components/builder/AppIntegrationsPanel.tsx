'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, Check, ExternalLink, Settings, Zap, Plus,
  ShoppingCart, Share2, Music, BarChart3, Mail, CreditCard,
  Globe, Package, Video, Image, Users, MessageCircle,
  Store, Palette, PlayCircle, Headphones, Camera, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppIntegration {
  id: string
  name: string
  category: 'ecommerce' | 'social' | 'media' | 'marketing' | 'analytics' | 'payments' | 'design'
  icon: string
  color: string
  description: string
  features: string[]
  popular?: boolean
}

const APP_INTEGRATIONS: AppIntegration[] = [
  // E-Commerce
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    icon: '🛍️',
    color: 'bg-green-500',
    description: 'Connect your Shopify store to display products and enable purchases',
    features: ['Product sync', 'Cart integration', 'Checkout redirect', 'Inventory updates'],
    popular: true
  },
  {
    id: 'ebay',
    name: 'eBay',
    category: 'ecommerce',
    icon: '🏷️',
    color: 'bg-blue-500',
    description: 'List and manage eBay auctions directly from your website',
    features: ['Listing sync', 'Bid tracking', 'Order management', 'Seller dashboard'],
    popular: true
  },
  {
    id: 'etsy',
    name: 'Etsy',
    category: 'ecommerce',
    icon: '🧶',
    color: 'bg-orange-500',
    description: 'Showcase your Etsy handmade and vintage items',
    features: ['Shop sync', 'Reviews display', 'Favorites tracking', 'Sales analytics']
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    icon: '🛒',
    color: 'bg-purple-500',
    description: 'Full WooCommerce store integration for WordPress',
    features: ['Product import', 'Order sync', 'Customer data', 'Payment processing']
  },
  {
    id: 'amazon',
    name: 'Amazon Seller',
    category: 'ecommerce',
    icon: '📦',
    color: 'bg-amber-500',
    description: 'Connect Amazon seller account for product management',
    features: ['FBA integration', 'Inventory sync', 'Order fulfillment', 'Pricing tools']
  },
  {
    id: 'square',
    name: 'Square',
    category: 'ecommerce',
    icon: '⬜',
    color: 'bg-slate-700',
    description: 'Square payment processing and POS integration',
    features: ['Online payments', 'POS sync', 'Invoicing', 'Gift cards']
  },

  // Social Media
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    icon: '📸',
    color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    description: 'Display Instagram feed and enable social shopping',
    features: ['Feed embed', 'Story highlights', 'Shop tagging', 'DM automation'],
    popular: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    icon: '🎵',
    color: 'bg-black',
    description: 'Embed TikTok videos and enable TikTok Shop',
    features: ['Video embed', 'TikTok Shop', 'Analytics', 'Creator tools'],
    popular: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    icon: '👥',
    color: 'bg-blue-600',
    description: 'Facebook page integration and Messenger chat',
    features: ['Page embed', 'Messenger bot', 'Shop sync', 'Event integration']
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    category: 'social',
    icon: '🐦',
    color: 'bg-black',
    description: 'Display tweets and enable social engagement',
    features: ['Timeline embed', 'Tweet buttons', 'Card preview', 'Analytics']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    icon: '💼',
    color: 'bg-blue-700',
    description: 'Professional networking and company page integration',
    features: ['Profile badge', 'Company feed', 'Job postings', 'Share buttons']
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    icon: '📌',
    color: 'bg-red-600',
    description: 'Display pins and enable Pinterest shopping',
    features: ['Board embed', 'Pin buttons', 'Shopping pins', 'Analytics']
  },

  // Media & Music
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'media',
    icon: '🎧',
    color: 'bg-green-500',
    description: 'Embed playlists and connect artist profiles',
    features: ['Playlist embed', 'Now playing', 'Artist page', 'Podcast integration'],
    popular: true
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'media',
    icon: '▶️',
    color: 'bg-red-600',
    description: 'Embed videos and display channel content',
    features: ['Video embed', 'Channel feed', 'Live streams', 'Playlists'],
    popular: true
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'media',
    icon: '🔊',
    color: 'bg-orange-500',
    description: 'Embed tracks and playlists from SoundCloud',
    features: ['Track embed', 'Waveform player', 'Playlist display', 'Artist profile']
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    category: 'media',
    icon: '🎬',
    color: 'bg-cyan-500',
    description: 'Professional video hosting and embedding',
    features: ['HD video', 'Privacy controls', 'Analytics', 'Custom player']
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'media',
    icon: '🍎',
    color: 'bg-red-500',
    description: 'Embed Apple Music playlists and albums',
    features: ['Album embed', 'Playlist display', 'Artist links', 'Preview tracks']
  },
  {
    id: 'twitch',
    name: 'Twitch',
    category: 'media',
    icon: '🎮',
    color: 'bg-purple-600',
    description: 'Embed live streams and clips',
    features: ['Live embed', 'Chat integration', 'Clips', 'VOD player']
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'marketing',
    icon: '🐵',
    color: 'bg-amber-400',
    description: 'Email marketing and newsletter signup forms',
    features: ['Signup forms', 'Campaign sync', 'Automation', 'Analytics'],
    popular: true
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'marketing',
    icon: '🧲',
    color: 'bg-orange-500',
    description: 'CRM and marketing automation integration',
    features: ['Forms', 'Lead tracking', 'Email automation', 'CRM sync']
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    category: 'marketing',
    icon: '📧',
    color: 'bg-green-600',
    description: 'E-commerce focused email and SMS marketing',
    features: ['Email flows', 'SMS campaigns', 'Segmentation', 'Product recs']
  },
  {
    id: 'convertkit',
    name: 'ConvertKit',
    category: 'marketing',
    icon: '✉️',
    color: 'bg-red-500',
    description: 'Email marketing for creators',
    features: ['Landing pages', 'Email sequences', 'Subscriber tags', 'Automations']
  },

  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'analytics',
    icon: '📊',
    color: 'bg-orange-400',
    description: 'Track website traffic and user behavior',
    features: ['Traffic analysis', 'Conversion tracking', 'User flow', 'Real-time data'],
    popular: true
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'analytics',
    icon: '🔥',
    color: 'bg-red-500',
    description: 'Heatmaps and user session recordings',
    features: ['Heatmaps', 'Recordings', 'Surveys', 'Feedback']
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'analytics',
    icon: '📈',
    color: 'bg-purple-500',
    description: 'Product analytics and user engagement tracking',
    features: ['Event tracking', 'Funnels', 'Cohorts', 'A/B testing']
  },

  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    icon: '💳',
    color: 'bg-indigo-500',
    description: 'Accept payments with Stripe checkout',
    features: ['Checkout', 'Subscriptions', 'Invoicing', 'Payment links'],
    popular: true
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    icon: '🅿️',
    color: 'bg-blue-600',
    description: 'PayPal payment buttons and checkout',
    features: ['PayPal buttons', 'Checkout', 'Subscriptions', 'Invoicing']
  },
  {
    id: 'venmo',
    name: 'Venmo',
    category: 'payments',
    icon: '💵',
    color: 'bg-blue-400',
    description: 'Accept Venmo payments',
    features: ['Quick payments', 'Social features', 'QR codes', 'Split payments']
  },

  // Design
  {
    id: 'canva',
    name: 'Canva',
    category: 'design',
    icon: '🎨',
    color: 'bg-cyan-500',
    description: 'Create and embed Canva designs',
    features: ['Design embed', 'Brand kit', 'Templates', 'Collaboration'],
    popular: true
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'design',
    icon: '🎯',
    color: 'bg-black',
    description: 'Embed Figma prototypes and designs',
    features: ['Prototype embed', 'Design specs', 'Comments', 'Handoff']
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    category: 'design',
    icon: '📷',
    color: 'bg-slate-800',
    description: 'Access free high-quality stock photos',
    features: ['Photo search', 'Collections', 'API access', 'Attribution']
  }
]

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Globe, color: 'from-slate-500 to-slate-600' },
  { id: 'ecommerce', name: 'E-Commerce', icon: ShoppingCart, color: 'from-green-500 to-emerald-600' },
  { id: 'social', name: 'Social', icon: Share2, color: 'from-pink-500 to-rose-600' },
  { id: 'media', name: 'Media', icon: Music, color: 'from-purple-500 to-violet-600' },
  { id: 'marketing', name: 'Marketing', icon: Mail, color: 'from-orange-500 to-amber-600' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, color: 'from-blue-500 to-cyan-600' },
  { id: 'payments', name: 'Payments', icon: CreditCard, color: 'from-indigo-500 to-purple-600' },
  { id: 'design', name: 'Design', icon: Palette, color: 'from-cyan-500 to-teal-600' },
]

interface AppIntegrationsPanelProps {
  isOpen: boolean
  onClose: () => void
  onIntegrationSelect?: (integration: AppIntegration) => void
  connectedApps?: string[]
}

export function AppIntegrationsPanel({
  isOpen,
  onClose,
  onIntegrationSelect,
  connectedApps = []
}: AppIntegrationsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>(connectedApps)
  const [configuringApp, setConfiguringApp] = useState<AppIntegration | null>(null)

  const filteredIntegrations = APP_INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const popularIntegrations = APP_INTEGRATIONS.filter(i => i.popular)

  const handleConnect = (integration: AppIntegration) => {
    setConfiguringApp(integration)
  }

  const handleConfirmConnect = () => {
    if (configuringApp) {
      setConnectedIntegrations(prev => [...prev, configuringApp.id])
      onIntegrationSelect?.(configuringApp)
      setConfiguringApp(null)
    }
  }

  const handleDisconnect = (integrationId: string) => {
    setConnectedIntegrations(prev => prev.filter(id => id !== integrationId))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-zinc-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">App Marketplace</h2>
                  <p className="text-sm text-zinc-400">Connect your favorite apps and services to your website</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-lg"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-zinc-800 overflow-x-auto bg-zinc-900/50">
            <div className="flex gap-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all",
                      isSelected
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.name}</span>
                    {category.id !== 'all' && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        isSelected ? "bg-white/20" : "bg-zinc-700"
                      )}>
                        {APP_INTEGRATIONS.filter(i => i.category === category.id).length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            {/* Popular Section */}
            {selectedCategory === 'all' && !searchQuery && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Popular Apps</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {popularIntegrations.map((integration) => (
                    <motion.button
                      key={integration.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleConnect(integration)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all group relative",
                        connectedIntegrations.includes(integration.id)
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-purple-500/50 hover:bg-zinc-800'
                      )}
                    >
                      <div className="text-4xl mb-3">{integration.icon}</div>
                      <div className="font-medium text-white text-sm">{integration.name}</div>
                      {connectedIntegrations.includes(integration.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* All Integrations Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedCategory === 'all' ? 'All Apps' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </h3>
                <span className="text-sm text-zinc-500">{filteredIntegrations.length} apps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-5 rounded-xl border transition-all group",
                      connectedIntegrations.includes(integration.id)
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{integration.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{integration.name}</h4>
                          {connectedIntegrations.includes(integration.id) && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{integration.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {integration.features.slice(0, 2).map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-0.5 bg-zinc-700/50 text-zinc-300 text-xs rounded"
                            >
                              {feature}
                            </span>
                          ))}
                          {integration.features.length > 2 && (
                            <span className="px-2 py-0.5 bg-zinc-700/50 text-zinc-500 text-xs rounded">
                              +{integration.features.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        {connectedIntegrations.includes(integration.id) ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setConfiguringApp(integration)}
                              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
                            >
                              <Settings className="w-4 h-4 text-zinc-300" />
                            </button>
                            <button
                              onClick={() => handleDisconnect(integration.id)}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleConnect(integration)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No apps found</h3>
                <p className="text-zinc-400">Try adjusting your search or filter</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {connectedIntegrations.slice(0, 3).map((id) => {
                    const app = APP_INTEGRATIONS.find(a => a.id === id)
                    return app ? (
                      <div key={id} className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center border-2 border-zinc-900 text-sm">
                        {app.icon}
                      </div>
                    ) : null
                  })}
                  {connectedIntegrations.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center border-2 border-zinc-900 text-xs text-zinc-300">
                      +{connectedIntegrations.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-zinc-400">
                  <span className="text-white font-medium">{connectedIntegrations.length}</span> apps connected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Request an app
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Configuration Modal */}
        <AnimatePresence>
          {configuringApp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
              onClick={() => setConfiguringApp(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 rounded-xl w-full max-w-lg border border-zinc-800 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{configuringApp.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Connect {configuringApp.name}</h3>
                      <p className="text-sm text-zinc-400">Configure your integration settings</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {configuringApp.category === 'ecommerce' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Store URL</label>
                        <input
                          type="url"
                          placeholder={`https://your-store.${configuringApp.id}.com`}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">API Key</label>
                        <input
                          type="password"
                          placeholder="Enter your API key"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <p className="text-sm text-blue-300">
                          Products will sync automatically after connection
                        </p>
                      </div>
                    </>
                  )}

                  {configuringApp.category === 'social' && (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <button className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg">
                        Sign in with {configuringApp.name}
                      </button>
                      <p className="text-xs text-zinc-500 mt-4">
                        You'll be redirected to {configuringApp.name} to authorize access
                      </p>
                    </div>
                  )}

                  {configuringApp.category === 'media' && (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-white" />
                      </div>
                      <button className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg">
                        Connect {configuringApp.name} Account
                      </button>
                      <p className="text-xs text-zinc-500 mt-4">
                        Access your playlists, videos, and media content
                      </p>
                    </div>
                  )}

                  {configuringApp.category === 'marketing' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">API Key</label>
                        <input
                          type="password"
                          placeholder="Enter your API key"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">List/Audience ID</label>
                        <input
                          type="text"
                          placeholder="Enter your list ID"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </>
                  )}

                  {configuringApp.category === 'analytics' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Tracking ID</label>
                      <input
                        type="text"
                        placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  )}

                  {configuringApp.category === 'payments' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Publishable Key</label>
                        <input
                          type="text"
                          placeholder="pk_live_..."
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Secret Key</label>
                        <input
                          type="password"
                          placeholder="sk_live_..."
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </>
                  )}

                  {configuringApp.category === 'design' && (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                        <Palette className="w-8 h-8 text-white" />
                      </div>
                      <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg">
                        Connect {configuringApp.name}
                      </button>
                      <p className="text-xs text-zinc-500 mt-4">
                        Access your designs and templates
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-medium text-zinc-300 mb-3">What you'll get:</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {configuringApp.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-zinc-400">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex gap-3 bg-zinc-900/50">
                  <Button
                    onClick={() => setConfiguringApp(null)}
                    variant="outline"
                    className="flex-1 border-zinc-700 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmConnect}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default AppIntegrationsPanel
