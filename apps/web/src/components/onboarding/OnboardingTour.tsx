'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, Zap, Palette, Rocket, Code2, Upload, Layout, MessageSquare, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  title: string
  tip: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  icon?: React.ElementType
  highlight?: boolean
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Webstew!',
    tip: 'Your AI-powered website builder',
    description: 'Build beautiful websites in minutes with the power of AI. Just describe what you want and watch the magic happen!',
    target: '[data-tour="preview"]',
    position: 'center',
    icon: Sparkles,
    highlight: true,
  },
  {
    id: 'chat',
    title: 'AI Chat Interface',
    tip: 'Your creative command center',
    description: 'Type natural language commands like "Create a modern landing page for my coffee shop" or "Make the header blue". The AI understands context and builds or modifies your site instantly.',
    target: '[data-tour="chat"]',
    position: 'top',
    icon: MessageSquare,
  },
  {
    id: 'templates',
    title: 'Template Library',
    tip: 'Start with professional designs',
    description: 'Choose from our curated templates to jumpstart your project. Each template is fully customizable and optimized for conversion.',
    target: '[data-tour="templates"]',
    position: 'right',
    icon: Layout,
  },
  {
    id: 'webstew',
    title: 'Webstew Ingredients',
    tip: 'Add your own content',
    description: 'Upload your images, documents, or spreadsheets. The AI will incorporate your content directly into the website design. Great for logos, product photos, and brand assets!',
    target: '[data-tour="webstew"]',
    position: 'right',
    icon: Upload,
  },
  {
    id: 'preview',
    title: 'Live Preview',
    tip: 'See your site in real-time',
    description: 'Watch your website come to life as the AI builds it. Test responsive views for desktop, tablet, and mobile. Click elements to select and edit them directly!',
    target: '[data-tour="preview"]',
    position: 'left',
    icon: Wand2,
  },
  {
    id: 'code',
    title: 'Code Editor',
    tip: 'Full control when you need it',
    description: 'View and edit the generated HTML, CSS, and JavaScript. Perfect for developers who want to fine-tune the output. Use Cmd+S (Mac) or Ctrl+S (Windows) to save changes.',
    target: '[data-tour="code"]',
    position: 'bottom',
    icon: Code2,
  },
  {
    id: 'styles',
    title: 'Style Presets',
    tip: 'One-click theme changes',
    description: 'Instantly transform your site with curated color schemes and typography. Choose from dark mode, light mode, vibrant, minimal, and more!',
    target: '[data-tour="styles"]',
    position: 'bottom',
    icon: Palette,
  },
  {
    id: 'deploy',
    title: 'Ship It!',
    tip: 'Go live in seconds',
    description: 'Deploy your website with one click. Connect to GitHub for version control, or publish directly to Render for instant hosting. Your site will be live in moments!',
    target: '[data-tour="deploy"]',
    position: 'right',
    icon: Rocket,
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
  const Icon = current.icon || Zap

  // Position tooltip relative to target
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      // Center position for welcome screen
      if (current.position === 'center') {
        const centerX = window.innerWidth / 2 - 175 // Half of tooltip width (350/2)
        const centerY = window.innerHeight / 2 - 100
        setTooltipPos({ x: centerX, y: centerY })
        setRect(null)
        return
      }

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

      const gap = 16
      const tooltipW = 350
      const tooltipH = 140

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

    // Add a small delay to ensure elements are rendered
    const timer = setTimeout(updatePosition, 100)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      clearTimeout(timer)
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
    if (!rect || current.position === 'center') return { display: 'none' }

    const arrowSize = 10

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

  const isWelcome = step === 0
  const isLastStep = step === tourSteps.length - 1

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed overlay for welcome, transparent for others */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[200] transition-colors",
              isWelcome ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
            )}
            onClick={skip}
          />

          {/* Spotlight ring around target */}
          {rect && current.position !== 'center' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[201] pointer-events-none rounded-xl"
              style={{
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.6), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Animated ring */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-violet-500"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(139, 92, 246, 0.4)',
                    '0 0 0 10px rgba(139, 92, 246, 0)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed z-[202]"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              width: isWelcome ? 400 : 350,
            }}
          >
            <div className={cn(
              "bg-zinc-900/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden",
              current.highlight ? "border-violet-500/50" : "border-zinc-700/80"
            )}>
              {/* Header with icon */}
              <div className={cn(
                "px-5 py-4 flex items-start gap-4",
                current.highlight && "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  current.highlight
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                    : "bg-violet-500/20"
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    current.highlight ? "text-white" : "text-violet-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {current.title}
                    </h3>
                    <button
                      onClick={skip}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-violet-400 font-medium mt-0.5">
                    {current.tip}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-3 border-t border-zinc-800/50">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Footer with navigation */}
              <div className="px-5 py-3 bg-zinc-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Progress dots */}
                  <div className="flex gap-1.5">
                    {tourSteps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === step
                            ? "bg-violet-500 w-6"
                            : i < step
                              ? "bg-violet-500/50 w-1.5"
                              : "bg-zinc-600 w-1.5 hover:bg-zinc-500"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {step + 1} of {tourSteps.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={prev}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={next}
                    className={cn(
                      "flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                      isLastStep
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90"
                        : "bg-violet-500 text-white hover:bg-violet-400"
                    )}
                  >
                    {isLastStep ? "Let's Build!" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Arrow pointing to target */}
            {current.position !== 'center' && (
              <div
                className="absolute w-3 h-3 bg-zinc-900 border-zinc-700"
                style={{
                  ...getArrowStyle(),
                  borderWidth: current.position === 'top' || current.position === 'left'
                    ? '0 1px 1px 0'
                    : '1px 0 0 1px',
                }}
              />
            )}
          </motion.div>

          {/* Skip hint at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[202]"
          >
            <button
              onClick={skip}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono">ESC</kbd> to skip tour
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
