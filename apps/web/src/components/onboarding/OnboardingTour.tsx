'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  title: string
  tip: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    id: 'prompt',
    title: 'Prompt',
    tip: 'Describe your site → AI builds it',
    target: '[data-tour="prompt"]',
    position: 'top',
  },
  {
    id: 'preview',
    title: 'Preview',
    tip: 'Live render • Desktop/Mobile views',
    target: '[data-tour="preview"]',
    position: 'left',
  },
  {
    id: 'chat',
    title: 'Chat',
    tip: '"make header blue" → instant update',
    target: '[data-tour="chat"]',
    position: 'top',
  },
  {
    id: 'webstew',
    title: 'WebStew',
    tip: 'Upload images, docs → AI uses them',
    target: '[data-tour="webstew"]',
    position: 'right',
  },
  {
    id: 'code',
    title: 'Code',
    tip: 'View/edit HTML • Cmd+S to save',
    target: '[data-tour="code"]',
    position: 'bottom',
  },
  {
    id: 'export',
    title: 'Export',
    tip: 'Download ZIP or deploy live',
    target: '[data-tour="export"]',
    position: 'bottom',
  },
]

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  const current = tourSteps[step]

  // Position tooltip relative to target
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const el = document.querySelector(current.target)
      if (!el) {
        // If element not found, try next step or close
        if (step < tourSteps.length - 1) {
          setStep(s => s + 1)
        }
        return
      }

      const r = el.getBoundingClientRect()
      setRect(r)

      const gap = 12
      const tooltipW = 200
      const tooltipH = 70

      let x = 0, y = 0

      switch (current.position) {
        case 'top':
          x = r.left + r.width / 2 - tooltipW / 2
          y = r.top - tooltipH - gap
          break
        case 'bottom':
          x = r.left + r.width / 2 - tooltipW / 2
          y = r.bottom + gap
          break
        case 'left':
          x = r.left - tooltipW - gap
          y = r.top + r.height / 2 - tooltipH / 2
          break
        case 'right':
          x = r.right + gap
          y = r.top + r.height / 2 - tooltipH / 2
          break
      }

      // Keep in viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltipW - 8))
      y = Math.max(8, Math.min(y, window.innerHeight - tooltipH - 8))

      setTooltipPos({ x, y })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, step, current])

  const next = useCallback(() => {
    if (step < tourSteps.length - 1) {
      setStep(s => s + 1)
    } else {
      onComplete()
      onClose()
    }
  }, [step, onComplete, onClose])

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  const skip = useCallback(() => {
    onComplete()
    onClose()
  }, [onComplete, onClose])

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, next, prev, skip])

  if (!isOpen) return null

  // Arrow position calculation
  const getArrowStyle = () => {
    if (!rect) return {}

    const arrowSize = 8

    switch (current.position) {
      case 'top':
        return {
          left: '50%',
          bottom: -arrowSize,
          transform: 'translateX(-50%) rotate(45deg)',
        }
      case 'bottom':
        return {
          left: '50%',
          top: -arrowSize,
          transform: 'translateX(-50%) rotate(45deg)',
        }
      case 'left':
        return {
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        }
      case 'right':
        return {
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent overlay - click to skip */}
          <div
            className="fixed inset-0 z-[200]"
            onClick={skip}
          />

          {/* Spotlight ring around target */}
          {rect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-[201] pointer-events-none rounded-lg ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent"
              style={{
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
              }}
            >
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-lg animate-ping bg-violet-500/20" />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed z-[202] w-[200px]"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                  {current.title}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {step + 1}/{tourSteps.length}
                  </span>
                  <button
                    onClick={skip}
                    className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tip */}
              <div className="px-3 py-2">
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {current.tip}
                </p>
              </div>

              {/* Nav */}
              <div className="px-2 py-1.5 bg-zinc-800/50 flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className={cn(
                    "p-1 rounded",
                    step === 0
                      ? "text-zinc-600 cursor-not-allowed"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dots */}
                <div className="flex gap-1">
                  {tourSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        i === step
                          ? "bg-violet-500 w-3"
                          : i < step
                            ? "bg-violet-500/50"
                            : "bg-zinc-600"
                      )}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="p-1 rounded text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Arrow */}
            <div
              className="absolute w-2 h-2 bg-zinc-900 border-zinc-700"
              style={{
                ...getArrowStyle(),
                borderWidth: current.position === 'top' || current.position === 'left'
                  ? '0 1px 1px 0'
                  : '1px 0 0 1px',
              }}
            />
          </motion.div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[202]"
          >
            <button
              onClick={skip}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800"
            >
              ESC to skip
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export const tourStyles = `
/* No additional styles needed - using Tailwind */
`

export default OnboardingTour
