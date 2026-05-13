'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stylePresets, StylePreset } from '@/lib/builder/style-presets'

interface StylePresetPickerProps {
  selected: string
  onChange: (preset: StylePreset) => void
  compact?: boolean
}

// useLayoutEffect during SSR throws a noisy warning; alias to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function StylePresetPicker({ selected, onChange, compact = false }: StylePresetPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null)
  const currentPreset = stylePresets.find(p => p.id === selected) || stylePresets[0]

  // Compute panel position relative to the button. We render via a portal
  // because an ancestor with overflow-x-auto on the toolbar otherwise clips
  // the dropdown vertically (CSS spec: overflow-x:auto forces overflow-y:auto).
  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return
    const update = () => {
      const r = buttonRef.current!.getBoundingClientRect()
      setPanelPos({ top: r.bottom + 8, left: r.left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true) // capture phase catches scroll on ancestors
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen])

  // Close on click outside — the panel is portaled, so we have to check it
  // explicitly in addition to the button wrapper.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node
      if (dropdownRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 whitespace-nowrap",
            "bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-violet-400",
            "dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:border-white/[0.05] dark:hover:border-violet-500/30",
            isOpen && "bg-slate-200 border-violet-400 shadow-sm dark:bg-white/[0.08] dark:border-violet-500/30 dark:shadow-lg dark:shadow-violet-500/10"
          )}
        >
          <div
            className="w-4 h-4 rounded-md ring-1 ring-slate-300 dark:ring-white/20"
            style={{ background: currentPreset.preview }}
          />
          <span className="text-slate-700 dark:text-zinc-300 hidden sm:inline whitespace-nowrap">{currentPreset.name}</span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-slate-500 dark:text-zinc-500 transition-transform duration-200",
            isOpen && "rotate-180 text-violet-600 dark:text-violet-400"
          )} />
        </button>

        {typeof window !== 'undefined' && createPortal(
          <AnimatePresence>
            {isOpen && panelPos && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ position: 'fixed', top: panelPos.top, left: panelPos.left }}
                className="z-[100] w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-3 py-2.5 border-b border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                    <Palette className="w-3.5 h-3.5" />
                    <span className="font-medium">Site theme presets</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-500">
                    Changes the colors of the site you're building — not the workspace UI.
                  </p>
                </div>

              {/* Presets List */}
              <div className="max-h-[320px] overflow-y-auto py-1">
                {stylePresets.map((preset, index) => (
                  <motion.button
                    key={preset.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      onChange(preset)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left group",
                      selected === preset.id
                        ? "bg-violet-100 dark:bg-violet-500/20 border-l-2 border-violet-500"
                        : "hover:bg-slate-100 dark:hover:bg-white/[0.05] border-l-2 border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg ring-1 transition-all",
                        selected === preset.id
                          ? "ring-violet-500 shadow-lg shadow-violet-500/20"
                          : "ring-slate-300 group-hover:ring-slate-400 dark:ring-white/10 dark:group-hover:ring-white/20"
                      )}
                      style={{ background: preset.preview }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          selected === preset.id
                            ? "text-violet-900 dark:text-white"
                            : "text-slate-700 dark:text-zinc-300"
                        )}>
                          {preset.name}
                        </span>
                        {preset.id === 'modern-dark' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-500 truncate">{preset.description}</p>
                    </div>
                    {selected === preset.id && (
                      <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02]">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Theme affects generated website colors
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Palette className="w-4 h-4" />
        <span>Style Preset</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stylePresets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onChange(preset)}
            className={cn(
              "relative p-3 rounded-lg border transition group",
              selected === preset.id
                ? "border-violet-500 bg-violet-500/10"
                : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
            )}
          >
            <div
              className="h-8 rounded mb-2"
              style={{ background: preset.preview }}
            />
            <div className="text-xs font-medium text-white">{preset.name}</div>
            <div className="text-[10px] text-zinc-500 truncate">{preset.description}</div>
            {selected === preset.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-3.5 h-3.5 text-violet-400" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default StylePresetPicker
