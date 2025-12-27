'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MediaItem {
  id: string
  url: string
  thumbnail: string
  title: string
  source: string
  author?: string
  width?: number
  height?: number
}

interface ImagePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string, item?: MediaItem) => void
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16' | 'any'
  initialSearch?: string
}

type Tab = 'recent' | 'search' | 'upload' | 'generate'

export function ImagePicker({
  isOpen,
  onClose,
  onSelect,
  aspectRatio = 'any',
  initialSearch = '',
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('recent')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MediaItem[]>([])
  const [recentUploads, setRecentUploads] = useState<MediaItem[]>([])
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Load recent uploads on mount
  useEffect(() => {
    if (isOpen) {
      loadRecentUploads()
    }
  }, [isOpen])

  const loadRecentUploads = async () => {
    try {
      const response = await fetch('/api/user/uploads?limit=20')
      if (response.ok) {
        const data = await response.json()
        setRecentUploads(data.uploads || [])
      }
    } catch (error) {
      console.error('Failed to load recent uploads:', error)
    }
  }

  const searchImages = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setResults([])

    try {
      const response = await fetch(
        `/api/media/search?source=all&q=${encodeURIComponent(searchQuery)}&per_page=24`
      )
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setIsLoading(true)
    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('files', file))

    try {
      const response = await fetch('/api/user/uploads', {
        method: 'POST',
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        if (data.uploads?.[0]) {
          onSelect(data.uploads[0].url, data.uploads[0])
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateImage = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)

    try {
      const response = await fetch('/api/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          aspectRatio: aspectRatio === 'any' ? 'landscape' : aspectRatio,
          saveToLibrary: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          onSelect(data.url, {
            id: data.savedId || `ai-${Date.now()}`,
            url: data.url,
            thumbnail: data.url,
            title: aiPrompt,
            source: 'ai-generated',
          })
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelect = useCallback((item: MediaItem) => {
    onSelect(item.url, item)
  }, [onSelect])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Choose Image</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {[
              { id: 'recent' as Tab, label: 'Recent', icon: ImageIcon },
              { id: 'search' as Tab, label: 'Search', icon: Search },
              { id: 'upload' as Tab, label: 'Upload', icon: Upload },
              { id: 'generate' as Tab, label: 'AI Generate', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'text-violet-400 border-b-2 border-violet-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Recent Tab */}
            {activeTab === 'recent' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {recentUploads.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">No recent images</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Upload or search for images to get started
                    </p>
                  </div>
                ) : (
                  recentUploads.map((item) => (
                    <ImageCard
                      key={item.id}
                      item={item}
                      onClick={() => handleSelect(item)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search for images..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchImages()}
                      className="pl-10 bg-slate-800 border-slate-700"
                    />
                  </div>
                  <Button onClick={searchImages} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {results.map((item) => (
                    <ImageCard
                      key={item.id}
                      item={item}
                      onClick={() => handleSelect(item)}
                    />
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                  </div>
                )}
              </>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center py-12">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-600 rounded-xl hover:border-violet-500 hover:bg-violet-500/5 transition">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium">
                        Click to upload an image
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the image you want to create..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateImage()}
                    className="flex-1 bg-slate-800 border-slate-700"
                  />
                  <Button
                    onClick={generateImage}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate
                  </Button>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-300 mb-2">Tips:</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>Be specific about the subject and style</li>
                    <li>Include details like lighting, colors, and mood</li>
                    <li>Example: "Modern office space with plants, natural lighting, minimalist design"</li>
                  </ul>
                </div>

                {isGenerating && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
                    <p className="text-sm text-slate-400">
                      Generating your image...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Image Card Component
function ImageCard({
  item,
  onClick,
}: {
  item: MediaItem
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-violet-500 transition-all"
    >
      <img
        src={item.thumbnail}
        alt={item.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Check className="w-6 h-6 text-white" />
      </div>
      {item.source && item.source !== 'uploads' && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white/80 capitalize">
          {item.source}
        </div>
      )}
    </button>
  )
}

export default ImagePicker
