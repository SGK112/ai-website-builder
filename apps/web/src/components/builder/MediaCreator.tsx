'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, Image, Video, FileText, Layout,
  Instagram, Facebook, Youtube, Play, Download, Copy,
  Loader2, Wand2, Palette, Type, Square, Layers,
  MonitorPlay, Smartphone, Megaphone, PresentationIcon,
  ChevronRight, Check, RefreshCw, Share2, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MediaType = 'ad' | 'presentation' | 'banner' | 'social'
type AdPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'twitter'
type AdSize = { width: number; height: number; name: string }

interface MediaTemplate {
  id: string
  name: string
  type: MediaType
  platform?: AdPlatform
  size: AdSize
  thumbnail: string
  category: string
}

const AD_SIZES: Record<AdPlatform, AdSize[]> = {
  instagram: [
    { width: 1080, height: 1080, name: 'Square Post' },
    { width: 1080, height: 1350, name: 'Portrait Post' },
    { width: 1080, height: 1920, name: 'Story/Reel' },
  ],
  facebook: [
    { width: 1200, height: 628, name: 'Link Ad' },
    { width: 1080, height: 1080, name: 'Square Post' },
    { width: 1200, height: 1200, name: 'Carousel' },
  ],
  tiktok: [
    { width: 1080, height: 1920, name: 'Video Ad' },
    { width: 1080, height: 1080, name: 'Square' },
  ],
  youtube: [
    { width: 1280, height: 720, name: 'Thumbnail' },
    { width: 2560, height: 1440, name: 'Channel Banner' },
    { width: 300, height: 250, name: 'Display Ad' },
  ],
  twitter: [
    { width: 1200, height: 675, name: 'Tweet Image' },
    { width: 1500, height: 500, name: 'Header' },
  ],
}

const PRESENTATION_SIZES = [
  { width: 1920, height: 1080, name: '16:9 Widescreen' },
  { width: 1024, height: 768, name: '4:3 Standard' },
  { width: 1080, height: 1080, name: 'Square' },
]

const MEDIA_TEMPLATES: MediaTemplate[] = [
  // Instagram Ads
  { id: 'ig-product', name: 'Product Showcase', type: 'ad', platform: 'instagram', size: { width: 1080, height: 1080, name: 'Square' }, thumbnail: '🛍️', category: 'E-commerce' },
  { id: 'ig-sale', name: 'Sale Announcement', type: 'ad', platform: 'instagram', size: { width: 1080, height: 1080, name: 'Square' }, thumbnail: '🏷️', category: 'Promotions' },
  { id: 'ig-story', name: 'Story Promo', type: 'ad', platform: 'instagram', size: { width: 1080, height: 1920, name: 'Story' }, thumbnail: '📱', category: 'Stories' },

  // Facebook Ads
  { id: 'fb-link', name: 'Link Preview Ad', type: 'ad', platform: 'facebook', size: { width: 1200, height: 628, name: 'Link' }, thumbnail: '🔗', category: 'Traffic' },
  { id: 'fb-carousel', name: 'Carousel Ad', type: 'ad', platform: 'facebook', size: { width: 1200, height: 1200, name: 'Carousel' }, thumbnail: '🎠', category: 'Multi-product' },

  // TikTok
  { id: 'tt-video', name: 'Video Ad', type: 'ad', platform: 'tiktok', size: { width: 1080, height: 1920, name: 'Video' }, thumbnail: '🎵', category: 'Video' },

  // YouTube
  { id: 'yt-thumb', name: 'Thumbnail', type: 'ad', platform: 'youtube', size: { width: 1280, height: 720, name: 'Thumbnail' }, thumbnail: '▶️', category: 'Thumbnails' },
  { id: 'yt-banner', name: 'Channel Banner', type: 'ad', platform: 'youtube', size: { width: 2560, height: 1440, name: 'Banner' }, thumbnail: '🎬', category: 'Branding' },

  // Presentations
  { id: 'pres-pitch', name: 'Pitch Deck', type: 'presentation', size: { width: 1920, height: 1080, name: 'Widescreen' }, thumbnail: '📊', category: 'Business' },
  { id: 'pres-portfolio', name: 'Portfolio', type: 'presentation', size: { width: 1920, height: 1080, name: 'Widescreen' }, thumbnail: '🎨', category: 'Creative' },
  { id: 'pres-report', name: 'Report', type: 'presentation', size: { width: 1920, height: 1080, name: 'Widescreen' }, thumbnail: '📈', category: 'Data' },

  // Banners
  { id: 'banner-hero', name: 'Website Hero', type: 'banner', size: { width: 1920, height: 600, name: 'Hero' }, thumbnail: '🖼️', category: 'Website' },
  { id: 'banner-leaderboard', name: 'Leaderboard', type: 'banner', size: { width: 728, height: 90, name: 'Leaderboard' }, thumbnail: '📐', category: 'Display' },
  { id: 'banner-sidebar', name: 'Sidebar', type: 'banner', size: { width: 300, height: 600, name: 'Sidebar' }, thumbnail: '📏', category: 'Display' },
]

