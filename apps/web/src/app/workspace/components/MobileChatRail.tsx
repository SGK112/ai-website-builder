'use client'

// Mobile chat rail — the conversation as ambient bubbles that float UP the side
// of the screen over the live-building canvas, then fade. The creation (the site
// cooking in the canvas behind) is the star; the chat stays out of the way.
// Voice and text both land in chatMessages, so both flow through here identically.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ChatMessage } from './BuildChatPanel'

interface Props {
  isDark: boolean
  messages: ChatMessage[]
  streaming?: boolean
}

const MAX_VISIBLE = 4

export function MobileChatRail({ isDark, messages, streaming }: Props) {
  // Ambient: visible while the conversation/build is happening, then fades so a
  // finished site sits unobstructed. Re-shows on any new message or stream.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(true)
    if (streaming) return
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [messages.length, streaming])

  const recent = messages.slice(-MAX_VISIBLE)
  if (!recent.length) return null
  const base = messages.length - recent.length

  return (
    // Sits above the composer; pointer-events off so the canvas stays tappable.
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none absolute inset-x-0 top-10 bottom-[84px] z-30 flex flex-col justify-end gap-2 px-3"
    >
      <AnimatePresence initial={false}>
        {recent.map((m, i) => {
          const ageFromNewest = recent.length - 1 - i // 0 = newest (bottom)
          const opacity = ageFromNewest === 0 ? 1 : Math.max(0.22, 1 - ageFromNewest * 0.26)
          const isUser = m.role === 'user'
          const isLiveAssistant = streaming && i === recent.length - 1 && m.role === 'assistant'
          const text = m.content.trim()
          return (
            <motion.div
              key={base + i}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[76%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-lg backdrop-blur-md',
                  isUser
                    ? 'bg-gradient-to-br from-violet-500/90 to-fuchsia-500/90 text-white rounded-br-md shadow-violet-500/25'
                    : isDark
                      ? 'bg-zinc-900/70 text-zinc-100 border border-white/10 rounded-bl-md'
                      : 'bg-white/85 text-slate-800 border border-slate-200/70 rounded-bl-md'
                )}
              >
                {isLiveAssistant && !text ? (
                  <span className="inline-flex items-center gap-1.5 text-violet-300">
                    <span className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                    cooking…
                  </span>
                ) : (
                  text.length > 180 ? text.slice(0, 180) + '…' : text || '…'
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
