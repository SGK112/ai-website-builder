'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Loader2,
  Sparkles,
  User,
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatRefinementProps {
  theme: 'light' | 'dark'
  currentHtml: string
  onUpdate: (newHtml: string) => void
  isRefining: boolean
  setIsRefining: (value: boolean) => void
}

// Quick refinement suggestions
const QUICK_ACTIONS = [
  { icon: Palette, label: 'Change colors', prompt: 'Change the color scheme to' },
  { icon: Type, label: 'Edit text', prompt: 'Update the heading to say' },
  { icon: ImageIcon, label: 'Swap images', prompt: 'Replace the hero image with a' },
  { icon: Layout, label: 'Adjust layout', prompt: 'Make the layout more' },
]

const SMART_SUGGESTIONS = [
  "Make it more modern and minimal",
  "Add more whitespace and breathing room",
  "Make the CTA buttons more prominent",
  "Change to a warmer color palette",
  "Make the text larger and more readable",
  "Add subtle animations on scroll",
  "Make it more professional looking",
  "Add a gradient background to the hero",
]

export function ChatRefinement({
  theme,
  currentHtml,
  onUpdate,
  isRefining,
  setIsRefining
}: ChatRefinementProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isDark = theme === 'dark'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message on mount (only once)
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current && currentHtml) {
      hasInitialized.current = true
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "I can help you refine this design. Try asking me to change colors, update text, adjust layouts, or anything else you'd like to improve.",
        timestamp: new Date()
      }])
    }
  }, [currentHtml])

  const handleSubmit = async () => {
    if (!input.trim() || isRefining) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setShowSuggestions(false)
    setIsRefining(true)

    try {
      const res = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.trim(),
          currentHtml,
          theme,
          // Filter out welcome/system messages, only send actual conversation
          conversationHistory: messages
            .filter(m => m.id !== 'welcome' && !m.id.startsWith('error-'))
            .map(m => ({
              role: m.role,
              content: m.content
            }))
        }),
      })

      if (!res.ok) throw new Error('Refinement failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''
      let assistantMessageId = `assistant-${Date.now()}`
      let fullResponse = ''
      let newHtml = ''

      // Add placeholder assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'thinking') {
                fullResponse = data.message || 'Analyzing your request...'
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullResponse }
                    : m
                ))
              } else if (data.type === 'update') {
                fullResponse = data.message || 'Applying changes...'
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullResponse }
                    : m
                ))
              } else if (data.type === 'complete') {
                newHtml = data.html
                fullResponse = data.message || 'Done! I\'ve updated the design.'
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullResponse }
                    : m
                ))
              } else if (data.type === 'error') {
                fullResponse = data.message || 'Something went wrong. Please try again.'
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullResponse }
                    : m
                ))
              }
            } catch {}
          }
        }
      }

      if (newHtml) {
        onUpdate(newHtml)
      }
    } catch (err) {
      console.error('Refinement error:', err)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsRefining(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared. What would you like to change?",
      timestamp: new Date()
    }])
    setShowSuggestions(true)
  }

  return (
    <div className={cn(
      "h-full flex flex-col",
      isDark ? "bg-slate-900" : "bg-white"
    )}>
      {/* Clear chat button - compact header */}
      {messages.length > 1 && (
        <div className={cn(
          "shrink-0 px-3 py-2 border-b flex items-center justify-end",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <button
            onClick={clearChat}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
              isDark
                ? "hover:bg-white/10 text-gray-400"
                : "hover:bg-gray-100 text-gray-500"
            )}
            title="Clear chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isDark
                    ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                    : "bg-gradient-to-br from-orange-100 to-pink-100"
                )}>
                  <Sparkles className={cn(
                    "w-4 h-4",
                    isDark ? "text-violet-400" : "text-orange-500"
                  )} />
                </div>
              )}

              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.role === 'user'
                  ? isDark
                    ? "bg-violet-600 text-white"
                    : "bg-orange-500 text-white"
                  : isDark
                    ? "bg-white/5 text-gray-200"
                    : "bg-gray-100 text-gray-800"
              )}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>

              {message.role === 'user' && (
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isDark ? "bg-white/10" : "bg-gray-200"
                )}>
                  <User className={cn(
                    "w-4 h-4",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isRefining && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isDark
                ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                : "bg-gradient-to-br from-orange-100 to-pink-100"
            )}>
              <Loader2 className={cn(
                "w-4 h-4 animate-spin",
                isDark ? "text-violet-400" : "text-orange-500"
              )} />
            </div>
            <div className={cn(
              "rounded-2xl px-4 py-3",
              isDark ? "bg-white/5" : "bg-gray-100"
            )}>
              <div className="flex gap-1">
                <span className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isDark ? "bg-violet-400" : "bg-orange-400"
                )} style={{ animationDelay: '0ms' }} />
                <span className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isDark ? "bg-violet-400" : "bg-orange-400"
                )} style={{ animationDelay: '150ms' }} />
                <span className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isDark ? "bg-violet-400" : "bg-orange-400"
                )} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length <= 1 && (
        <div className={cn(
          "shrink-0 px-4 py-3 border-t",
          isDark ? "border-white/10" : "border-gray-200"
        )}>
          <p className={cn(
            "text-xs font-medium mb-2",
            isDark ? "text-gray-500" : "text-gray-500"
          )}>Try these:</p>
          <div className="flex flex-wrap gap-2">
            {SMART_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => useSuggestion(suggestion)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  isDark
                    ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={cn(
        "shrink-0 p-4 border-t",
        isDark ? "border-white/10" : "border-gray-200"
      )}>
        {/* Quick actions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => useSuggestion(action.prompt)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                isDark
                  ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className={cn(
          "flex items-end gap-2 rounded-xl border p-2",
          isDark
            ? "bg-white/5 border-white/10"
            : "bg-gray-50 border-gray-200",
          input && (isDark ? "ring-1 ring-violet-500/50" : "ring-1 ring-orange-400/50")
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change..."
            disabled={isRefining}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm focus:outline-none min-h-[36px] max-h-[120px] py-2 px-2",
              isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
            )}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
          />

          <motion.button
            whileHover={{ scale: input.trim() && !isRefining ? 1.05 : 1 }}
            whileTap={{ scale: input.trim() && !isRefining ? 0.95 : 1 }}
            onClick={handleSubmit}
            disabled={!input.trim() || isRefining}
            className={cn(
              "p-2.5 rounded-lg transition-all shrink-0",
              input.trim() && !isRefining
                ? isDark
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  : "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                : isDark
                  ? "bg-white/5 text-gray-600"
                  : "bg-gray-200 text-gray-400"
            )}
          >
            {isRefining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
