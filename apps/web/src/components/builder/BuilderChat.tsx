'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Square,
  Sparkles,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  Wand2,
  Palette,
  Layout,
  Type,
  Image,
  Code,
  Zap,
  Bug,
  Plus,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ArrowRight,
  Settings,
  Loader2,
  CornerDownLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProjectFile {
  path: string
  content: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  fileChanges?: FileChange[]
  quickAction?: QuickAction
  timestamp?: Date
}

interface FileChange {
  path: string
  content: string
  applied?: boolean
  type?: 'create' | 'modify' | 'delete'
  lineChanges?: number
}

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  prompt: string
  category: 'style' | 'content' | 'feature' | 'fix'
}

interface BuilderChatProps {
  files: ProjectFile[]
  projectName: string
  onApplyChanges: (changes: FileChange[]) => void
  currentFile?: string
  selectedElement?: {
    tagName: string
    className: string
    textContent?: string
  } | null
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'modern-style',
    label: 'Modernize Design',
    icon: Palette,
    prompt: 'Make the design more modern with better spacing, shadows, and a refined color palette',
    category: 'style'
  },
  {
    id: 'responsive',
    label: 'Improve Mobile',
    icon: Layout,
    prompt: 'Improve the responsive design for mobile devices. Add proper breakpoints and optimize touch targets',
    category: 'style'
  },
  {
    id: 'typography',
    label: 'Better Typography',
    icon: Type,
    prompt: 'Improve typography with better font hierarchy, line heights, and reading experience',
    category: 'style'
  },
  {
    id: 'dark-mode',
    label: 'Add Dark Mode',
    icon: Eye,
    prompt: 'Add dark mode support with a toggle. Use CSS variables for easy theming',
    category: 'feature'
  },
  {
    id: 'animations',
    label: 'Add Animations',
    icon: Zap,
    prompt: 'Add subtle CSS animations and transitions for better user experience. Include hover effects and scroll animations',
    category: 'style'
  },
  {
    id: 'hero-section',
    label: 'Enhance Hero',
    icon: Image,
    prompt: 'Enhance the hero section with a better layout, compelling headline, and strong call-to-action',
    category: 'content'
  },
  {
    id: 'add-section',
    label: 'Add Section',
    icon: Plus,
    prompt: 'Add a new features section with icon cards showcasing key benefits',
    category: 'content'
  },
  {
    id: 'fix-bugs',
    label: 'Fix Issues',
    icon: Bug,
    prompt: 'Review the code and fix any potential issues, improve accessibility, and optimize performance',
    category: 'fix'
  },
]

function parseFileChanges(content: string): FileChange[] {
  const changes: FileChange[] = []
  const regex = /```(?:file:)?([^\n`]+)\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()

    if (path.match(/^(javascript|typescript|jsx|tsx|css|html|json|bash|sh)$/i)) {
      continue
    }

    changes.push({
      path: path.startsWith('/') ? path.slice(1) : path,
      content: fileContent,
      type: 'modify',
      lineChanges: fileContent.split('\n').length,
    })
  }

  return changes
}

