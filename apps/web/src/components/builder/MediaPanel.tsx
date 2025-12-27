'use client'

import { useState, useRef } from 'react'
import {
  X,
  Image as ImageIcon,
  Video,
  Music,
  Wand2,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  Upload,
  Trash2,
  ChevronDown,
  Zap,
  Palette,
  FileImage,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type MediaType = 'image' | 'video' | 'audio' | 'enhance'

interface MediaModel {
  key: string
  name: string
  description: string
  type: string
}

const MODEL_OPTIONS: Record<MediaType, MediaModel[]> = {
  image: [
    { key: 'flux-schnell', name: 'Flux Schnell', description: 'Fast, high-quality', type: 'image' },
    { key: 'flux-dev', name: 'Flux Dev', description: 'Best quality', type: 'image' },
    { key: 'sdxl', name: 'SDXL', description: 'Versatile', type: 'image' },
    { key: 'logo', name: 'Logo Generator', description: 'Professional logos', type: 'image' },
    { key: 'icon', name: 'Icon Generator', description: 'App icons', type: 'image' },
  ],
  video: [
    { key: 'minimax-video', name: 'Minimax Video', description: 'Text to video', type: 'video' },
    { key: 'stable-video', name: 'Stable Video', description: 'Image to video', type: 'video' },
    { key: 'animate-diff', name: 'Animate Diff', description: 'Animate images', type: 'video' },
  ],
  audio: [
    { key: 'musicgen', name: 'MusicGen', description: 'Generate music', type: 'audio' },
    { key: 'bark', name: 'Bark TTS', description: 'Text to speech', type: 'audio' },
  ],
  enhance: [
    { key: 'upscale', name: 'Upscale 4x', description: 'Increase resolution', type: 'enhance' },
    { key: 'remove-bg', name: 'Remove Background', description: 'Transparent BG', type: 'enhance' },
    { key: 'restore', name: 'Face Restore', description: 'Fix blurry faces', type: 'enhance' },
    { key: 'colorize', name: 'Colorize', description: 'B&W to color', type: 'enhance' },
  ],
}

const STYLE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'professional', label: 'Professional' },
  { value: 'modern', label: 'Modern' },
  { value: 'creative', label: 'Creative' },
  { value: 'tech', label: 'Tech' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'playful', label: 'Playful' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'dark', label: 'Dark Mode' },
]

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Wide' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '4:3', label: '4:3 Standard' },
  { value: '3:4', label: '3:4 Portrait' },
]

interface MediaPanelProps {
  onClose: () => void
  onInsert: (url: string, type: 'image' | 'video' | 'audio') => void
}

export function MediaPanel({ onClose, onInsert }: MediaPanelProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('image')
  const [selectedModel, setSelectedModel] = useState<string>('flux-schnell')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTabChange = (tab: MediaType) => {
    setActiveTab(tab)
    setSelectedModel(MODEL_OPTIONS[tab][0].key)
    setResult(null)
    setError(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const body: Record<string, any> = {
        action: selectedModel,
        prompt,
        style,
        aspectRatio,
      }

      // Add image for enhance/video models
      if (uploadedImage) {
        body.imageBase64 = uploadedImage.split(',')[1]
      }

      const res = await fetch('/api/ai/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setResult(data.output)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInsert = (url: string) => {
    const mediaType = activeTab === 'enhance' ? 'image' : activeTab
    onInsert(url, mediaType as 'image' | 'video' | 'audio')
    onClose()
  }

  const needsImage = activeTab === 'enhance' || ['stable-video', 'animate-diff'].includes(selectedModel)
  const needsPrompt = activeTab !== 'enhance' || selectedModel === 'animate-diff'

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Media Studio</h2>
            <p className="text-xs text-slate-400">Generate images, videos & more</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { key: 'image', icon: ImageIcon, label: 'Image' },
          { key: 'video', icon: Video, label: 'Video' },
          { key: 'audio', icon: Music, label: 'Audio' },
          { key: 'enhance', icon: Wand2, label: 'Enhance' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key as MediaType)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2',
              activeTab === key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Model Selection */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Model</label>
          <div className="grid grid-cols-2 gap-2">
            {MODEL_OPTIONS[activeTab].map((model) => (
              <button
                key={model.key}
                onClick={() => setSelectedModel(model.key)}
                className={cn(
                  'p-3 rounded-lg border text-left transition',
                  selectedModel === model.key
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                )}
              >
                <div className="font-medium text-sm text-white">{model.name}</div>
                <div className="text-xs text-slate-400">{model.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload (for enhance/video) */}
        {needsImage && (
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              {activeTab === 'enhance' ? 'Image to Enhance' : 'Source Image'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploadedImage ? (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-40 object-cover rounded-lg border border-white/10"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 transition"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-400">Upload Image</span>
              </button>
            )}
          </div>
        )}

        {/* Prompt */}
        {needsPrompt && (
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              {activeTab === 'audio' ? 'Description' : 'Prompt'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'image'
                  ? 'A modern office building with glass facade...'
                  : activeTab === 'video'
                  ? 'A serene ocean sunset with gentle waves...'
                  : 'Upbeat electronic music for a tech startup...'
              }
              className="w-full h-24 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>
        )}

        {/* Style & Aspect Ratio (for image) */}
        {activeTab === 'image' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {ASPECT_RATIOS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (needsPrompt && !prompt.trim()) || (needsImage && !uploadedImage)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <label className="block text-xs text-slate-400">Result</label>
            {Array.isArray(result) ? (
              result.map((url, i) => (
                <ResultItem
                  key={i}
                  url={url}
                  type={activeTab === 'enhance' ? 'image' : activeTab}
                  onCopy={() => handleCopy(url)}
                  onInsert={() => handleInsert(url)}
                  copied={copied}
                />
              ))
            ) : (
              <ResultItem
                url={result}
                type={activeTab === 'enhance' ? 'image' : activeTab}
                onCopy={() => handleCopy(result)}
                onInsert={() => handleInsert(result)}
                copied={copied}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultItem({
  url,
  type,
  onCopy,
  onInsert,
  copied,
}: {
  url: string
  type: string
  onCopy: () => void
  onInsert: () => void
  copied: boolean
}) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden bg-slate-800/50">
      {type === 'image' || type === 'enhance' ? (
        <img src={url} alt="Generated" className="w-full h-48 object-cover" />
      ) : type === 'video' ? (
        <video src={url} controls className="w-full h-48 object-cover" />
      ) : (
        <audio src={url} controls className="w-full p-4" />
      )}
      <div className="flex gap-2 p-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCopy}
          className="flex-1 text-xs"
        >
          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          Copy URL
        </Button>
        <Button
          size="sm"
          onClick={onInsert}
          className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
        >
          <FileImage className="w-3 h-3 mr-1" />
          Insert
        </Button>
        <a
          href={url}
          download
          className="flex items-center justify-center px-3 rounded-md bg-slate-700 hover:bg-slate-600 transition"
        >
          <Download className="w-3 h-3 text-slate-300" />
        </a>
      </div>
    </div>
  )
}

export default MediaPanel
