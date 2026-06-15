'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Clapperboard, Send, Sparkles, Wand2 } from 'lucide-react'

interface DirectorContext {
  mode: 'text' | 'image'
  model: string
  modelLabel?: string
  imageCount?: number
  style?: string
  aspectRatio?: string
  duration?: number
}

interface Msg { role: 'user' | 'assistant'; content: string }

interface Props {
  open: boolean
  initialPrompt: string
  context: DirectorContext
  onApply: (prompt: string) => void
  onClose: () => void
}

// A "film director" chat that turns a rough idea into a model-tuned video
// prompt. Talks to /api/ai/video/coach. When it has enough, it surfaces a
// crafted prompt the user can drop straight into the generator.
export default function VideoDirectorChat({ open, initialPrompt, context, onApply, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [crafted, setCrafted] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Kick off the conversation once when opened, seeding the director with
  // whatever the user already typed (or a blank-slate ask).
  useEffect(() => {
    if (!open) { startedRef.current = false; return }
    if (startedRef.current) return
    startedRef.current = true
    setMessages([]); setSuggestions([]); setCrafted(null); setError(null); setInput('')
    const seed = initialPrompt.trim() ||
      (context.mode === 'image' ? 'Help me animate my image into a great video.' : 'Help me craft a great video prompt.')
    void send(seed, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, crafted])

  async function send(message: string, priorOverride?: Msg[]) {
    const prior = priorOverride ?? messages
    setError(null)
    setSuggestions([])
    const next = [...prior, { role: 'user' as const, content: message }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/video/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: prior,
          mode: context.mode,
          model: context.model,
          modelLabel: context.modelLabel,
          imageCount: context.imageCount,
          style: context.style,
          aspectRatio: context.aspectRatio,
          duration: context.duration,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || `Director unavailable (HTTP ${res.status}).`)
      setMessages([...next, { role: 'assistant', content: data.reply || '' }])
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
      setCrafted(data.craftedPrompt || null)
    } catch (e: any) {
      setError(e?.message || 'The director is unavailable right now.')
      setMessages(next)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="AI Director">
      <div className="w-full sm:max-w-lg h-[85vh] sm:h-[640px] flex flex-col rounded-t-2xl sm:rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Clapperboard className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI Director</div>
              <div className="text-[10px] text-zinc-400">Crafting for {context.modelLabel || context.model}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={[
                'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                m.role === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white/[0.06] text-zinc-100 rounded-bl-sm',
              ].join(' ')}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
              </div>
            </div>
          )}

          {/* Crafted prompt card */}
          {crafted && !loading && (
            <div className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/[0.07] p-3">
              <div className="flex items-center gap-1.5 mb-1.5 text-fuchsia-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Director's cut</span>
              </div>
              <p className="text-sm text-zinc-100 leading-relaxed">{crafted}</p>
              <button
                onClick={() => { onApply(crafted); onClose() }}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium py-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Use this prompt
              </button>
            </div>
          )}

          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
        </div>

        {/* Suggestion chips */}
        {suggestions.length > 0 && !loading && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-200 text-xs hover:bg-violet-500/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/10 p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim() && !loading) send(input.trim()) } }}
            placeholder="Answer the director, or refine…"
            rows={1}
            className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 max-h-28"
          />
          <button
            onClick={() => { if (input.trim() && !loading) send(input.trim()) }}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
