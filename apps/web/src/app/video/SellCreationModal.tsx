'use client'

import { useState } from 'react'
import { X, Tag, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'

interface SellTarget { id: string; kind: 'clip' | 'video' | 'image'; url: string; title: string }

// Lists a saved Studio creation for sale in the community marketplace. Posts to
// the SAME /api/community/posts endpoint websites use (type:'video'); the buy /
// checkout / payout routes already handle any listing type. Honest about the
// two real gates: listings are moderated (start 'pending'), and to RECEIVE money
// the seller must finish Stripe payout setup (enforced at checkout).
export default function SellCreationModal({ target, onClose }: { target: SellTarget; onClose: () => void }) {
  const [title, setTitle] = useState(target.title || 'My video')
  const [description, setDescription] = useState('')
  const [priceUsd, setPriceUsd] = useState('5')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Pricing is in credits (1 credit = $0.01). Sellers keep 97% (3% platform fee).
  const priceCredits = Math.max(0, Math.round(parseFloat(priceUsd || '0') * 100))
  const youKeep = (priceCredits * 0.97 / 100).toFixed(2)

  // A still frame from a Cloudinary video makes a good listing thumbnail.
  const poster = /cloudinary\.com/.test(target.url)
    ? target.url.replace('/video/upload/', '/video/upload/so_0/').replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg')
    : undefined

  async function submit() {
    if (!title.trim()) { setError('Give your listing a title.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          title: title.trim(),
          description: description.trim(),
          videoUrl: target.url,
          thumbnail: poster,
          category: 'video',
          tags: ['video', 'ai'],
          priceCredits,
        }),
      })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok || !j.success) throw new Error(j.error || 'Could not create the listing.')
      setDone(true)
    } catch (e: any) {
      setError(e?.message || 'Could not create the listing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sell in community">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Tag className="w-4 h-4 text-emerald-300" /> Sell in the community</div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-white">Listing submitted</div>
            <p className="text-xs text-zinc-400 mt-1.5">It goes live in the community after a quick review. To actually receive payouts, finish your Stripe payout setup in your profile — buyers can't check out against a seller who hasn't.</p>
            <div className="flex gap-2 mt-4">
              <a href="/community" className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-xs py-2">View community <ExternalLink className="w-3 h-3" /></a>
              <a href="/profile?stripe=onboard" className="flex-1 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2">Set up payouts</a>
            </div>
            <button onClick={onClose} className="mt-2 text-[11px] text-zinc-500 hover:text-white">Done</button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {poster && <img src={poster} alt="" className="w-full h-28 object-cover rounded-lg bg-black" />}
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Description <span className="text-zinc-600">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What it's good for, how to use it…" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none" />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Price (USD)</label>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">$</span>
                <input type="number" min={0} step={1} value={priceUsd} onChange={e => setPriceUsd(e.target.value)} className="w-24 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                <span className="text-[11px] text-zinc-500">{priceCredits > 0 ? `You keep ~$${youKeep} (97%)` : 'Free'}</span>
              </div>
            </div>
            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
            <p className="text-[10px] text-zinc-600">Listings are reviewed before going live. Payouts require Stripe setup in your profile.</p>
            <button onClick={submit} disabled={submitting} className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />} List for sale
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
