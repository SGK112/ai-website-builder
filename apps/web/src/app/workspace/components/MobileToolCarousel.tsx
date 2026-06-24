'use client'

// Mobile tool bar — Vibecode-style: small, uniform icon+label tools that float
// over the preview, evenly spaced, no chunky chips or enclosing panel. Four
// essentials: Talk, Build, Edit, Publish. Everything else lives in the Build
// sheet's tab strip. A soft bottom scrim keeps the icons legible over any
// preview content without looking like a bar.

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
  hasContent, canShip, editMode,
  onBuild, onVoice, onEdit, onShip,
}: Props) {
  const tools: { key: string; label: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean; active?: boolean; primary?: boolean }[] = [
    { key: 'voice', label: 'Talk', Icon: Mic, onClick: onVoice, primary: true },
    { key: 'build', label: 'Build', Icon: MessageSquarePlus, onClick: onBuild },
    { key: 'edit', label: 'Edit', Icon: Pencil, onClick: onEdit, disabled: !hasContent, active: editMode },
    { key: 'ship', label: 'Publish', Icon: Rocket, onClick: onShip, disabled: !canShip },
  ]

  return (
    <div
      className="md:hidden fixed inset-x-0 z-[55] pointer-events-none"
      style={{ bottom: 0 }}
    >
      {/* Soft scrim so the floating icons read over light/busy previews. */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-auto relative flex items-end justify-around gap-1 px-6"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', paddingTop: '8px' }}
      >
        {tools.map(({ key, label, Icon, onClick, disabled, active, primary }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-[56px] transition-opacity active:opacity-60',
              'drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]',
              disabled && 'opacity-35',
              active || primary ? 'text-violet-400' : 'text-white',
            )}
          >
            <Icon className="w-[22px] h-[22px]" />
            <span className="text-[11px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
