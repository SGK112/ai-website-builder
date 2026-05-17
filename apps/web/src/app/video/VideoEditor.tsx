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
  { id: 'seedance', label: 'Seedance', speed: 'Fast', quality: 'Best', badge: '🔥 Hot' },
  { id: 'wan', label: 'Wan 2.1', speed: 'Medium', quality: 'Great', badge: 'Open' },
  { id: 'animatediff', label: 'AnimateDiff', speed: 'Fast', quality: 'Good', badge: '' },
  { id: 'zeroscope', label: 'Zeroscope XL', speed: 'Fast', quality: 'Good', badge: '' },
  { id: 'svd', label: 'Stable Video', speed: 'Medium', quality: 'Great', badge: 'Img→Vid' },
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
  const [model, setModel] = useState('minimax')
  const [style, setStyle] = useState('')
  const [duration, setDuration] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState<GeneratedVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
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
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [captionText, setCaptionText] = useState('')
  const [captionLoading, setCaptionLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const isDark = true // video editor is always dark

  const generate = async () => {
    if (generateMode === 'text' && !prompt.trim()) return
    if (generateMode === 'image' && !uploadedImage) return
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
      if (generateMode === 'image' && uploadedImage) body.imageUrl = uploadedImage

      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start generation')

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
        const pollData = await poll.json()

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
    reader.readAsDataURL(file)
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
      setCaptionText(data.transcript || '')
    } catch {
      setCaptionText('Could not auto-generate captions. Enter them manually.')
    } finally {
      setCaptionLoading(false)
    }
  }

  const downloadVideo = async (video: GeneratedVideo) => {
    const a = document.createElement('a')
    a.href = video.url
    a.download = `webstew-video-${video.id}.mp4`
    a.click()
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
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Source Image</label>
                  {uploadedImage ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-900">
                      <img src={uploadedImage} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-white/[0.1] hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all flex flex-col items-center justify-center gap-2 text-zinc-500"
                    >
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Click to upload image</span>
                      <span className="text-[10px] text-zinc-600">JPG, PNG, WebP</span>
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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
                disabled={generating || (!prompt.trim() && generateMode === 'text') || (!uploadedImage && generateMode === 'image')}
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

                {[
                  { id: 'trim', icon: Scissors, label: 'Trim & Cut', sub: 'Set in/out points' },
                  { id: 'captions', icon: Captions, label: 'AI Captions', sub: 'Auto-generate subtitles' },
                  { id: 'text', icon: Type, label: 'Text Overlay', sub: 'Add titles & text' },
                  { id: 'music', icon: Music, label: 'Background Music', sub: 'Add audio track' },
                  { id: 'export', icon: Download, label: 'Export', sub: 'Download for social' },
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
                        className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors"
                      >
                        {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                      </button>
                      <button onClick={() => setMuted(m => !m)} className="text-zinc-500 hover:text-white transition-colors">
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
                  {[
                    { label: 'YouTube (1080p)', icon: Youtube, format: 'mp4', ratio: '16:9' },
                    { label: 'Instagram Reels', icon: Instagram, format: 'mp4', ratio: '9:16' },
                    { label: 'TikTok', icon: Video, format: 'mp4', ratio: '9:16' },
                    { label: 'Twitter/X', icon: Share2, format: 'mp4', ratio: '16:9' },
                    { label: 'Original Quality', icon: Download, format: 'mp4', ratio: editingVideo.aspectRatio },
                  ].map(({ label, icon: Icon, format, ratio }) => (
                    <button
                      key={label}
                      onClick={() => downloadVideo(editingVideo)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-all text-left"
                    >
                      <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="text-xs text-zinc-200 font-medium">{label}</p>
                        <p className="text-[10px] text-zinc-600">{ratio} · {format.toUpperCase()}</p>
                      </div>
                      <Download className="w-3 h-3 text-zinc-600 ml-auto" />
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider font-semibold">Insert</p>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Add to Website
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium transition-colors mt-2">
                    <Copy className="w-3.5 h-3.5" />
                    Copy video URL
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
