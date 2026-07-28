'use client'

// Full-screen overlay for a voice-generated logo/image. Cooking spinner →
// the image with download / make-another, or a clean error + retry. Closing
// minimizes to a chip (auto-saved to the user's creations). Parallels
// VideoResultOverlay.

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Loader2, AlertCircle, RefreshCw, Check, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageStatus } from '../hooks/useVoiceImage'

interface Props {
  isDark: boolean
  status: ImageStatus
  imageUrl: string | null
  error: string | null
  prompt: string
  saved: boolean
  minimized: boolean
  onClose: () => void
  onRetry: () => void
}

export function ImageResultOverlay({ isDark, status, imageUrl, error, prompt, saved, minimized, onClose, onRetry }: Props) {
  const open = status !== 'idle' && !minimized
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-5 backdrop-blur-xl"
          style={{ background: isDark ? 'rgba(9,9,14,0.82)' : 'rgba(15,12,30,0.7)' }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {status === 'generating' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center max-w-sm">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-2xl bg-violet-500 blur-xl opacity-60 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl bg-violet-500 flex items-center justify-center shadow-2xl">
                  <ImageIcon className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white text-lg font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" /> Designing your image…
              </div>
              <p className="mt-2 text-sm text-white/60 line-clamp-2">“{prompt}”</p>
            </motion.div>
          )}

          {status === 'ready' && imageUrl && (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full max-w-md">
              {/* checkerboard so transparent PNG logos read clearly */}
              <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={prompt} className="w-full h-auto max-h-[60vh] object-contain mx-auto" />
              </div>
              <p className="mt-3 text-sm text-white/60 text-center line-clamp-2">“{prompt}”</p>
              <p className={cn('mt-1.5 flex items-center gap-1.5 text-xs', saved ? 'text-emerald-400' : 'text-white/40')}>
                {saved ? <><Check className="w-3.5 h-3.5" /> Saved to your creations</> : <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a href={imageUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 active:scale-95 transition">
                  <Download className="w-4 h-4" /> Download
                </a>
                <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">
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
              <p className="text-white font-semibold">Couldn’t create the image</p>
              <p className="mt-2 text-sm text-white/60">{error || 'Something went wrong.'}</p>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold shadow-lg active:scale-95 transition">
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">Close</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Minimised image chip. Three things were wrong with it on a phone:
//   • bottom-40 (160px) parked it in the middle of the canvas — the exact lane
//     the chat bubbles occupy, so once a build finished and the rail re-showed
//     they overlapped and fought.
//   • No way to get rid of it. minimize() only hides the big overlay; the chip
//     then sits at 'ready' indefinitely on top of the user's site.
//   • It stayed up in focus mode, which is meant to be a clean preview.
// Now: docked top-right under the notch (free space — the header's own buttons
// are hidden in focus mode), with an explicit dismiss.
export function ImageMiniChip({
  status, minimized, onReopen, onDismiss, hidden,
}: {
  status: ImageStatus
  minimized: boolean
  onReopen: () => void
  onDismiss: () => void
  /** Focus mode = pure preview; nothing of ours floats over the site. */
  hidden?: boolean
}) {
  if (hidden || !minimized || (status !== 'generating' && status !== 'ready')) return null
  const generating = status === 'generating'
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="fixed z-[110] right-3 md:right-4 flex items-center rounded-full bg-violet-600 text-white text-sm font-semibold shadow-xl shadow-violet-500/30"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 60px)' }}
    >
      <button onClick={onReopen} className="flex items-center gap-2 pl-2.5 pr-3 py-2 active:scale-95 transition">
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
        </span>
        {generating ? 'Designing…' : 'View image'}
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss image"
        className="pl-1 pr-3 py-2 self-stretch flex items-center text-white/70 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
