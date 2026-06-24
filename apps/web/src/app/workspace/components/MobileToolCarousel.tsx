'use client'

// Mobile tool bar — Vibecode-style: small, uniform icon+label tools that float
// over the preview, no chunky chips or enclosing panel. The full tool set lives
// here in a horizontally scrollable row; a soft bottom scrim keeps the icons
// legible over any preview content without looking like a bar. Talk is the
// accented primary.

import { cn } from '@/lib/utils'
import {
  MessageSquarePlus, Pencil, LayoutTemplate, Image as ImageIcon,
  Clapperboard, Gauge, Rocket, FolderOpen, Mic,
} from 'lucide-react'

interface Props {
  isDark: boolean
  hasContent: boolean
  canShip: boolean
  editMode: boolean
  onBuild: () => void
  onVoice: () => void
  onEdit: () => void
  onTemplates: () => void
  onImages: () => void
  onVideo: () => void
  onGrade: () => void
  onProjects: () => void
  onShip: () => void
}

export function MobileToolCarousel({
  hasContent, canShip, editMode,
  onBuild, onVoice, onEdit, onTemplates, onImages, onVideo, onGrade, onProjects, onShip,
}: Props) {
  const tools: { key: string; label: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean; active?: boolean; primary?: boolean }[] = [
    { key: 'voice', label: 'Talk', Icon: Mic, onClick: onVoice, primary: true },
    { key: 'build', label: 'Build', Icon: MessageSquarePlus, onClick: onBuild },
    { key: 'edit', label: 'Edit', Icon: Pencil, onClick: onEdit, disabled: !hasContent, active: editMode },
    { key: 'templates', label: 'Templates', Icon: LayoutTemplate, onClick: onTemplates },
    { key: 'images', label: 'Images', Icon: ImageIcon, onClick: onImages },
    { key: 'video', label: 'Video', Icon: Clapperboard, onClick: onVideo },
    { key: 'grade', label: 'Grade', Icon: Gauge, onClick: onGrade, disabled: !hasContent },
    { key: 'projects', label: 'Files', Icon: FolderOpen, onClick: onProjects },
    { key: 'ship', label: 'Publish', Icon: Rocket, onClick: onShip, disabled: !canShip },
  ]

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-[55] pointer-events-none">
      {/* Soft scrim so the floating icons read over light/busy previews. */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-auto relative flex items-end gap-1 overflow-x-auto scrollbar-hide px-4 [-webkit-overflow-scrolling:touch]"
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
              'shrink-0 flex flex-col items-center justify-center gap-1 w-[58px] transition-opacity active:opacity-60',
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
