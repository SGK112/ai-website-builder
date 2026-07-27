'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Plus, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { componentLibrary, getCategories, ComponentSection } from '@/lib/builder/component-library'

interface ComponentPickerProps {
  onInsert: (component: ComponentSection) => void
  onPreview?: (component: ComponentSection | null) => void
}

const categoryLabels: Record<string, string> = {
  navigation: 'Nav',
  hero: 'Hero',
  features: 'Features',
  pricing: 'Pricing',
  testimonials: 'Reviews',
  stats: 'Stats',
  cta: 'CTA',
  contact: 'Contact',
  footer: 'Footer',
  content: 'Content',
  gallery: 'Gallery',
}

const categoryColors: Record<string, string> = {
  navigation: 'bg-blue-500',
  hero: 'bg-violet-500',
  features: 'bg-emerald-500',
  pricing: 'bg-amber-500',
  testimonials: 'bg-pink-500',
  stats: 'bg-cyan-500',
  cta: 'bg-orange-500',
  contact: 'bg-indigo-500',
  footer: 'bg-zinc-500',
  content: 'bg-teal-500',
  gallery: 'bg-rose-500',
}

export function ComponentPicker({ onInsert, onPreview }: ComponentPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<ComponentSection | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = getCategories()
  const filteredComponents = activeCategory
    ? componentLibrary.filter(c => c.category === activeCategory)
    : componentLibrary

  const modal = isOpen ? (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
        onClick={() => setIsOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-8 lg:inset-16 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl z-[9999] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Component Library</h2>
            <span className="text-xs text-zinc-500 font-mono">{componentLibrary.length} sections</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-3 border-b border-zinc-800 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
              !activeCategory
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5",
                activeCategory === cat
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", categoryColors[cat])} />
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Component Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComponents.map(component => (
              <div
                key={component.id}
                className="group relative bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden hover:border-violet-500/50 transition"
                onMouseEnter={() => {
                  setHoveredComponent(component)
                  onPreview?.(component)
                }}
                onMouseLeave={() => {
                  setHoveredComponent(null)
                  onPreview?.(null)
                }}
              >
                {/* Preview */}
                <div className="h-32 bg-zinc-950 overflow-hidden">
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;transform:scale(0.25);transform-origin:top left;width:400%;}</style></head><body class="bg-slate-950">${component.html}</body></html>`}
                    className="w-full h-[512px] pointer-events-none"
                    sandbox="allow-scripts"
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-2 h-2 rounded-full", categoryColors[component.category])} />
                        <span className="text-xs text-zinc-500 uppercase">{component.category}</span>
                      </div>
                      <h3 className="font-medium text-white text-sm">{component.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{component.description}</p>
                    </div>
                  </div>
                </div>

                {/* Insert / Preview. These are the ONLY way to use a
                    component, and they lived behind :hover — on touch the
                    library was browse-only. Below md the scrim sits at the
                    bottom of the tile instead of covering it, so the preview
                    stays visible while the actions stay tappable. */}
                <div className="absolute inset-x-0 bottom-0 md:inset-0 bg-black/80 flex items-center justify-center gap-3 py-3 md:py-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      onInsert(component)
                      setIsOpen(false)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Insert
                  </button>
                  <button
                    onClick={() => {
                      const w = window.open('', '_blank')
                      if (w) {
                        w.document.write(`<!DOCTYPE html><html><head><title>${component.name} Preview</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"><script>tailwind.config={theme:{extend:{fontFamily:{sans:['Inter','sans-serif']}}}}</script></head><body class="bg-slate-950 text-white font-sans">${component.html}</body></html>`)
                        w.document.close()
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
          <span>Click a component to insert it into your page</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </motion.div>
    </>
  ) : null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
        data-tour="components"
        title="Browse component library"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Components</span>
      </button>

      {mounted && createPortal(
        <AnimatePresence>{modal}</AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default ComponentPicker
