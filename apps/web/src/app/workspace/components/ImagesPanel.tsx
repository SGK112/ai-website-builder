'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  X,
  Crosshair,
  ImagePlus,
  Loader2,
  Sparkles,
  ArrowRight,
  Plus,
  Download,
  Star,
  Box,
  Layout,
  Image as ImageIcon,
  Cloud,
  Check,
  Trash2,
  Eraser,
  Film,
  Contrast,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageEdit } from '../types'

type AspectRatio = '1:1' | '16:9' | '9:16'

export interface SelectedMediaElement {
  type: 'image' | 'video'
  index: number
}

interface ImagesPanelProps {
  isDark: boolean
  hasHtml: boolean
  selectedMediaElement: SelectedMediaElement | null
  onDeselectMedia: () => void
  // AI generator
  imagePrompt: string
  onImagePromptChange: (value: string) => void
  imageStyle: string
  onImageStyleChange: (value: string) => void
  imageAspectRatio: AspectRatio
  onImageAspectRatioChange: (value: AspectRatio) => void
  imageGenerating: boolean
  onGenerate: () => void
  generatedImageUrl: string | null
  onClearGenerated: () => void
  // Insert / drag
  onInsert: (url: string, name: string) => void
  onDragStart: (url: string) => void
  onDragEnd: () => void
  // Upload + edits
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  imageEdits: ImageEdit[]
  selectedImage: ImageEdit | null
  onSelectImage: (image: ImageEdit) => void
  onProcessImage: (id: string, operation: 'remove-bg' | 'to-video' | 'enhance') => void
  onRemoveImage: (id: string) => void
}

// Best-effort client download — fall back to opening the URL if fetching the
// blob is blocked (e.g. CORS on the generated-image host).
async function downloadImage(url: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const objUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = 'ai-generated-image.webp'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(objUrl)
  } catch {
    window.open(url, '_blank')
  }
}

