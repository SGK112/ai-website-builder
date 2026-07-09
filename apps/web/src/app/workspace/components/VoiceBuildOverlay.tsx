'use client'

// Full-screen voice-build mode. A mic orb that reacts to state (connecting /
// listening / speaking) sits above the live CONVERSATION THREAD — the builder
// consults with you (asks a couple of questions), then builds. Presentational —
// the realtime connection lives in useRealtimeVoice (owned by the page so a tool
// call routes into the normal build).

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mic, X, Loader2, AudioLines, AlertCircle, ChevronDown } from 'lucide-react'
import type { RealtimeStatus, VoiceTurn } from '../hooks/useRealtimeVoice'

interface Props {
  isDark: boolean
  status: RealtimeStatus
  error: string | null
  transcript: VoiceTurn[]
  onClose: () => void
  onRetry: () => void
  onMinimize: () => void
}

export function VoiceBuildOverlay({ status, error, transcript, onClose, onRetry, onMinimize }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript.length, status])

  const label =
    status === 'connecting' ? 'Connecting…'
      : status === 'listening' ? 'Listening…'
      : status === 'speaking' ? 'Speaking…'
      : 'Tap to talk'

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-white"
      style={{ paddingTop: 'env(safe-area-inset-top,0px)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom,0px))' }}
    >
      {/* Top bar — minimize keeps the session live and drops to the floating
          bubble so the workspace (the site cooking) is visible; close ends it. */}
      <div className="w-full flex shrink-0 justify-between p-4">
        <button onClick={onMinimize} aria-label="Minimize voice" className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10">
          <ChevronDown className="w-5 h-5" />
        </button>
        <button onClick={onClose} aria-label="Close voice" className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      {status === 'error' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500/15 border border-red-500/30">
            <AlertCircle className="w-9 h-9 text-red-400" />
          </div>
          <p className="text-sm text-zinc-300 max-w-xs leading-relaxed">{error || 'Something went wrong.'}</p>
          <button onClick={onRetry} className="px-6 py-3 rounded-xl bg-violet-600 active:bg-violet-500 font-semibold text-sm">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Compact orb + status (leaves room for the thread) */}
          <div className="shrink-0 flex flex-col items-center gap-2.5 pb-1">
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  'absolute rounded-full bg-violet-600/30',
                  status === 'speaking' ? 'w-28 h-28 animate-ping' : status === 'listening' ? 'w-24 h-24 animate-pulse' : 'w-20 h-20',
                )}
              />
              <div
                className={cn(
                  'relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all bg-violet-500 shadow-violet-500/40',
                  status === 'speaking' && 'scale-110',
                )}
              >
                {status === 'connecting' ? <Loader2 className="w-7 h-7 animate-spin" /> : status === 'speaking' ? <AudioLines className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400">{label}</p>
          </div>

          {/* Conversation thread — the consultation, turn by turn */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-2.5">
            {transcript.length === 0 && status !== 'connecting' && (
              <p className="mx-auto mt-8 max-w-xs text-center text-xs leading-relaxed text-zinc-500">
                Tell me what you want to build — I’ll ask a couple of quick questions, then make it.
              </p>
            )}
            {transcript.map((t) => (
              <div key={t.id} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-lg',
                    t.role === 'user'
                      ? 'bg-violet-500 text-white rounded-br-md shadow-violet-500/25'
                      : 'bg-white/10 text-zinc-100 rounded-bl-md border border-white/10',
                  )}
                >
                  {t.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </>
      )}

      {/* Bottom: end */}
      <button
        onClick={onClose}
        className="shrink-0 mx-auto mt-2 px-8 py-3.5 rounded-2xl bg-white/10 active:bg-white/15 font-semibold text-sm flex items-center gap-2"
      >
        <X className="w-4 h-4" /> End voice
      </button>
    </div>
  )
}
