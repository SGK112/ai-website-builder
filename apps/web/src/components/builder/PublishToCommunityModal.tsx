'use client'

// Lightweight modal — collect a title/description/category, POST the
// current project HTML to /api/community/posts as type='website', land
// the user on the new listing in /community.
//
// v1: anyone can publish. Approval queue + paid listings + Stripe Connect
// payouts come in a follow-up. Today this just gets user-generated
// listings flowing so the catalog isn't empty.

import { useEffect, useState } from 'react'
import { X, Send, Loader2, AlertCircle, Check, Image as ImageIcon, Upload } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

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
  // Pricing — empty / 0 = free listing; >0 = paid (priced in credits, where
  // 100 credits = $1). Buyers pay credits via /api/marketplace/buy. Cashout
  // converts credits → USD via the existing payouts route. Sellers keep 70%.
  const [priceCredits, setPriceCredits] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // Optional custom thumbnail. If unset we'll auto-generate a picsum seed
  // on the server. If user uploads a real screenshot, we use that.
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, () => { if (!submitting) onClose() })

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail must be under 5MB.')
      return
    }
    setUploadingThumb(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed')
      setThumbnailUrl(data.url)
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
    } finally {
      setUploadingThumb(false)
    }
  }

  // Reset state every time the modal opens with a fresh project.
  useEffect(() => {
    if (isOpen) {
      setTitle(projectName || '')
      setDescription('')
      setCategory('general')
      setTags('')
      setIsPublic(true)
      setPriceCredits('')
      setThumbnailUrl('')
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
      // Thumbnail: prefer the user's uploaded screenshot (real preview of
      // their site). Fall back to a deterministic picsum seed so the
      // listing always has SOMETHING visible if they skip the upload.
      const seed = encodeURIComponent((projectId || title || 'webstew').slice(0, 40))
      const thumbnail = thumbnailUrl || `https://picsum.photos/seed/${seed}/800/600`

      const priceNum = Math.max(0, Math.floor(Number(priceCredits) || 0))
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
          // Optional paid listing — server validates and sets isPremium flag
          // alongside price_credits so the buy/checkout routes pick it up.
          ...(priceNum > 0 && { priceCredits: priceNum }),
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
      const username: string | undefined = data?.post?.author?.username
      const profileUrl = username ? `/u/${username}` : '/community'
      setSuccess(
        isPending
          ? `Submitted for review. As soon as an admin approves it, it'll show up on your creator page${username ? ` at /u/${username}` : ''}.`
          : `Published! View your creator page${username ? ` at /u/${username}` : ''}.`
      )
      // Close after a moment so the user sees the confirmation.
      setTimeout(() => {
        onClose()
        // For approved (auto-admin), land them on their public profile so
        // they see their listing live. For pending, send to /community
        // where their own pending posts are visible.
        window.location.href = isPending ? '/community' : profileUrl
      }, 2200)
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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-community-title"
        className="w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 id="publish-community-title" className="font-semibold text-white">Publish to community</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Anyone can view + remix. You stay the author.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5">
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

          <div className="block">
            <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Thumbnail <span className="text-zinc-600">(optional — recommend a real screenshot)</span></span>
            {thumbnailUrl ? (
              <div className="flex items-center gap-3">
                <img src={thumbnailUrl} alt="Thumbnail" className="w-24 h-16 object-cover rounded-lg border border-white/10" />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
                  className="text-xs text-zinc-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-white/15 cursor-pointer hover:border-violet-500/40 transition text-sm text-zinc-400 ${uploadingThumb ? 'opacity-60' : ''}`}>
                {uploadingThumb ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" /> Click to upload a screenshot</>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleThumbUpload}
                  disabled={uploadingThumb}
                />
              </label>
            )}
            <span className="text-[10px] text-zinc-600">PNG/JPG/WebP up to 5MB. We'll auto-generate a placeholder if you skip.</span>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5"
            />
            <span>Publish publicly — visible in the community feed</span>
          </label>

          {/* Pricing — leave blank for free; anything > 0 makes the listing
              paid. Buyers spend credits; you cash out USD from /seller. */}
          <label className="block">
            <span className="text-xs font-medium text-zinc-400 mb-1.5 block flex items-center justify-between">
              <span>Price <span className="text-zinc-600">(credits — leave blank for free)</span></span>
              {Number(priceCredits) > 0 && (
                <span className="text-emerald-400 text-[11px]">
                  ≈ ${(Number(priceCredits) / 100).toFixed(2)} · you keep ${(Number(priceCredits) * 0.7 / 100).toFixed(2)}
                </span>
              )}
            </span>
            <input
              type="number"
              min={0}
              step={50}
              value={priceCredits}
              onChange={(e) => setPriceCredits(e.target.value)}
              placeholder="0 = free"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-zinc-600 mt-1 block">
              100 credits = $1. Webstew takes 30% to cover Stripe + hosting. Payouts at /seller.
            </span>
          </label>

          {!Number(priceCredits) && (
            <div className="text-xs text-zinc-500 leading-relaxed bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <strong className="text-blue-300">Free listing.</strong> Anyone can view, remix, and use it. Set a price above to make it a paid template.
            </div>
          )}

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
