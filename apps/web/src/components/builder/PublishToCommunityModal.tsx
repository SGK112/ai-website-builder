'use client'

// Lightweight modal — collect a title/description/category, POST the
// current project HTML to /api/community/posts as type='website', land
// the user on the new listing in /community.
//
// v1: anyone can publish. Approval queue + paid listings + Stripe Connect
// payouts come in a follow-up. Today this just gets user-generated
// listings flowing so the catalog isn't empty.

import { useEffect, useState } from 'react'
import { X, Send, Loader2, AlertCircle, Check } from 'lucide-react'

interface PublishToCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  projectId?: string | null
  html: string
}

const CATEGORIES = [
  { value: 'general',    label: 'General' },
  { value: 'business',   label: 'Business / agency' },
  { value: 'landing',    label: 'Landing page' },
  { value: 'portfolio',  label: 'Portfolio' },
  { value: 'ecommerce',  label: 'E-commerce' },
  { value: 'restaurant', label: 'Restaurant / food' },
  { value: 'saas',       label: 'SaaS' },
  { value: 'blog',       label: 'Blog / content' },
  { value: 'event',      label: 'Event' },
  { value: 'nonprofit',  label: 'Non-profit' },
]

export function PublishToCommunityModal({
  isOpen,
  onClose,
  projectName,
  projectId,
  html,
}: PublishToCommunityModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reset state every time the modal opens with a fresh project.
  useEffect(() => {
    if (isOpen) {
      setTitle(projectName || '')
      setDescription('')
      setCategory('general')
      setTags('')
      setIsPublic(true)
      setError(null)
      setSuccess(null)
    }
  }, [isOpen, projectName])

  if (!isOpen) return null

  const submit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!html || html.length < 200) {
      setError('Project has no content to publish yet.')
      return
    }
    setSubmitting(true)
    try {
      // Thumbnail: deterministic picsum seed so the listing always has SOMETHING
      // visible. Sellers can replace with a real screenshot from the
      // dashboard later (v2 — screenshot service not wired).
      const seed = encodeURIComponent((projectId || title || 'webstew').slice(0, 40))
      const thumbnail = `https://picsum.photos/seed/${seed}/800/600`

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'website',
          title: title.trim(),
          description: description.trim(),
          html,
          thumbnail,
          category,
          tags: tags
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 8),
          isPublic,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      // Status comes back on the post — 'pending' means it's queued for
      // admin review, 'approved' means it's already live (admin authors
      // auto-approve their own posts).
      const isPending = data?.post?.status === 'pending'
      setSuccess(
        isPending
          ? 'Submitted for review. You\'ll see it in the community feed as soon as an admin approves it (usually within a day).'
          : 'Published! View it in the community feed.'
      )
      // Close after a moment so the user sees the confirmation.
      setTimeout(() => {
        onClose()
        // Soft nav to the community feed so they see their listing
        // (pending posts are visible to their own author).
        window.location.href = '/community'
      }, 2000)
    } catch (e: any) {
      setError(e?.message || 'Failed to publish')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold text-white">Publish to community</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Anyone can view + remix. You stay the author.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Title <span className="text-red-400">*</span></span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="A short, clear name"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What is it? Who's it for?"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
            />
            <span className="text-[10px] text-zinc-600">{description.length}/500</span>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-zinc-900">{c.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Tags <span className="text-zinc-600">(comma separated, max 8)</span></span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="dark, modern, minimal"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5"
            />
            <span>Publish publicly — visible in the community feed</span>
          </label>

          <div className="text-xs text-zinc-500 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <strong className="text-amber-300">Heads-up:</strong> v1 of the marketplace is community-visibility only. Paid listings + Stripe payouts are coming. Anything you publish now is free for others to view and use.
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !title.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Publish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
