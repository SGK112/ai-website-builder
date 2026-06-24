'use client'

// Stripped-down mobile tool bar. On a phone the surface is full-screen
// preview + voice, so this is just the four essentials: Talk (the highlighted
// primary), Build, Edit, Publish. Everything else (Templates, Media, Video,
// Files, …) lives inside the Build sheet's tab strip — no need to crowd it in
// here. "Talk" is visually promoted as the primary action.

import { cn } from '@/lib/utils'
import { MessageSquarePlus, Pencil, Rocket, Mic } from 'lucide-react'

interface Props {
  isDark: boolean
  hasContent: boolean
  canShip: boolean
  editMode: boolean
  onBuild: () => void
  onVoice: () => void
  onEdit: () => void
  onShip: () => void
}

export function MobileToolCarousel({
  isDark, hasContent, canShip, editMode,
  onBuild, onVoice, onEdit, onShip,
}: Props) {
  const secondary: { key: string; label: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean; active?: boolean }[] = [
    { key: 'build', label: 'Build', Icon: MessageSquarePlus, onClick: onBuild },
    { key: 'edit', label: 'Edit', Icon: Pencil, onClick: onEdit, disabled: !hasContent, active: editMode },
    { key: 'ship', label: 'Publish', Icon: Rocket, onClick: onShip, disabled: !canShip },
  ]

  return (
    <div
      className="md:hidden fixed inset-x-0 z-[55] px-3"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className={cn(
          'flex items-stretch gap-2 rounded-2xl border px-2 py-2 shadow-2xl backdrop-blur-xl',
          isDark ? 'bg-zinc-900/90 border-white/10 shadow-black/50' : 'bg-white/90 border-slate-200 shadow-slate-400/30'
        )}
      >
        {/* Primary: Talk — the highlighted, can't-miss action */}
        <button
          onClick={onVoice}
          aria-label="Talk to build"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl h-[60px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/30 active:scale-[0.98] transition"
        >
          <Mic className="w-6 h-6" />
          <span className="text-[14px]">Talk</span>
        </button>

        {/* Secondary essentials */}
        {secondary.map(({ key, label, Icon, onClick, disabled, active }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl w-[68px] h-[60px] transition-colors',
              disabled && 'opacity-35',
              active
                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                : isDark
                  ? 'bg-white/[0.04] text-zinc-200 active:bg-white/10'
                  : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[11px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
