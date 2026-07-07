'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Film,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  Plus,
  Download,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import VideoDirectorChat from '@/app/video/VideoDirectorChat'

type VideoModel = 'animate-diff' | 'zeroscope' | 'svd'

const MODEL_LABELS: Record<VideoModel, string> = {
  'animate-diff': 'AnimateDiff',
  zeroscope: 'Zeroscope',
  svd: 'Stable Video Diffusion',
}

interface VideoPanelProps {
  isDark: boolean
  hasHtml: boolean
  // Source image (image-to-video)
  videoSourceImage: string | null
  videoSourceUploading: boolean
  onUploadSource: (file: File) => void
  onClearSource: () => void
  // Prompt + model
  videoPrompt: string
  onVideoPromptChange: (value: string) => void
  videoModel: VideoModel
  onVideoModelChange: (model: VideoModel) => void
  // Generation
  videoGenerating: boolean
  onGenerate: () => void
  videoStatus: string
  videoError: string
  generatedVideoUrl: string | null
  onInsert: () => void
  onCopyUrl: (url: string) => void
  // Open the full Video Studio in-place (overlay inside the workspace) instead
  // of navigating away to /video in a new tab.
  onOpenStudio?: () => void
}

export function VideoPanel({
  isDark,
  hasHtml,
  videoSourceImage,
  videoSourceUploading,
  onUploadSource,
  onClearSource,
  videoPrompt,
  onVideoPromptChange,
  videoModel,
  onVideoModelChange,
  videoGenerating,
  onGenerate,
  videoStatus,
  videoError,
  generatedVideoUrl,
  onInsert,
  onCopyUrl,
  onOpenStudio,
}: VideoPanelProps) {
  const [videoLoadError, setVideoLoadError] = useState(false)
  const [directorOpen, setDirectorOpen] = useState(false)
  const effectiveModel: VideoModel = videoSourceImage ? 'svd' : videoModel
  return (
    <motion.div
      key="video"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-3 space-y-4"
    >
      <button
        type="button"
        onClick={onOpenStudio}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-colors',
          isDark
            ? 'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
            : 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
        )}
      >
        <span className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5" />
          Open full Video Studio — Create, Edit, Export
        </span>
        <Sparkles className="w-3 h-3 opacity-60" />
      </button>

      <div className="flex items-center gap-2 text-xs text-purple-400">
        <Film className="w-4 h-4" />
        <span className="font-medium">Quick Generate</span>
      </div>

      {/* Image-to-Video: upload an image and animate it (Stable Video Diffusion) */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <label className={cn('block text-sm mb-3 font-medium flex items-center gap-2', isDark ? 'text-blue-300' : 'text-blue-700')}>
          <ImageIcon className="w-4 h-4" />
          Image to Video — bring a still photo to life
        </label>
        {videoSourceImage ? (
          <div className="mb-3 relative">
            <img src={videoSourceImage} alt="Source" className="w-full rounded-lg border border-blue-500/30" />
            <button
              onClick={onClearSource}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="block mb-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={videoSourceUploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUploadSource(file)
              }}
            />
            <div className="flex flex-col items-center justify-center w-full p-6 rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 cursor-pointer transition">
              {videoSourceUploading ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-blue-400/60 mb-2" />
                  <span className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-slate-600')}>Click to upload image</span>
                  <span className={cn('text-[10px] mt-1', isDark ? 'text-zinc-600' : 'text-slate-400')}>JPG, PNG, WebP</span>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {/* Text to Video — only enabled when no source image is set */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <label className={cn('block text-sm mb-3 font-medium', isDark ? 'text-purple-300' : 'text-purple-700')}>
          {videoSourceImage ? 'Optional motion prompt' : 'Text to Video'}
        </label>
        <textarea
          value={videoPrompt}
          onChange={(e) => onVideoPromptChange(e.target.value)}
          placeholder={videoSourceImage
            ? "Optional: describe the motion (e.g. 'gentle camera pan, leaves rustling')"
            : "Describe your video... e.g., 'ocean waves crashing on a beach at sunset'"}
          rows={3}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-purple-500/50 resize-none mb-3',
            isDark
              ? 'bg-black/40 border-white/10 text-white placeholder:text-zinc-500'
              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
          )}
        />

        <button
          onClick={() => setDirectorOpen(true)}
          className="mb-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/40 bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 hover:from-violet-600/25 hover:to-fuchsia-600/25 text-violet-200 text-xs font-medium py-2 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Director — help me craft this prompt
        </button>

        <div className="mb-3">
          <label className={cn('block text-xs mb-1.5', isDark ? 'text-zinc-400' : 'text-slate-600')}>Model</label>
          <select
            value={videoSourceImage ? 'svd' : videoModel}
            onChange={(e) => onVideoModelChange(e.target.value as VideoModel)}
            disabled={!!videoSourceImage}
            className={cn(
              'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-60',
              isDark
                ? 'bg-black/40 border-white/10 text-white'
                : 'bg-white border-slate-300 text-slate-900',
            )}
          >
            {videoSourceImage ? (
              <option value="svd">Stable Video Diffusion (image → 4s clip)</option>
            ) : (
              <>
                <option value="animate-diff">AnimateDiff (Fast, ~60s)</option>
                <option value="zeroscope">Zeroscope (Higher quality)</option>
              </>
            )}
          </select>
        </div>

        <button
          onClick={onGenerate}
          disabled={videoGenerating || (!videoSourceImage && !videoPrompt.trim())}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          {videoGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {videoSourceImage ? 'Animate Image' : 'Generate Video'}
            </>
          )}
        </button>

        {/* Status Message */}
        {videoGenerating && videoStatus && (
          <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              {videoStatus}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              AI is creating your video. Please wait...
            </div>
          </div>
        )}

        {/* Error Message */}
        {videoError && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-sm text-red-400">
              ✕ {videoError}
            </div>
          </div>
        )}
      </div>

      {/* Generated Video Preview */}
      {generatedVideoUrl && (
        <div className={cn('p-4 rounded-xl border', isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200')}>
          <label className={cn('block text-xs mb-2', isDark ? 'text-zinc-400' : 'text-slate-600')}>Generated Video</label>
          {videoLoadError ? (
            <div className="w-full rounded-lg mb-3 p-4 text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20">
              Couldn&apos;t load video
            </div>
          ) : (
            <video
              src={generatedVideoUrl}
              controls
              autoPlay
              loop
              muted
              onError={() => setVideoLoadError(true)}
              className="w-full rounded-lg mb-3"
            />
          )}

          {/* Insert into Website Button */}
          <button
            onClick={onInsert}
            disabled={!hasHtml}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition mb-2"
          >
            <Plus className="w-4 h-4" />
            Insert into Website
          </button>

          <div className="flex gap-2">
            <a
              href={generatedVideoUrl}
              download="ai-video.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={() => onCopyUrl(generatedVideoUrl)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition',
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
              )}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy URL
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className={cn('p-3 rounded-lg border', isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-100 border-slate-200')}>
        <div className={cn('text-xs space-y-1', isDark ? 'text-zinc-400' : 'text-slate-600')}>
          <p className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Powered by Replicate AI
          </p>
          <p className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Generation takes ~60 seconds
          </p>
          <p className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Output: MP4 video clip
          </p>
        </div>
      </div>

      <VideoDirectorChat
        open={directorOpen}
        initialPrompt={videoPrompt}
        context={{
          mode: videoSourceImage ? 'image' : 'text',
          model: effectiveModel,
          modelLabel: MODEL_LABELS[effectiveModel],
          imageCount: videoSourceImage ? 1 : 0,
        }}
        onApply={(p) => onVideoPromptChange(p)}
        onClose={() => setDirectorOpen(false)}
      />
    </motion.div>
  )
}
