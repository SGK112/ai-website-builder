'use client'

// App-style floating toolbar for the mobile workspace. Replaces the stacked
// mobile chrome (top header tools + step bar + global tab nav) with ONE
// condensed pill that floats above the home indicator. Shown only when the
// side drawer is closed (i.e. the user is looking at the full-screen preview);
// opening a panel swaps to the drawer, which has its own controls.

import { cn } from '@/lib/utils'
import { MessageSquarePlus, Pencil, LayoutGrid, Rocket } from 'lucide-react'

interface MobileWorkspaceBarProps {
  isDark: boolean
  hasContent: boolean
  canShip: boolean
  editMode: boolean
  onChat: () => void
  onToggleEdit: () => void
  onTools: () => void
  onShip: () => void
}

export function MobileWorkspaceBar({
  isDark,
  hasContent,
  canShip,
  editMode,
  onChat,
  onToggleEdit,
  onTools,
  onShip,
}: MobileWorkspaceBarProps) {
  const items = [
    { key: 'chat', label: 'Build', Icon: MessageSquarePlus, onClick: onChat, disabled: false, active: false },
    { key: 'edit', label: 'Edit', Icon: Pencil, onClick: onToggleEdit, disabled: !hasContent, active: editMode },
    { key: 'tools', label: 'Tools', Icon: LayoutGrid, onClick: onTools, disabled: false, active: false },
    { key: 'ship', label: 'Ship', Icon: Rocket, onClick: onShip, disabled: !canShip, active: false },
  ]

  return (
    <div
      className="md:hidden fixed left-1/2 -translate-x-1/2 z-[55] pointer-events-none"
      style={{ bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-0.5 rounded-2xl border px-1.5 py-1.5 shadow-2xl backdrop-blur-xl',
          isDark
            ? 'bg-zinc-900/90 border-white/10 shadow-black/50'
            : 'bg-white/90 border-slate-200 shadow-slate-400/30'
        )}
      >
        {items.map(({ key, label, Icon, onClick, disabled, active }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-xl w-[60px] h-[52px] transition-colors',
              disabled && 'opacity-35',
              active
                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                : isDark
                  ? 'text-zinc-300 active:bg-white/10'
                  : 'text-slate-700 active:bg-slate-100'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
