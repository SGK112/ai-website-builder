'use client'

// Full-screen overlay for voice-generated video. Shows a cooking spinner while
// Grok renders (~30s), then the looping clip with download/share, or a clean
// error with retry. Driven entirely by useVoiceVideo state — thin presentation.

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Loader2, AlertCircle, RefreshCw, Clapperboard, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VideoStatus } from '../hooks/useVoiceVideo'

interface Props {
  isDark: boolean
  status: VideoStatus
  videoUrl: string | null
  error: string | null
  prompt: string
  saved: boolean
  minimized: boolean
  onClose: () => void
  onRetry: () => void
}

export function VideoResultOverlay({ isDark, status, videoUrl, error, prompt, saved, minimized, onClose, onRetry }: Props) {
  const open = status !== 'idle' && !minimized
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-5 backdrop-blur-xl"
          style={{ background: isDark ? 'rgba(9,9,14,0.82)' : 'rgba(15,12,30,0.7)' }}
        >
          <button
            onClick={onClose}
            aria-label="Close video"
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {status === 'generating' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center max-w-sm">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-xl opacity-60 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl">
                  <Clapperboard className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white text-lg font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" /> Cooking up your video…
              </div>
              <p className="mt-2 text-sm text-white/60 line-clamp-2">“{prompt}”</p>
              <p className="mt-4 text-xs text-white/40">Usually ready in about 30 seconds.</p>
            </motion.div>
          )}

          {status === 'ready' && videoUrl && (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full max-w-md">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl shadow-2xl border border-white/10 bg-black"
              />
              <p className="mt-3 text-sm text-white/60 text-center line-clamp-2">“{prompt}”</p>
              <p className={cn('mt-1.5 flex items-center gap-1.5 text-xs', saved ? 'text-emerald-400' : 'text-white/40')}>
                {saved ? <><Check className="w-3.5 h-3.5" /> Saved to your videos</> : <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={videoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 active:scale-95 transition"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
                >
                  <RefreshCw className="w-4 h-4" /> Make another
                </button>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-5">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-semibold">Couldn’t make the video</p>
              <p className="mt-2 text-sm text-white/60">{error || 'Something went wrong.'}</p>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold shadow-lg active:scale-95 transition">
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Floating re-open chip — shown when the video overlay is minimized, so a clip
// is never lost on tap-away. Reflects generating vs ready.
export function VideoMiniChip({ status, minimized, onReopen }: { status: VideoStatus; minimized: boolean; onReopen: () => void }) {
  if (!minimized || (status !== 'generating' && status !== 'ready')) return null
  const generating = status === 'generating'
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={onReopen}
      className="fixed z-[110] bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-xl shadow-violet-500/30 active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clapperboard className="w-3.5 h-3.5" />}
      </span>
      {generating ? 'Making video…' : 'Watch video'}
    </motion.button>
  )
}
