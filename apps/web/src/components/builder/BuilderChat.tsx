'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, Bot, User, Sparkles, FileCode, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
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
}

interface FileChange {
  path: string
  content: string
  applied?: boolean
}

interface BuilderChatProps {
  files: ProjectFile[]
  projectName: string
  onApplyChanges: (changes: FileChange[]) => void
}

// Parse file changes from Claude's response
function parseFileChanges(content: string): FileChange[] {
  const changes: FileChange[] = []
  const regex = /```file:([^\n]+)\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(content)) !== null) {
    changes.push({
      path: match[1].trim(),
      content: match[2].trim(),
    })
  }

  return changes
}

export function BuilderChat({ files, projectName, onApplyChanges }: BuilderChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('/api/builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          files,
          projectName,
          conversationHistory,
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
                // Parse file changes from the response
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
            } catch (e) {
              // Ignore JSON parse errors
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
  }, [input, isLoading, messages, files, projectName])

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={cn(
      "flex flex-col bg-slate-900 border-l border-slate-700 transition-all duration-300",
      isOpen ? "w-96" : "w-12"
    )}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-900/70 hover:to-blue-900/70 transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        {isOpen && (
          <>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white text-sm">Claude AI</h3>
              <p className="text-xs text-slate-400">Modify your project</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", !isOpen && "rotate-180")} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[calc(100vh-300px)] bg-slate-800">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
                <Bot className="h-10 w-10 mb-3 text-purple-400" />
                <h3 className="text-sm font-medium mb-1 text-white">AI Assistant</h3>
                <p className="text-xs max-w-[200px]">
                  Ask me to modify your website, add features, or fix issues.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onApplyChanges={(changes) => handleApplyChanges(message.id, changes)}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-700 bg-slate-900">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Claude to modify your site..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[40px] max-h-[120px]"
                rows={1}
              />
              {isLoading ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={stopGeneration}
                  className="h-10 w-10"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="h-10 w-10 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function MessageBubble({
  message,
  onApplyChanges,
}: {
  message: Message
  onApplyChanges: (changes: FileChange[]) => void
}) {
  const isUser = message.role === 'user'
  const [showCode, setShowCode] = useState(false)

  // Remove code blocks from display content
  const displayContent = message.content.replace(/```file:[^\n]+\n[\s\S]*?```/g, '').trim()

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      {/* Message */}
      <div className={cn("max-w-[85%] space-y-2", isUser && "text-right")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-100"
          )}
        >
          <p className="whitespace-pre-wrap">{displayContent || '...'}</p>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse ml-1" />
          )}
        </div>

        {/* File Changes */}
        {message.fileChanges && message.fileChanges.length > 0 && (
          <div className="bg-slate-700 rounded-lg border border-slate-600 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5" />
                {message.fileChanges.length} file{message.fileChanges.length > 1 ? 's' : ''} to update
              </span>
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                {showCode ? 'Hide' : 'Show'} code
                {showCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* File list */}
            <div className="space-y-1">
              {message.fileChanges.map((change, idx) => (
                <div key={idx} className="text-xs bg-slate-800 rounded px-2 py-1 flex items-center justify-between">
                  <span className="font-mono text-slate-300 truncate">{change.path}</span>
                  {change.applied && (
                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Code preview */}
            {showCode && (
              <div className="space-y-2">
                {message.fileChanges.map((change, idx) => (
                  <div key={idx} className="bg-slate-900 rounded overflow-hidden">
                    <div className="px-2 py-1 bg-slate-800 text-xs text-slate-400 font-mono">
                      {change.path}
                    </div>
                    <pre className="p-2 text-xs overflow-x-auto max-h-40 text-green-400">
                      <code>{change.content.slice(0, 500)}{change.content.length > 500 ? '...' : ''}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Apply button */}
            {!message.fileChanges.every(fc => fc.applied) && (
              <Button
                size="sm"
                onClick={() => onApplyChanges(message.fileChanges!)}
                className="w-full bg-green-600 hover:bg-green-700 text-xs h-8"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Apply Changes
              </Button>
            )}

            {message.fileChanges.every(fc => fc.applied) && (
              <div className="flex items-center justify-center gap-1 text-xs text-green-400 py-1">
                <Check className="w-3.5 h-3.5" />
                Changes applied
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
