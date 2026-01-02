'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  Monitor,
  Tablet,
  Smartphone,
  X,
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
    thumbnail_url: 'https://picsum.photos/seed/ecommerce/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'agency-portfolio',
    name: 'Agency Portfolio',
    description: 'Creative agency portfolio with project showcases',
    category: 'agency',
    thumbnail_url: 'https://picsum.photos/seed/agency/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'saas-landing',
    name: 'SaaS Landing',
    description: 'Modern SaaS landing page with gradient effects',
    category: 'saas',
    thumbnail_url: 'https://picsum.photos/seed/saas/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'restaurant-modern',
    name: 'Modern Restaurant',
    description: 'Elegant restaurant template with menu sections',
    category: 'restaurant',
    thumbnail_url: 'https://picsum.photos/seed/restaurant/800/600',
    is_premium: true,
    price_credits: 10,
  },
  {
    id: 'photography-portfolio',
    name: 'Photography Portfolio',
    description: 'Minimal photography portfolio with gallery grid',
    category: 'portfolio',
    thumbnail_url: 'https://picsum.photos/seed/photography/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'tech-blog',
    name: 'Tech Blog',
    description: 'Clean tech blog template with article layouts',
    category: 'blog',
    thumbnail_url: 'https://picsum.photos/seed/techblog/800/600',
    is_premium: true,
    price_credits: 5,
  },
  {
    id: 'startup-landing',
    name: 'Startup Landing',
    description: 'Bold startup landing page with pricing tables',
    category: 'landing',
    thumbnail_url: 'https://picsum.photos/seed/startup/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'fitness-gym',
    name: 'Fitness Gym',
    description: 'Energy-filled gym and fitness template',
    category: 'landing',
    thumbnail_url: 'https://picsum.photos/seed/fitness/800/600',
    is_premium: true,
    price_credits: 10,
  },
  {
    id: 'fashion-store',
    name: 'Fashion Store',
    description: 'Bold modern fashion store with dynamic layouts and shopping cart',
    category: 'ecommerce',
    thumbnail_url: 'https://picsum.photos/seed/fashion/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menu',
    description: 'Elegant restaurant with menu sections and reservation system',
    category: 'restaurant',
    thumbnail_url: 'https://picsum.photos/seed/dining/800/600',
    is_premium: false,
    price_credits: 0,
  },
  {
    id: 'saas-multipage',
    name: 'SaaS Complete',
    description: 'Full-featured SaaS with pricing, features, testimonials, and FAQ',
    category: 'saas',
    thumbnail_url: 'https://picsum.photos/seed/dashboard/800/600',
    is_premium: true,
    price_credits: 15,
  },
]

type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(BUILTIN_TEMPLATES)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')

  // Get the full template HTML if available
  const previewHtml = useMemo(() => {
    if (!previewTemplate) return null
    const fullTemplate = getTemplateById(previewTemplate.id)
    return fullTemplate?.html || null
  }, [previewTemplate])

  useEffect(() => {
    loadTemplates()
  }, [])

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
    // Navigate to workspace with template ID
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
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Premium Badge */}
                    {template.is_premium && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-amber-500/90 rounded-full">
                        <Crown className="w-3 h-3 text-white" />
                        <span className="text-xs font-medium text-white">{template.price_credits} credits</span>
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => useTemplate(template)}
                        className="px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium transition flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Use Template
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-slate-400 capitalize">
                        {template.category}
                      </span>
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
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    {previewTemplate.price_credits} credits
                  </span>
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
            <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
              <div
                className={cn(
                  'bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300',
                  previewDevice === 'desktop' && 'w-full h-full',
                  previewDevice === 'tablet' && 'w-[768px] h-[600px] max-w-full',
                  previewDevice === 'mobile' && 'w-[375px] h-[667px]'
                )}
              >
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    title={`Preview: ${previewTemplate.name}`}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <img
                    src={previewTemplate.thumbnail_url}
                    alt={previewTemplate.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
