'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Image as ImageIcon,
  Palette,
  Code2,
  Settings,
  Layers,
  Layout,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  Paperclip,
  Wand2,
  FileCode,
  Download,
  Rocket,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Copy,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingChatProps {
  onSendMessage: (message: string, images?: string[]) => void
  isGenerating: boolean
  generatedCode: { html: string; css: string; js?: string }
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void
  currentDevice: 'desktop' | 'tablet' | 'mobile'
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onExport?: () => void
  onDeploy?: () => void
  onToggleCode?: () => void
  showCode?: boolean
  isDark?: boolean
  onThemeToggle?: () => void
}

const quickActions = [
  { icon: Wand2, label: 'Improve design', prompt: 'Improve the overall design with better spacing and modern touches' },
  { icon: Palette, label: 'Change colors', prompt: 'Suggest a new color scheme that looks more professional' },
  { icon: Layout, label: 'Add section', prompt: 'Add a new testimonials section with customer reviews' },
  { icon: ImageIcon, label: 'Better images', prompt: 'Replace images with more relevant, high-quality alternatives' },
]

export function FloatingChat({
  onSendMessage,
  isGenerating,
  generatedCode,
  onDeviceChange,
  currentDevice,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onDeploy,
  onToggleCode,
  showCode,
  isDark = true,
  onThemeToggle,
}: FloatingChatProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [message, setMessage] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!message.trim() || isGenerating) return
    onSendMessage(message.trim())
    setMessage('')
    setShowQuickActions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickAction = (prompt: string) => {
    onSendMessage(prompt)
    setShowQuickActions(false)
  }

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      {/* Main floating container */}
      <motion.div
        layout
        className={cn(
          "max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl",
          isDark
            ? "bg-slate-900/95 backdrop-blur-xl border border-white/10"
            : "bg-white/95 backdrop-blur-xl border border-slate-200"
        )}
        style={{
          boxShadow: isDark
            ? '0 -10px 60px -15px rgba(139, 92, 246, 0.3), 0 -5px 30px -10px rgba(0, 0, 0, 0.5)'
            : '0 -10px 60px -15px rgba(139, 92, 246, 0.2), 0 -5px 30px -10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Top toolbar */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 border-b",
          isDark ? "border-white/10" : "border-slate-200"
        )}>
          {/* Left: Device controls */}
          <div className="flex items-center gap-1">
            {[
              { mode: 'desktop' as const, icon: Monitor },
              { mode: 'tablet' as const, icon: Tablet },
              { mode: 'mobile' as const, icon: Smartphone },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => onDeviceChange(mode)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  currentDevice === mode
                    ? isDark
                      ? "bg-violet-500/20 text-violet-400"
                      : "bg-violet-100 text-violet-600"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Center: Actions */}
          <div className="flex items-center gap-1">
            {onUndo && (
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canUndo
                    ? isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "opacity-30 cursor-not-allowed"
                )}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}
            {onRedo && (
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canRedo
                    ? isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "opacity-30 cursor-not-allowed"
                )}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            )}

            <div className={cn("w-px h-5 mx-1", isDark ? "bg-white/10" : "bg-slate-200")} />

            {onToggleCode && (
              <button
                onClick={onToggleCode}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  showCode
                    ? isDark
                      ? "bg-violet-500/20 text-violet-400"
                      : "bg-violet-100 text-violet-600"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Export/Deploy */}
          <div className="flex items-center gap-1">
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {onDeploy && generatedCode.html && (
              <button
                onClick={onDeploy}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
                  "hover:shadow-lg hover:shadow-violet-500/25"
                )}
              >
                <Rocket className="w-3.5 h-3.5" />
                Deploy
              </button>
            )}
          </div>
        </div>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Quick actions */}
              <AnimatePresence>
                {showQuickActions && !isGenerating && generatedCode.html && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={cn(
                      "border-b overflow-hidden",
                      isDark ? "border-white/10" : "border-slate-200"
                    )}
                  >
                    <div className="p-3 flex gap-2 overflow-x-auto">
                      {quickActions.map((action, i) => (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleQuickAction(action.prompt)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                            isDark
                              ? "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          <action.icon className="w-4 h-4" />
                          {action.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input area */}
              <div className="p-3">
                <div className={cn(
                  "flex items-end gap-3 rounded-xl p-2",
                  isDark ? "bg-white/5" : "bg-slate-100"
                )}>
                  {/* Attachment button */}
                  <button
                    className={cn(
                      "p-2 rounded-lg transition-all flex-shrink-0",
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white"
                    )}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Text input */}
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowQuickActions(true)}
                    placeholder={
                      isGenerating
                        ? "Building your website..."
                        : generatedCode.html
                          ? "Describe changes or ask for improvements..."
                          : "Describe the website you want to build..."
                    }
                    disabled={isGenerating}
                    rows={1}
                    className={cn(
                      "flex-1 bg-transparent border-0 resize-none text-sm focus:outline-none focus:ring-0",
                      "min-h-[40px] max-h-[120px] py-2",
                      isDark
                        ? "text-white placeholder:text-slate-500"
                        : "text-slate-900 placeholder:text-slate-400"
                    )}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                    }}
                  />

                  {/* Quick actions toggle */}
                  {generatedCode.html && !isGenerating && (
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className={cn(
                        "p-2 rounded-lg transition-all flex-shrink-0",
                        isDark
                          ? "text-slate-400 hover:text-white hover:bg-white/10"
                          : "text-slate-500 hover:text-slate-900 hover:bg-white"
                      )}
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  )}

                  {/* Send button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isGenerating}
                    className={cn(
                      "p-2 rounded-xl transition-all flex-shrink-0",
                      message.trim() && !isGenerating
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                        : isDark
                          ? "bg-white/10 text-slate-500"
                          : "bg-slate-200 text-slate-400"
                    )}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse handle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full py-1.5 flex items-center justify-center transition-colors",
            isDark
              ? "text-slate-500 hover:text-white hover:bg-white/5"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </motion.div>

      {/* Generation status indicator */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2"
          >
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              isDark
                ? "bg-slate-800/90 backdrop-blur-sm border border-white/10"
                : "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg"
            )}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-violet-500"
              />
              <span className={cn(
                "text-sm font-medium",
                isDark ? "text-white" : "text-slate-900"
              )}>
                Building...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FloatingChat
