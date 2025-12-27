'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Layout,
  Grid3X3,
  Users,
  MessageSquare,
  CreditCard,
  Mail,
  ArrowRight,
  BarChart3,
  Loader2,
  Plus,
  Eye,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  name: string
  category: string
  description: string
  html: string
}

interface SectionPickerProps {
  theme: 'light' | 'dark'
  onAddSection: (html: string) => void
}

const CATEGORY_ICONS: Record<string, any> = {
  hero: Sparkles,
  features: Grid3X3,
  about: Users,
  testimonials: MessageSquare,
  pricing: CreditCard,
  cta: ArrowRight,
  contact: Mail,
  footer: Layout,
  stats: BarChart3,
  gallery: Grid3X3,
  team: Users,
}

const CATEGORY_LABELS: Record<string, string> = {
  hero: 'Hero',
  features: 'Features',
  about: 'About',
  gallery: 'Gallery',
  testimonials: 'Reviews',
  pricing: 'Pricing',
  team: 'Team',
  cta: 'CTA',
  contact: 'Contact',
  stats: 'Stats',
  footer: 'Footer',
}

export function SectionPicker({ theme, onAddSection }: SectionPickerProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('hero')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewSection, setPreviewSection] = useState<Section | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sections')
      if (!res.ok) {
        throw new Error('Failed to load sections')
      }
      const data = await res.json()
      setSections(data.sections || [])
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to load sections:', err)
      setError('Failed to load sections. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSections = sections.filter(s => s.category === activeCategory)

  const handleAddSection = (section: Section) => {
    onAddSection(section.html)
    setPreviewSection(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
        <AlertCircle className={cn("w-12 h-12 mb-4", isDark ? "text-red-400" : "text-red-500")} />
        <p className={cn("mb-4", isDark ? "text-gray-400" : "text-gray-600")}>{error}</p>
        <button
          onClick={loadSections}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            isDark
              ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              : "bg-purple-100 text-purple-600 hover:bg-purple-200"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Category Pills */}
      <div className="shrink-0 p-4 border-b overflow-x-auto"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || Layout
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? isDark
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "bg-purple-100 text-purple-700 border border-purple-200"
                    : isDark
                      ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {CATEGORY_LABELS[cat] || cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sections Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4">
          {filteredSections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "group rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                isDark
                  ? "bg-slate-800/50 border-white/10 hover:border-purple-500/50"
                  : "bg-white border-gray-200 hover:border-purple-400"
              )}
            >
              {/* Preview Thumbnail */}
              <div className={cn(
                "h-32 relative overflow-hidden",
                isDark ? "bg-slate-900" : "bg-gray-100"
              )}>
                {/* Mini preview of section */}
                <div
                  className="absolute inset-0 scale-[0.25] origin-top-left w-[400%] h-[400%] pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPreviewSection(section)}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddSection(section)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Section Info */}
              <div className="p-4">
                <h3 className={cn(
                  "font-semibold mb-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {section.name}
                </h3>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  {section.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className={cn(
            "text-center py-12",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <Layout className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No sections in this category yet</p>
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setPreviewSection(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="font-semibold text-gray-900">{previewSection.name}</h3>
                  <p className="text-sm text-gray-500">{previewSection.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewSection(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddSection(previewSection)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Page
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="overflow-auto max-h-[calc(90vh-80px)]">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                      <style>body { font-family: 'Inter', sans-serif; margin: 0; }</style>
                    </head>
                    <body>${previewSection.html}</body>
                    </html>
                  `}
                  className="w-full h-[600px] border-0"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