export function ImagesPanel({
  isDark,
  hasHtml,
  selectedMediaElement,
  onDeselectMedia,
  imagePrompt,
  onImagePromptChange,
  imageStyle,
  onImageStyleChange,
  imageAspectRatio,
  onImageAspectRatioChange,
  imageGenerating,
  onGenerate,
  generatedImageUrl,
  onClearGenerated,
  onInsert,
  onDragStart,
  onDragEnd,
  onUpload,
  imageEdits,
  selectedImage,
  onSelectImage,
  onProcessImage,
  onRemoveImage,
}: ImagesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  // After a Quick Tool prefills the prompt, bring the main prompt textarea into
  // view and focus it so the user sees the next step (they still hit Generate).
  const focusPrompt = () => {
    requestAnimationFrame(() => {
      const el = promptInputRef.current
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    })
  }

  return (
    <motion.div
      key="images"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-3 space-y-3"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onUpload}
        className="hidden"
      />

      {/* Selected Image Indicator */}
      {selectedMediaElement && selectedMediaElement.type === 'image' && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Image Selected</p>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 truncate">Click Insert to replace image #{(selectedMediaElement.index || 0) + 1}</p>
              </div>
            </div>
            <button
              onClick={onDeselectMedia}
              aria-label="Deselect image"
              className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tip when no image selected */}
      {!selectedMediaElement && hasHtml && (
        <div className={cn('p-2 rounded-lg border flex items-center gap-2', isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200')}>
          <Crosshair className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <p className="text-[10px] text-zinc-500">Enable <span className="text-violet-400">Select Mode</span> in toolbar, then click an image in preview to replace it</p>
        </div>
      )}

      {/* AI Image Generation */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <label className="block text-xs text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5 font-medium">
          <ImagePlus className="w-3.5 h-3.5" />
          AI Image Generator
        </label>
        <textarea
          ref={promptInputRef}
          value={imagePrompt}
          onChange={(e) => onImagePromptChange(e.target.value)}
          placeholder="Describe the image... e.g., 'modern office workspace with plants and natural lighting'"
          rows={2}
          className={cn(
            'w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-blue-500/50 resize-none mb-2',
            isDark
              ? 'bg-black/30 border-white/10 text-white placeholder:text-zinc-600'
              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
          )}
        />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Style</label>
            <select
              value={imageStyle}
              onChange={(e) => onImageStyleChange(e.target.value)}
              className={cn(
                'w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none',
                isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900',
              )}
            >
              <option value="modern">Modern</option>
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="tech">Tech</option>
              <option value="nature">Nature</option>
              <option value="luxury">Luxury</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Aspect</label>
            <select
              value={imageAspectRatio}
              onChange={(e) => onImageAspectRatioChange(e.target.value as AspectRatio)}
              className={cn(
                'w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none',
                isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900',
              )}
            >
              <option value="16:9">16:9 Wide</option>
              <option value="1:1">1:1 Square</option>
              <option value="9:16">9:16 Tall</option>
            </select>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={imageGenerating || !imagePrompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-medium transition"
        >
          {imageGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Image
            </>
          )}
        </button>

        {/* Generated Image Preview - Draggable */}
        {generatedImageUrl && (
          <div className="mt-3 space-y-2">
            <div className="relative group">
              <img
                src={generatedImageUrl}
                alt="AI Generated"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', generatedImageUrl)
                  e.dataTransfer.setData('image-url', generatedImageUrl)
                  onDragStart(generatedImageUrl)
                }}
                onDragEnd={onDragEnd}
                className="w-full rounded-lg cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-violet-500/50 transition-all"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-2">
                <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-1 rounded">
                  Drag to replace an image
                </span>
              </div>
              {/* Delete button */}
              <button
                onClick={onClearGenerated}
                aria-label="Discard generated image"
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => onInsert(generatedImageUrl, 'AI Generated Image')}
                disabled={!hasHtml}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg disabled:opacity-50 text-white text-[10px] font-medium transition",
                  selectedMediaElement
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                    : "bg-emerald-600 hover:bg-emerald-500"
                )}
              >
                {selectedMediaElement ? (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    Replace
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Add to Site
                  </>
                )}
              </button>
              <button
                onClick={() => downloadImage(generatedImageUrl)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-medium transition"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tools */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const logoPrompt = prompt('Describe your logo (e.g., "minimalist tech startup logo with abstract shapes")')
            if (logoPrompt) {
              onImagePromptChange(`Logo design: ${logoPrompt}, clean vector style, transparent background, professional branding`)
              onImageStyleChange('minimal')
              focusPrompt()
            }
          }}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Star className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Logo Generator</span>
        </button>
        <button
          onClick={() => {
            const iconPrompt = prompt('Describe your icon (e.g., "shopping cart icon for e-commerce")')
            if (iconPrompt) {
              onImagePromptChange(`Icon: ${iconPrompt}, flat design, single color, minimal, SVG style`)
              onImageStyleChange('minimal')
              focusPrompt()
            }
          }}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Box className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">Icon Generator</span>
        </button>
        <button
          onClick={() => {
            const bannerPrompt = prompt('Describe your banner (e.g., "sale banner with 50% off text")')
            if (bannerPrompt) {
              onImagePromptChange(`Web banner: ${bannerPrompt}, eye-catching, promotional, modern design`)
              onImageAspectRatioChange('16:9')
              focusPrompt()
            }
          }}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <Layout className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-[10px] font-medium text-pink-700 dark:text-pink-300">Banner Maker</span>
        </button>
        <button
          onClick={() => {
            const heroPrompt = prompt('Describe your hero image (e.g., "modern office with happy team")')
            if (heroPrompt) {
              onImagePromptChange(`Hero image: ${heroPrompt}, high quality, professional photography style, website hero section`)
              onImageAspectRatioChange('16:9')
              onImageStyleChange('professional')
              focusPrompt()
            }
          }}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-[10px] font-medium text-violet-700 dark:text-violet-300">Hero Image</span>
        </button>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-zinc-500 hover:text-violet-400"
      >
        <ImagePlus className="w-5 h-5" />
        <span className="text-sm">Upload Images</span>
      </button>

      {/* Image List */}
      {imageEdits.length === 0 ? (
        <div className="text-center py-8">
          <Cloud className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
          <p className="text-xs text-zinc-600">No images uploaded</p>
          <p className="text-[10px] text-zinc-700 mt-1">Upload images to remove backgrounds or create videos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {imageEdits.map(image => (
            <div
              key={image.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all',
                selectedImage?.id === image.id
                  ? 'border-violet-500/50 bg-violet-500/5'
                  : 'border-white/[0.05] bg-white/[0.02]'
              )}
            >
              {/* Image Preview - Draggable */}
              <div
                className="relative aspect-video cursor-pointer group"
                onClick={() => onSelectImage(image)}
              >
                <img
                  src={image.result || image.url}
                  alt={image.name}
                  draggable
                  onDragStart={(e) => {
                    const imageUrl = image.result || image.url
                    e.dataTransfer.setData('text/plain', imageUrl)
                    e.dataTransfer.setData('image-url', imageUrl)
                    onDragStart(imageUrl)
                  }}
                  onDragEnd={onDragEnd}
                  className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 pointer-events-none">
                  <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-1 rounded">
                    Drag to replace an image
                  </span>
                </div>
                {image.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Cloud className="w-8 h-8 text-violet-400 mx-auto" />
                      </motion.div>
                      <p className="text-xs text-violet-300 mt-2">Processing...</p>
                    </div>
                  </div>
                )}
                {image.status === 'complete' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {image.status === 'error' && (
                  <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Failed
                  </div>
                )}
              </div>

              {/* Image Actions */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs truncate flex-1', isDark ? 'text-white' : 'text-slate-900')}>{image.name}</span>
                  <button
                    onClick={() => onRemoveImage(image.id)}
                    aria-label="Remove image"
                    className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => onProcessImage(image.id, 'remove-bg')}
                    disabled={image.status === 'processing'}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Remove BG</span>
                  </button>
                  <button
                    onClick={() => onProcessImage(image.id, 'to-video')}
                    disabled={image.status === 'processing'}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span className="text-[9px]">To Video</span>
                  </button>
                  <button
                    onClick={() => onProcessImage(image.id, 'enhance')}
                    disabled={image.status === 'processing'}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                  >
                    <Contrast className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Enhance</span>
                  </button>
                </div>

                {/* Insert/Replace Button */}
                <button
                  onClick={() => onInsert(image.result || image.url, image.name)}
                  disabled={!hasHtml}
                  className={cn(
                    "w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                    selectedMediaElement
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                      : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white",
                    !hasHtml && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {selectedMediaElement ? (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      Replace Selected Image
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Insert into Website
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
