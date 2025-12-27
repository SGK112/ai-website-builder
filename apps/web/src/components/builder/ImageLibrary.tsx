'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Image as ImageIcon,
  Sparkles,
  Upload,
  X,
  Download,
  Check,
  Loader2,
  Wand2,
  Maximize2,
  Scissors,
  RefreshCw,
  Camera,
  Grid3X3,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageResult {
  id: string
  source: string
  url: string
  thumbnail: string
  width: number
  height: number
  alt: string
  photographer: string
  photographerUrl: string
  downloadUrl: string
  color?: string
}

interface ImageLibraryProps {
  onSelectImage: (url: string, alt?: string) => void
  onClose?: () => void
}

type Tab = 'search' | 'ai' | 'upload'
type ViewMode = 'grid' | 'list'

const CATEGORIES = [
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'team', label: 'People', emoji: '👥' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'abstract', label: 'Abstract', emoji: '🎨' },
  { id: 'office', label: 'Office', emoji: '🏢' },
  { id: 'minimal', label: 'Minimal', emoji: '⬜' },
]

const AI_STYLES = [
  { id: 'professional', label: 'Professional' },
  { id: 'modern', label: 'Modern' },
  { id: 'creative', label: 'Creative' },
  { id: 'tech', label: 'Tech' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'luxury', label: 'Luxury' },
]

export function ImageLibrary({ onSelectImage, onClose }: ImageLibraryProps) {
  const [tab, setTab] = useState<Tab>('search')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [images, setImages] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)

  // AI Generation state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState('professional')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  // Enhancement state
  const [enhancing, setEnhancing] = useState<string | null>(null)

  // Load default images on mount
  useEffect(() => {
    searchImages('business')
  }, [])

  const searchImages = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/images/search?q=${encodeURIComponent(query)}&per_page=24`)
      const data = await response.json()
      if (data.success) {
        setImages(data.images)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchImages(searchQuery)
    }
  }

  const handleCategoryClick = (category: string) => {
    setSearchQuery(category)
    searchImages(category)
  }

  const generateAiImage = async () => {
    if (!aiPrompt.trim()) return

    setAiLoading(true)
    setGeneratedImage(null)

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: aiPrompt,
          style: aiStyle,
          aspectRatio: '16:9',
        }),
      })

      const data = await response.json()

      if (data.success && data.output) {
        // Flux returns array, get first image
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output
        setGeneratedImage(imageUrl)
      } else {
        alert(data.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const enhanceImage = async (action: 'upscale' | 'remove-bg' | 'restore', imageUrl: string) => {
    setEnhancing(action)

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          imageUrl,
        }),
      })

      const data = await response.json()

      if (data.success && data.output) {
        const enhancedUrl = Array.isArray(data.output) ? data.output[0] : data.output
        // Use the enhanced image
        onSelectImage(enhancedUrl, selectedImage?.alt)
        onClose?.()
      } else {
        alert(data.error || 'Enhancement failed')
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
      alert('Failed to enhance image')
    } finally {
      setEnhancing(null)
    }
  }

  const handleSelectImage = (image: ImageResult) => {
    setSelectedImage(image)
  }

  const confirmSelection = () => {
    if (selectedImage) {
      onSelectImage(selectedImage.downloadUrl || selectedImage.url, selectedImage.alt)
      onClose?.()
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          Image Library
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setTab('search')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition',
            tab === 'search'
              ? 'text-white border-b-2 border-purple-500 bg-slate-800/50'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Search className="w-4 h-4" />
          Free Photos
        </button>
        <button
          onClick={() => setTab('ai')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition',
            tab === 'ai'
              ? 'text-white border-b-2 border-purple-500 bg-slate-800/50'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
        <button
          onClick={() => setTab('upload')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition',
            tab === 'upload'
              ? 'text-white border-b-2 border-purple-500 bg-slate-800/50'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === 'search' && (
            <>
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-800">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search free photos..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium"
                  >
                    Search
                  </button>
                </form>

                {/* Categories */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition',
                        searchQuery === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      )}
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => handleSelectImage(image)}
                        className={cn(
                          'relative aspect-video rounded-lg overflow-hidden group transition',
                          selectedImage?.id === image.id
                            ? 'ring-2 ring-purple-500'
                            : 'hover:ring-2 hover:ring-slate-600'
                        )}
                      >
                        <img
                          src={image.thumbnail}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                            {image.source}
                          </span>
                        </div>
                        {selectedImage?.id === image.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'ai' && (
            <div className="p-4 space-y-4">
              {/* AI Prompt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Describe the image you need
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Modern office space with people collaborating, warm lighting, professional atmosphere"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {AI_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setAiStyle(style.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                        aiStyle === style.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateAiImage}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-lg font-medium transition"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating... (30-60s)
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>

              {/* Generated Image */}
              {generatedImage && (
                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-2">Generated Image:</p>
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={generatedImage}
                      alt={aiPrompt}
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={() => {
                        onSelectImage(generatedImage, aiPrompt)
                        onClose?.()
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      Use This Image
                    </button>
                  </div>
                </div>
              )}

              {/* AI Credit */}
              <p className="text-xs text-slate-500 text-center">
                Powered by Flux AI • Images are generated uniquely for you
              </p>
            </div>
          )}

          {tab === 'upload' && (
            <div className="p-4">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500 transition cursor-pointer">
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-1">Drop images here or click to upload</p>
                <p className="text-slate-500 text-sm">PNG, JPG, WebP up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      onSelectImage(url, file.name)
                      onClose?.()
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected Image Panel */}
        {selectedImage && tab === 'search' && (
          <div className="w-72 border-l border-slate-800 p-4 flex flex-col">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="w-full rounded-lg mb-4"
            />

            <p className="text-white font-medium text-sm mb-1 truncate">
              {selectedImage.alt}
            </p>
            <p className="text-slate-500 text-xs mb-4">
              by {selectedImage.photographer} • {selectedImage.source}
            </p>

            {/* AI Enhancements */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                AI Enhance
              </p>
              <button
                onClick={() => enhanceImage('upscale', selectedImage.url)}
                disabled={!!enhancing}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm transition"
              >
                {enhancing === 'upscale' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
                Upscale 4x
              </button>
              <button
                onClick={() => enhanceImage('remove-bg', selectedImage.url)}
                disabled={!!enhancing}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm transition"
              >
                {enhancing === 'remove-bg' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                Remove Background
              </button>
              <button
                onClick={() => enhanceImage('restore', selectedImage.url)}
                disabled={!!enhancing}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm transition"
              >
                {enhancing === 'restore' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Enhance Quality
              </button>
            </div>

            {/* Use Original */}
            <button
              onClick={confirmSelection}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition mt-auto"
            >
              <Check className="w-4 h-4" />
              Use Original
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
