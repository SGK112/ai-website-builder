'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Chef-themed messages organized by cooking phase
const phaseMessages = {
  structure: [
    "Gathering fresh ingredients",
    "Reading the recipe",
    "Prepping the workspace",
    "Measuring the components",
  ],
  styling: [
    "Adding the secret sauce",
    "Seasoning with style",
    "Whisking the colors",
    "Folding in the design",
  ],
  interactivity: [
    "Sprinkling the magic",
    "Adding the finishing zest",
    "Testing for doneness",
    "Quality tasting in progress",
  ],
  complete: [
    "Your dish is ready!",
    "Bon appétit!",
    "Time to serve!",
  ],
}

// All messages for fallback
const allMessages = [
  "Prepping the ingredients",
  "Heating up the code",
  "Whisking the layout",
  "Seasoning with style",
  "Letting it simmer",
  "Adding the finishing touches",
  "Quality tasting in progress",
  "Almost ready to serve",
]

interface ChefLoaderProps {
  isVisible: boolean
  phase?: 'structure' | 'styling' | 'interactivity' | 'complete' | 'idle'
}

// Steam particle component
function SteamParticle({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute w-3 h-3 rounded-full bg-white/30 blur-sm"
      initial={{
        opacity: 0,
        y: 0,
        x: Math.random() * 40 - 20,
        scale: 0.5
      }}
      animate={{
        opacity: [0, 0.8, 0],
        y: -100,
        x: Math.random() * 80 - 40,
        scale: [0.5, 1.5, 0.8]
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
    />
  )
}

// Bubble particle for pot
function BubbleParticle({ delay }: { delay: number }) {
  const size = 4 + Math.random() * 6
  return (
    <motion.div
      className="absolute rounded-full bg-violet-400/40"
      style={{ width: size, height: size }}
      initial={{
        opacity: 0,
        y: 20,
        x: Math.random() * 60 - 30,
        scale: 0
      }}
      animate={{
        opacity: [0, 1, 0],
        y: [-10, -30],
        scale: [0, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
    />
  )
}

// Ingredient floating animation
function FloatingIngredient({ emoji, delay, x }: { emoji: string; delay: number; x: number }) {
  return (
    <motion.div
      className="absolute text-2xl"
      initial={{ opacity: 0, y: 50, x, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [50, 20, -20, -50],
        x: [x, x + 20, x - 10, x],
        scale: [0, 1, 1, 0.5],
        rotate: [0, 15, -10, 0]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {emoji}
    </motion.div>
  )
}

export function ChefLoader({ isVisible, phase = 'structure' }: ChefLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  // Get messages for current phase
  const currentMessages = phase !== 'idle' ? (phaseMessages[phase] || allMessages) : allMessages

  // Cycle through messages smoothly
  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0)
      return
    }

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % currentMessages.length)
    }, 2500)

    return () => clearInterval(messageInterval)
  }, [isVisible, currentMessages])

  // Generate steam particles
  const steamParticles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => (
      <SteamParticle key={i} delay={i * 0.25} />
    )), []
  )

  // Generate bubble particles
  const bubbleParticles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => (
      <BubbleParticle key={i} delay={i * 0.4} />
    )), []
  )

  // Floating ingredients
  const ingredients = ['🧂', '🌿', '✨', '💜', '🔮']

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950"
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-violet-500/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <div className="relative flex flex-col items-center gap-8">
            {/* Pot with enhanced effects */}
            <div className="relative">
              {/* Floating ingredients */}
              <div className="absolute -inset-20 pointer-events-none">
                {ingredients.map((emoji, i) => (
                  <FloatingIngredient
                    key={i}
                    emoji={emoji}
                    delay={i * 0.8}
                    x={-60 + i * 30}
                  />
                ))}
              </div>

              {/* Steam particles */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 h-24">
                {steamParticles}
              </div>

              {/* Glowing ring behind pot */}
              <motion.div
                className="absolute inset-0 -m-8 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(236, 72, 153, 0.2) 50%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Secondary glow pulse */}
              <motion.div
                className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-lg"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />

              {/* Bubble particles in pot */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-8">
                {bubbleParticles}
              </div>

              {/* The pot emoji with cooking animation */}
              <motion.div
                className="relative text-[120px] leading-none select-none"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 2, 0, -2, 0],
                  scale: phase === 'complete' ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {phase === 'complete' ? '✨🍲✨' : '🍲'}
              </motion.div>
            </div>

            {/* Message with smooth transitions */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`${phase}-${messageIndex}`}
                initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-xl text-white/80 font-medium tracking-wide"
              >
                {currentMessages[messageIndex % currentMessages.length]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChefLoader
