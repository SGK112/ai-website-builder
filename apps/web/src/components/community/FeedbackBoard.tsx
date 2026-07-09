'use client'

// Public feedback board — mounted inside /community as the "Feedback" tab.
// Was a standalone /feedback page; folded in so users get one social surface
// instead of two parallel destinations. /feedback now redirects here.

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp,
  Bug,
  Sparkles,
  HelpCircle,
  Heart,
  MessageSquare,
  Loader2,
  X,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = 'bug' | 'feature' | 'question' | 'compliment'
type Status = 'open' | 'in_progress' | 'shipped' | 'wontfix'
type Sort = 'top' | 'recent'

interface Author {
  id: string
  name: string
  username?: string
  avatar?: string
}
interface Feedback {
  _id: string
  author: Author
  category: Category
  title: string
  body: string
  status: Status
  upvotes: number
  replyCount: number
  viewerUpvoted: boolean
  createdAt: string
}
interface Reply {
  _id: string
  author: Author
  isStaff: boolean
  body: string
  createdAt: string
}

const CATEGORY_META: Record<Category, { label: string; icon: any; accent: string }> = {
  bug: { label: 'Bug', icon: Bug, accent: 'text-red-300' },
  feature: { label: 'Feature', icon: Sparkles, accent: 'text-violet-300' },
  question: { label: 'Question', icon: HelpCircle, accent: 'text-amber-300' },
  compliment: { label: 'Compliment', icon: Heart, accent: 'text-pink-300' },
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
  in_progress: { label: 'In progress', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  shipped: { label: 'Shipped', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  wontfix: { label: "Won't fix", cls: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
}

function relTime(iso: string) {
  const d = new Date(iso).getTime()
  const diffSec = Math.max(0, Math.floor((Date.now() - d) / 1000))
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function FeedbackBoard({ isDark = true }: { isDark?: boolean }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sort, setSort] = useState<Sort>('top')
  const [openId, setOpenId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    const sp = new URLSearchParams()
    if (category !== 'all') sp.set('category', category)
    if (statusFilter !== 'all') sp.set('status', statusFilter)
    sp.set('sort', sort)
    fetch(`/api/feedback?${sp.toString()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((data) => alive && setItems(data.items || []))
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [category, statusFilter, sort])

  const onVote = async (id: string) => {
    if (!session?.user) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent('/community?tab=feedback')}`
      return
    }
    setItems((prev) =>
      prev.map((f) =>
        f._id === id
          ? { ...f, viewerUpvoted: !f.viewerUpvoted, upvotes: f.upvotes + (f.viewerUpvoted ? -1 : 1) }
          : f
      )
    )
    try {
      const res = await fetch(`/api/feedback/${id}/vote`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems((prev) =>
        prev.map((f) => (f._id === id ? { ...f, viewerUpvoted: data.viewerUpvoted, upvotes: data.upvotes } : f))
      )
    } catch {
      setItems((prev) =>
        prev.map((f) =>
          f._id === id
            ? { ...f, viewerUpvoted: !f.viewerUpvoted, upvotes: f.upvotes + (f.viewerUpvoted ? 1 : -1) }
            : f
        )
      )
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className={cn('text-2xl sm:text-3xl font-bold tracking-tight mb-2', isDark ? 'text-white' : 'text-zinc-900')}>
          Tell us what to build, fix, or change.
        </h2>
        <p className={cn('text-sm max-w-2xl', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
          See what's broken, what others are asking for, and what the team's shipping. Upvote anything you want prioritized.
          Replies from the Webstew team appear inline with a staff badge.
        </p>
      </header>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={category === 'all'} onClick={() => setCategory('all')} isDark={isDark}>All</Chip>
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
            const Icon = CATEGORY_META[c].icon
            return (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)} isDark={isDark}>
                <Icon className={cn('w-3.5 h-3.5 mr-1.5', CATEGORY_META[c].accent)} />
                {CATEGORY_META[c].label}
              </Chip>
            )
          })}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
            <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>Status</span>
            <SmallChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} isDark={isDark}>All</SmallChip>
            {(Object.keys(STATUS_META) as Status[]).map((s) => (
              <SmallChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} isDark={isDark}>
                {STATUS_META[s].label}
              </SmallChip>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
            <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>Sort</span>
            <SmallChip active={sort === 'top'} onClick={() => setSort('top')} isDark={isDark}>Top</SmallChip>
            <SmallChip active={sort === 'recent'} onClick={() => setSort('recent')} isDark={isDark}>Recent</SmallChip>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (!session?.user) {
            window.location.href = `/login?callbackUrl=${encodeURIComponent('/community?tab=feedback')}`
            return
          }
          setComposeOpen(true)
        }}
        className="w-full mb-6 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
      >
        <Sparkles className="w-4 h-4" /> Post your feedback
      </button>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className={cn(
          'rounded-2xl border border-dashed p-10 text-center text-sm',
          isDark ? 'border-white/10 text-zinc-400' : 'border-zinc-300 text-zinc-500'
        )}>
          <MessageSquare className="w-8 h-8 text-zinc-500 mx-auto mb-3 opacity-60" />
          No feedback yet matching your filters. Be the first to post.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <FeedbackCard
              key={f._id}
              feedback={f}
              expanded={openId === f._id}
              onToggle={() => setOpenId(openId === f._id ? null : f._id)}
              onVote={() => onVote(f._id)}
              onReplied={() =>
                setItems((prev) => prev.map((x) => (x._id === f._id ? { ...x, replyCount: x.replyCount + 1 } : x)))
              }
              sessionUser={session?.user || null}
              isDark={isDark}
            />
          ))}
        </ul>
      )}

      <AnimatePresence>
        {composeOpen && (
          <ComposeModal
            onClose={() => setComposeOpen(false)}
            onCreated={(created) => {
              setItems((prev) => [created, ...prev])
              setComposeOpen(false)
              setOpenId(created._id)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({
  children,
  active,
  onClick,
  isDark,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  isDark: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
          : isDark
            ? 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
      )}
    >
      {children}
    </button>
  )
}

function SmallChip({
  children,
  active,
  onClick,
  isDark,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  isDark: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold transition-colors',
        active
          ? isDark
            ? 'bg-white/10 text-white'
            : 'bg-zinc-200 text-zinc-900'
          : isDark
            ? 'text-zinc-500 hover:text-zinc-300'
            : 'text-zinc-500 hover:text-zinc-700'
      )}
    >
      {children}
    </button>
  )
}

