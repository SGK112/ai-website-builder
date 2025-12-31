'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Chef-themed messages - witty and fun
const messages = [
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
}

// Steam particle component
function SteamParticle({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute w-3 h-3 rounded-full bg-white/20 blur-sm"
      initial={{
        opacity: 0,
        y: 0,
        x: Math.random() * 40 - 20,
        scale: 0.5
      }}
      animate={{
        opacity: [0, 0.6, 0],
        y: -80,
        x: Math.random() * 60 - 30,
        scale: [0.5, 1.2, 0.8]
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
    />
  )
}

export function ChefLoader({ isVisible }: ChefLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Cycle through messages smoothly
  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0)
      setProgress(0)
      return
    }

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2500)

    return () => clearInterval(messageInterval)
  }, [isVisible])

  // Smooth progress animation
  useEffect(() => {
    if (!isVisible) return

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev // Cap at 95% until complete
        return prev + Math.random() * 3 + 1
      })
    }, 300)

    return () => clearInterval(progressInterval)
  }, [isVisible])

  // Generate steam particles
  const steamParticles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => (
      <SteamParticle key={i} delay={i * 0.3} />
    )), []
  )

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950"
        >
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-fuchsia-950/20" />

          <div className="relative flex flex-col items-center gap-10">
            {/* Pot with steam */}
            <div className="relative">
              {/* Steam particles */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-20">
                {steamParticles}
              </div>

              {/* Glowing ring behind pot */}
              <motion.div
                className="absolute inset-0 -m-6 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 blur-xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* The pot emoji - smooth bounce */}
              <motion.div
                className="relative text-[100px] leading-none select-none"
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, 1, 0, -1, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🍲
              </motion.div>
            </div>

            {/* Message with smooth transitions */}
            <div className="text-center space-y-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-xl text-white font-medium tracking-wide"
                >
                  {messages[messageIndex]}
                </motion.p>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              {/* Subtle hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-sm text-zinc-500"
              >
                Your creation is cooking...
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChefLoader
