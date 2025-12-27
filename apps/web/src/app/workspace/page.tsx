'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Loader2,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Download,
  RefreshCw,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Copy,
  Check,
  Paintbrush,
  ExternalLink,
} from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

// Device sizes for preview
const DEVICES = {
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', icon: Smartphone, label: 'Mobile' },
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function WorkspacePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // State
  const [html, setHtml] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingPhase, setGeneratingPhase] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [visualEditorStatus, setVisualEditorStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Generate website from prompt - defined before useEffect that uses it
  const generateWebsite = useCallback(async (prompt: string) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setIsGenerating(true)
    setGeneratingPhase('analyzing')

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch('/api/ai/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, theme }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Generation failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

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

              if (data.type === 'status') {
                setGeneratingPhase(data.phase || data.message)
              } else if (data.type === 'complete' && data.code?.html) {
                setHtml(data.code.html)
                // Add assistant message
                setMessages(prev => [...prev, {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: "I've created your website! You can see the preview on the right. Let me know if you'd like any changes.",
                  timestamp: new Date(),
                }])
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      console.error('Generation error:', error)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setIsGenerating(false)
      setGeneratingPhase('')
    }
  }, [theme])

  // Initialize from URL params
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    const urlTheme = searchParams.get('theme') as 'light' | 'dark' | null

    if (urlTheme) setTheme(urlTheme)

    if (prompt && !html && !isGenerating) {
      generateWebsite(prompt)
    }
  }, [searchParams, html, isGenerating, generateWebsite])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Refine website with chat
  const handleRefine = useCallback(async () => {
    if (!input.trim() || isGenerating || !html) return

    const prompt = input.trim()
    setInput('')

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setIsGenerating(true)
    setGeneratingPhase('refining')

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }])

    try {
      const response = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentHtml: html,
          theme,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Refinement failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let assistantMessage = ''

      // Add placeholder assistant message
      const msgId = `assistant-${Date.now()}`
      setMessages(prev => [...prev, {
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
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

              if (data.type === 'thinking' || data.type === 'update') {
                assistantMessage = data.message || 'Working on it...'
                setMessages(prev => prev.map(m =>
                  m.id === msgId ? { ...m, content: assistantMessage } : m
                ))
              } else if (data.type === 'complete') {
                if (data.html) setHtml(data.html)
                assistantMessage = data.message || 'Done! I\'ve updated the design.'
                setMessages(prev => prev.map(m =>
                  m.id === msgId ? { ...m, content: assistantMessage } : m
                ))
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      console.error('Refine error:', error)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I couldn\'t make that change. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setIsGenerating(false)
      setGeneratingPhase('')
    }
  }, [input, html, theme, messages, isGenerating])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (html) {
        handleRefine()
      } else {
        generateWebsite(input)
        setInput('')
      }
    }
  }

  // Copy HTML to clipboard
  const copyHtml = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Download HTML file
  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'website.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Check visual editor (Microweber) status
  const checkVisualEditor = useCallback(async () => {
    try {
      const response = await fetch('/api/visual-editor')
      const data = await response.json()
      setVisualEditorStatus(data.available ? 'available' : 'unavailable')
    } catch {
      setVisualEditorStatus('unavailable')
    }
  }, [])

  // Open visual editor with current HTML
  const openVisualEditor = async () => {
    if (!html) return

    try {
      const response = await fetch('/api/visual-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', html }),
      })
      const data = await response.json()

      if (data.success) {
        // Open Microweber in a new window
        window.open('http://localhost:8080', '_blank')
      }
    } catch (error) {
      console.error('Failed to open visual editor:', error)
    }
  }

  // Check visual editor on mount
  useEffect(() => {
    checkVisualEditor()
  }, [checkVisualEditor])

  // Quick suggestions
  const suggestions = html ? [
    'Make it more modern',
    'Add more spacing',
    'Change colors to blue',
    'Make text larger',
  ] : [
    'A SaaS landing page',
    'A coffee shop website',
    'A portfolio for a designer',
    'An agency homepage',
  ]

  return (
    <div className="h-screen flex bg-slate-950 text-white overflow-hidden">
      {/* Chat Panel */}
      <div className={`flex flex-col border-r border-slate-800 transition-all ${isFullscreen ? 'w-0 overflow-hidden' : 'w-[400px]'}`}>
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">AI Builder</span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isGenerating && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">What would you like to build?</h2>
              <p className="text-sm text-slate-400">Describe your website and I'll create it for you.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-slate-300 capitalize">{generatingPhase || 'Generating'}...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !isGenerating && (
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-500 mb-2">Try:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s)
                    inputRef.current?.focus()
                  }}
                  className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-end gap-2 bg-slate-800 rounded-xl p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={html ? "Describe changes..." : "Describe your website..."}
              className="flex-1 bg-transparent text-sm resize-none min-h-[40px] max-h-[120px] p-2 focus:outline-none"
              rows={1}
              disabled={isGenerating}
            />
            <button
              onClick={() => html ? handleRefine() : (generateWebsite(input), setInput(''))}
              disabled={!input.trim() || isGenerating}
              className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col">
        {/* Preview Toolbar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-1">
            {Object.entries(DEVICES).map(([key, { icon: Icon, label }]) => (
              <button
                key={key}
                onClick={() => setDevice(key as typeof device)}
                className={`p-2 rounded-lg transition ${device === key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`p-2 rounded-lg transition ${showCode ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              title="View Code"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={copyHtml}
              disabled={!html}
              className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition"
              title="Copy HTML"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={downloadHtml}
              disabled={!html}
              className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => html && generateWebsite(messages.find(m => m.role === 'user')?.content || '')}
              disabled={!html || isGenerating}
              className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={openVisualEditor}
              disabled={!html || visualEditorStatus === 'unavailable'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                visualEditorStatus === 'available'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white disabled:opacity-50'
              }`}
              title={visualEditorStatus === 'available' ? 'Open Visual Editor (Microweber)' : 'Visual editor not available'}
            >
              <Paintbrush className="w-4 h-4" />
              Visual Edit
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-slate-950 rounded-lg overflow-auto"
              >
                <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap">
                  {html || '// Your website code will appear here'}
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
                style={{
                  width: DEVICES[device].width,
                  maxWidth: '100%',
                  height: '100%',
                }}
              >
                {html ? (
                  <iframe
                    srcDoc={html}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <div className="text-center px-8">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {isGenerating ? 'Creating your website...' : 'Your website preview'}
                      </h3>
                      <p className="text-slate-600">
                        {isGenerating
                          ? 'AI is designing a custom website based on your description.'
                          : 'Describe what you want to build in the chat.'}
                      </p>
                      {isGenerating && (
                        <div className="flex justify-center gap-1 mt-6">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
