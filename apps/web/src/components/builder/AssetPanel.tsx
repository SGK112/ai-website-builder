'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Image as ImageIcon,
  FileText,
  File,
  Trash2,
  Copy,
  Check,
  X,
  Search,
  Grid,
  List,
  FolderOpen,
  Link,
  ExternalLink,
  Sparkles,
  Wand2,
  Loader2,
  Maximize2,
  Scissors,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  type: 'image' | 'document' | 'other'
  url: string
  size: number
  uploadedAt: Date
  thumbnail?: string
  source?: string
  photographer?: string
}

interface AssetPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectAsset: (asset: Asset) => void
}

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

export function AssetPanel({ isOpen, onClose, onSelectAsset }: AssetPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [activeTab, setActiveTab] = useState<'uploads' | 'photos' | 'ai' | 'url'>('photos')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)

  // Stock photos state
  const [stockPhotos, setStockPhotos] = useState<Asset[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Asset | null>(null)

  // AI state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState('professional')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  // Enhancement state
  const [enhancing, setEnhancing] = useState<string | null>(null)

  // Load initial photos
  useEffect(() => {
    if (isOpen && stockPhotos.length === 0) {
      searchPhotos('business')
    }
  }, [isOpen])

  const searchPhotos = async (query: string) => {
    setLoadingPhotos(true)
    try {
      const response = await fetch(`/api/images/search?q=${encodeURIComponent(query)}&per_page=24`)
      const data = await response.json()
      if (data.success && data.images) {
        const photos: Asset[] = data.images.map((img: any) => ({
          id: img.id,
          name: img.alt || query,
          type: 'image' as const,
          url: img.url,
          thumbnail: img.thumbnail,
          size: 0,
          uploadedAt: new Date(),
          source: img.source,
          photographer: img.photographer,
        }))
        setStockPhotos(photos)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const handlePhotoSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchPhotos(searchQuery)
    }
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
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output
        setGeneratedImage(imageUrl)
      } else {
        alert(data.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      alert('Failed to generate image. Check if REPLICATE_API_TOKEN is configured.')
    } finally {
      setAiLoading(false)
    }
  }

  const enhanceImage = async (action: 'upscale' | 'remove-bg' | 'restore') => {
    if (!selectedPhoto) return

    setEnhancing(action)

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          imageUrl: selectedPhoto.url,
        }),
      })

      const data = await response.json()

      if (data.success && data.output) {
        const enhancedUrl = Array.isArray(data.output) ? data.output[0] : data.output
        onSelectAsset({
          ...selectedPhoto,
          url: enhancedUrl,
          name: `${selectedPhoto.name} (${action})`,
        })
        onClose()
      } else {
        alert(data.error || 'Enhancement failed. Check if REPLICATE_API_TOKEN is configured.')
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
      alert('Failed to enhance image')
    } finally {
      setEnhancing(null)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploading(true)

    const newAssets: Asset[] = acceptedFiles.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') || file.type.includes('doc') ? 'document' : 'other',
      url: URL.createObjectURL(file),
      size: file.size,
      uploadedAt: new Date(),
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))

    setTimeout(() => {
      setAssets(prev => [...newAssets, ...prev])
      setUploading(false)
    }, 500)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
  })

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    const newAsset: Asset = {
      id: `url-${Date.now()}`,
      name: urlInput.split('/').pop() || 'External Image',
      type: 'image',
      url: urlInput,
      size: 0,
      uploadedAt: new Date(),
      thumbnail: urlInput,
    }

    onSelectAsset(newAsset)
    setUrlInput('')
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-[1000px] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Image Library</h2>
              <p className="text-sm text-slate-400">Free photos, AI generation & enhancements</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800">
          {[
            { id: 'photos', label: 'Free Photos', icon: ImageIcon },
            { id: 'ai', label: 'AI Generate', icon: Sparkles },
            { id: 'uploads', label: 'My Uploads', icon: Upload },
            { id: 'url', label: 'From URL', icon: Link },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as typeof activeTab); setSelectedPhoto(null) }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
                activeTab === id
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'photos' && (
              <>
                {/* Search */}
                <div className="p-4 border-b border-slate-800">
                  <form onSubmit={handlePhotoSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search millions of free photos..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-500">
                      Search
                    </Button>
                  </form>

                  {/* Categories */}
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSearchQuery(cat.id); searchPhotos(cat.id) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-medium text-slate-300 whitespace-nowrap transition"
                      >
                        <span>{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingPhotos ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {stockPhotos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo)}
                          className={cn(
                            "relative aspect-video rounded-lg overflow-hidden group transition",
                            selectedPhoto?.id === photo.id
                              ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900"
                              : "hover:ring-2 hover:ring-slate-600"
                          )}
                        >
                          <img
                            src={photo.thumbnail || photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs truncate">{photo.photographer}</p>
                              <p className="text-slate-300 text-xs">{photo.source}</p>
                            </div>
                          </div>
                          {selectedPhoto?.id === photo.id && (
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

            {activeTab === 'ai' && (
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Describe the image you need
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Modern office with team collaborating, natural lighting, professional atmosphere"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
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
                      Generate with AI
                    </>
                  )}
                </button>

                {generatedImage && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-400 mb-2">Generated Image:</p>
                    <div className="relative rounded-lg overflow-hidden">
                      <img src={generatedImage} alt={aiPrompt} className="w-full rounded-lg" />
                      <button
                        onClick={() => {
                          onSelectAsset({
                            id: `ai-${Date.now()}`,
                            name: aiPrompt.slice(0, 50),
                            type: 'image',
                            url: generatedImage,
                            size: 0,
                            uploadedAt: new Date(),
                          })
                          onClose()
                        }}
                        className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Use This Image
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 text-center">
                  Powered by Flux AI via Replicate • Requires REPLICATE_API_TOKEN
                </p>
              </div>
            )}

            {activeTab === 'uploads' && (
              <>
                <div className="p-4">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer",
                      isDragActive
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className={cn("w-10 h-10 mx-auto mb-3", isDragActive ? "text-purple-400" : "text-slate-400")} />
                    {isDragActive ? (
                      <p className="text-purple-400 font-medium">Drop files here...</p>
                    ) : (
                      <>
                        <p className="text-white font-medium mb-1">Drag & drop images here</p>
                        <p className="text-sm text-slate-400">or click to browse</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {assets.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No uploads yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="group relative aspect-video rounded-lg overflow-hidden bg-slate-800 cursor-pointer"
                          onClick={() => { onSelectAsset(asset); onClose() }}
                        >
                          <img src={asset.thumbnail || asset.url} alt={asset.name} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(asset.id) }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'url' && (
              <div className="p-6">
                <div className="max-w-md mx-auto">
                  <label className="text-sm text-slate-400 mb-2 block">Enter image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button onClick={handleUrlSubmit} className="bg-purple-600 hover:bg-purple-500">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Use
                    </Button>
                  </div>
                  {urlInput && (
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Preview:</p>
                      <img
                        src={urlInput}
                        alt="Preview"
                        className="max-h-48 rounded-lg mx-auto"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Selected Photo Details & AI Enhance */}
          {selectedPhoto && activeTab === 'photos' && (
            <div className="w-72 border-l border-slate-800 p-4 flex flex-col bg-slate-900/50">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                className="w-full rounded-lg mb-4"
              />

              <p className="text-white font-medium text-sm mb-1 truncate">{selectedPhoto.name}</p>
              <p className="text-slate-500 text-xs mb-4">
                by {selectedPhoto.photographer} • {selectedPhoto.source}
              </p>

              {/* AI Enhancements */}
              <div className="space-y-2 mb-4">
                <p className="text-xs text-purple-400 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Enhance
                </p>
                <button
                  onClick={() => enhanceImage('upscale')}
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
                  onClick={() => enhanceImage('remove-bg')}
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
                  onClick={() => enhanceImage('restore')}
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

              <div className="mt-auto space-y-2">
                <button
                  onClick={() => { onSelectAsset(selectedPhoto); onClose() }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition"
                >
                  <Check className="w-4 h-4" />
                  Use Original
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="w-full px-4 py-2 text-slate-400 hover:text-white text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
