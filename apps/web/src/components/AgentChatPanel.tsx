'use client'

// AgentChatPanel — refinement chat for the builder. Streams agent events
// from POST /api/builder/agent and renders them inline as a live transcript:
//
//   • assistant text (Claude's prose)
//   • tool calls (read_file, write_file, etc.) with a colored chip
//   • tool results (collapsed by default, expandable)
//   • file_update events bubble up to the parent via onFilesChanged so the
//     workspace can hot-reload its file tree + WebContainer preview
//
// The whole UI is one flat scrolling column of turns. Each turn is either
// `user`, `assistant_text`, `tool_use` (with result), or `done`/`error`.

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Send, Loader2, FileText, FileCheck, FileX, FilePlus, List, CheckCircle2,
  AlertCircle, Wrench, ChevronDown, ChevronRight, Square, Sparkles, Zap,
} from 'lucide-react'

type EventType = 'text' | 'tool_use' | 'tool_result' | 'file_update' | 'file_delete' | 'done' | 'error'

interface AgentEvent {
  type: EventType
  data: any
  // Generated client-side so we can correlate tool_use ↔ tool_result
  ts: number
}

interface Turn {
  id: string
  kind: 'user' | 'agent'
  // For 'user': just text
  text?: string
  // For 'agent': a sequence of mixed events
  events?: AgentEvent[]
  finished?: boolean
  summary?: string | null
  error?: string | null
  // Populated when the server returned a 429 monthly-credit cap. Rendered as
  // a real upgrade CTA instead of plain red error text.
  upgrade?: { plan: string; used: number; limit: number } | null
}

export interface AgentChatPanelProps {
  // Current VFS — passed to the agent so it can see what exists.
  files: Record<string, string>
  // Called when a file is created/updated/deleted by the agent.
  onFilesChanged: (next: Record<string, string>) => void
  // Optional: persist alongside Mongo project doc
  projectId?: string
  // Optional: drive Anthropic model choice
  model?: string
  // Target hint for the agent's system prompt
  target?: 'website' | 'nextjs' | 'react' | 'astro' | 'expo'
  // Optional: initial prompt pre-filled in the input
  initialInput?: string
  className?: string
}

const TOOL_LABELS: Record<string, { label: string; icon: any; tone: string }> = {
  list_files:  { label: 'list files',  icon: List,      tone: 'text-slate-400' },
  read_file:   { label: 'read',        icon: FileText,  tone: 'text-blue-300' },
  write_file:  { label: 'write',       icon: FileCheck, tone: 'text-emerald-300' },
  delete_file: { label: 'delete',      icon: FileX,     tone: 'text-red-300' },
  done:        { label: 'done',        icon: CheckCircle2, tone: 'text-violet-300' },
}

