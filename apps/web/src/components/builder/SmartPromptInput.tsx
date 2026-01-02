'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Wand2, Lightbulb, Zap, Layout,
  ShoppingCart, Users, Image, Palette, Code,
  Globe, Smartphone, Rocket, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptSuggestion {
  id: string
  text: string
  category: 'quick' | 'template' | 'enhance' | 'style'
  icon: typeof Sparkles
}

const quickSuggestions: PromptSuggestion[] = [
  { id: 'landing', text: 'Modern SaaS landing page', category: 'template', icon: Layout },
  { id: 'ecommerce', text: 'Luxury e-commerce store', category: 'template', icon: ShoppingCart },
  { id: 'portfolio', text: 'Creative portfolio site', category: 'template', icon: Image },
  { id: 'restaurant', text: 'Restaurant with online booking', category: 'template', icon: Globe },
  { id: 'startup', text: 'Tech startup homepage', category: 'template', icon: Rocket },
  { id: 'agency', text: 'Digital agency website', category: 'template', icon: Users },
]

const enhancementSuggestions: PromptSuggestion[] = [
  { id: 'mobile', text: 'Make it mobile-first', category: 'enhance', icon: Smartphone },
  { id: 'dark', text: 'Add dark mode toggle', category: 'enhance', icon: Palette },
  { id: 'animate', text: 'Add scroll animations', category: 'enhance', icon: Zap },
  { id: 'interactive', text: 'Make it more interactive', category: 'enhance', icon: Code },
]

interface SmartPromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isGenerating: boolean
  hasHtml: boolean
}

export function SmartPromptInput({
  value,
  onChange,
  onSubmit,
  isGenerating,
  hasHtml
}: SmartPromptInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Get relevant suggestions based on context
  const suggestions = hasHtml ? enhancementSuggestions : quickSuggestions

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(s =>
    value.length < 3 || s.text.toLowerCase().includes(value.toLowerCase())
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex])
        } else {
          onSubmit()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, selectedIndex, filteredSuggestions, onSubmit])

  const handleSelectSuggestion = (suggestion: PromptSuggestion) => {
    if (hasHtml) {
      onChange(value + (value ? ' ' : '') + suggestion.text)
    } else {
      onChange(suggestion.text)
    }
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (value.length < 20) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    setTimeout(() => setShowSuggestions(false), 200)
  }

  useEffect(() => {
    if (value.length > 20) {
      setShowSuggestions(false)
    } else if (isFocused && value.length < 3) {
      setShowSuggestions(true)
    }
  }, [value, isFocused])

  return (
    <div className="relative">
      {/* Main Input Container */}
      <div className={cn(
        "relative rounded-2xl transition-all duration-300",
        isFocused
          ? "bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-purple-600/20 p-[2px]"
          : "bg-white/5 p-[1px]"
      )}>
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
          {/* Input Area */}
          <div className="flex items-end gap-2 p-3">
            <div className="flex-shrink-0 self-center">
              {isGenerating ? (
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </motion.div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>

            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={hasHtml ? "Describe changes to make..." : "Describe your website..."}
              disabled={isGenerating}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 resize-none focus:outline-none py-2 text-[15px] leading-relaxed max-h-32 overflow-y-auto"
              style={{ minHeight: '24px' }}
            />

            <button
              onClick={onSubmit}
              disabled={isGenerating || !value.trim()}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                value.trim() && !isGenerating
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/10 text-slate-500 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Generating Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10"
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-indigo-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-violet-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-purple-500 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-slate-400">Generating your website...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 bottom-full mb-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 font-medium">
                <Lightbulb className="w-3.5 h-3.5" />
                {hasHtml ? 'Enhancement Suggestions' : 'Quick Start Templates'}
              </div>

              <div className="space-y-0.5">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left",
                      selectedIndex === index
                        ? "bg-indigo-600/20 text-white"
                        : "text-slate-300 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedIndex === index ? "bg-indigo-500/30" : "bg-white/5"
                    )}>
                      <suggestion.icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="flex-1 text-sm">{suggestion.text}</span>
                    <ArrowRight className={cn(
                      "w-4 h-4 transition",
                      selectedIndex === index ? "text-indigo-400" : "text-slate-600"
                    )} />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
              <span>↑↓ to navigate</span>
              <span>Enter to select</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions (when input is empty and focused) */}
      <AnimatePresence>
        {isFocused && !value && !isGenerating && !showSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-full mt-3"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {quickSuggestions.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 hover:text-white transition flex items-center gap-2"
                >
                  <s.icon className="w-3.5 h-3.5 text-indigo-400" />
                  {s.text}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SmartPromptInput
