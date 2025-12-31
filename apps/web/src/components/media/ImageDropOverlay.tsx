'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Image as ImageIcon,
  Maximize2,
  LayoutGrid,
  Square,
  RectangleHorizontal,
  Circle,
  CheckCircle2,
  Columns,
  Rows,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ImageLayout =
  | 'hero-background'      // Full-width hero with overlay text
  | 'side-by-side'         // Image + text side by side
  | 'centered'             // Centered image with optional caption
  | 'card'                 // Image in a card component
  | 'gallery-item'         // Part of a gallery grid
  | 'floating'             // Floating image with text wrap
  | 'banner'               // Full-width banner
  | 'thumbnail'            // Small thumbnail

interface LayoutOption {
  id: ImageLayout
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  preview: string
}

const layoutOptions: LayoutOption[] = [
  {
    id: 'hero-background',
    label: 'Hero Background',
    description: 'Full-screen hero section with image background',
    icon: Maximize2,
    preview: 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20',
  },
  {
    id: 'side-by-side',
    label: 'Side by Side',
    description: 'Image next to text content',
    icon: Columns,
    preview: 'bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700',
  },
  {
    id: 'centered',
    label: 'Centered',
    description: 'Centered image with optional caption',
    icon: Square,
    preview: 'bg-zinc-700',
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Image inside a styled card',
    icon: RectangleHorizontal,
    preview: 'bg-gradient-to-b from-zinc-600 to-zinc-800',
  },
  {
    id: 'gallery-item',
    label: 'Gallery',
    description: 'Add to image gallery grid',
    icon: LayoutGrid,
    preview: 'bg-gradient-to-br from-zinc-700 to-zinc-800',
  },
  {
    id: 'banner',
    label: 'Banner',
    description: 'Full-width image banner',
    icon: Rows,
    preview: 'bg-gradient-to-r from-zinc-600 via-zinc-500 to-zinc-600',
  },
]

interface ImageDropOverlayProps {
  isVisible: boolean
  imageUrl: string
  imageName?: string
  onClose: () => void
  onSelect: (layout: ImageLayout, imageUrl: string) => void
}

export function ImageDropOverlay({
  isVisible,
  imageUrl,
  imageName,
  onClose,
  onSelect,
}: ImageDropOverlayProps) {
  const [selectedLayout, setSelectedLayout] = useState<ImageLayout | null>(null)
  const [hoveredLayout, setHoveredLayout] = useState<ImageLayout | null>(null)

  const handleConfirm = useCallback(() => {
    if (selectedLayout) {
      onSelect(selectedLayout, imageUrl)
      onClose()
    }
  }, [selectedLayout, imageUrl, onSelect, onClose])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl w-full max-w-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Choose Layout</h2>
                <p className="text-sm text-zinc-400">
                  {imageName || 'How should this image appear on your page?'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-2 gap-6">
            {/* Preview */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-zinc-400">Preview</p>
              <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                <img
                  src={imageUrl}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Layout Preview */}
              {(selectedLayout || hoveredLayout) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <p className="text-xs text-zinc-500 mb-2">Layout Preview</p>
                  <LayoutPreview
                    layout={(hoveredLayout || selectedLayout)!}
                    imageUrl={imageUrl}
                  />
                </motion.div>
              )}
            </div>

            {/* Layout Options */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-zinc-400">Select Layout</p>
              <div className="grid grid-cols-2 gap-3">
                {layoutOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedLayout === option.id
                  const isHovered = hoveredLayout === option.id

                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedLayout(option.id)}
                      onMouseEnter={() => setHoveredLayout(option.id)}
                      onMouseLeave={() => setHoveredLayout(null)}
                      className={cn(
                        'relative p-4 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'bg-fuchsia-500/20 border-fuchsia-500 ring-2 ring-fuchsia-500/30'
                          : isHovered
                          ? 'bg-zinc-800 border-zinc-600'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-fuchsia-400" />
                        </div>
                      )}
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
                        isSelected ? 'bg-fuchsia-500' : 'bg-zinc-700'
                      )}>
                        <Icon className={cn(
                          'w-4 h-4',
                          isSelected ? 'text-white' : 'text-zinc-300'
                        )} />
                      </div>
                      <p className={cn(
                        'font-medium text-sm',
                        isSelected ? 'text-fuchsia-300' : 'text-white'
                      )}>
                        {option.label}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                        {option.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Tip: You can drag images directly onto the preview
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedLayout}
                className={cn(
                  'px-6 py-2 rounded-lg text-sm font-medium transition',
                  selectedLayout
                    ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                )}
              >
                Insert Image
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Mini preview of how the layout will look
function LayoutPreview({ layout, imageUrl }: { layout: ImageLayout; imageUrl: string }) {
  switch (layout) {
    case 'hero-background':
      return (
        <div className="h-24 rounded-lg relative overflow-hidden">
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <div className="h-2 w-20 bg-white/80 rounded mb-1 mx-auto" />
              <div className="h-1 w-32 bg-white/50 rounded mx-auto" />
            </div>
          </div>
        </div>
      )
    case 'side-by-side':
      return (
        <div className="h-24 rounded-lg flex gap-2 overflow-hidden">
          <img src={imageUrl} alt="" className="w-1/2 h-full object-cover rounded" />
          <div className="w-1/2 flex flex-col justify-center gap-1 p-2">
            <div className="h-2 w-full bg-zinc-600 rounded" />
            <div className="h-1 w-3/4 bg-zinc-700 rounded" />
            <div className="h-1 w-1/2 bg-zinc-700 rounded" />
          </div>
        </div>
      )
    case 'centered':
      return (
        <div className="h-24 rounded-lg flex flex-col items-center justify-center bg-zinc-800 gap-2 p-2">
          <img src={imageUrl} alt="" className="h-14 w-auto rounded shadow" />
          <div className="h-1 w-16 bg-zinc-600 rounded" />
        </div>
      )
    case 'card':
      return (
        <div className="h-24 rounded-lg flex items-center justify-center bg-zinc-800 p-2">
          <div className="bg-zinc-700 rounded-lg overflow-hidden w-24 shadow-lg">
            <img src={imageUrl} alt="" className="h-12 w-full object-cover" />
            <div className="p-2 space-y-1">
              <div className="h-1 w-full bg-zinc-500 rounded" />
              <div className="h-1 w-2/3 bg-zinc-600 rounded" />
            </div>
          </div>
        </div>
      )
    case 'gallery-item':
      return (
        <div className="h-24 rounded-lg grid grid-cols-3 gap-1 bg-zinc-800 p-1 overflow-hidden">
          <img src={imageUrl} alt="" className="h-full w-full object-cover rounded ring-2 ring-fuchsia-500" />
          <div className="h-full bg-zinc-700 rounded" />
          <div className="h-full bg-zinc-700 rounded" />
          <div className="h-full bg-zinc-700 rounded" />
          <div className="h-full bg-zinc-700 rounded" />
          <div className="h-full bg-zinc-700 rounded" />
        </div>
      )
    case 'banner':
      return (
        <div className="h-24 rounded-lg flex flex-col overflow-hidden bg-zinc-800">
          <div className="h-4 bg-zinc-700" />
          <img src={imageUrl} alt="" className="flex-1 w-full object-cover" />
          <div className="h-4 bg-zinc-700" />
        </div>
      )
    default:
      return (
        <div className="h-24 rounded-lg bg-zinc-800 flex items-center justify-center">
          <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain rounded" />
        </div>
      )
  }
}

