'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2, Film, Upload, Download, Play, Pause, Scissors,
  Type, Music, Zap, ChevronDown, Check, Copy, Loader2,
  ImageIcon, Video, Captions, Sparkles, Share2, Clock,
  RotateCcw, Volume2, VolumeX, Maximize2, X, Plus,
  ArrowRight, Instagram, Youtube, MonitorPlay,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'create' | 'edit' | 'library'
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5'
type GenerateMode = 'text' | 'image'

interface GeneratedVideo {
  id: string
  url: string
  thumbnail?: string
  prompt: string
  mode: GenerateMode
  createdAt: Date
  duration?: number
  aspectRatio: AspectRatio
}

interface EditOp {
  type: 'trim' | 'caption' | 'overlay' | 'music'
  label: string
}

const ASPECT_RATIOS: { id: AspectRatio; label: string; icon: React.ElementType; hint: string }[] = [
  { id: '16:9', label: '16:9', icon: MonitorPlay, hint: 'YouTube / Landscape' },
  { id: '9:16', label: '9:16', icon: Instagram, hint: 'Reels / TikTok / Stories' },
  { id: '1:1', label: '1:1', icon: Instagram, hint: 'Instagram Square' },
  { id: '4:5', label: '4:5', icon: Instagram, hint: 'Instagram Portrait' },
]

const VIDEO_MODELS = [
  { id: 'seedance', label: 'Seedance', speed: 'Fast', quality: 'Best', badge: '🔥 Hot', multi: false },
  { id: 'grok', label: 'Grok Imagine', speed: 'Medium', quality: 'Premium', badge: '✨ Multi-image', multi: true },
  { id: 'wan', label: 'Wan 2.1', speed: 'Medium', quality: 'Great', badge: 'Open', multi: false },
  { id: 'animatediff', label: 'AnimateDiff', speed: 'Fast', quality: 'Good', badge: '', multi: false },
  { id: 'zeroscope', label: 'Zeroscope XL', speed: 'Fast', quality: 'Good', badge: '', multi: false },
  { id: 'svd', label: 'Stable Video', speed: 'Medium', quality: 'Great', badge: 'Img→Vid', multi: false },
]

const STYLE_PRESETS = [
  'Cinematic', 'Anime', 'Realistic', 'Cartoon', '3D Render',
  'Watercolor', 'Neon/Cyberpunk', 'Documentary', 'Slow Motion',
]

