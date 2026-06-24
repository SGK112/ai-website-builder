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
      {/* Transparent bar — no enclosing panel, so the chips appear to float
          over the preview. Each chip carries its own translucent blurred
          backdrop + shadow to stay legible against any content underneath. */}
      <div className="flex items-stretch justify-center gap-2">
        {/* Primary: Talk — same chip size as the others so it sits in
            proportion, but keeps the violet gradient so it stays the obvious
            highlighted action. */}
        <button
          onClick={onVoice}
          aria-label="Talk to build"
          className="shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl w-[72px] h-[60px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-600/40 active:scale-[0.98] transition"
        >
          <Mic className="w-6 h-6" />
          <span className="text-[11px] font-medium leading-none">Talk</span>
        </button>

        {/* Secondary essentials — each a floating blurred pill */}
        {secondary.map(({ key, label, Icon, onClick, disabled, active }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl w-[68px] h-[60px] backdrop-blur-md border transition-colors',
              disabled && 'opacity-35',
              active
                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-transparent shadow-xl shadow-violet-600/40'
                : isDark
                  ? 'bg-zinc-900/70 border-white/10 text-zinc-200 shadow-lg shadow-black/40 active:bg-zinc-800/80'
                  : 'bg-white/70 border-slate-200/80 text-slate-700 shadow-lg shadow-slate-400/30 active:bg-white/90'
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