export function BuilderChat({
  files,
  projectName,
  onApplyChanges,
  currentFile,
  selectedElement,
}: BuilderChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  const buildContextPrompt = useCallback((basePrompt: string): string => {
    let contextParts: string[] = [basePrompt]

    if (currentFile) {
      contextParts.push(`\n\nCurrently viewing file: ${currentFile}`)
    }

    if (selectedElement) {
      contextParts.push(`\n\nSelected element: <${selectedElement.tagName.toLowerCase()}${
        selectedElement.className ? ` class="${selectedElement.className}"` : ''
      }>${selectedElement.textContent?.slice(0, 100) || ''}...`)
    }

    return contextParts.join('')
  }, [currentFile, selectedElement])

  const sendMessage = useCallback(async (customPrompt?: string, quickAction?: QuickAction) => {
    const messageContent = customPrompt || input.trim()
    if (!messageContent || isLoading) return

    const contextualPrompt = buildContextPrompt(messageContent)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      quickAction,
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)
    setShowQuickActions(false)
    abortControllerRef.current = new AbortController()

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const relevantFiles = files.filter(f => {
        if (currentFile && f.path === currentFile) return true
        if (f.path.includes('page.tsx') || f.path.includes('index')) return true
        if (messageContent.toLowerCase().includes('style') && f.path.endsWith('.css')) return true
        return true
      }).slice(0, 8)

      const response = await fetch('/api/builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualPrompt,
          files: relevantFiles,
          projectName,
          conversationHistory,
          currentFile,
          selectedElement,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error('Chat request failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n').filter(Boolean)

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.content) {
                fullContent += data.content
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullContent }
                      : m
                  )
                )
              }

              if (data.done) {
                const fileChanges = parseFileChanges(fullContent)
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id
                      ? { ...m, isStreaming: false, fileChanges }
                      : m
                  )
                )
              }

              if (data.error) {
                throw new Error(data.error)
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Chat aborted')
      } else {
        console.error('Chat error:', error)
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: 'Sorry, an error occurred. Please try again.', isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, files, projectName, currentFile, selectedElement, buildContextPrompt])

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt, action)
    setShowQuickActions(false)
  }

  const handleApplyChanges = (messageId: string, changes: FileChange[]) => {
    onApplyChanges(changes)
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? {
            ...m,
            fileChanges: m.fileChanges?.map(fc => ({ ...fc, applied: true }))
          }
          : m
      )
    )
  }

  const handleApplySingleChange = (messageId: string, changePath: string) => {
    const message = messages.find(m => m.id === messageId)
    const change = message?.fileChanges?.find(fc => fc.path === changePath)
    if (change) {
      onApplyChanges([change])
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
              ...m,
              fileChanges: m.fileChanges?.map(fc =>
                fc.path === changePath ? { ...fc, applied: true } : fc
              )
            }
            : m
        )
      )
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-slate-500">
              {isLoading ? 'Generating...' : 'Ready to help'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white transition"
              title="Clear chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Context Bar */}
          {(currentFile || selectedElement) && (
            <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs">
                {currentFile && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] text-slate-400">
                    <FileCode className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{currentFile}</span>
                  </div>
                )}
                {selectedElement && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 text-purple-400">
                    <Code className="w-3 h-3" />
                    <span>&lt;{selectedElement.tagName.toLowerCase()}&gt;</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-6">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/[0.06]">
                    <Sparkles className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">How can I help?</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Describe what you want to build or modify. I'll generate the code for you.
                  </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">Suggestions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.slice(0, 6).map((action) => (
                      <motion.button
                        key={action.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action)}
                        disabled={isLoading}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-all text-left group"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          action.category === 'style' && "bg-pink-500/10 text-pink-400",
                          action.category === 'content' && "bg-blue-500/10 text-blue-400",
                          action.category === 'feature' && "bg-green-500/10 text-green-400",
                          action.category === 'fix' && "bg-amber-500/10 text-amber-400"
                        )}>
                          <action.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-slate-300 group-hover:text-white transition">
                          {action.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {messages.map((message) => (
                  <MessageBlock
                    key={message.id}
                    message={message}
                    onApplyChanges={(changes) => handleApplyChanges(message.id, changes)}
                    onApplySingleChange={(path) => handleApplySingleChange(message.id, path)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-white/[0.06] bg-white/[0.02]">
            {/* Quick Actions Toggle */}
            {messages.length > 0 && (
              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-white/[0.04]"
                  >
                    <div className="p-3 grid grid-cols-4 gap-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          disabled={isLoading}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/[0.04] transition text-center"
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center",
                            action.category === 'style' && "bg-pink-500/10 text-pink-400",
                            action.category === 'content' && "bg-blue-500/10 text-blue-400",
                            action.category === 'feature' && "bg-green-500/10 text-green-400",
                            action.category === 'fix' && "bg-amber-500/10 text-amber-400"
                          )}>
                            <action.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] text-slate-400">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            <div className="p-3">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedElement
                      ? `Modify the selected ${selectedElement.tagName.toLowerCase()}...`
                      : "Ask AI to build or modify..."
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-24 text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder-slate-500 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent min-h-[48px] max-h-[150px]"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className={cn(
                        "p-2 rounded-lg transition",
                        showQuickActions
                          ? "bg-purple-500/20 text-purple-400"
                          : "hover:bg-white/[0.05] text-slate-400 hover:text-white"
                      )}
                      title="Quick actions"
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>
                  )}
                  {isLoading ? (
                    <button
                      onClick={stopGeneration}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      className={cn(
                        "p-2 rounded-lg transition",
                        input.trim()
                          ? "bg-purple-500 text-white hover:bg-purple-600"
                          : "bg-white/[0.03] text-slate-500"
                      )}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> to send
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MessageBlock({
  message,
  onApplyChanges,
  onApplySingleChange,
}: {
  message: Message
  onApplyChanges: (changes: FileChange[]) => void
  onApplySingleChange: (path: string) => void
}) {
  const isUser = message.role === 'user'
  const [showCode, setShowCode] = useState(false)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const displayContent = message.content.replace(/```(?:file:)?[^\n`]+\n[\s\S]*?```/g, '').trim()

  const copyToClipboard = async (content: string, path: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  return (
    <div className={cn("p-4", isUser ? "bg-transparent" : "bg-white/[0.01]")}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center",
          isUser
            ? "bg-blue-500/20 text-blue-400"
            : "bg-purple-500/20 text-purple-400"
        )}>
          {isUser ? (
            <span className="text-[10px] font-bold">You</span>
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">
          {isUser ? 'You' : 'AI Assistant'}
        </span>
        {message.quickAction && (
          <span className="text-xs text-purple-400 flex items-center gap-1">
            <Wand2 className="w-3 h-3" />
            {message.quickAction.label}
          </span>
        )}
        {message.timestamp && !message.isStreaming && (
          <span className="text-[10px] text-slate-600 ml-auto">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="pl-8">
        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {displayContent || (message.isStreaming ? '' : '...')}
          {message.isStreaming && (
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>

        {/* File Changes */}
        {message.fileChanges && message.fileChanges.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Files Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                {message.fileChanges.length} file{message.fileChanges.length > 1 ? 's' : ''} modified
              </span>
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                {showCode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showCode ? 'Hide' : 'View'}
              </button>
            </div>

            {/* File List */}
            <div className="divide-y divide-white/[0.04]">
              {message.fileChanges.map((change, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-300 truncate">{change.path}</span>
                      {change.lineChanges && (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.04] flex-shrink-0">
                          {change.lineChanges} lines
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {change.applied ? (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Applied</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onApplySingleChange(change.path)}
                          className="px-2.5 py-1 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg flex items-center gap-1 transition"
                        >
                          <Check className="w-3 h-3" />
                          Apply
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Code Preview */}
                  <AnimatePresence>
                    {showCode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <div className="bg-[#0d0d12] rounded-lg border border-white/[0.04] overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
                              <span className="text-[10px] font-mono text-slate-500">{change.path}</span>
                              <button
                                onClick={() => copyToClipboard(change.content, change.path)}
                                className="p-1 hover:bg-white/[0.05] rounded"
                              >
                                {copiedPath === change.path ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-500" />
                                )}
                              </button>
                            </div>
                            <pre className="p-3 text-xs overflow-x-auto max-h-48 text-slate-300 font-mono">
                              <code>{change.content.slice(0, 1500)}{change.content.length > 1500 ? '\n\n... (truncated)' : ''}</code>
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Apply All Button */}
            {!message.fileChanges.every(fc => fc.applied) && (
              <div className="px-3 py-2 bg-white/[0.02] border-t border-white/[0.04]">
                <button
                  onClick={() => onApplyChanges(message.fileChanges!)}
                  className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20"
                >
                  <Check className="w-4 h-4" />
                  Apply All Changes
                </button>
              </div>
            )}

            {message.fileChanges.every(fc => fc.applied) && (
              <div className="px-3 py-2 bg-green-500/5 border-t border-green-500/10">
                <div className="flex items-center justify-center gap-1.5 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  All changes applied
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