export function AgentChatPanel({
  files,
  onFilesChanged,
  projectId,
  model,
  target,
  initialInput,
  className,
}: AgentChatPanelProps) {
  const [input, setInput] = useState(initialInput || '')
  const [turns, setTurns] = useState<Turn[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const filesRef = useRef(files)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep filesRef current so the live agent stream can read the latest state
  // without re-rendering this component each keystroke.
  useEffect(() => { filesRef.current = files }, [files])

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [turns])

  const pushAgentEvent = useCallback((turnId: string, ev: AgentEvent) => {
    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId ? { ...t, events: [...(t.events || []), ev] } : t
      )
    )
  }, [])

  const finishTurn = useCallback((turnId: string, patch: Partial<Turn>) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, ...patch, finished: true } : t))
    )
  }, [])

  const submit = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userTurn: Turn = { id: `u-${Date.now()}`, kind: 'user', text, finished: true }
    const agentTurn: Turn = { id: `a-${Date.now()}`, kind: 'agent', events: [] }
    setTurns((prev) => [...prev, userTurn, agentTurn])
    setInput('')
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    // Build history for multi-turn — pairs of (user prompt, agent summary).
    // Keep last 4 exchanges to stay under token budget.
    const history = turns
      .filter((t) => t.finished)
      .slice(-8)
      .map((t) =>
        t.kind === 'user'
          ? { role: 'user' as const, content: t.text || '' }
          : { role: 'assistant' as const, content: t.summary || (t.events || []).map((e) => e.type === 'text' ? e.data.text : '').join('') }
      )
      .filter((m) => m.content)

    try {
      const res = await fetch('/api/builder/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          files: filesRef.current,
          history,
          model,
          projectId,
          target,
        }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '')
        // 429 with `upgrade: true` payload → render upgrade CTA instead of
        // raw red text. Other failures fall through to the generic error.
        if (res.status === 429) {
          try {
            const payload = JSON.parse(errText)
            if (payload?.upgrade) {
              finishTurn(agentTurn.id, {
                error: payload.error || 'Monthly limit reached',
                upgrade: {
                  plan: String(payload.plan || 'free'),
                  used: Number(payload.used || 0),
                  limit: Number(payload.limit || 0),
                },
              })
              return
            }
          } catch { /* fall through */ }
        }
        finishTurn(agentTurn.id, { error: `HTTP ${res.status}: ${errText.slice(0, 200)}` })
        return
      }

      // Stream parser — events come in as `event: X\ndata: {...}\n\n` chunks.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const pendingFileUpdates: Record<string, string> = {}
      const pendingFileDeletes: string[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // SSE chunks split on \n\n
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() || ''
        for (const chunk of chunks) {
          const lines = chunk.split('\n')
          let eventName = 'message'
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim()
          }
          if (!dataLine) continue
          let payload: any
          try { payload = JSON.parse(dataLine) } catch { continue }

          if (eventName === 'file_update') {
            // Stash and flush in one setState call after the stream ends to
            // avoid re-rendering the entire workspace per-file.
            pendingFileUpdates[payload.path] = payload.contents
          } else if (eventName === 'file_delete') {
            pendingFileDeletes.push(payload.path)
          }

          // All event types feed the agent turn transcript
          pushAgentEvent(agentTurn.id, {
            type: eventName as EventType,
            data: payload,
            ts: Date.now(),
          })

          if (eventName === 'done') {
            finishTurn(agentTurn.id, { summary: payload.summary, finished: true })
          } else if (eventName === 'error') {
            finishTurn(agentTurn.id, { error: payload.message, finished: true })
          }
        }
      }

      // Flush file changes to parent in a single batch.
      if (Object.keys(pendingFileUpdates).length > 0 || pendingFileDeletes.length > 0) {
        const next = { ...filesRef.current, ...pendingFileUpdates }
        for (const p of pendingFileDeletes) delete next[p]
        onFilesChanged(next)
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        finishTurn(agentTurn.id, { error: e?.message || 'Network error' })
      } else {
        finishTurn(agentTurn.id, { error: 'Stopped by user' })
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [input, isStreaming, turns, model, projectId, target, finishTurn, pushAgentEvent, onFilesChanged])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border border-white/10 rounded-xl overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-mono text-slate-300">agent</span>
          {isStreaming && (
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              working
            </span>
          )}
        </div>
        {isStreaming && (
          <button onClick={stop} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
            <Square className="w-3 h-3" /> Stop
          </button>
        )}
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {turns.length === 0 && (
          <div className="text-slate-500 text-xs leading-relaxed py-8 text-center">
            Ask the agent to refine your project. It can read any file, then write the changes.
            <div className="mt-3 space-y-1 text-slate-600">
              <div>"change the hero image to a moody pizza shot"</div>
              <div>"add a press section with NYT, Eater, SF Chronicle"</div>
              <div>"swap the accent color from violet to amber globally"</div>
            </div>
          </div>
        )}
        {turns.map((t) => (
          <TurnView key={t.id} turn={t} />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3 bg-zinc-900/40">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
            placeholder={isStreaming ? 'Agent is working…' : 'Refine — e.g. "change the hero image to a wood-fired pizza"'}
            disabled={isStreaming}
            rows={2}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none resize-none disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isStreaming}
            className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 text-sm font-medium transition"
            title="⌘+Enter"
          >
            {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-600">⌘+Enter to send</div>
      </div>
    </div>
  )
}

function TurnView({ turn }: { turn: Turn }) {
  if (turn.kind === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-violet-600 text-white rounded-2xl rounded-br-md px-3 py-2 text-sm">
          {turn.text}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      {(turn.events || []).map((ev, i) => (
        <EventView key={i} event={ev} />
      ))}
      {turn.upgrade ? (
        <div className="mt-1 px-3 py-3 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-500/40 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-300 mt-0.5 shrink-0" />
            <div className="text-sm text-violet-100 font-medium">You're out of monthly credits</div>
          </div>
          <div className="text-xs text-violet-200/80 mb-3 leading-relaxed">
            Used {turn.upgrade.used.toLocaleString()} / {turn.upgrade.limit.toLocaleString()} on the {turn.upgrade.plan} plan.
            Upgrade for more, top up with a credit pack, or paste your own Anthropic key in Settings.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade plan
            </Link>
            <Link
              href="/upgrade#credits"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition"
            >
              Buy credits
            </Link>
          </div>
        </div>
      ) : turn.error && (
        <div className="mt-1 flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
          <div className="text-xs text-red-300">{turn.error}</div>
        </div>
      )}
      {turn.summary && (
        <div className="mt-1 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs text-violet-200 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
          <div>{turn.summary}</div>
        </div>
      )}
    </div>
  )
}

function EventView({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false)

  if (event.type === 'text') {
    const text = event.data.text || ''
    if (!text.trim()) return null
    return <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</div>
  }

  if (event.type === 'tool_use') {
    const meta = TOOL_LABELS[event.data.name] || { label: event.data.name, icon: Wrench, tone: 'text-slate-400' }
    const Icon = meta.icon
    const path = event.data.input?.path
    const summary = event.data.name === 'list_files'
      ? 'project files'
      : event.data.name === 'done'
        ? event.data.input?.summary || 'done'
        : path || ''
    return (
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/[0.03] transition text-left"
      >
        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.tone}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-mono ${meta.tone}`}>{meta.label}</span>
            {summary && <span className="text-slate-500 truncate font-mono">{summary}</span>}
            {expanded ? <ChevronDown className="w-3 h-3 text-slate-600 ml-auto" /> : <ChevronRight className="w-3 h-3 text-slate-600 ml-auto" />}
          </div>
          {expanded && event.data.input && (
            <pre className="mt-1 text-[10px] text-slate-500 bg-black/40 rounded p-2 overflow-x-auto max-h-40">
              {JSON.stringify(event.data.input, null, 2).slice(0, 1200)}
            </pre>
          )}
        </div>
      </button>
    )
  }

  if (event.type === 'tool_result') {
    if (event.data.ok) return null // success is implicit — covered by the tool_use chip
    return (
      <div className="ml-5 text-[11px] text-red-300 font-mono">
        × {event.data.content?.slice(0, 200)}
      </div>
    )
  }

  if (event.type === 'file_update') {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-emerald-300 font-mono">
        <FilePlus className="w-3 h-3" />
        {event.data.path}
        <span className="text-slate-600">({event.data.contents?.length || 0} chars)</span>
      </div>
    )
  }

  if (event.type === 'file_delete') {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-red-300 font-mono">
        <FileX className="w-3 h-3" />
        deleted {event.data.path}
      </div>
    )
  }

  return null
}
