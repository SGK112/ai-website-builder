'use client'

import { useState, useCallback, useRef } from 'react'
import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  isStreaming?: boolean
  agent?: 'claude' | 'gemini' | 'openai'
  wizardStep?: number
  timestamp: Date
}

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  sessionId: string | null
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  setSessionId: (id: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  sessionId: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setSessionId: (id) => set({ sessionId: id }),
  clearMessages: () => set({ messages: [], sessionId: null }),
}))

export function useChat(projectId?: string) {
  const {
    messages,
    isLoading,
    sessionId,
    addMessage,
    updateMessage,
    setLoading,
    setSessionId,
    clearMessages,
  } = useChatStore()

  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string, wizardStep?: number) => {
      // Add user message
      const userMessageId = crypto.randomUUID()
      addMessage({
        id: userMessageId,
        role: 'user',
        content,
        wizardStep,
        timestamp: new Date(),
      })

      // Add placeholder for assistant response
      const assistantMessageId = crypto.randomUUID()
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        wizardStep,
        timestamp: new Date(),
      })

      setLoading(true)
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            sessionId,
            projectId,
            wizardStep,
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
                  updateMessage(assistantMessageId, {
                    content: fullContent,
                    agent: data.agent,
                  })
                }

                if (data.done && data.sessionId) {
                  setSessionId(data.sessionId)
                  updateMessage(assistantMessageId, {
                    isStreaming: false,
                    agent: data.agent,
                  })
                }

                if (data.error) {
                  throw new Error(data.error)
                }
              } catch (e) {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.log('Chat aborted')
        } else {
          console.error('Chat error:', error)
          updateMessage(assistantMessageId, {
            content: 'Sorry, an error occurred. Please try again.',
            isStreaming: false,
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [
      sessionId,
      projectId,
      addMessage,
      updateMessage,
      setLoading,
      setSessionId,
    ]
  )

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setLoading(false)
  }, [setLoading])

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    clearMessages,
  }
}
