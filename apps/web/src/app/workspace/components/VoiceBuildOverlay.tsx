'use client'

// Full-screen voice-build mode. A big mic orb that reacts to state
// (connecting / listening / speaking), the live transcript, and an End button.
// Presentational — the realtime connection lives in useRealtimeVoice (owned by
// the page so a tool call routes into the normal build).

import { cn } from '@/lib/utils'
import { Mic, X, Loader2, AudioLines, AlertCircle, ChevronDown } from 'lucide-react'
import type { RealtimeStatus } from '../hooks/useRealtimeVoice'

interface Props {
  isDark: boolean
  status: RealtimeStatus
  error: string | null
  userText: string
  assistantText: string
  onClose: () => void
  onRetry: () => void
  onMinimize: () => void
}

export function VoiceBuildOverlay({ isDark, status, error, userText, assistantText, onClose, onRetry, onMinimize }: Props) {
  const label =
    status === 'connecting' ? 'Connecting…'
      : status === 'listening' ? 'Listening — just describe what you want'
      : status === 'speaking' ? 'Speaking…'
      : status === 'error' ? 'Voice unavailable'
      : 'Tap to talk'

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-white"
         style={{ paddingTop: 'env(safe-area-inset-top,0px)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom,0px))' }}>
      {/* Top bar — minimize keeps the session live and drops to the floating
          bubble so the workspace (the site cooking) is visible; close ends it. */}
      <div className="w-full flex justify-between p-4">
        <button onClick={onMinimize} aria-label="Minimize voice" className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10">
          <ChevronDown className="w-5 h-5" />
        </button>
        <button onClick={onClose} aria-label="Close voice" className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center: orb + state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 text-center">
        {status === 'error' ? (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500/15 border border-red-500/30">
              <AlertCircle className="w-9 h-9 text-red-400" />
            </div>
            <p className="text-sm text-zinc-300 max-w-xs leading-relaxed">{error || 'Something went wrong.'}</p>
            <button onClick={onRetry} className="px-6 py-3 rounded-xl bg-violet-600 active:bg-violet-500 font-semibold text-sm">
              Try again
            </button>
          </>
        ) : (
          <>
            {/* Orb */}
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  'absolute rounded-full bg-violet-600/30',
                  status === 'speaking' ? 'w-48 h-48 animate-ping' : status === 'listening' ? 'w-40 h-40 animate-pulse' : 'w-32 h-32',
                )}
              />
              <div
                className={cn(
                  'relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all',
                  'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-violet-500/40',
                  status === 'listening' && 'scale-105',
                  status === 'speaking' && 'scale-110',
                )}
              >
                {status === 'connecting'
                  ? <Loader2 className="w-10 h-10 animate-spin" />
                  : status === 'speaking'
                    ? <AudioLines className="w-10 h-10" />
                    : <Mic className="w-10 h-10" />}
              </div>
            </div>

            <p className="text-base font-medium text-zinc-200">{label}</p>

            {/* Live transcript */}
            <div className="min-h-[3.5rem] max-w-sm space-y-2">
              {userText && (
                <p className="text-sm text-white/90">“{userText}”</p>
              )}
              {assistantText && (
                <p className="text-sm text-violet-300/90">{assistantText}</p>
              )}
              {!userText && !assistantText && status === 'listening' && (
                <p className="text-xs text-zinc-500">Try: “Build a landing page for my coffee shop with a menu and hours.”</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom: end */}
      <button
        onClick={onClose}
        className="px-8 py-3.5 rounded-2xl bg-white/10 active:bg-white/15 font-semibold text-sm flex items-center gap-2"
      >
        <X className="w-4 h-4" /> End voice
      </button>
    </div>
  )
}
