// Voice controls for the chef (build assistant): a hold/tap mic to talk, a
// speaker toggle to hear replies, and a voice picker. Presentational — state
// lives in useVoiceChat. Renders nothing if no voice provider is configured.
'use client'

import { useState } from 'react'
import { Mic, Loader2, Volume2, VolumeX, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceOption } from '../hooks/useVoiceChat'

interface VoiceControlsProps {
  isDark: boolean
  available: boolean
  voices: VoiceOption[]
  voiceId: string
  onSelectVoice: (id: string) => void
  speakReplies: boolean
  onToggleSpeakReplies: () => void
  isListening: boolean
  isSpeaking: boolean
  busy?: boolean
  onMicToggle: () => void
}

export function VoiceControls({
  isDark,
  available,
  voices,
  voiceId,
  onSelectVoice,
  speakReplies,
  onToggleSpeakReplies,
  isListening,
  isSpeaking,
  busy,
  onMicToggle,
}: VoiceControlsProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  if (!available) return null

  const currentVoice = voices.find((v) => v.id === voiceId)

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Mic — tap to start talking, tap again to send the transcript */}
      <button
        type="button"
        onClick={onMicToggle}
        disabled={busy}
        title={isListening ? 'Stop and send' : 'Talk to the chef'}
        aria-label={isListening ? 'Stop recording and send' : 'Start voice input'}
        aria-pressed={isListening}
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all disabled:opacity-40',
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : isDark
              ? 'text-zinc-500 hover:text-violet-300 hover:bg-white/5'
              : 'text-slate-400 hover:text-violet-600 hover:bg-slate-200',
        )}
      >
        <Mic className="w-3.5 h-3.5" />
      </button>

      {/* Speak-replies toggle */}
      <button
        type="button"
        onClick={onToggleSpeakReplies}
        title={speakReplies ? 'Chef voice on — replies are spoken' : 'Chef voice off'}
        aria-label="Toggle spoken replies"
        aria-pressed={speakReplies}
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all',
          speakReplies
            ? isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
            : isDark ? 'text-zinc-500 hover:text-violet-300 hover:bg-white/5' : 'text-slate-400 hover:text-violet-600 hover:bg-slate-200',
        )}
      >
        {isSpeaking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : speakReplies ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      </button>

      {/* Voice picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          title="Choose the chef's voice"
          className={cn(
            'flex items-center gap-1 px-1.5 h-7 rounded-md text-[10px] font-medium transition-all max-w-[120px]',
            isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-600',
          )}
        >
          <span className="truncate">{currentVoice ? currentVoice.label.split(' — ')[0] : 'Voice'}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div
              className={cn(
                'absolute bottom-full right-0 mb-1 z-50 w-52 max-h-64 overflow-y-auto rounded-lg border shadow-xl py-1',
                isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200',
              )}
            >
              {voices.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { onSelectVoice(v.id); setPickerOpen(false) }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-2',
                    v.id === voiceId
                      ? isDark ? 'bg-violet-500/20 text-violet-200' : 'bg-violet-100 text-violet-800'
                      : isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  <span className="truncate">{v.label}</span>
                  <span className={cn('text-[9px] uppercase shrink-0', isDark ? 'text-zinc-600' : 'text-slate-400')}>{v.provider}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
