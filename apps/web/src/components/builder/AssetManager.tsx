'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Loader2,
  Search,
  Grid3X3,
  List,
  ExternalLink,
  Download,
  FolderOpen,
  Plus,
  X,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'document'
  size: number
  width?: number
  height?: number
  uploadedAt: Date
  folder?: string
}

interface AssetManagerProps {
  projectId: string
  onSelectAsset: (asset: Asset) => void
  onInsertImage: (url: string, alt: string) => void
}

// Unsplash API for free stock images
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

export function AssetManager({ projectId, onSelectAsset, onInsertImage }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [activeTab, setActiveTab] = useState<'uploads' | 'unsplash' | 'url'>('uploads')
  const [unsplashResults, setUnsplashResults] = useState<any[]>([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [altText, setAltText] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadedAssets: Asset[] = []

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          console.error('Invalid file type:', file.type)
          continue
        }

        // Create form data
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)

        // Upload to our API (which uses Cloudinary or similar)
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedAssets.push({
            id: data.id || `asset-${Date.now()}`,
            name: file.name,
            url: data.url,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            size: file.size,
            width: data.width,
            height: data.height,
            uploadedAt: new Date(),
          })
        } else {
          // Fallback: Create object URL for demo
          const objectUrl = URL.createObjectURL(file)
          uploadedAssets.push({
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: objectUrl,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            size: file.size,
            uploadedAt: new Date(),
          })
        }
      }

      setAssets(prev => [...uploadedAssets, ...prev])
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }, [projectId])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Search Unsplash
  const searchUnsplash = useCallback(async (query: string) => {
    if (!query.trim()) return

    setUnsplashLoading(true)
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY || 'demo'}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setUnsplashResults(data.results || [])
      } else {
        // Demo fallback with placeholder images
        setUnsplashResults([
          { id: '1', urls: { regular: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800', thumb: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200' }, alt_description: 'Gradient background', user: { name: 'Unsplash' } },
          { id: '2', urls: { regular: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800', thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200' }, alt_description: 'Colorful gradient', user: { name: 'Unsplash' } },
          { id: '3', urls: { regular: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800', thumb: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200' }, alt_description: 'Abstract art', user: { name: 'Unsplash' } },
        ])
      }
    } catch (error) {
      console.error('Unsplash search error:', error)
    } finally {
      setUnsplashLoading(false)
    }
  }, [])

  // Copy URL to clipboard
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Delete asset
  const deleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId))
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(null)
    }
  }

  // Insert image from URL
  const handleInsertFromUrl = () => {
    if (urlInput.trim()) {
      onInsertImage(urlInput.trim(), altText || 'Image')
      setUrlInput('')
      setAltText('')
    }
  }

  // Filter assets
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {[
          { id: 'uploads', label: 'My Uploads', icon: FolderOpen },
          { id: 'unsplash', label: 'Stock Photos', icon: ImageIcon },
          { id: 'url', label: 'From URL', icon: LinkIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition",
              activeTab === tab.id
                ? "text-white border-b-2 border-purple-500"
                : "text-slate-400 hover:text-white"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'uploads' && (
          <>
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition mb-4",
                uploading
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  <span className="text-sm text-slate-300">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-300">Drop files or click to upload</span>
                  <span className="text-xs text-slate-500">PNG, JPG, GIF, SVG, MP4 up to 10MB</span>
                </div>
              )}
            </div>

            {/* Search and View Toggle */}
            {assets.length > 0 && (
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets..."
                    className="pl-8 bg-slate-800 border-slate-700 text-sm h-8"
                  />
                </div>
                <div className="flex bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded",
                      viewMode === 'grid' ? "bg-slate-700 text-white" : "text-slate-400"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-1.5 rounded",
                      viewMode === 'list' ? "bg-slate-700 text-white" : "text-slate-400"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Asset Grid/List */}
            {filteredAssets.length > 0 ? (
              <div className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-2 gap-2"
                  : "space-y-2"
              )}>
                {filteredAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={cn(
                      "group relative rounded-lg overflow-hidden cursor-pointer transition border",
                      selectedAsset?.id === asset.id
                        ? "border-purple-500 ring-2 ring-purple-500/50"
                        : "border-slate-700 hover:border-slate-600",
                      viewMode === 'list' && "flex items-center gap-3 p-2"
                    )}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="aspect-square bg-slate-800">
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onInsertImage(asset.url, asset.name)
                            }}
                            className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(asset.url)
                            }}
                            className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAsset(asset.id)
                            }}
                            className="p-2 bg-red-600 rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{asset.name}</p>
                          <p className="text-xs text-slate-500">
                            {(asset.size / 1024).toFixed(1)} KB
                            {asset.width && asset.height && ` • ${asset.width}x${asset.height}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onInsertImage(asset.url, asset.name)
                            }}
                            className="p-1.5 hover:bg-slate-700 rounded"
                          >
                            <Plus className="w-4 h-4 text-purple-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAsset(asset.id)
                            }}
                            className="p-1.5 hover:bg-slate-700 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No images uploaded yet</p>
                <p className="text-xs mt-1">Upload images to use in your website</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'unsplash' && (
          <>
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnsplash(searchQuery)}
                  placeholder="Search free photos..."
                  className="pl-8 bg-slate-800 border-slate-700 text-sm h-9"
                />
              </div>
              <Button
                onClick={() => searchUnsplash(searchQuery)}
                disabled={unsplashLoading}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {unsplashLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {/* Quick search tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {['technology', 'business', 'nature', 'abstract', 'minimal', 'office'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag)
                    searchUnsplash(tag)
                  }}
                  className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Results */}
            {unsplashResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {unsplashResults.map((photo: any) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-slate-700 hover:border-slate-600"
                  >
                    <img
                      src={photo.urls.thumb || photo.urls.small}
                      alt={photo.alt_description || 'Unsplash photo'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => onInsertImage(photo.urls.regular, photo.alt_description || 'Image')}
                        className="w-full py-2 bg-purple-600 rounded-lg text-xs font-medium hover:bg-purple-700"
                      >
                        Insert Image
                      </button>
                      <span className="text-xs text-slate-300">by {photo.user?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Search for free stock photos</p>
                <p className="text-xs mt-1">Powered by Unsplash</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Image URL</label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-slate-800 border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Alt Text (for SEO)</label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image..."
                className="bg-slate-800 border-slate-700 text-sm"
              />
            </div>

            {urlInput && (
              <div className="rounded-lg overflow-hidden border border-slate-700">
                <img
                  src={urlInput}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>'
                  }}
                />
              </div>
            )}

            <Button
              onClick={handleInsertFromUrl}
              disabled={!urlInput.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Insert Image
            </Button>
          </div>
        )}
      </div>

      {/* Selected Asset Details */}
      {selectedAsset && activeTab === 'uploads' && (
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white truncate">{selectedAsset.name}</span>
            <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onInsertImage(selectedAsset.url, selectedAsset.name)}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Insert
            </Button>
            <Button
              onClick={() => copyToClipboard(selectedAsset.url)}
              size="sm"
              variant="outline"
              className="border-slate-700"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => window.open(selectedAsset.url, '_blank')}
              size="sm"
              variant="outline"
              className="border-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
