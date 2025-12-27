'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  Wand2,
  ChevronDown,
  Lightbulb,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  buildReady?: boolean
  buildPrompt?: string
}

interface ChatPanelProps {
  theme: 'light' | 'dark'
  hasWebsite: boolean
  currentPrompt?: string
  onBuild: (prompt: string) => void
  isBuilding: boolean
}

const QUICK_PROMPTS = [
  { label: 'Landing Page', prompt: 'Help me create a modern landing page for my startup' },
  { label: 'Portfolio', prompt: 'I want to build a portfolio website to showcase my work' },
  { label: 'Restaurant', prompt: 'I need a website for my restaurant' },
  { label: 'E-commerce', prompt: 'Build me an online store' },
]

export function ChatPanel({ theme, hasWebsite, currentPrompt, onBuild, isBuilding }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isDark = theme === 'dark'

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && !hasWebsite) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey! 👋 I'm your AI design assistant. Tell me about the website you want to create, and I'll help you build it. What kind of site are you thinking about?",
        timestamp: new Date(),
      }])
    } else if (messages.length === 0 && hasWebsite) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Welcome back! 🎨 I see you're working on your website. What would you like to change or improve? I can help with colors, layout, content, or adding new sections.",
        timestamp: new Date(),
      }])
    }
  }, [hasWebsite])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    setShowQuickPrompts(false)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/builder-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            hasWebsite,
            currentPrompt,
          },
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        buildReady: data.buildReady,
        buildPrompt: data.buildPrompt,
      }

      setMessages(prev => [...prev, assistantMessage])

      // If build is ready, trigger it after a short delay
      if (data.buildReady && data.buildPrompt) {
        setTimeout(() => {
          onBuild(data.buildPrompt)
        }, 1500)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I ran into an issue. Please try again.",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-full",
      isDark ? "bg-[#0a0a0f]" : "bg-white"
    )}>
      {/* Header */}
      <div className={cn(
        "shrink-0 px-4 py-3 border-b flex items-center gap-3",
        isDark ? "border-white/5 bg-slate-900/50" : "border-slate-200 bg-slate-50"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isDark
            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
            : "bg-gradient-to-br from-orange-400 to-pink-500"
        )}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Design Assistant</h3>
          <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
            {isBuilding ? 'Building your website...' : 'Online'}
          </p>
        </div>
      </div>

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
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                message.role === 'assistant'
                  ? isDark
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                    : "bg-gradient-to-br from-orange-400 to-pink-500"
                  : isDark
                    ? "bg-slate-800"
                    : "bg-slate-200"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-600")} />
                )}
              </div>

              {/* Message */}
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === 'assistant'
                  ? isDark
                    ? "bg-slate-800/80 border border-white/5"
                    : "bg-slate-100 border border-slate-200"
                  : isDark
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                    : "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Build Ready Indicator */}
                {message.buildReady && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "mt-3 pt-3 border-t flex items-center gap-2",
                      isDark ? "border-white/10" : "border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                    )}>
                      <Wand2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    )}>
                      Building your website...
                    </span>
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              isDark
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                : "bg-gradient-to-br from-orange-400 to-pink-500"
            )}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className={cn(
              "rounded-2xl px-4 py-3",
              isDark ? "bg-slate-800/80 border border-white/5" : "bg-slate-100"
            )}>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <AnimatePresence>
        {showQuickPrompts && messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className={cn("w-3 h-3", isDark ? "text-yellow-400" : "text-yellow-500")} />
              <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                Quick start
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => sendMessage(item.prompt)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105",
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className={cn(
        "shrink-0 p-4 border-t",
        isDark ? "border-white/5 bg-slate-900/30" : "border-slate-200 bg-slate-50"
      )}>
        <div className={cn(
          "flex items-end gap-2 p-2 rounded-2xl border",
          isDark
            ? "bg-slate-800/50 border-white/5"
            : "bg-white border-slate-200"
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasWebsite ? "What would you like to change?" : "Describe your website..."}
            rows={1}
            disabled={isBuilding}
            className={cn(
              "flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-32 py-2 px-2",
              isDark
                ? "text-white placeholder-slate-500"
                : "text-slate-900 placeholder-slate-400"
            )}
            style={{ minHeight: '24px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 128) + 'px'
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || isBuilding}
            className={cn(
              "p-2.5 rounded-xl transition-all shrink-0",
              input.trim() && !isLoading && !isBuilding
                ? isDark
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25"
                : isDark
                  ? "bg-slate-700 text-slate-500"
                  : "bg-slate-200 text-slate-400"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
        <p className={cn(
          "text-xs mt-2 text-center",
          isDark ? "text-slate-500" : "text-slate-400"
        )}>
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
