'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: () => void
  template: {
    id: string
    name: string
    html?: string
    pages?: { name: string; slug: string; html: string }[]
    description?: string
    features?: string[]
  }
  isSelected?: boolean
}

const DEVICE_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  onSelect,
  template,
  isSelected,
}: TemplatePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [isLoading, setIsLoading] = useState(true)

  // Get pages array (either from template.pages or use single page)
  const pages = template.pages || [
    { name: 'Home', slug: 'index', html: template.html || '' }
  ]

  const currentPage = pages[currentPageIndex]

  // Reset state when template changes
  useEffect(() => {
    setCurrentPageIndex(0)
    setDeviceMode('desktop')
    setZoom(100)
  }, [template.id])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">{template.name}</h2>
              {template.description && (
                <p className="text-sm text-white/60">{template.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Device Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={cn(
                  'p-2 rounded transition',
                  deviceMode === 'desktop'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white'
                )}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={cn(
                  'p-2 rounded transition',
                  deviceMode === 'tablet'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white'
                )}
                title="Tablet"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={cn(
                  'p-2 rounded transition',
                  deviceMode === 'mobile'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white'
                )}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(z => Math.max(z - 25, 25))}
                className="p-1.5 text-white/60 hover:text-white transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/80 min-w-[40px] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(z + 25, 150))}
                className="p-1.5 text-white/60 hover:text-white transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Select Button */}
            <Button
              onClick={onSelect}
              className={cn(
                'gap-2',
                isSelected
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-violet-600 hover:bg-violet-700'
              )}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  Selected
                </>
              ) : (
                'Use This Template'
              )}
            </Button>
          </div>
        </div>

        {/* Page Tabs (if multiple pages) */}
        {pages.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-b border-white/10">
            <button
              onClick={() => setCurrentPageIndex(i => Math.max(i - 1, 0))}
              disabled={currentPageIndex === 0}
              className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pages.map((page, index) => (
              <button
                key={page.slug}
                onClick={() => setCurrentPageIndex(index)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition',
                  currentPageIndex === index
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                {page.name}
              </button>
            ))}

            <button
              onClick={() => setCurrentPageIndex(i => Math.min(i + 1, pages.length - 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
          <div
            className="relative bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: DEVICE_WIDTHS[deviceMode],
              maxWidth: '100%',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-500">Loading preview...</span>
                </div>
              </div>
            )}

            <iframe
              srcDoc={currentPage.html}
              className="w-full h-[800px] border-0"
              title={`${template.name} - ${currentPage.name}`}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>

        {/* Features Footer */}
        {template.features && template.features.length > 0 && (
          <div className="border-t border-white/10 px-6 py-3">
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-white/40">Includes:</span>
              <div className="flex items-center gap-2">
                {template.features.slice(0, 5).map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70"
                  >
                    {feature}
                  </span>
                ))}
                {template.features.length > 5 && (
                  <span className="text-xs text-white/40">
                    +{template.features.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default TemplatePreviewModal
