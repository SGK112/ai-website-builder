'use client'

// Thumbs up/down on an AI build/edit message. A down-vote opens a quick "what
// went wrong?" box; the note is fed back into this user's future builds (see
// /api/builder/feedback + getRecentNegativeNotes). Its own module so the
// workspace page doesn't grow another inline widget.

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react'

export function MessageFeedback({
  messageKey, prompt, projectId, target, isDark,
}: {
  messageKey: string
  prompt?: string
  projectId?: string | null
  target?: string
  isDark: boolean
}) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [thanks, setThanks] = useState(false)

  const post = (r: 'up' | 'down', c?: string) =>
    fetch('/api/builder/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageKey, rating: r, comment: c, prompt, projectId, target }),
    }).catch((e) => console.warn('[feedback] post failed:', e?.message))

  const onUp = () => { setRating('up'); setShowComment(false); setThanks(true); void post('up') }
  const onDown = () => { setRating('down'); setShowComment(true); void post('down') }
  const submitComment = () => {
    setShowComment(false); setThanks(true)
    void post('down', comment.trim() || undefined)
  }

  const muted = isDark ? 'text-zinc-600' : 'text-slate-400'
  const active = isDark ? 'text-violet-400' : 'text-violet-600'
  const down = isDark ? 'text-amber-400' : 'text-amber-600'

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1.5">
        <button onClick={onUp} title="Good" className={`rounded p-1 transition hover:bg-white/5 ${rating === 'up' ? active : muted}`}>
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDown} title="Needs work" className={`rounded p-1 transition hover:bg-white/5 ${rating === 'down' ? down : muted}`}>
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
        {thanks && (
          <span className={`flex items-center gap-1 text-[11px] ${muted}`}>
            <Check className="h-3 w-3" /> Thanks — I'll learn from that
          </span>
        )}
      </div>
      {showComment && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitComment() }}
            placeholder="What went wrong? (optional — helps me improve)"
            autoFocus
            className={`w-64 rounded-lg px-2.5 py-1 text-[12px] outline-none ring-1 ${isDark ? 'bg-white/[0.03] ring-white/10 text-white placeholder-zinc-600' : 'bg-slate-50 ring-slate-200 text-slate-900 placeholder-slate-400'}`}
          />
          <button onClick={submitComment} className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-500">Send</button>
        </div>
      )}
    </div>
  )
}
