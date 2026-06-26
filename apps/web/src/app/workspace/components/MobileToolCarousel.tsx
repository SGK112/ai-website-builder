'use client'

// Mobile bottom tool bar. A solid, always-visible row at the bottom of the
// workspace (a real layout row, not a floating fixed element — so Safari's
// bottom chrome can't cover it). All tools live here, scrolling horizontally.

import { cn } from '@/lib/utils'
import {
  MessageSquarePlus, Pencil, LayoutTemplate, Image as ImageIcon,
  Clapperboard, Gauge, Rocket, FolderOpen,
} from 'lucide-react'

interface Props {
  isDark: boolean
  hasContent: boolean
  canShip: boolean
  editMode: boolean
  onBuild: () => void
  onEdit: () => void
  onTemplates: () => void
  onImages: () => void
  onVideo: () => void
  onGrade: () => void
  onProjects: () => void
  onShip: () => void
}

export function MobileToolCarousel({
  isDark, hasContent, canShip, editMode,
  onBuild, onEdit, onTemplates, onImages, onVideo, onGrade, onProjects, onShip,
}: Props) {
  const tools: { key: string; label: string; Icon: React.ComponentType<{ className?: string }>; onClick: () => void; disabled?: boolean; active?: boolean; primary?: boolean; pulse?: boolean }[] = [
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
    <div
      className={cn(
        'md:hidden shrink-0 border-t',
        isDark ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-violet-500/10' : 'bg-white border-slate-200'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch gap-1 overflow-x-auto scrollbar-hide px-3 py-2 [-webkit-overflow-scrolling:touch]">
        {tools.map(({ key, label, Icon, onClick, disabled, active, primary, pulse }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active || pulse}
            className={cn(
              'shrink-0 flex flex-col items-center justify-center gap-1 w-[60px] py-1.5 rounded-xl transition-colors',
              disabled && 'opacity-35',
              pulse && 'animate-pulse',
              active
                ? 'text-white bg-gradient-to-br from-violet-600 to-fuchsia-600'
                : primary
                  // The voice build — Webstew's marquee move. Make it the one
                  // filled, glowing chip so the eye lands on "Talk" first.
                  ? 'text-white bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md shadow-violet-600/30'
                  : isDark ? 'text-zinc-300 active:bg-white/5' : 'text-slate-600 active:bg-slate-100',
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