export default function VideoEditor() {
  const [tab, setTab] = useState<Tab>('create')
  const [generateMode, setGenerateMode] = useState<GenerateMode>('text')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [model, setModel] = useState('seedance')
  const [style, setStyle] = useState('')
  const [duration, setDuration] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState<GeneratedVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null)
  const [editingVideo, setEditingVideo] = useState<GeneratedVideo | null>(null)

  // Player state
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Editor state
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [captionText, setCaptionText] = useState('')
  const [captionLoading, setCaptionLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const isDark = true // video editor is always dark
  // Only Grok accepts more than one source image; everything else is single-image.
  const isMultiImage = !!VIDEO_MODELS.find(m => m.id === model)?.multi

  const generate = async () => {
    if (generateMode === 'text' && !prompt.trim()) return
    if (generateMode === 'image' && uploadedImages.length === 0) return
    setGenerating(true)
    setProgress(5)
    setProgressLabel('Sending to Seedance…')
    setError(null)

    try {
      // 1. Start prediction
      const body: Record<string, unknown> = {
        action: generateMode === 'text' ? 'text-to-video' : 'image-to-video',
        prompt: prompt.trim() || 'Animate this image with smooth natural motion',
        model,
        aspectRatio,
        duration,
        style: style || undefined,
      }
      if (generateMode === 'image' && uploadedImages.length) {
        // Grok takes several images (images[]); everything else takes one.
        if (isMultiImage && uploadedImages.length > 1) body.imageUrls = uploadedImages
        else body.imageUrl = uploadedImages[0]
      }

      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      // Defensive parse — never let an empty/non-JSON response surface as a
      // cryptic "Unexpected end of JSON input"; fall back to a clean message.
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || `Couldn't start generation (HTTP ${res.status}).`)

      const predictionId = data.id
      if (!predictionId) throw new Error('No prediction ID returned')

      // 2. Poll GET endpoint every 3s — avoids hammering rate limits
      setProgressLabel('AI is rendering your video…')
      let videoUrl: string | null = null
      let attempts = 0
      const maxAttempts = 80 // 4 minutes max

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000))
        attempts++
        setProgress(Math.min(88, 8 + attempts * 1.1))

        const poll = await fetch(`/api/ai/video?id=${predictionId}`)
        const pollData = await poll.json().catch(() => ({} as any))

        if (pollData.status === 'succeeded') {
          videoUrl = pollData.videoUrl
          break
        }
        if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Generation failed on Replicate')
        }
        // starting | processing — keep polling
      }

      if (!videoUrl) throw new Error('Generation timed out or returned no video')

      setProgress(100)
      setProgressLabel('Done! 🎬')

      const vid: GeneratedVideo = {
        id: predictionId,
        url: videoUrl,
        prompt: (body.prompt as string),
        mode: generateMode,
        createdAt: new Date(),
        aspectRatio,
      }
      setLibrary(prev => [vid, ...prev])
      setSelectedVideo(vid)
      setEditingVideo(vid)
      setTab('edit')
    } catch (e: any) {
      setError(e?.message || 'Generation failed')
    } finally {
      setGenerating(false)
      setTimeout(() => { setProgress(0); setProgressLabel('') }, 2000)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    // Single-image models only ever use the first file; Grok can use several.
    const toUpload = isMultiImage ? files : files.slice(0, 1)

    // Image-to-video sends these URLs straight to the model, which fetches them
    // server-side and can't resolve `data:` URLs — so each must end up a public
    // HTTPS URL. Upload to /api/upload and reject any data: response (means
    // Cloudinary isn't configured).
    setError(null)
    setUploadingImage(true)
    try {
      const urls: string[] = []
      for (const file of toUpload) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Upload failed (${res.status})`)
        }
        const json = await res.json()
        if (!json.url) throw new Error('Upload returned no URL')
        if (json.url.startsWith('data:')) {
          throw new Error('Image storage isn\'t configured on this server. Ask an admin to set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET on the Webstew service.')
        }
        urls.push(json.url)
      }
      // Single-image models replace; multi-image appends (up to a sane cap).
      setUploadedImages(prev => (isMultiImage ? [...prev, ...urls].slice(0, 6) : urls))
    } catch (e: any) {
      setError(e?.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
      // Allow re-selecting the same file(s) again.
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedVideo(file)
    const url = URL.createObjectURL(file)
    const vid: GeneratedVideo = {
      id: Date.now().toString(),
      url,
      prompt: file.name,
      mode: 'text',
      createdAt: new Date(),
      aspectRatio: '16:9',
    }
    setLibrary(prev => [vid, ...prev])
    setEditingVideo(vid)
    setTab('edit')
  }

  const autoCaption = async () => {
    if (!editingVideo) return
    setCaptionLoading(true)
    try {
      const res = await fetch('/api/ai/video/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: editingVideo.url }),
      })
      const data = await res.json()
      if (data.comingSoon) {
        setCaptionText('⏳ AI captions coming soon — add OPENAI_API_KEY to enable Whisper transcription.')
        return
      }
      setCaptionText(data.transcript || '')
    } catch {
      setCaptionText('Could not auto-generate captions. Enter them manually.')
    } finally {
      setCaptionLoading(false)
    }
  }

  const downloadVideo = async (video: GeneratedVideo) => {
    // <a download> is ignored for cross-origin URLs (Replicate/Cloudinary) —
    // the browser would just navigate to the raw .mp4. Fetch a blob so the
    // file actually saves and the user stays in the editor.
    try {
      const res = await fetch(video.url)
      if (!res.ok) throw new Error()
      const blobUrl = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `webstew-video-${video.id}.mp4`
      a.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
    } catch {
      // Fallback: open in a new tab so the user can save manually.
      window.open(video.url, '_blank', 'noopener')
    }
  }

  const copyToClipboard = async (text: string, which: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Video Studio</h1>
            <p className="text-[10px] text-zinc-500">AI-powered video creation & editing</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          {([
            { id: 'create' as Tab, icon: Wand2, label: 'Create' },
            { id: 'edit' as Tab, icon: Scissors, label: 'Edit' },
            { id: 'library' as Tab, icon: Film, label: 'Library', count: library.length },
          ]).map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                tab === id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="bg-violet-500/30 text-violet-300 px-1 rounded text-[9px]">{count}</span>
              )}
            </button>
          ))}
        </div>

        <a href="/workspace" className="text-xs text-zinc-500 hover:text-white transition">
          ← Workspace
        </a>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* ── CREATE TAB ── */}
        {tab === 'create' && (
          <div className="flex-1 flex gap-0 overflow-hidden">
            {/* Left: settings */}
            <div className="w-[380px] shrink-0 border-r border-white/[0.06] overflow-y-auto p-5 space-y-5">

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGenerateMode('text')}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                    generateMode === 'text'
                      ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                      : 'border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white'
                  )}
                >
                  <Wand2 className="w-4 h-4" />
                  Text to Video
                </button>
                <button
                  onClick={() => setGenerateMode('image')}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                    generateMode === 'image'
                      ? 'border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300'
                      : 'border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white'
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  Image to Video
                </button>
              </div>

              {/* Image upload (image mode) */}
              {generateMode === 'image' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    {isMultiImage ? 'Source Images' : 'Source Image'}
                    {isMultiImage && <span className="ml-1.5 text-[10px] text-fuchsia-400/80">Grok can blend up to 6</span>}
                  </label>
                  {uploadingImage ? (
                    <div className="w-full aspect-video rounded-xl border-2 border-dashed border-fuchsia-500/40 bg-fuchsia-500/5 flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <div className="w-6 h-6 rounded-full border-2 border-fuchsia-500/40 border-t-fuchsia-500 animate-spin" />
                      <span className="text-xs">Uploading to image storage…</span>
                    </div>
                  ) : uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((url, i) => (
                        <div key={url + i} className="relative rounded-lg overflow-hidden aspect-square bg-zinc-900">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-black/80"
                            aria-label="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Add-more tile (multi-image models only) */}
                      {isMultiImage && uploadedImages.length < 6 && (
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-white/[0.1] hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all flex flex-col items-center justify-center gap-1 text-zinc-500"
                        >
                          <Upload className="w-5 h-5" />
                          <span className="text-[10px]">Add</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-white/[0.1] hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all flex flex-col items-center justify-center gap-2 text-zinc-500"
                    >
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">{isMultiImage ? 'Click to upload images' : 'Click to upload image'}</span>
                      <span className="text-[10px] text-zinc-600">JPG, PNG, WebP, HEIC</span>
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" multiple={isMultiImage} className="hidden" onChange={handleImageUpload} />
                </div>
              )}

              {/* Prompt */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  {generateMode === 'text' ? 'Describe your video' : 'Motion description (optional)'}
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={
                    generateMode === 'text'
                      ? 'A drone shot flying over mountain peaks at golden hour, cinematic, 4K…'
                      : 'Gentle zoom in, soft wind in hair, bokeh background…'
                  }
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              {/* Style presets */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_PRESETS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(style === s ? '' : s)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                        style === s
                          ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                          : 'border-white/[0.08] text-zinc-500 hover:text-white hover:border-white/20'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect ratio */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all',
                        aspectRatio === r.id
                          ? 'border-violet-500 bg-violet-500/15'
                          : 'border-white/[0.08] hover:border-white/20'
                      )}
                    >
                      <div className={cn(
                        'border-2 rounded',
                        aspectRatio === r.id ? 'border-violet-400' : 'border-zinc-600',
                        r.id === '16:9' ? 'w-8 h-5' : r.id === '9:16' ? 'w-5 h-8' : r.id === '1:1' ? 'w-6 h-6' : 'w-5 h-7'
                      )} />
                      <span className={cn('text-[10px] font-bold', aspectRatio === r.id ? 'text-violet-300' : 'text-zinc-500')}>{r.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-400">Duration</label>
                  <span className="text-xs text-violet-300 font-mono">{duration}s</span>
                </div>
                <input
                  type="range" min={3} max={15} value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>3s</span><span>15s</span>
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">AI Model</label>
                <div className="space-y-1.5">
                  {VIDEO_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={cn(
                        'w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all',
                        model === m.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/[0.06] hover:border-white/15 bg-white/[0.02]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {model === m.id && <Check className="w-3 h-3 text-violet-400" />}
                        <span className="text-xs font-medium text-white">{m.label}</span>
                        {m.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[9px] font-bold">{m.badge}</span>
                        )}
                      </div>
                      <div className="flex gap-2 text-[10px] text-zinc-500">
                        <span>{m.speed}</span>
                        <span>·</span>
                        <span>{m.quality}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={generating || uploadingImage || (!prompt.trim() && generateMode === 'text') || (generateMode === 'image' && uploadedImages.length === 0) || (generateMode === 'image' && uploadedImages.some(u => u.startsWith('data:')))}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {progressLabel || 'Generating…'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Video
                  </>
                )}
              </button>

              {/* Also upload existing */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-zinc-950 text-[11px] text-zinc-600">or</span>
                </div>
              </div>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white text-sm font-medium transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload existing video to edit
              </button>
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            </div>

            {/* Right: preview / progress */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
              {generating ? (
                <div className="text-center space-y-6 max-w-sm">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/30">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-8 h-8 text-violet-400" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">{progressLabel || 'Generating your video…'}</p>
                    <p className="text-zinc-500 text-sm">This takes 30–120 seconds depending on the model</p>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 font-mono">{progress}%</p>
                </div>
              ) : selectedVideo ? (
                <VideoPlayer video={selectedVideo} onEdit={() => { setEditingVideo(selectedVideo); setTab('edit') }} onDownload={() => downloadVideo(selectedVideo)} />
              ) : (
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center border border-white/[0.06]">
                    <Film className="w-10 h-10 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-zinc-400 font-medium">Your video will appear here</p>
                    <p className="text-zinc-600 text-sm mt-1">Set your options and click Generate</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { icon: Zap, label: 'Fast generation', sub: '30–90s' },
                      { icon: Instagram, label: 'Social formats', sub: 'Reels, TikTok, YT' },
                      { icon: Scissors, label: 'Edit after', sub: 'Trim, captions' },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                        <Icon className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-zinc-300">{label}</p>
                        <p className="text-[10px] text-zinc-600">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EDIT TAB ── */}
        {tab === 'edit' && (
          <div className="flex-1 flex gap-0 overflow-hidden">
            {/* Left: tools */}
            <div className="w-72 shrink-0 border-r border-white/[0.06] overflow-y-auto">
              {/* Tool sections */}
              <div className="p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-3">Edit Tools</p>

                {/* Only tools with a real panel below — Text Overlay / Music
                    scrolled to anchors that don't exist (dead clicks). */}
                {[
                  { id: 'trim', icon: Scissors, label: 'Trim & Cut', sub: 'Set in/out points' },
                  { id: 'captions', icon: Captions, label: 'AI Captions', sub: 'Auto-generate subtitles' },
                ].map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => document.getElementById(`edit-${id}`)?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <Icon className="w-4 h-4 text-zinc-400 group-hover:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{label}</p>
                      <p className="text-[10px] text-zinc-600">{sub}</p>
                    </div>
                  </button>
                ))}

                {/* Select from library */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-2">Select Video</p>
                  {library.length === 0 ? (
                    <p className="text-xs text-zinc-600 p-2">No videos yet. Generate one first.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {library.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setEditingVideo(v)}
                          className={cn(
                            'w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all',
                            editingVideo?.id === v.id ? 'bg-violet-500/15 border border-violet-500/30' : 'hover:bg-white/[0.04]'
                          )}
                        >
                          <div className="w-12 h-8 rounded bg-zinc-800 overflow-hidden shrink-0">
                            <video src={v.url} className="w-full h-full object-cover" muted />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-zinc-300 truncate">{v.prompt.slice(0, 30)}…</p>
                            <p className="text-[10px] text-zinc-600">{v.aspectRatio}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center: preview + timeline */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {editingVideo ? (
                <>
                  {/* Video preview */}
                  <div className="flex-1 flex items-center justify-center bg-black/50 p-6">
                    <div className="relative max-h-full max-w-full">
                      <video
                        ref={videoRef}
                        src={editingVideo.url}
                        className="max-h-[50vh] max-w-full rounded-xl"
                        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
                        onDurationChange={e => setVideoDuration(e.currentTarget.duration)}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        muted={muted}
                      />
                    </div>
                  </div>

                  {/* Transport controls */}
                  <div className="px-6 py-3 border-t border-white/[0.06] bg-zinc-900/80">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => playing ? videoRef.current?.pause() : videoRef.current?.play()}
                        aria-label={playing ? 'Pause' : 'Play'}
                        className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors"
                      >
                        {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                      </button>
                      <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} className="text-zinc-500 hover:text-white transition-colors">
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatTime(currentTime)} / {formatTime(videoDuration)}
                      </span>
                      <div className="flex-1">
                        <input
                          type="range" min={0} max={videoDuration || 100}
                          value={currentTime}
                          onChange={e => {
                            const t = Number(e.target.value)
                            if (videoRef.current) videoRef.current.currentTime = t
                          }}
                          className="w-full accent-violet-500 h-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Edit panels */}
                  <div className="h-48 overflow-y-auto border-t border-white/[0.06] bg-zinc-900/50">
                    {/* Trim */}
                    <div id="edit-trim" className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-3">
                        <Scissors className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs font-semibold text-zinc-200">Trim</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 mb-1 block">In point</label>
                          <input type="number" min={0} max={videoDuration} step={0.1}
                            value={trimStart} onChange={e => setTrimStart(Number(e.target.value))}
                            className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 mb-1 block">Out point</label>
                          <input type="number" min={0} max={videoDuration} step={0.1}
                            value={trimEnd || videoDuration} onChange={e => setTrimEnd(Number(e.target.value))}
                            className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono" />
                        </div>
                      </div>
                    </div>

                    {/* Captions */}
                    <div id="edit-captions" className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Captions className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-xs font-semibold text-zinc-200">Captions</span>
                        </div>
                        <button
                          onClick={autoCaption}
                          disabled={captionLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-[11px] font-medium transition-colors disabled:opacity-50"
                        >
                          {captionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Auto-Caption
                        </button>
                      </div>
                      <textarea
                        value={captionText}
                        onChange={e => setCaptionText(e.target.value)}
                        placeholder="Captions will appear here after AI analysis, or type manually…"
                        rows={2}
                        className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-zinc-600 resize-none focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <Film className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">Select a video from the left panel to edit</p>
                    <p className="text-zinc-600 text-xs mt-1">or <button onClick={() => setTab('create')} className="text-violet-400 underline">generate a new one</button></p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: export */}
            {editingVideo && (
              <div className="w-64 shrink-0 border-l border-white/[0.06] overflow-y-auto p-4 space-y-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Export</p>

                <div className="space-y-2">
                  {/* Download original — works now */}
                  <button
                    onClick={() => downloadVideo(editingVideo)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 transition-all text-left"
                  >
                    <Download className="w-4 h-4 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-xs text-violet-200 font-medium">Download Video</p>
                      <p className="text-[10px] text-violet-400/60">{editingVideo.aspectRatio} · MP4</p>
                    </div>
                    <Download className="w-3 h-3 text-violet-400 ml-auto" />
                  </button>
                  <p className="text-[10px] text-zinc-600 px-0.5 leading-relaxed">
                    Downloads the generated video. Trim &amp; caption edits are preview-only for now and aren't burned into the file yet.
                  </p>

                  {/* Coming soon — need platform API keys */}
                  <div className="pt-1">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold mb-1.5 px-0.5">Coming Soon</p>
                    {[
                      { label: 'Publish to YouTube', icon: Youtube, key: 'YOUTUBE_API_KEY', ratio: '16:9' },
                      { label: 'Post to Instagram', icon: Instagram, key: 'INSTAGRAM_ACCESS_TOKEN', ratio: '9:16' },
                      { label: 'Upload to TikTok', icon: Video, key: 'TIKTOK_API_KEY', ratio: '9:16' },
                      { label: 'Post to Twitter/X', icon: Share2, key: 'TWITTER_API_KEY', ratio: '16:9' },
                    ].map(({ label, icon: Icon, key, ratio }) => (
                      <div
                        key={label}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left opacity-50 cursor-not-allowed mb-1.5"
                        title={`Requires ${key}`}
                      >
                        <Icon className="w-4 h-4 text-zinc-600 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-500 font-medium">{label}</p>
                          <p className="text-[10px] text-zinc-700">{ratio} · needs {key}</p>
                        </div>
                        <span className="ml-auto text-[9px] font-bold text-zinc-700 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded">Soon</span>
                      </div>
                    ))}</div>
                </div>

                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider font-semibold">Insert</p>
                  <button
                    onClick={() => editingVideo && copyToClipboard(`<video src="${editingVideo.url}" controls playsinline style="width:100%;border-radius:12px"></video>`, 'embed')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {copied === 'embed' ? 'Embed code copied!' : 'Copy embed code'}
                  </button>
                  <button
                    onClick={() => editingVideo && copyToClipboard(editingVideo.url, 'url')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium transition-colors mt-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied === 'url' ? 'URL copied!' : 'Copy video URL'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LIBRARY TAB ── */}
        {tab === 'library' && (
          <div className="flex-1 overflow-y-auto p-6">
            {library.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Film className="w-9 h-9 text-zinc-700" />
                </div>
                <div>
                  <p className="text-zinc-400 font-medium">No videos yet</p>
                  <p className="text-zinc-600 text-sm mt-1">Generated videos will appear here</p>
                </div>
                <button
                  onClick={() => setTab('create')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Create your first video
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">{library.length} video{library.length !== 1 ? 's' : ''}</h2>
                  <button onClick={() => setTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                    <Plus className="w-4 h-4" />
                    New Video
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {library.map(v => (
                    <div key={v.id} className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] hover:border-violet-500/40 transition-all">
                      <div className={cn(
                        'relative overflow-hidden bg-black',
                        v.aspectRatio === '9:16' ? 'aspect-[9/16]' : v.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'
                      )}>
                        <video src={v.url} className="w-full h-full object-cover" muted loop />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                            <button
                              onClick={() => { setEditingVideo(v); setTab('edit') }}
                              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors"
                            >
                              <Scissors className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadVideo(v)}
                              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-[11px] text-zinc-300 truncate">{v.prompt}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-zinc-600">{v.aspectRatio}</span>
                          <span className="text-[10px] text-zinc-600">{v.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function VideoPlayer({ video, onEdit, onDownload }: { video: GeneratedVideo; onEdit: () => void; onDownload: () => void }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  return (
    <div className="text-center space-y-4 max-w-lg w-full">
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl">
        <video
          ref={ref}
          src={video.url}
          className={cn(
            'w-full',
            video.aspectRatio === '9:16' ? 'max-h-[60vh]' : 'max-h-[50vh]'
          )}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={() => playing ? ref.current?.pause() : ref.current?.play()}
          style={{ objectFit: 'contain' }}
          loop
        />
        {!playing && (
          <button
            onClick={() => ref.current?.play()}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-zinc-200 text-sm font-medium transition-all"
        >
          <Scissors className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/25"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
      <p className="text-xs text-zinc-600 truncate max-w-xs mx-auto">{video.prompt}</p>
    </div>
  )
}