function FeedbackCard({
  feedback: f,
  expanded,
  onToggle,
  onVote,
  onReplied,
  sessionUser,
  isDark,
}: {
  feedback: Feedback
  expanded: boolean
  onToggle: () => void
  onVote: () => void
  onReplied: () => void
  sessionUser: any
  isDark: boolean
}) {
  const Cat = CATEGORY_META[f.category]?.icon || HelpCircle
  const statusMeta = STATUS_META[f.status] || STATUS_META.open

  return (
    <li className={cn(
      'rounded-2xl border overflow-hidden',
      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-200 bg-white shadow-sm'
    )}>
      <div className="flex gap-3 p-4">
        <button
          onClick={onVote}
          aria-pressed={f.viewerUpvoted}
          aria-label={f.viewerUpvoted ? 'Remove upvote' : 'Upvote'}
          className={cn(
            'shrink-0 w-12 flex flex-col items-center justify-center rounded-xl border transition-colors',
            f.viewerUpvoted
              ? 'bg-violet-500/20 border-violet-500/50 text-violet-200'
              : isDark
                ? 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          )}
        >
          <ArrowUp className="w-4 h-4" />
          <span className="text-xs font-bold mt-0.5">{f.upvotes}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <span className={cn('inline-flex items-center text-[10px] uppercase tracking-wider font-bold', CATEGORY_META[f.category]?.accent)}>
              <Cat className="w-3 h-3 mr-1" /> {CATEGORY_META[f.category]?.label}
            </span>
            <span className={cn('text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold', statusMeta.cls)}>
              {statusMeta.label}
            </span>
            <span className="text-[10px] text-zinc-500">·</span>
            <span className="text-[10px] text-zinc-500">{relTime(f.createdAt)}</span>
          </div>
          <button onClick={onToggle} className="block w-full text-left">
            <h3 className={cn('font-semibold text-sm sm:text-base leading-snug', isDark ? 'text-white' : 'text-zinc-900')}>{f.title}</h3>
            {!expanded && (
              <p className={cn('text-xs sm:text-sm mt-1 line-clamp-2 whitespace-pre-line', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                {f.body}
              </p>
            )}
          </button>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
            <span>by {f.author.username ? `@${f.author.username}` : f.author.name}</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {f.replyCount}
            </span>
            <button onClick={onToggle} className="ml-auto text-violet-400 hover:text-violet-300 font-semibold">
              {expanded ? 'Collapse' : 'Open thread'}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <Thread feedbackId={f._id} body={f.body} onReplied={onReplied} sessionUser={sessionUser} isDark={isDark} />
      )}
    </li>
  )
}

