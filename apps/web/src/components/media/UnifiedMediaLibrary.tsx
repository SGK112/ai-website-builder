'use client'

import { useState, useEffect } from 'react'
import {
  Image as ImageIcon,
  Upload,
  Search,
  X,
  Check,
  Loader2,
  Link2,
  FolderOpen,
  FolderPlus,
  Sparkles,
  Settings,
  ExternalLink,
  RefreshCw,
  Trash2,
  Tag,
  MoreVertical,
  Grid3X3,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Media source types
type MediaSource = 'uploads' | 'unsplash' | 'pexels' | 'pixabay' | 'canva' | 'url' | 'ai'

interface MediaItem {
  id: string
  url: string
  thumbnail: string
  title: string
  source: MediaSource
  width?: number
  height?: number
  author?: string
  authorUrl?: string
  folderId?: string
  tags?: string[]
}

interface Folder {
  id: string
  name: string
  imageCount: number
}

interface UnifiedMediaLibraryProps {
  onSelect: (item: MediaItem) => void
  onClose?: () => void
  allowMultiple?: boolean
}

interface ConnectedService {
  id: MediaSource
  name: string
  icon: string
  connected: boolean
  apiKey?: string
}

const MEDIA_SOURCES: { id: MediaSource; name: string; icon: string; description: string }[] = [
  { id: 'uploads', name: 'My Uploads', icon: '📁', description: 'Your uploaded images' },
  { id: 'unsplash', name: 'Unsplash', icon: '📷', description: 'Free high-res photos' },
  { id: 'pexels', name: 'Pexels', icon: '🖼️', description: 'Free stock photos & videos' },
  { id: 'pixabay', name: 'Pixabay', icon: '🎨', description: 'Free images & vectors' },
  { id: 'canva', name: 'Canva', icon: '🎯', description: 'Your Canva designs' },
  { id: 'url', name: 'From URL', icon: '🔗', description: 'Import from any URL' },
  { id: 'ai', name: 'AI Generate', icon: '✨', description: 'Create with AI' },
]

export function UnifiedMediaLibrary({ onSelect, onClose, allowMultiple = false }: UnifiedMediaLibraryProps) {
  const [activeSource, setActiveSource] = useState<MediaSource>('uploads')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MediaItem[]>([])
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([])
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')

  // Folder management
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load connected services and folders on mount
  useEffect(() => {
    loadConnectedServices()
    loadFolders()
  }, [])

  // Load images when source or folder changes
  useEffect(() => {
    if (activeSource === 'uploads') {
      loadUploads()
    } else if (activeSource !== 'url' && activeSource !== 'ai') {
      // Clear results when switching to a searchable source
      setResults([])
    }
  }, [activeSource, currentFolderId])

  const loadConnectedServices = async () => {
    try {
      const response = await fetch('/api/user/integrations')
      if (response.ok) {
        const data = await response.json()
        setConnectedServices(data.services || [])
      }
    } catch (error) {
      console.error('Failed to load connected services:', error)
    }
  }

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/user/uploads/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const loadUploads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentFolderId) {
        params.set('folderId', currentFolderId)
      } else {
        params.set('folderId', 'uncategorized')
      }

      const response = await fetch(`/api/user/uploads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.uploads || [])
      }
    } catch (error) {
      console.error('Failed to load uploads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/user/uploads/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      })

      if (response.ok) {
        setNewFolderName('')
        setShowCreateFolder(false)
        loadFolders()
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return

    try {
      const ids = selectedItems.map(i => i.id).join(',')
      const response = await fetch(`/api/user/uploads?ids=${ids}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSelectedItems([])
        loadUploads()
        loadFolders()
      }
    } catch (error) {
      console.error('Failed to delete items:', error)
    }
  }

  const moveToFolder = async (folderId: string | null) => {
    if (selectedItems.length === 0) return

    try {
      const response = await fetch('/api/user/uploads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedItems.map(i => i.id),
          folderId,
        }),
      })

      if (response.ok) {
        setSelectedItems([])
        loadUploads()
        loadFolders()
      }
    } catch (error) {
      console.error('Failed to move items:', error)
    }
  }

  const searchImages = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setResults([])

    try {
      const response = await fetch(`/api/media/search?source=${activeSource}&q=${encodeURIComponent(searchQuery)}`)
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
        loadUploads()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return

    const item: MediaItem = {
      id: `url-${Date.now()}`,
      url: urlInput,
      thumbnail: urlInput,
      title: 'Imported Image',
      source: 'url',
    }
    onSelect(item)
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          const item: MediaItem = {
            id: `ai-${Date.now()}`,
            url: data.url,
            thumbnail: data.url,
            title: aiPrompt,
            source: 'ai',
          }
          setResults([item, ...results])
        }
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelect = (item: MediaItem) => {
    if (allowMultiple) {
      setSelectedItems((prev) =>
        prev.find((i) => i.id === item.id)
          ? prev.filter((i) => i.id !== item.id)
          : [...prev, item]
      )
    } else {
      onSelect(item)
    }
  }

  const isServiceConnected = (source: MediaSource) => {
    if (source === 'uploads' || source === 'url' || source === 'ai') return true
    return connectedServices.find((s) => s.id === source)?.connected || false
  }

  return (
    <div className="flex h-[600px] bg-background rounded-xl border overflow-hidden">
      {/* Sidebar - Sources */}
      <div className="w-56 border-r bg-muted/30 flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Media Sources</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {MEDIA_SOURCES.map((source) => {
            const connected = isServiceConnected(source.id)
            return (
              <button
                key={source.id}
                onClick={() => setActiveSource(source.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  activeSource === source.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <span className="text-lg">{source.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{source.name}</p>
                </div>
                {!connected && source.id !== 'uploads' && source.id !== 'url' && source.id !== 'ai' && (
                  <div className="w-2 h-2 rounded-full bg-yellow-500" title="Not connected" />
                )}
              </button>
            )
          })}
        </div>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Connect Services
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-4">
          {activeSource === 'url' ? (
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Paste image URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleUrlImport}>Import</Button>
            </div>
          ) : activeSource === 'ai' ? (
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Describe the image you want to generate..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAiGenerate} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          ) : activeSource === 'uploads' ? (
            <div className="flex-1 flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload Images</span>
                </div>
              </label>
              <Button variant="outline" onClick={loadUploads}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${MEDIA_SOURCES.find((s) => s.id === activeSource)?.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchImages()}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchImages} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </>
          )}

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isServiceConnected(activeSource) && activeSource !== 'uploads' && activeSource !== 'url' && activeSource !== 'ai' ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Link2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Connect {MEDIA_SOURCES.find((s) => s.id === activeSource)?.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your API key to access images from this source
              </p>
              <Button onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Connect Now
              </Button>
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {activeSource === 'uploads' ? 'No uploads yet' : 'Search for images'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeSource === 'uploads'
                  ? 'Upload images to use in your projects'
                  : 'Enter a search term to find images'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((item) => {
                const isSelected = selectedItems.find((i) => i.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={cn(
                      'group relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/50'
                    )}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Select</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    {item.author && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white truncate">by {item.author}</p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer - Selected Items */}
        {allowMultiple && selectedItems.length > 0 && (
          <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <Button onClick={() => selectedItems.forEach((item) => onSelect(item))}>
              Add Selected
            </Button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <IntegrationSettings
          onClose={() => setShowSettings(false)}
          onUpdate={loadConnectedServices}
        />
      )}
    </div>
  )
}

// Integration Settings Modal
function IntegrationSettings({ onClose, onUpdate }: { onClose: () => void; onUpdate: () => void }) {
  const [services, setServices] = useState({
    unsplash: '',
    pexels: '',
    pixabay: '',
    canva_client_id: '',
    canva_client_secret: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/integrations')
      if (response.ok) {
        const data = await response.json()
        if (data.keys) {
          setServices(data.keys)
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services),
      })
      if (response.ok) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Connect Media Services</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Unsplash */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium flex items-center gap-2">
                <span>📷</span> Unsplash
              </label>
              <a
                href="https://unsplash.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              placeholder="Access Key"
              value={services.unsplash}
              onChange={(e) => setServices({ ...services, unsplash: e.target.value })}
            />
          </div>

          {/* Pexels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium flex items-center gap-2">
                <span>🖼️</span> Pexels
              </label>
              <a
                href="https://www.pexels.com/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              placeholder="API Key"
              value={services.pexels}
              onChange={(e) => setServices({ ...services, pexels: e.target.value })}
            />
          </div>

          {/* Pixabay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium flex items-center gap-2">
                <span>🎨</span> Pixabay
              </label>
              <a
                href="https://pixabay.com/api/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              placeholder="API Key"
              value={services.pixabay}
              onChange={(e) => setServices({ ...services, pixabay: e.target.value })}
            />
          </div>

          {/* Canva */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium flex items-center gap-2">
                <span>🎯</span> Canva
              </label>
              <a
                href="https://www.canva.com/developers/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Get Credentials <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              placeholder="Client ID"
              value={services.canva_client_id}
              onChange={(e) => setServices({ ...services, canva_client_id: e.target.value })}
              className="mb-2"
            />
            <Input
              placeholder="Client Secret"
              type="password"
              value={services.canva_client_secret}
              onChange={(e) => setServices({ ...services, canva_client_secret: e.target.value })}
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Connections
          </Button>
        </div>
      </div>
    </div>
  )
}
