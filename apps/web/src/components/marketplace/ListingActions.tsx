'use client'

// Action bar for a listing detail page — like/save (anon → signup), buy
// (premium), open in workspace (owned). Client component so it can read
// the live entitlement state from /api/listings/[id].

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Bookmark, ShoppingBag, Loader2, AlertCircle, Check, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  listingId: string
  title: string
  isPremium: boolean
  priceCredits: number
}

interface Entitlement {
  owned: boolean
  isOwner: boolean
  viewerLiked: boolean
  viewerSaved: boolean
  likes: number
}

export function ListingActions({ listingId, title, isPremium, priceCredits }: Props) {
  const router = useRouter()
  const [state, setState] = useState<Entitlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'like' | 'save' | 'buy' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const l = data.listing
      setState({
        owned: !!l.owned,
        isOwner: !!l.isOwner,
        viewerLiked: !!l.viewerLiked,
        viewerSaved: !!l.viewerSaved,
        likes: l.likes || 0,
      })
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [listingId])

  const requireAuth = (action: string) => {
    router.push(`/signup?next=${encodeURIComponent(`/listings/${listingId}`)}`)
  }

  const toggleLike = async () => {
    if (!state) return
    setBusy('like')
    setError(null)
    try {
      const res = await fetch(`/api/community/posts/${listingId}/like`, { method: 'POST' })
      if (res.status === 401) { requireAuth('like'); return }
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setState({ ...state, viewerLiked: !!data.liked, likes: data.likes })
    } catch (e: any) {
      setError('Could not save your like.')
    } finally {
      setBusy(null)
    }
  }

  const toggleSave = async () => {
    if (!state) return
    setBusy('save')
    setError(null)
    try {
      const res = await fetch(`/api/community/posts/${listingId}/save`, { method: 'POST' })
      if (res.status === 401) { requireAuth('save'); return }
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setState({ ...state, viewerSaved: !!data.saved })
    } catch (e: any) {
      setError('Could not save your bookmark.')
    } finally {
      setBusy(null)
    }
  }

  const buy = async () => {
    if (!state) return
    setBusy('buy')
    setError(null)
    setFlash(null)
    try {
      const res = await fetch(`/api/marketplace/buy/${listingId}`, { method: 'POST' })
      if (res.status === 401) { requireAuth('buy'); return }
      const data = await res.json()
      if (res.status === 402) {
        // Buyer is short on credits — punt them to /upgrade with a return
        router.push(`/upgrade?next=${encodeURIComponent(`/listings/${listingId}`)}&reason=marketplace_credits`)
        return
      }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setFlash(data?.message || 'Purchased.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Purchase failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading || !state) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking access…
      </div>
    )
  }

  const canBuy = isPremium && !state.owned && !state.isOwner

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-wrap items-center gap-3">
      <button
        onClick={toggleLike}
        disabled={busy === 'like'}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition',
          state.viewerLiked
            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
            : 'border-white/10 hover:bg-white/5 text-zinc-300'
        )}
      >
        <Heart className={cn('w-4 h-4', state.viewerLiked && 'fill-current')} />
        {state.likes.toLocaleString()}
      </button>

      <button
        onClick={toggleSave}
        disabled={busy === 'save'}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition',
          state.viewerSaved
            ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
            : 'border-white/10 hover:bg-white/5 text-zinc-300'
        )}
      >
        <Bookmark className={cn('w-4 h-4', state.viewerSaved && 'fill-current')} />
        {state.viewerSaved ? 'Saved' : 'Save'}
      </button>

      {canBuy && (
        <button
          onClick={buy}
          disabled={busy === 'buy'}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 text-white font-semibold text-sm disabled:opacity-60"
        >
          {busy === 'buy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
          Buy for {priceCredits} credits
        </button>
      )}

      {state.owned && (
        <Link
          href={`/workspace?from=listing&listingId=${listingId}`}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-lg hover:shadow-violet-500/25 text-white font-semibold text-sm"
        >
          <Wand2 className="w-4 h-4" />
          {state.isOwner ? 'Open in workspace' : 'Use this listing'}
        </Link>
      )}

      {error && (
        <div className="basis-full mt-2 flex items-start gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {flash && (
        <div className="basis-full mt-2 flex items-start gap-2 text-sm text-emerald-300">
          <Check className="w-4 h-4 mt-0.5 shrink-0" /> {flash}
        </div>
      )}
    </div>
  )
}
