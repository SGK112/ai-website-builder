'use client'

// Full-screen describe screen. Mirrors Vibecode's "Describe your project
// idea…" pattern — one screen, one job: type a prompt, tap send. Replaces
// the drawer-overlay pattern that felt broken on mobile because it
// inherited desktop sidebar chrome.
//
// Lifecycle:
//   • Workspace mounts this with `open` controlled by the quick-start
//     card the user tapped. The label + intent come from that card.
//   • Submit calls `onSubmit(text)` — workspace runs its existing
//     handleChatMessage path, no special generation surface needed.
//   • Sheet closes itself the moment submit fires; the workspace then
//     shows the streaming preview.

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send, Loader2, Lightbulb, Image as ImageIcon, FileText, Sparkles, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  // Visible context — the target the user chose ("Website", "Mobile app",
  // etc.). Pure display; the parent already set the actual buildTarget
  // before opening this sheet.
  intent: { icon: string; label: string; placeholder: string; tips: string[] } | null
  onSubmit: (text: string) => void
  isGenerating: boolean
}

export function MobileBuildSheet({ open, onClose, intent, onSubmit, isGenerating }: Props) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    // Defer focus until after the open animation; iOS Safari refuses to
    // raise the keyboard if the focus call happens during the transform.
    const t = setTimeout(() => taRef.current?.focus(), 280)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Hide the global MobileBottomNav while this sheet is the foreground —
  // the tab bar otherwise covers the Build button at the bottom of the
  // dock. Modal pattern: when you're describing your idea you can't
  // navigate, so the tabs aren't needed.
  useEffect(() => {
    if (!open) return
    document.body.dataset.mobileSheetOpen = 'true'
    return () => { delete document.body.dataset.mobileSheetOpen }
  }, [open])

  if (!open || !intent) return null

  const submit = () => {
    const v = text.trim()
    if (!v || isGenerating) return
    onSubmit(v)
    setText('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col"
      role="dialog"
      aria-label={`Describe your ${intent.label}`}
    >
      {/* Header — back button + project-type label. Safe-area-inset
          reserves the iPhone notch. */}
      <header
        className="flex items-center justify-between px-3 border-b border-white/[0.06]"
        style={{
          height: 'calc(52px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-300 active:bg-white/5 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{intent.icon}</span>
          <span className="text-base font-semibold text-white">{intent.label}</span>
        </div>
        <button
          onClick={() => taRef.current?.focus()}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 active:bg-white/5 transition-colors"
          aria-label="Tips"
        >
          <Lightbulb className="w-5 h-5" />
        </button>
      </header>

      {/* Body — single big text area that grows with content. The
          attachment dock + send live at the bottom, above the keyboard. */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-3">
        <h2 className="text-2xl font-bold text-white mb-1">Describe your idea</h2>
        <p className="text-sm text-zinc-400 mb-5">
          The more detail, the better the result. Mention sections, colors, and what each page should do.
        </p>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={intent.placeholder}
          rows={6}
          className="w-full min-h-[180px] bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {intent.tips.map((tip) => (
            <button
              key={tip}
              onClick={() => setText((t) => (t ? t + ' ' + tip : tip))}
              className="px-3 py-1.5 rounded-full text-[12px] text-violet-200 bg-violet-500/10 border border-violet-500/30 active:bg-violet-500/20 transition-colors"
            >
              {tip}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom dock — attachment / mic / send. shrink-0 stops flexbox
          from collapsing the row to 0 when the keyboard reduces the
          visible viewport on iOS. */}
      <div
        className="shrink-0 border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl px-3 py-2.5 flex items-center gap-2"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 active:bg-white/5 transition-colors"
          aria-label="Add image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 active:bg-white/5 transition-colors"
          aria-label="Attach file"
        >
          <FileText className="w-5 h-5" />
        </button>
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 active:bg-white/5 transition-colors"
          aria-label="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={submit}
          disabled={!text.trim() || isGenerating}
          className={cn(
            'h-12 px-5 rounded-2xl flex items-center gap-2 font-semibold text-[15px] transition-all',
            text.trim() && !isGenerating
              ? 'bg-violet-600 active:bg-violet-700 text-white shadow-lg shadow-violet-900/40'
              : 'bg-white/5 text-zinc-600'
          )}
          aria-label="Build"
        >
          {isGenerating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Building…</>
            : <><Sparkles className="w-4 h-4" /> Build</>}
        </button>
      </div>
    </div>
  )
}
