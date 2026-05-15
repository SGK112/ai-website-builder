'use client'

// /library — the user's own listings + their purchases + their saves.
// Three tabs, single fetch. Gated by middleware (anon → /signup).

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, AlertCircle, Crown, Bookmark, Package, ShoppingBag, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Listing {
  _id: string
  type: string
  title: string
  description?: string
  thumbnail?: string
  author?: { id?: string; name?: string; username?: string; avatar?: string }
  category?: string
  likes?: number
  views?: number
  isPremium?: boolean
  priceCredits?: number
  status?: string
  createdAt?: string
}
interface PurchaseRow {
  _id: string
  listingId: string
  listing: Listing | null
  title: string
  type: string
  priceCredits: number
  purchasedAt: string
}
interface LibraryData {
  authored: Listing[]
  purchased: PurchaseRow[]
  saved: Listing[]
}

type Tab = 'purchased' | 'authored' | 'saved'

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<LibraryData | null>(null)
  const [tab, setTab] = useState<Tab>('purchased')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let alive = true
    fetch('/api/library', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => { if (alive) setData(d) })
      .catch((e) => alive && setError(e?.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [status])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading…</div>
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Library · Sign in required</h1>
          <Link href={`/login?callbackUrl=${encodeURIComponent('/library')}`} className="text-violet-400 hover:text-violet-300">Sign in →</Link>
        </div>
      </div>
    )
  }

  const tabs: Array<{ key: Tab; label: string; icon: any; count: number }> = [
    { key: 'purchased', label: 'Purchased',  icon: ShoppingBag, count: data?.purchased.length ?? 0 },
    { key: 'authored',  label: 'My listings', icon: Package,     count: data?.authored.length ?? 0 },
    { key: 'saved',     label: 'Saved',       icon: Bookmark,    count: data?.saved.length ?? 0 },
  ]

  const items: Listing[] =
    tab === 'purchased'
      ? (data?.purchased || []).map((p) => p.listing || {
          _id: p.listingId,
          type: p.type,
          title: p.title,
          isPremium: true,
          priceCredits: p.priceCredits,
        } as Listing)
      : tab === 'authored'
        ? data?.authored || []
        : data?.saved || []

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <Link href="/community" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Browse the community
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Your library</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition',
                  active
                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                    : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" /> {t.label}
                <span className="text-[10px] font-semibold bg-white/10 px-1.5 py-0.5 rounded">{t.count}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((l) => (
              <Link
                key={l._id}
                href={tab === 'purchased' ? `/workspace?from=library&listingId=${l._id}` : `/listings/${l._id}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-violet-500/40 transition"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative">
                  {l.thumbnail && (
                    <img
                      src={l.thumbnail}
                      alt={l.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const img = e.currentTarget
                        const fallback = `https://picsum.photos/seed/${encodeURIComponent(l._id)}/800/500`
                        if (img.src !== fallback) img.src = fallback
                        else img.style.display = 'none'
                      }}
                    />
                  )}
                  {l.isPremium && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/85 text-white">
                      <Crown className="w-3 h-3" /> {l.priceCredits} credits
                    </span>
                  )}
                  {l.status && l.status !== 'approved' && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {l.status}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-semibold text-sm leading-tight">{l.title}</h2>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 shrink-0">{l.type}</span>
                  </div>
                  {l.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{l.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === 'purchased') {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
        <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-300 mb-1">No purchases yet</p>
        <p className="text-sm text-zinc-500 mb-4">Premium templates and apps you buy from the community appear here.</p>
        <Link href="/community" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium">
          Browse the community <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    )
  }
  if (tab === 'authored') {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
        <Package className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-300 mb-1">You haven't published anything yet</p>
        <p className="text-sm text-zinc-500 mb-4">Build a site in the workspace, then click Publish to share it with the community.</p>
        <Link href="/workspace" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium">
          Open the workspace <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
      <Bookmark className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="text-zinc-300 mb-1">Nothing saved yet</p>
      <p className="text-sm text-zinc-500 mb-4">Bookmark listings while browsing the community — they'll show up here.</p>
      <Link href="/community" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium">
        Browse the community <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  )
}