function Thread({
  feedbackId,
  body,
  onReplied,
  sessionUser,
  isDark,
}: {
  feedbackId: string
  body: string
  onReplied: () => void
  sessionUser: any
  isDark: boolean
}) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`/api/feedback/${feedbackId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => alive && setReplies(data.replies || []))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [feedbackId])

  const send = async () => {
    const text = draft.trim()
    if (!text) return
    if (!sessionUser) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent('/community?tab=feedback')}`
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setReplies((prev) => [...prev, created])
      setDraft('')
      onReplied()
    } catch {
      // swallow
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={cn(
      'border-t px-4 py-3',
      isDark ? 'border-white/5 bg-black/20' : 'border-zinc-200 bg-zinc-50'
    )}>
      <p className={cn('text-sm whitespace-pre-line mb-4 leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-700')}>{body}</p>
      {loading ? (
        <div className="text-xs text-zinc-500 inline-flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading replies…
        </div>
      ) : (
        <ul className="space-y-3 mb-3">
          {replies.length === 0 && (
            <li className="text-xs text-zinc-500 italic">No replies yet — be the first.</li>
          )}
          {replies.map((r) => (
            <li key={r._id} className="flex gap-2.5">
              <div className={cn(
                'w-7 h-7 rounded-full overflow-hidden shrink-0',
                isDark ? 'bg-zinc-800' : 'bg-zinc-200'
              )}>
                {r.author.avatar ? (
                  <img src={r.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                  <span className={cn('text-xs font-semibold', isDark ? 'text-zinc-200' : 'text-zinc-800')}>
                    {r.author.username ? `@${r.author.username}` : r.author.name}
                  </span>
                  {r.isStaff && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-200 font-bold border border-violet-500/40">
                      <ShieldCheck className="w-2.5 h-2.5" /> Webstew
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">{relTime(r.createdAt)}</span>
                </div>
                <p className={cn('text-xs sm:text-sm whitespace-pre-line leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-700')}>{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className={cn(
        'flex items-end gap-2 rounded-xl border p-2',
        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
      )}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
          placeholder={sessionUser ? 'Add a reply…' : 'Sign in to reply'}
          rows={1}
          disabled={!sessionUser || sending}
          className={cn(
            'flex-1 bg-transparent text-sm focus:outline-none px-2 py-1.5 min-h-[36px] max-h-[120px] resize-none',
            isDark ? 'text-white placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'
          )}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button
          onClick={send}
          disabled={!sessionUser || sending || !draft.trim()}
          className={cn(
            'p-2 rounded-lg shrink-0 transition-colors',
            draft.trim() && sessionUser && !sending
              ? 'bg-violet-600 text-white'
              : isDark ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
          )}
          aria-label="Send reply"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function ComposeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (f: Feedback) => void
}) {
  const [category, setCategory] = useState<Category>('feature')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      onCreated({
        ...data,
        author: {
          id: data.authorId,
          name: data.authorName,
          username: data.authorUsername,
          avatar: data.authorAvatar,
        },
        viewerUpvoted: false,
      })
    } catch (e: any) {
      setErr(e?.message || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-zinc-950 text-white shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Post feedback</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 -mr-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1.5 block">Category</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
            const Icon = CATEGORY_META[c].icon
            const active = category === c
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  active
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', CATEGORY_META[c].accent)} />
                {CATEGORY_META[c].label}
              </button>
            )
          })}
        </div>

        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1.5 block">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          maxLength={120}
          placeholder="One sentence summary"
          className="w-full mb-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
        />
        <p className="text-[10px] text-zinc-500 mb-4 text-right">{title.length} / 120</p>

        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1.5 block">Detail</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          maxLength={2000}
          rows={5}
          placeholder="What's happening, what should happen, steps to reproduce — whatever helps us understand."
          className="w-full mb-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
        />
        <p className="text-[10px] text-zinc-500 mb-4 text-right">{body.length} / 2000</p>

        {err && <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">{err}</div>}

        <div className="flex items-center gap-2">
          <button
            onClick={submit}
            disabled={submitting || title.length < 3 || body.length < 5}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Post feedback
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </>
  )
}

export default FeedbackBoard
