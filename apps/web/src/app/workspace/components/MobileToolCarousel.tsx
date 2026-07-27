'use client'

// Mobile bottom tool bar. A solid, always-visible row at the bottom of the
// workspace (a real layout row, not a floating fixed element — so Safari's
// bottom chrome can't cover it). All tools live here, scrolling horizontally.
//
// The row overflows on purpose — 8 tools at 60px plus gaps is ~530px against a
// ~390px phone — but it did so with no visual cue, so the last two (Files and
// PUBLISH, the one action that makes money) sat off the right edge looking
// like they didn't exist. The edge fades below say "there's more this way",
// and each one hides when you reach that end.

import { useEffect, useRef, useState } from 'react'
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
    // Order is by value, not by workflow order, because only ~6 of these fit
    // on a phone before the row scrolls. Publish used to be LAST — the one
    // action that makes money sat off the right edge, reachable only if you
    // guessed the row scrolled. It's third now; Video and Files are the ones
    // that scroll, which is the right trade.
    { key: 'build', label: 'Build', Icon: MessageSquarePlus, onClick: onBuild },
    { key: 'edit', label: 'Edit', Icon: Pencil, onClick: onEdit, disabled: !hasContent, active: editMode },
    { key: 'ship', label: 'Publish', Icon: Rocket, onClick: onShip, disabled: !canShip },
    { key: 'images', label: 'Images', Icon: ImageIcon, onClick: onImages },
    { key: 'templates', label: 'Templates', Icon: LayoutTemplate, onClick: onTemplates },
    { key: 'grade', label: 'Grade', Icon: Gauge, onClick: onGrade, disabled: !hasContent },
    { key: 'video', label: 'Video', Icon: Clapperboard, onClick: onVideo },
    { key: 'projects', label: 'Files', Icon: FolderOpen, onClick: onProjects },
  ]

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  // Publish this bar's height as --bottom-nav-h, the same contract
  // MobileBottomNav uses. The global tab nav is deliberately NOT shown on
  // /workspace, so the var stayed 0 here and everything that offsets by it —
  // toasts, FinishedBuildBanner, SectionChat's input — anchored to the very
  // bottom of the screen and landed ON TOP of this bar. Measured rather than
  // hardcoded so it stays right if the row's padding or type size changes.
  useEffect(() => {
    const root = document.documentElement
    const publish = () => {
      const h = barRef.current?.offsetHeight
      // offsetHeight already includes the safe-area padding on the element.
      root.style.setProperty('--bottom-nav-h', h ? `${h}px` : '0px')
    }
    publish()
    const ro = new ResizeObserver(publish)
    if (barRef.current) ro.observe(barRef.current)
    return () => {
      ro.disconnect()
      root.style.setProperty('--bottom-nav-h', '0px')
    }
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => {
      // 2px slack: sub-pixel layout means scrollLeft rarely hits the exact end.
      const max = el.scrollWidth - el.clientWidth
      setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    // Tools appear/disappear with build state (Edit, Grade and Publish enable
    // once there's content), which changes the scroll width without a scroll.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div
      ref={barRef}
      className={cn(
        'md:hidden shrink-0 border-t relative',
        isDark ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-violet-500/10' : 'bg-white border-slate-200'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Edge fades — pointer-events-none so they never eat a tap on the
          tool underneath. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 transition-opacity',
          isDark ? 'bg-gradient-to-r from-zinc-900 to-transparent' : 'bg-gradient-to-r from-white to-transparent',
          edges.left ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 transition-opacity',
          isDark ? 'bg-gradient-to-l from-zinc-900 to-transparent' : 'bg-gradient-to-l from-white to-transparent',
          edges.right ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        ref={scrollerRef}
        className="flex items-stretch gap-1 overflow-x-auto scrollbar-hide px-3 py-2 [-webkit-overflow-scrolling:touch]"
      >
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
                ? 'text-white bg-violet-600'
                : primary
                  // The voice build — Webstew's marquee move. Make it the one
                  // filled, glowing chip so the eye lands on "Talk" first.
                  ? 'text-white bg-violet-600 shadow-md shadow-violet-600/30'
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
