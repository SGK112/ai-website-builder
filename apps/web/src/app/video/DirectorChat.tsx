'use client'

// The Studio's conversational voice CHEF. You talk to it (mic or text) about the
// cut you want from your timeline clips; it chats back (and reads its replies
// aloud), and when you're ready it hands a one-line ORDER to the orchestrator,
// which assembles the whole production. Same brain as the workspace chef — but
// here it can put it all together. Talks to /api/ai/video/director-chat.

import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Mic, Square, Send, X, Volume2, VolumeX, Loader2, Radio } from 'lucide-react'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { useDirectorVoice } from './useDirectorVoice'

interface Turn { role: 'user' | 'assistant'; content: string }
interface ClipIn { id: string; prompt?: string; kind?: 'image' | 'video'; hasUrl?: boolean; url?: string }

interface Props {
  open: boolean
  clips: ClipIn[]
  busy: boolean                    // the Studio is generating / assembling / rendering
  onGenerate: (shots: string[]) => void
  onAssemble: (order: string) => void
  onRender: () => void
  onClose: () => void
}

export default function DirectorChat({ open, clips, busy, onGenerate, onAssemble, onRender, onClose }: Props) {
  const [messages, setMessages] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [speak, setSpeak] = useState(true)        // read replies aloud (voice chef)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const greetedRef = useRef(false)
  const mic = useSpeechToText((t) => setInput(prev => (prev.trim() ? prev.trim() + ' ' : '') + t))
  // Fresh mic object each render — hold it in a ref so the close-cleanup effect
  // can depend on `open` alone (depending on `mic` would re-run every render and
  // stop the recorder mid-sentence).
  const micRef = useRef(mic)
  micRef.current = mic

  // Realtime voice — the SAME continuous voice as the workspace (not push-to-talk).
  const voice = useDirectorVoice({
    onGenerate, onAssemble, onRender,
    getStatus: () => busy ? 'working on it right now' : clips.length ? `${clips.length} clip(s) on the timeline` : 'the timeline is empty',
  })
  const voiceRef = useRef(voice)
  voiceRef.current = voice

  // Greet once when first opened.
  useEffect(() => {
    if (open && !greetedRef.current) {
      greetedRef.current = true
      setMessages([{
        role: 'assistant',
        content: clips.length
          ? `Got ${clips.length} clip${clips.length !== 1 ? 's' : ''} on your timeline. What are we making? Tell me the vibe and I'll cut it together.`
          : `Tell me what you want and I'll cook it up — I can generate the footage, add B-roll, write a voiceover, and put the whole cut together. What are we making?`,
      }])
    }
  }, [open, clips.length])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [messages, sending, busy])

  // Stop audio + mic when the panel closes.
  useEffect(() => {
    if (!open) {
      audioRef.current?.pause()
      if (micRef.current.listening) micRef.current.stop()
      if (voiceRef.current.active) voiceRef.current.stop()
    }
  }, [open])

  async function speakReply(text: string) {
    if (!speak || !text) return
    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tts', text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioRef.current?.pause()
      const a = new Audio(url)
      audioRef.current = a
      a.onended = () => URL.revokeObjectURL(url)
      void a.play().catch(() => { /* autoplay may be blocked — replies still show as text */ })
    } catch { /* readback is best-effort */ }
  }

  async function send() {
    const content = input.trim()
    if (!content || sending || busy) return
    setInput(''); setError(null)
    const base = [...messages, { role: 'user' as const, content }]
    setMessages(base); setSending(true)
    try {
      // Image URLs the chef can SEE (photos/stills on the timeline).
      const mediaUrls = clips.filter(c => c.kind === 'image' && c.url).map(c => c.url as string).slice(0, 6)
      const res = await fetch('/api/ai/video/director-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages.slice(-10), clips, mediaUrls }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || 'The director didn\'t respond.')
      const reply = String(data.reply || '')
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      void speakReply(reply)
      // The chef drives: run whichever action she chose behind the scenes.
      if (data.action === 'generate' && Array.isArray(data.shots) && data.shots.length) onGenerate(data.shots)
      else if (data.action === 'assemble' && data.order) onAssemble(String(data.order))
      else if (data.action === 'render') onRender()
    } catch (e: any) {
      setError(e?.message || 'Director chat failed')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Talk to the director">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md h-[100dvh] bg-zinc-950 border-l border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Clapperboard className="w-4 h-4 text-violet-300" /> Talk to the chef</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSpeak(s => !s)} title={speak ? 'Mute replies' : 'Hear replies'} className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">{speak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}</button>
            <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted text-foreground/80 hover:text-foreground hover:bg-muted/70"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'ml-auto bg-violet-600 text-white' : 'bg-muted text-foreground'}`}>{m.content}</div>
          ))}
          {voice.transcript.map((t) => (
            <div key={`v${t.id}`} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${t.role === 'user' ? 'ml-auto bg-violet-600 text-white' : 'bg-muted text-foreground'}`}>{t.text}</div>
          ))}
          {sending && <div className="bg-muted text-muted-foreground rounded-2xl px-3 py-2 w-14 flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>}
          {busy && <div className="bg-violet-500/15 text-violet-200 rounded-2xl px-3 py-2 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> On it — working behind the scenes. Watch the timeline.</div>}
          {error && <div className="text-rose-300 text-xs px-1">{error}</div>}
        </div>

        <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] border-t border-border shrink-0">
          {/* Realtime voice — the same continuous, hands-free chat as the workspace. */}
          <button onClick={voice.toggle} disabled={busy && !voice.active}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 mb-2 text-sm font-semibold disabled:opacity-40 ${voice.active ? 'bg-rose-500 text-white' : 'bg-violet-600 text-white'}`}>
            {voice.status === 'connecting' ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
              : voice.active ? <><Radio className="w-4 h-4 animate-pulse" /> {voice.status === 'speaking' ? 'Chef is speaking… (tap to end)' : 'Listening… (tap to end)'}</>
              : <><Mic className="w-4 h-4" /> Talk to the chef — voice</>}
          </button>
          {voice.error && <p className="text-[10px] text-rose-300/80 mb-1">{voice.error}</p>}
          {mic.error && <p className="text-[10px] text-rose-300/80 mb-1">{mic.error}</p>}
          <div className="flex items-center gap-1.5 w-full">
            <input
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder={mic.listening ? 'Listening…' : mic.transcribing ? 'Transcribing…' : 'Tell the director…'}
              disabled={mic.listening || mic.transcribing || busy}
              className="flex-1 min-w-0 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 disabled:opacity-70" />
            {mic.supported && (
              <button onClick={mic.toggle} disabled={sending || busy || mic.transcribing} aria-label={mic.listening ? 'Stop' : 'Speak'}
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 ${mic.listening ? 'bg-rose-500 animate-pulse' : 'bg-muted/70 hover:bg-muted/80'}`}>
                {mic.transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : mic.listening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button onClick={send} disabled={!input.trim() || sending || busy} aria-label="Send"
              className="shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white flex items-center justify-center"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
