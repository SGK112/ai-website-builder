'use client'

import { useState } from 'react'
import {
  Image,
  MapPin,
  FileSpreadsheet,
  Calendar,
  Lock,
  BarChart3,
  CreditCard,
  MessageSquare,
  Share2,
  Sparkles,
  Code,
  Search,
  X,
  Check,
  Zap,
  Mail,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Bot,
  Type,
  Palette,
  PieChart,
  ShoppingCart,
  FormInput,
  ClipboardList,
  Database,
  Globe,
  Play,
  ChevronRight,
  Webhook,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Plugin {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  popular?: boolean
  prompt: string // Chat prompt to add this plugin
  example?: string // Example of what it generates
}

export const PLUGINS: Plugin[] = [
  // Images & Media
  {
    id: 'unsplash',
    name: 'Unsplash Images',
    description: 'Add high-quality stock photos',
    icon: <Image className="w-5 h-5" />,
    category: 'Images & Media',
    popular: true,
    prompt: 'Add an image from Unsplash showing',
    example: 'a modern office space',
  },
  {
    id: 'pexels',
    name: 'Pexels Photos',
    description: 'Free stock photos and videos',
    icon: <Image className="w-5 h-5" />,
    category: 'Images & Media',
    prompt: 'Add a Pexels image of',
    example: 'a beautiful sunset',
  },
  {
    id: 'ai-images',
    name: 'AI Image Generator',
    description: 'Generate custom images with AI',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Images & Media',
    popular: true,
    prompt: 'Generate an AI image of',
    example: 'a futuristic city skyline',
  },
  {
    id: 'youtube',
    name: 'YouTube Embed',
    description: 'Embed YouTube videos',
    icon: <Youtube className="w-5 h-5" />,
    category: 'Images & Media',
    prompt: 'Add a YouTube video section with embed for',
    example: 'product demo videos',
  },
  {
    id: 'vimeo',
    name: 'Vimeo Embed',
    description: 'Embed Vimeo videos',
    icon: <Play className="w-5 h-5" />,
    category: 'Images & Media',
    prompt: 'Add a Vimeo video player for',
    example: 'our company intro video',
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    description: 'Create a responsive image gallery',
    icon: <Image className="w-5 h-5" />,
    category: 'Images & Media',
    prompt: 'Create an image gallery section with',
    example: '6 portfolio images',
  },

  // Google Services
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Add interactive maps',
    icon: <MapPin className="w-5 h-5" />,
    category: 'Google Services',
    popular: true,
    prompt: 'Add a Google Map showing',
    example: 'our office location at 123 Main St',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Display data from spreadsheets',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    category: 'Google Services',
    popular: true,
    prompt: 'Add a data table that connects to Google Sheets showing',
    example: 'our pricing tiers',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Embed calendar and booking',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Google Services',
    prompt: 'Add a Google Calendar widget for',
    example: 'appointment booking',
  },
  {
    id: 'google-signin',
    name: 'Google Sign-In',
    description: 'Add Google authentication',
    icon: <Lock className="w-5 h-5" />,
    category: 'Google Services',
    prompt: 'Add a login section with Google Sign-In button',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track website analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'Google Services',
    prompt: 'Add Google Analytics tracking code',
  },

  // Forms & Data
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Create contact forms',
    icon: <FormInput className="w-5 h-5" />,
    category: 'Forms & Data',
    popular: true,
    prompt: 'Add a contact form with',
    example: 'name, email, phone, and message fields',
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Email subscription forms',
    icon: <Mail className="w-5 h-5" />,
    category: 'Forms & Data',
    prompt: 'Add a newsletter signup form with',
    example: 'email input and subscribe button',
  },
  {
    id: 'survey',
    name: 'Survey Form',
    description: 'Create surveys and polls',
    icon: <ClipboardList className="w-5 h-5" />,
    category: 'Forms & Data',
    prompt: 'Add a survey form asking about',
    example: 'customer satisfaction',
  },
  {
    id: 'booking',
    name: 'Booking Widget',
    description: 'Appointment scheduling',
    icon: <Calendar className="w-5 h-5" />,
    category: 'Forms & Data',
    prompt: 'Add a booking form for',
    example: 'scheduling consultations',
  },
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'Display data in tables',
    icon: <Database className="w-5 h-5" />,
    category: 'Forms & Data',
    prompt: 'Create a data table showing',
    example: 'product comparison features',
  },
  {
    id: 'search-bar',
    name: 'Search Bar',
    description: 'Add site search functionality',
    icon: <Search className="w-5 h-5" />,
    category: 'Forms & Data',
    prompt: 'Add a search bar in the header for',
    example: 'searching products',
  },

  // Payments
  {
    id: 'stripe-checkout',
    name: 'Stripe Checkout',
    description: 'Accept payments with Stripe',
    icon: <CreditCard className="w-5 h-5" />,
    category: 'Payments',
    popular: true,
    prompt: 'Add a Stripe checkout button for',
    example: 'a $49 monthly subscription',
  },
  {
    id: 'paypal-button',
    name: 'PayPal Button',
    description: 'PayPal payment button',
    icon: <CreditCard className="w-5 h-5" />,
    category: 'Payments',
    prompt: 'Add a PayPal payment button for',
    example: 'accepting donations',
  },
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    description: 'Display pricing plans',
    icon: <ShoppingCart className="w-5 h-5" />,
    category: 'Payments',
    popular: true,
    prompt: 'Create a pricing table with',
    example: '3 tiers: Basic, Pro, and Enterprise',
  },
  {
    id: 'shopping-cart',
    name: 'Shopping Cart',
    description: 'Add e-commerce cart',
    icon: <ShoppingCart className="w-5 h-5" />,
    category: 'Payments',
    prompt: 'Add a shopping cart with',
    example: 'add to cart buttons and checkout',
  },

  // Social
  {
    id: 'share-buttons',
    name: 'Social Share',
    description: 'Add sharing buttons',
    icon: <Share2 className="w-5 h-5" />,
    category: 'Social',
    prompt: 'Add social share buttons for',
    example: 'Twitter, Facebook, and LinkedIn',
  },
  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    description: 'Display Instagram posts',
    icon: <Instagram className="w-5 h-5" />,
    category: 'Social',
    prompt: 'Add an Instagram feed widget showing',
    example: 'our latest posts',
  },
  {
    id: 'twitter-feed',
    name: 'Twitter/X Feed',
    description: 'Embed tweets and timelines',
    icon: <Twitter className="w-5 h-5" />,
    category: 'Social',
    prompt: 'Add a Twitter timeline embed for',
    example: 'our company updates',
  },
  {
    id: 'facebook-page',
    name: 'Facebook Plugin',
    description: 'Facebook page widget',
    icon: <Facebook className="w-5 h-5" />,
    category: 'Social',
    prompt: 'Add a Facebook page plugin for',
    example: 'following our page',
  },
  {
    id: 'social-links',
    name: 'Social Links',
    description: 'Social media icons',
    icon: <Globe className="w-5 h-5" />,
    category: 'Social',
    popular: true,
    prompt: 'Add social media icon links in the footer for',
    example: 'Twitter, Instagram, LinkedIn, and YouTube',
  },

  // AI & Automation
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot',
    description: 'Add AI-powered chat support',
    icon: <Bot className="w-5 h-5" />,
    category: 'AI & Automation',
    popular: true,
    prompt: 'Add an AI chatbot widget for',
    example: 'customer support',
  },
  {
    id: 'ai-content',
    name: 'AI Content',
    description: 'Generate content with AI',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'AI & Automation',
    prompt: 'Generate AI content for',
    example: 'the About Us section',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Connect to external services',
    icon: <Webhook className="w-5 h-5" />,
    category: 'AI & Automation',
    prompt: 'Add a webhook integration for',
    example: 'form submissions',
  },
  {
    id: 'zapier',
    name: 'Zapier Integration',
    description: 'Connect 5000+ apps',
    icon: <Zap className="w-5 h-5" />,
    category: 'AI & Automation',
    prompt: 'Add Zapier integration for',
    example: 'automating email notifications',
  },

  // Design & UI
  {
    id: 'icons',
    name: 'Icon Library',
    description: 'Add beautiful icons',
    icon: <Palette className="w-5 h-5" />,
    category: 'Design & UI',
    prompt: 'Add icons for',
    example: 'features: speed, security, and support',
  },
  {
    id: 'animations',
    name: 'Animations',
    description: 'Add scroll and hover effects',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Design & UI',
    prompt: 'Add animations to the',
    example: 'hero section with fade-in effects',
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Customer testimonial slider',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Design & UI',
    popular: true,
    prompt: 'Add a testimonials section with',
    example: 'customer reviews and ratings',
  },
  {
    id: 'faq',
    name: 'FAQ Accordion',
    description: 'Expandable FAQ section',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Design & UI',
    prompt: 'Add an FAQ section with',
    example: '5 common questions about our service',
  },
  {
    id: 'custom-fonts',
    name: 'Custom Fonts',
    description: 'Use Google Fonts',
    icon: <Type className="w-5 h-5" />,
    category: 'Design & UI',
    prompt: 'Change the font to',
    example: 'Poppins for headings and Inter for body',
  },
  {
    id: 'custom-code',
    name: 'Custom Code',
    description: 'Add HTML/CSS/JS',
    icon: <Code className="w-5 h-5" />,
    category: 'Design & UI',
    prompt: 'Add custom code for',
    example: 'a countdown timer',
  },

  // Analytics & SEO
  {
    id: 'seo-meta',
    name: 'SEO Meta Tags',
    description: 'Optimize for search engines',
    icon: <Globe className="w-5 h-5" />,
    category: 'Analytics & SEO',
    prompt: 'Add SEO meta tags for',
    example: 'better search engine visibility',
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Widget',
    description: 'Display site statistics',
    icon: <PieChart className="w-5 h-5" />,
    category: 'Analytics & SEO',
    prompt: 'Add an analytics dashboard showing',
    example: 'visitor stats and page views',
  },
  {
    id: 'live-chat',
    name: 'Live Chat',
    description: 'Add live chat support',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Analytics & SEO',
    prompt: 'Add a live chat widget for',
    example: 'real-time customer support',
  },
  {
    id: 'cookie-consent',
    name: 'Cookie Consent',
    description: 'GDPR cookie banner',
    icon: <Lock className="w-5 h-5" />,
    category: 'Analytics & SEO',
    prompt: 'Add a cookie consent banner for',
    example: 'GDPR compliance',
  },
]