// Generate HTML code for each layout type
export function generateImageLayoutHtml(layout: ImageLayout, imageUrl: string): string {
  switch (layout) {
    case 'hero-background':
      return `
<!-- Hero Section with Background Image -->
<section class="relative h-screen w-full overflow-hidden">
  <img src="${imageUrl}" alt="Hero background" class="absolute inset-0 w-full h-full object-cover" />
  <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
  <div class="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">Your Headline Here</h1>
    <p class="text-xl text-white/80 max-w-2xl mb-8">Add your compelling subheadline or description to capture visitor attention.</p>
    <button class="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition">Get Started</button>
  </div>
</section>`

    case 'side-by-side':
      return `
<!-- Side by Side Section -->
<section class="py-16 px-4 lg:px-8">
  <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div class="rounded-2xl overflow-hidden shadow-2xl">
      <img src="${imageUrl}" alt="Feature image" class="w-full h-full object-cover" />
    </div>
    <div class="space-y-6">
      <h2 class="text-4xl font-bold text-white">Feature Headline</h2>
      <p class="text-lg text-zinc-400">Describe your feature or service in detail. Explain the benefits and value proposition to your visitors.</p>
      <ul class="space-y-3">
        <li class="flex items-center gap-3 text-zinc-300">
          <span class="w-2 h-2 bg-fuchsia-500 rounded-full"></span>
          Benefit point one
        </li>
        <li class="flex items-center gap-3 text-zinc-300">
          <span class="w-2 h-2 bg-fuchsia-500 rounded-full"></span>
          Benefit point two
        </li>
        <li class="flex items-center gap-3 text-zinc-300">
          <span class="w-2 h-2 bg-fuchsia-500 rounded-full"></span>
          Benefit point three
        </li>
      </ul>
      <button class="px-6 py-3 bg-fuchsia-500 text-white font-medium rounded-lg hover:bg-fuchsia-600 transition">Learn More</button>
    </div>
  </div>
</section>`

    case 'centered':
      return `
<!-- Centered Image Section -->
<section class="py-16 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <div class="rounded-2xl overflow-hidden shadow-2xl inline-block">
      <img src="${imageUrl}" alt="Featured image" class="max-w-full h-auto" />
    </div>
    <p class="mt-4 text-sm text-zinc-500">Add a caption for your image</p>
  </div>
</section>`

    case 'card':
      return `
<!-- Image Card -->
<div class="max-w-sm mx-auto bg-zinc-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
  <img src="${imageUrl}" alt="Card image" class="w-full h-48 object-cover" />
  <div class="p-6">
    <h3 class="text-xl font-semibold text-white mb-2">Card Title</h3>
    <p class="text-zinc-400 text-sm mb-4">A brief description of the card content goes here.</p>
    <button class="text-fuchsia-400 text-sm font-medium hover:text-fuchsia-300 transition">Learn more →</button>
  </div>
</div>`

    case 'gallery-item':
      return `
<!-- Gallery Grid Item (add to existing grid or create new) -->
<div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
  <div class="aspect-square rounded-xl overflow-hidden group cursor-pointer">
    <img src="${imageUrl}" alt="Gallery image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
  </div>
  <!-- Add more gallery items as needed -->
</div>`

    case 'banner':
      return `
<!-- Full Width Banner -->
<section class="w-full">
  <div class="relative h-64 md:h-96 overflow-hidden">
    <img src="${imageUrl}" alt="Banner image" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70 flex items-center">
      <div class="max-w-xl ml-8 md:ml-16">
        <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">Banner Headline</h2>
        <p class="text-white/80 text-lg">Supporting text for your banner message.</p>
      </div>
    </div>
  </div>
</section>`

    default:
      return `<img src="${imageUrl}" alt="Image" class="rounded-lg shadow-lg" />`
  }
}

export default ImageDropOverlay
