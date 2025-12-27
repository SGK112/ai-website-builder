'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Sparkles,
  Check,
  Cpu,
  Layers,
  Paintbrush,
  Image as ImageIcon,
  Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type BuildStage =
  | 'analyzing'
  | 'designing'
  | 'building'
  | 'styling'
  | 'images'
  | 'complete'

interface BuildStageInfo {
  id: BuildStage
  icon: React.ElementType
  title: string
  verb: string
}

const BUILD_STAGES: BuildStageInfo[] = [
  { id: 'analyzing', icon: Cpu, title: 'Analyzing', verb: 'Understanding your vision' },
  { id: 'designing', icon: Layers, title: 'Designing', verb: 'Crafting the perfect layout' },
  { id: 'building', icon: Sparkles, title: 'Building', verb: 'Generating components' },
  { id: 'styling', icon: Paintbrush, title: 'Styling', verb: 'Applying visual polish' },
  { id: 'images', icon: ImageIcon, title: 'Optimizing', verb: 'Enhancing media assets' },
  { id: 'complete', icon: Rocket, title: 'Complete', verb: 'Your site is ready' },
]

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-violet-500/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// Animated code lines
function CodeLines() {
  const lines = [
    'import { createWebsite } from "ai"',
    'const layout = await design(prompt)',
    'const components = generate(layout)',
    'await optimize(components)',
    'export default Website',
  ]

  return (
    <div className="absolute bottom-8 left-8 font-mono text-xs text-zinc-700 opacity-40">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.6, x: 0 }}
          transition={{ delay: 0.5 + i * 0.3, duration: 0.5 }}
          className="mb-1"
        >
          <span className="text-violet-600/50">{`${i + 1}  `}</span>
          {line}
        </motion.div>
      ))}
    </div>
  )
}

// Morphing background orb
function MorphingOrb({ color, position }: { color: string; position: string }) {
  return (
    <motion.div
      className={cn("absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-30", position)}
      style={{ background: color }}
      animate={{
        scale: [1, 1.2, 1.1, 1],
        rotate: [0, 90, 180, 270, 360],
        borderRadius: ['50%', '40%', '50%', '45%', '50%'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

interface BuildProgressProps {
  currentStage: BuildStage
  prompt?: string
}

export function BuildProgress({ currentStage, prompt }: BuildProgressProps) {
  const currentIndex = BUILD_STAGES.findIndex(s => s.id === currentStage)
  const progress = ((currentIndex + 1) / BUILD_STAGES.length) * 100
  const currentStageInfo = BUILD_STAGES[currentIndex]
  const CurrentIcon = currentStageInfo?.icon || Sparkles

  const [dots, setDots] = useState('')

  useEffect(() => {
    if (currentStage === 'complete') return
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [currentStage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070a] overflow-hidden">
      {/* Animated background */}
      <MorphingOrb color="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" position="top-0 -left-64" />
      <MorphingOrb color="linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" position="bottom-0 -right-64" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Code lines decoration */}
      <CodeLines />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-8">
        {/* Central icon animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center mb-12"
        >
          <div className="relative">
            {/* Outer rotating ring */}
            <motion.div
              className="absolute -inset-8 rounded-full border border-violet-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-500 rounded-full" />
            </motion.div>

            {/* Middle pulsing ring */}
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-violet-500/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Icon container */}
            <motion.div
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/30"
              animate={currentStage !== 'complete' ? {
                scale: [1, 1.05, 1],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  {currentStage === 'complete' ? (
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  ) : (
                    <CurrentIcon className="w-10 h-10 text-white" />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: [-100, 100] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Stage title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-4xl md:text-5xl font-bold text-white mb-3"
            >
              {currentStageInfo?.title}
              {currentStage !== 'complete' && (
                <span className="text-violet-400">{dots}</span>
              )}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={currentStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg text-zinc-400"
            >
              {currentStageInfo?.verb}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-8"
        >
          {/* Track */}
          <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            {/* Progress fill */}
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Progress percentage */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-zinc-500">
              Step {currentIndex + 1} of {BUILD_STAGES.length}
            </span>
            <motion.span
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-sm font-semibold text-violet-400"
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </motion.div>

        {/* Stage indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between"
        >
          {BUILD_STAGES.map((stage, index) => {
            const isPast = index < currentIndex
            const isCurrent = index === currentIndex
            const StageIcon = stage.icon

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="flex flex-col items-center"
              >
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    isPast && "bg-emerald-500/20",
                    isCurrent && "bg-violet-500/20",
                    !isPast && !isCurrent && "bg-zinc-800/50"
                  )}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isPast ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <StageIcon className={cn(
                      "w-4 h-4",
                      isCurrent ? "text-violet-400" : "text-zinc-600"
                    )} />
                  )}
                </motion.div>
                <span className={cn(
                  "text-[10px] mt-2 font-medium",
                  isPast ? "text-emerald-400" : isCurrent ? "text-violet-400" : "text-zinc-600"
                )}>
                  {stage.title.replace('ing', '')}
                </span>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Prompt display */}
        {prompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm"
          >
            <p className="text-xs text-zinc-500 mb-1">Creating</p>
            <p className="text-sm text-zinc-300 line-clamp-2">"{prompt}"</p>
          </motion.div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 right-8 flex items-center gap-2 text-zinc-600 text-xs">
        <motion.div
          className="w-2 h-2 rounded-full bg-violet-500"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span>AI Engine Active</span>
      </div>
    </div>
  )
}

export default BuildProgress