interface MediaCreatorProps {
  isOpen: boolean
  onClose: () => void
  onCreateMedia?: (media: { type: MediaType; content: string }) => void
}

export function MediaCreator({ isOpen, onClose, onCreateMedia }: MediaCreatorProps) {
  const [step, setStep] = useState<'type' | 'template' | 'customize' | 'generate'>('type')
  const [selectedType, setSelectedType] = useState<MediaType | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MediaTemplate | null>(null)
  const [selectedSize, setSelectedSize] = useState<AdSize | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [brandColors, setBrandColors] = useState({ primary: '#8B5CF6', secondary: '#EC4899' })
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')

  const mediaTypes = [
    { type: 'ad' as MediaType, name: 'Social Media Ads', icon: Megaphone, description: 'Create ads for Instagram, Facebook, TikTok, and more', color: 'from-pink-500 to-rose-500' },
    { type: 'presentation' as MediaType, name: 'Presentations', icon: PresentationIcon, description: 'Design stunning pitch decks and slideshows', color: 'from-blue-500 to-cyan-500' },
    { type: 'banner' as MediaType, name: 'Banners & Graphics', icon: Layout, description: 'Create website banners and display ads', color: 'from-amber-500 to-orange-500' },
    { type: 'social' as MediaType, name: 'Social Posts', icon: Share2, description: 'Design posts for all social platforms', color: 'from-purple-500 to-violet-500' },
  ]

  const platforms = [
    { id: 'instagram' as AdPlatform, name: 'Instagram', icon: Instagram, color: 'from-pink-500 via-purple-500 to-orange-500' },
    { id: 'facebook' as AdPlatform, name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700' },
    { id: 'tiktok' as AdPlatform, name: 'TikTok', icon: Play, color: 'from-gray-900 to-black' },
    { id: 'youtube' as AdPlatform, name: 'YouTube', icon: Youtube, color: 'from-red-600 to-red-700' },
  ]

  const handleGenerate = async () => {
    setGenerating(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGeneratedContent(`
      <div style="width: ${selectedSize?.width}px; height: ${selectedSize?.height}px; background: linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary}); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; text-align: center;">
        <h1 style="color: white; font-size: 48px; font-weight: bold; margin-bottom: 16px;">${headline || 'Your Amazing Product'}</h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 24px;">${subheadline || 'The best solution for your needs'}</p>
        <button style="margin-top: 32px; padding: 16px 32px; background: white; color: ${brandColors.primary}; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer;">Learn More</button>
      </div>
    `)
    setGenerating(false)
    setStep('generate')
  }

  const handleDownload = () => {
    // In production, this would generate an actual image/PDF
    alert('Download feature would generate a high-quality export of your media!')
  }

  const resetAndClose = () => {
    setStep('type')
    setSelectedType(null)
    setSelectedPlatform(null)
    setSelectedTemplate(null)
    setSelectedSize(null)
    setPrompt('')
    setGeneratedContent(null)
    setHeadline('')
    setSubheadline('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-zinc-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Media Creator</h2>
                  <p className="text-sm text-zinc-400">Create stunning ads, presentations, and graphics with AI</p>
                </div>
              </div>
              <button
                onClick={resetAndClose}
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-6">
              {['type', 'template', 'customize', 'generate'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    step === s ? "bg-violet-500 text-white" :
                    ['type', 'template', 'customize', 'generate'].indexOf(step) > i ? "bg-green-500 text-white" :
                    "bg-zinc-700 text-zinc-400"
                  )}>
                    {['type', 'template', 'customize', 'generate'].indexOf(step) > i ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 3 && (
                    <div className={cn(
                      "w-12 h-0.5 rounded-full",
                      ['type', 'template', 'customize', 'generate'].indexOf(step) > i ? "bg-green-500" : "bg-zinc-700"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Type */}
              {step === 'type' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">What do you want to create?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {mediaTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <motion.button
                          key={type.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedType(type.type)
                            if (type.type === 'ad') {
                              // Show platform selection for ads
                            } else {
                              setStep('template')
                            }
                          }}
                          className={cn(
                            "p-6 rounded-xl border text-left transition-all group",
                            selectedType === type.type
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30"
                          )}
                        >
                          <div className={cn(
                            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                            type.color
                          )}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-1">{type.name}</h4>
                          <p className="text-sm text-zinc-400">{type.description}</p>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Platform selection for ads */}
                  {selectedType === 'ad' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">Select platform</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {platforms.map((platform) => {
                          const Icon = platform.icon
                          return (
                            <motion.button
                              key={platform.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedPlatform(platform.id)
                                setStep('template')
                              }}
                              className={cn(
                                "p-4 rounded-xl border text-center transition-all",
                                selectedPlatform === platform.id
                                  ? "border-violet-500 bg-violet-500/10"
                                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30"
                              )}
                            >
                              <div className={cn(
                                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-3",
                                platform.color
                              )}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-sm font-medium text-white">{platform.name}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Select Template */}
              {step === 'template' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Choose a template</h3>
                    <button
                      onClick={() => setStep('type')}
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Size Selection */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-zinc-400 mb-3">Select size</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedType === 'ad' && selectedPlatform
                        ? AD_SIZES[selectedPlatform]
                        : selectedType === 'presentation'
                        ? PRESENTATION_SIZES
                        : [{ width: 1920, height: 600, name: 'Banner' }]
                      ).map((size) => (
                        <button
                          key={`${size.width}x${size.height}`}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            selectedSize?.width === size.width && selectedSize?.height === size.height
                              ? "bg-violet-500 text-white"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          )}
                        >
                          {size.name} ({size.width}×{size.height})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Templates */}
                  <div className="grid grid-cols-3 gap-4">
                    {MEDIA_TEMPLATES.filter(t =>
                      t.type === selectedType &&
                      (selectedType !== 'ad' || t.platform === selectedPlatform)
                    ).map((template) => (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedTemplate(template)
                          if (!selectedSize) setSelectedSize(template.size)
                          setStep('customize')
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          selectedTemplate?.id === template.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30"
                        )}
                      >
                        <div className="aspect-video bg-zinc-700 rounded-lg flex items-center justify-center text-4xl mb-3">
                          {template.thumbnail}
                        </div>
                        <h4 className="font-medium text-white">{template.name}</h4>
                        <p className="text-xs text-zinc-500">{template.category}</p>
                      </motion.button>
                    ))}

                    {/* Blank template */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedTemplate(null)
                        setStep('customize')
                      }}
                      className="p-4 rounded-xl border border-dashed border-zinc-700 hover:border-violet-500 text-left transition-all"
                    >
                      <div className="aspect-video bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                        <Sparkles className="w-8 h-8 text-zinc-600" />
                      </div>
                      <h4 className="font-medium text-white">Start from scratch</h4>
                      <p className="text-xs text-zinc-500">AI-generated design</p>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Customize */}
              {step === 'customize' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Customize your design</h3>
                    <button
                      onClick={() => setStep('template')}
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      ← Back
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">Preview</h4>
                      <div
                        className="rounded-xl overflow-hidden border border-zinc-700"
                        style={{
                          aspectRatio: selectedSize ? `${selectedSize.width}/${selectedSize.height}` : '16/9',
                          maxHeight: '400px',
                        }}
                      >
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                          style={{
                            background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
                          }}
                        >
                          <h1 className="text-2xl font-bold text-white mb-2">
                            {headline || 'Your Headline Here'}
                          </h1>
                          <p className="text-white/80">
                            {subheadline || 'Your subheadline here'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          <Type className="w-4 h-4 inline mr-2" />
                          Headline
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Enter your headline"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          <Type className="w-4 h-4 inline mr-2" />
                          Subheadline
                        </label>
                        <input
                          type="text"
                          value={subheadline}
                          onChange={(e) => setSubheadline(e.target.value)}
                          placeholder="Enter your subheadline"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          <Palette className="w-4 h-4 inline mr-2" />
                          Brand Colors
                        </label>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-zinc-500 mb-1 block">Primary</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={brandColors.primary}
                                onChange={(e) => setBrandColors(prev => ({ ...prev, primary: e.target.value }))}
                                className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={brandColors.primary}
                                onChange={(e) => setBrandColors(prev => ({ ...prev, primary: e.target.value }))}
                                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-zinc-500 mb-1 block">Secondary</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={brandColors.secondary}
                                onChange={(e) => setBrandColors(prev => ({ ...prev, secondary: e.target.value }))}
                                className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={brandColors.secondary}
                                onChange={(e) => setBrandColors(prev => ({ ...prev, secondary: e.target.value }))}
                                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          <Sparkles className="w-4 h-4 inline mr-2" />
                          AI Enhancement Prompt
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe how you want the AI to enhance your design..."
                          rows={3}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                        />
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-lg font-semibold"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5 mr-2" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Generated Result */}
              {step === 'generate' && generatedContent && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Your design is ready!</h3>
                        <p className="text-sm text-zinc-400">Download or continue editing</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep('customize')}
                      className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Preview */}
                    <div>
                      <div
                        className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800"
                        style={{
                          aspectRatio: selectedSize ? `${selectedSize.width}/${selectedSize.height}` : '16/9',
                        }}
                      >
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: generatedContent }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                        <h4 className="font-medium text-white mb-2">Export Options</h4>
                        <div className="space-y-2">
                          <Button
                            onClick={handleDownload}
                            className="w-full justify-start bg-zinc-700 hover:bg-zinc-600"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PNG
                          </Button>
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="w-full justify-start border-zinc-700 hover:bg-zinc-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-zinc-700 hover:bg-zinc-700"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Clipboard
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                        <h4 className="font-medium text-white mb-2">Share</h4>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 border-zinc-700">
                            <Instagram className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 border-zinc-700">
                            <Facebook className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 border-zinc-700">
                            <Youtube className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          onCreateMedia?.({ type: selectedType!, content: generatedContent })
                          resetAndClose()
                        }}
                        className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Add to Website
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MediaCreator
