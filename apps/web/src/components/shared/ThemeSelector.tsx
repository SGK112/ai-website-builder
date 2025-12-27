'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Sparkles } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeSelector() {
  const { theme, setTheme, hasChosenTheme, setHasChosenTheme } = useTheme()
  const [hoveredTheme, setHoveredTheme] = useState<'light' | 'dark' | null>(null)

  const handleSelectTheme = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme)
    setHasChosenTheme(true)
  }

  if (hasChosenTheme) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
      >
        {/* Backdrop - changes based on hover */}
        <motion.div
          className="absolute inset-0 transition-all duration-500"
          animate={{
            background: hoveredTheme === 'light'
              ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
              : hoveredTheme === 'dark'
                ? 'linear-gradient(135deg, #0c0c0f 0%, #1a1a2e 50%, #16213e 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)'
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full transition-colors duration-500 ${
                hoveredTheme === 'light' ? 'bg-violet-500/30' : 'bg-white/20'
              }`}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              }}
              animate={{
                y: [null, -20, 20],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 text-center px-6"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className={`text-3xl font-bold tracking-tight transition-colors duration-500 ${
              hoveredTheme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>WebCraft</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-4xl md:text-5xl font-bold mb-4 transition-colors duration-500 ${
              hoveredTheme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Choose Your Experience
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-lg mb-12 max-w-md mx-auto transition-colors duration-500 ${
              hoveredTheme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Select your preferred building environment. You can change this anytime in settings.
          </motion.p>

          {/* Theme Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            {/* Light Theme Option */}
            <motion.button
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => handleSelectTheme('light')}
              onMouseEnter={() => setHoveredTheme('light')}
              onMouseLeave={() => setHoveredTheme(null)}
              className="group relative w-44 h-52 rounded-2xl overflow-hidden bg-white shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 border-2 border-transparent hover:border-amber-400 transition-all duration-300"
            >
              {/* Light Theme Preview */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white transition-transform duration-300 group-hover:scale-105">
                {/* Mini header */}
                <div className="h-6 bg-white border-b border-slate-200 flex items-center px-2 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                {/* Mini sidebar */}
                <div className="absolute left-0 top-6 bottom-0 w-8 bg-slate-100 border-r border-slate-200">
                  <div className="mt-2 mx-1.5 h-1.5 w-5 bg-violet-500 rounded transition-all duration-300 group-hover:w-6 group-hover:bg-amber-500" />
                  <div className="mt-1.5 mx-1.5 h-1.5 w-4 bg-slate-300 rounded" />
                  <div className="mt-1.5 mx-1.5 h-1.5 w-4 bg-slate-300 rounded" />
                </div>
                {/* Mini content */}
                <div className="absolute left-10 right-2 top-8">
                  <div className="h-2 w-16 bg-slate-800 rounded mb-1.5" />
                  <div className="h-1.5 w-20 bg-slate-300 rounded mb-3" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 bg-slate-200 rounded transition-colors duration-300 group-hover:bg-amber-100" />
                    <div className="h-10 bg-slate-200 rounded transition-colors duration-300 group-hover:bg-amber-100" />
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white to-transparent">
                <div className="flex items-center justify-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                  <span className="text-sm font-semibold text-slate-900">Light</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 text-center">Clean & professional</p>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-amber-500/15 to-orange-500/15" />
            </motion.button>

            {/* Dark Theme Option */}
            <motion.button
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => handleSelectTheme('dark')}
              onMouseEnter={() => setHoveredTheme('dark')}
              onMouseLeave={() => setHoveredTheme(null)}
              className="group relative w-44 h-52 rounded-2xl overflow-hidden bg-[#0c0c0f] shadow-xl hover:shadow-2xl hover:shadow-violet-500/30 border-2 border-white/10 hover:border-violet-500 transition-all duration-300"
            >
              {/* Dark Theme Preview */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0f] to-[#0a0a0d] transition-transform duration-300 group-hover:scale-105">
                {/* Mini header */}
                <div className="h-6 bg-[#0c0c0f] border-b border-white/10 flex items-center px-2 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                </div>
                {/* Mini sidebar */}
                <div className="absolute left-0 top-6 bottom-0 w-8 bg-[#0a0a0d] border-r border-white/5">
                  <div className="mt-2 mx-1.5 h-1.5 w-5 bg-violet-500 rounded transition-all duration-300 group-hover:w-6 group-hover:bg-fuchsia-500" />
                  <div className="mt-1.5 mx-1.5 h-1.5 w-4 bg-white/20 rounded" />
                  <div className="mt-1.5 mx-1.5 h-1.5 w-4 bg-white/20 rounded" />
                </div>
                {/* Mini content */}
                <div className="absolute left-10 right-2 top-8">
                  <div className="h-2 w-16 bg-white rounded mb-1.5" />
                  <div className="h-1.5 w-20 bg-white/30 rounded mb-3" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 bg-white/10 rounded transition-colors duration-300 group-hover:bg-violet-500/20" />
                    <div className="h-10 bg-white/10 rounded transition-colors duration-300 group-hover:bg-violet-500/20" />
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f] to-transparent">
                <div className="flex items-center justify-center gap-1.5">
                  <Moon className="w-4 h-4 text-violet-400 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                  <span className="text-sm font-semibold text-white">Dark</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 text-center">Modern & focused</p>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15" />
            </motion.button>
          </motion.div>

          {/* Skip link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => handleSelectTheme('dark')}
            className={`mt-8 text-sm transition-colors duration-500 ${
              hoveredTheme === 'light'
                ? 'text-slate-500 hover:text-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Skip and use default (Dark)
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
