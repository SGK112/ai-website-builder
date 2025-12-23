'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  projectId?: string
  wizardStep?: number
  placeholder?: string
  initialMessage?: string
}

export function ChatInterface({
  projectId,
  wizardStep,
  placeholder = 'Type your message...',
  initialMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const { messages, isLoading, sendMessage, stopGeneration } = useChat(projectId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send initial message
  useEffect(() => {
    if (initialMessage && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true
      sendMessage(initialMessage, wizardStep)
    }
  }, [initialMessage, messages.length, sendMessage, wizardStep])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message, wizardStep)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">AI Tour Guide</h3>
            <p className="max-w-sm">
              I'm here to help you build your website. Tell me about your project!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={stopGeneration}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

function MessageBubble({
  message,
}: {
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    isStreaming?: boolean
    agent?: string
  }
}) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Message */}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
        {message.agent && !isUser && (
          <p className="text-xs mt-1 opacity-60">
            Powered by {message.agent}
          </p>
        )}
      </div>
    </div>
  )
}
