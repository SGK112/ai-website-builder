'use client'

// Admin moderation queue for community/marketplace listings.
// /admin/listings — gated by middleware + by isAdminEmail in the route
// handlers. Shows pending submissions with approve / reject / delete.

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Check, X, Trash2, ExternalLink, Loader2, AlertCircle, RefreshCw, Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminNav } from '@/components/admin/AdminNav'

interface Listing {
  _id: string
  type: string
  title: string
  description?: string
  thumbnail?: string
  author: { id: string; name: string; username: string; avatar?: string }
  category?: string
  tags?: string[]
  status?: string
  createdAt: string
  moderatedBy?: string
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'legacy'

export default function AdminListingsPage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [posts, setPosts] = useState<Listing[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/listings?status=${status}&limit=100`, { cache: 'no-store' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPosts(data.posts || [])
      setCounts(data.counts || {})
    } catch (e: any) {
      setError(e?.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { load() }, [load])

  const moderate = async (id: string, action: 'approved' | 'rejected') => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setPosts((p) => p.filter((x) => x._id !== id))
      setCounts((c) => ({
        ...c,
        [status]: Math.max(0, (c[status] || 1) - 1),
        [action]: (c[action] || 0) + 1,
      }))
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Hard-delete this listing? The author is not notified.')) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setPosts((p) => p.filter((x) => x._id !== id))
      setCounts((c) => ({ ...c, [status]: Math.max(0, (c[status] || 1) - 1) }))
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setBusyId(null)
    }
  }

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'legacy',   label: 'Legacy (no status)' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminNav email={session?.user?.email || ''} />
      <div className="flex-1 min-w-0">
      <header className="border-b border-border bg-card/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:hidden">
            <Crown className="w-5 h-5 text-amber-400" />
            <h1 className="font-bold text-lg">Listings · Moderation</h1>
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg">Listings moderation</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!confirm('Seed marketplace with dummy users + listings? Re-runs are idempotent.')) return
                try {
                  const res = await fetch('/api/admin/seed-marketplace', { method: 'POST' })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
                  alert(`Seeded ${data.listings.total} listings (${data.listings.inserted} new, ${data.listings.updated} updated) across ${data.users} accounts. Visit /community to see them.`)
                  load()
                } catch (e: any) {
                  alert(`Seed failed: ${e?.message || e}`)
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25"
              title="Idempotent seed — safe to re-run"
            >
              <Sparkles className="w-3 h-3" /> Seed demo data
            </button>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">← Admin home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition',
                status === f.key
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
              {counts[f.key] != null && (
                <span className="text-[10px] font-bold bg-foreground/10 px-1.5 py-0.5 rounded">
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing here. The {status} queue is empty.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <div key={p._id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : null}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-sm leading-tight">{p.title}</h2>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground shrink-0">
                      {p.type}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{p.description}</p>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-auto pt-2 flex items-center gap-2 flex-wrap">
                    <span>by {p.author?.name || p.author?.username || 'unknown'}</span>
                    <span>·</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    {p.category && <><span>·</span><span>{p.category}</span></>}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-border mt-2">
                    {status !== 'approved' && (
                      <button
                        disabled={busyId === p._id}
                        onClick={() => moderate(p._id, 'approved')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-sm font-medium disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        disabled={busyId === p._id}
                        onClick={() => moderate(p._id, 'rejected')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-sm font-medium disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    <button
                      disabled={busyId === p._id}
                      onClick={() => remove(p._id)}
                      title="Hard delete"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
