'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonPreviewProps {
  progress?: number // 0-100
  phase?: string
  isDark?: boolean
}

export function SkeletonPreview({ progress = 0, phase, isDark = true }: SkeletonPreviewProps) {
  return (
    <div className={cn(
      "w-full h-full relative overflow-hidden",
      isDark ? "bg-slate-950" : "bg-white"
    )}>
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Skeleton Layout */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Navigation skeleton */}
        <div className="flex items-center justify-between">
          <motion.div
            className={cn(
              "h-8 w-32 rounded-lg",
              isDark ? "bg-slate-800" : "bg-slate-200"
            )}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  "h-4 w-16 rounded",
                  isDark ? "bg-slate-800" : "bg-slate-200"
                )}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>

        {/* Hero skeleton */}
        <div className="py-16 space-y-6">
          <motion.div
            className={cn(
              "h-4 w-24 rounded mx-auto",
              isDark ? "bg-violet-900/50" : "bg-violet-200"
            )}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className={cn(
              "h-12 w-3/4 rounded-lg mx-auto",
              isDark ? "bg-slate-800" : "bg-slate-200"
            )}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className={cn(
              "h-6 w-1/2 rounded mx-auto",
              isDark ? "bg-slate-800/70" : "bg-slate-200/70"
            )}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <div className="flex gap-4 justify-center pt-4">
            <motion.div
              className={cn(
                "h-12 w-32 rounded-xl",
                isDark ? "bg-violet-600/30" : "bg-violet-300"
              )}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className={cn(
                "h-12 w-32 rounded-xl",
                isDark ? "bg-slate-800" : "bg-slate-200"
              )}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>

        {/* Features skeleton */}
        <div className="grid grid-cols-3 gap-6 py-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "h-40 rounded-2xl",
                isDark ? "bg-slate-800/50" : "bg-slate-100"
              )}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* Progress indicator at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="max-w-md mx-auto">
          {/* Progress bar */}
          <div className={cn(
            "h-1 rounded-full overflow-hidden",
            isDark ? "bg-slate-800" : "bg-slate-200"
          )}>
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          {/* Status text */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-violet-500"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className={cn(
              "text-xs font-medium",
              isDark ? "text-slate-400" : "text-slate-500"
            )}>
              {phase || 'Building your website...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonPreview
