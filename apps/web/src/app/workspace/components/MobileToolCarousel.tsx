'use client'

// Vibe-Code-style bottom tool menu: a single horizontal SCROLLING carousel of
// big, thumb-sized tool chips. Replaces the cramped fixed pill + the 12-tab
// sheet — every tool lives here, swipe to reach them, nothing crammed. Shown
// over the full-screen preview; tapping a tool opens its bottom sheet (or
// toggles, for Edit).

import { cn } from '@/lib/utils'
import {
  MessageSquarePlus, Pencil, LayoutTemplate, Image as ImageIcon,
  Clapperboard, Gauge, Rocket, FolderOpen, Mic,
} from 'lucide-react'

export interface CarouselTool {
  key: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

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
  isDark, hasContent, canShip, editMode,
  onBuild, onVoice, onEdit, onTemplates, onImages, onVideo, onGrade, onProjects, onShip,
}: Props) {
  const tools: CarouselTool[] = [
    { key: 'voice', label: 'Talk', Icon: Mic, onClick: onVoice },
    { key: 'build', label: 'Build', Icon: MessageSquarePlus, onClick: onBuild },
    { key: 'edit', label: 'Edit', Icon: Pencil, onClick: onEdit, disabled: !hasContent, active: editMode },
    { key: 'templates', label: 'Templates', Icon: LayoutTemplate, onClick: onTemplates },
    { key: 'images', label: 'Images', Icon: ImageIcon, onClick: onImages },
    { key: 'video', label: 'Video', Icon: Clapperboard, onClick: onVideo },
    { key: 'grade', label: 'Grade', Icon: Gauge, onClick: onGrade, disabled: !hasContent },
    { key: 'projects', label: 'Projects', Icon: FolderOpen, onClick: onProjects },
    { key: 'ship', label: 'Publish', Icon: Rocket, onClick: onShip, disabled: !canShip },
  ]

  return (
    <div
      className="md:hidden fixed inset-x-0 z-[55] px-3"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className={cn(
          'flex gap-2 overflow-x-auto scrollbar-hide rounded-2xl border px-2 py-2 shadow-2xl backdrop-blur-xl',
          // momentum scroll on iOS + snap so chips settle nicely
          'snap-x snap-mandatory [-webkit-overflow-scrolling:touch]',
          isDark ? 'bg-zinc-900/90 border-white/10 shadow-black/50' : 'bg-white/90 border-slate-200 shadow-slate-400/30'
        )}
      >
        {tools.map(({ key, label, Icon, onClick, disabled, active }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'snap-start shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl w-[72px] h-[60px] transition-colors',
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