const CATEGORIES = [
  'All',
  'Images & Media',
  'Google Services',
  'Forms & Data',
  'Payments',
  'Social',
  'AI & Automation',
  'Design & UI',
  'Analytics & SEO',
]

interface PluginsPanelProps {
  onSelectPlugin: (plugin: Plugin) => void
  onClose?: () => void
}

export function PluginsPanel({ onSelectPlugin, onClose }: PluginsPanelProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [recentlyUsed, setRecentlyUsed] = useState<Set<string>>(new Set())

  const filteredPlugins = PLUGINS.filter(plugin => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(search.toLowerCase()) ||
      plugin.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || plugin.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const popularPlugins = PLUGINS.filter(p => p.popular)

  const handleSelectPlugin = (plugin: Plugin) => {
    setRecentlyUsed(prev => new Set([...prev, plugin.id]))
    onSelectPlugin(plugin)
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Plugins & Integrations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click to add to your chat</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b border-white/5 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition',
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Popular Section */}
        {selectedCategory === 'All' && !search && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Popular
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {popularPlugins.slice(0, 6).map(plugin => (
                <button
                  key={plugin.id}
                  onClick={() => handleSelectPlugin(plugin)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-purple-500/20 transition text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                    {plugin.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{plugin.name}</p>
                    <p className="text-xs text-slate-500 truncate">{plugin.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Plugins */}
        {CATEGORIES.filter(c => c !== 'All').map(category => {
          const categoryPlugins = filteredPlugins.filter(p => p.category === category)
          if (categoryPlugins.length === 0) return null

          if (selectedCategory !== 'All' && selectedCategory !== category) return null

          return (
            <div key={category}>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryPlugins.map(plugin => (
                  <button
                    key={plugin.id}
                    onClick={() => handleSelectPlugin(plugin)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/20 hover:bg-slate-800 transition text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-slate-600 transition">
                      {plugin.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{plugin.name}</p>
                        {recentlyUsed.has(plugin.id) && (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{plugin.description}</p>
                      {plugin.example && (
                        <p className="text-xs text-blue-400/70 mt-1 italic truncate">
                          e.g., &ldquo;{plugin.prompt} {plugin.example}&rdquo;
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {filteredPlugins.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No plugins found</p>
            <p className="text-xs text-slate-600 mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-4 border-t border-white/5 bg-slate-800/30">
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span>
            <span className="text-slate-300">Pro tip:</span> Just describe what you want in the chat!
            Try &ldquo;Add a contact form&rdquo; or &ldquo;Show a map of NYC&rdquo;
          </span>
        </p>
      </div>
    </div>
  )
}
