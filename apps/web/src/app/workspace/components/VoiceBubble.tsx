'use client'

// Minimized voice mode. Once the conversation is live we collapse the
// full-screen orb into this small floating pill so the user watches their site
// build ("cook") while still talking. The realtime session stays connected —
// this is purely the compact UI for it. Tap the orb to expand back to the
// full overlay; tap × to end the session.

import { cn } from '@/lib/utils'
import { Mic, AudioLines, Loader2, X } from 'lucide-react'
import type { RealtimeStatus } from '../hooks/useRealtimeVoice'

interface Props {
  isDark: boolean
  status: RealtimeStatus
  userText: string
  assistantText: string
  onExpand: () => void
  onEnd: () => void
}

export function VoiceBubble({ isDark, status, userText, assistantText, onExpand, onEnd }: Props) {
  const caption =
    status === 'connecting' ? 'Connecting…'
      : status === 'speaking' ? (assistantText || 'Speaking…')
      : status === 'listening' ? (userText || 'Listening — keep talking')
      : 'Voice active'

  return (
    <div
      className="fixed right-3 z-[60] md:right-5"
      // Sit above the mobile tool bar (≈70px) + the safe-area inset.
      style={{ bottom: 'calc(82px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-2 shadow-2xl backdrop-blur-xl max-w-[78vw]',
          isDark ? 'bg-zinc-900/95 border-white/10 shadow-black/50' : 'bg-white/95 border-slate-200 shadow-slate-400/30'
        )}
      >
        {/* Orb — tap to expand back to the full voice screen */}
        <button
          onClick={onExpand}
          aria-label="Expand voice"
          className="relative shrink-0 flex items-center justify-center"
        >
          <span
            className={cn(
              'absolute rounded-full bg-violet-600/30',
              status === 'speaking' ? 'w-11 h-11 animate-ping' : status === 'listening' ? 'w-10 h-10 animate-pulse' : 'w-9 h-9',
            )}
          />
          <span className="relative w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
            {status === 'connecting'
              ? <Loader2 className="w-[18px] h-[18px] animate-spin" />
              : status === 'speaking'
                ? <AudioLines className="w-[18px] h-[18px]" />
                : <Mic className="w-[18px] h-[18px]" />}
          </span>
        </button>

        {/* Live caption — truncated so the pill stays small */}
        <button
          onClick={onExpand}
          className={cn('min-w-0 text-left text-[12px] font-medium truncate', isDark ? 'text-zinc-200' : 'text-slate-700')}
        >
          {caption}
        </button>

        {/* End */}
        <button
          onClick={onEnd}
          aria-label="End voice"
          className={cn(
            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            isDark ? 'bg-white/[0.06] text-zinc-300 active:bg-white/15' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
