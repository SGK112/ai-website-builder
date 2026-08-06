'use client'

// /admin/domains — resolution queue for domain purchases. Surfaces orders that
// the webhook couldn't fully auto-resolve (needs_attention = registered but not
// serving; register_failed = no auto-refund possible) with one-click Retry
// (re-run register/attach/DNS) and Refund. Gated by isAdminEmail in the route.

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, AlertCircle, RefreshCw, RotateCcw, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminNav } from '@/components/admin/AdminNav'

interface Order {
  _id: string
  domain: string
  userId?: string
  projectId?: string | null
  priceCents?: number
  status: string
  registrar?: { ok?: boolean; mock?: boolean; terminal?: boolean; message?: string }
  render?: { ok?: boolean; mock?: boolean; message?: string }
  dns?: { ok?: boolean }
  refundReason?: string
  createdAt?: string
  updatedAt?: string
  paidAt?: string
}

const FILTERS = ['needs_attention', 'register_failed', 'registered', 'refunded', 'all'] as const
type Filter = typeof FILTERS[number]

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  needs_attention: { label: 'Needs attention', cls: 'bg-amber-500/15 text-amber-500', icon: AlertCircle },
  register_failed: { label: 'Registration failed', cls: 'bg-red-500/15 text-red-500', icon: XCircle },
  registered:      { label: 'Registered', cls: 'bg-emerald-500/15 text-emerald-500', icon: CheckCircle2 },
  registered_mock: { label: 'Registered (mock)', cls: 'bg-zinc-500/15 text-zinc-400', icon: CheckCircle2 },
  refunded:        { label: 'Refunded', cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', icon: RotateCcw },
  pending:         { label: 'Pending', cls: 'bg-zinc-500/15 text-zinc-400', icon: Clock },
}

export default function AdminDomainsPage() {
  const { data: session } = useSession()
  const [filter, setFilter] = useState<Filter>('needs_attention')
  const [orders, setOrders] = useState<Order[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/admin/domain-orders${qs}`)
      if (!res.ok) throw new Error(res.status === 403 ? 'Admin access required.' : `HTTP ${res.status}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setCounts(data.counts || {})
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (orderId: string, action: 'retry' | 'refund') => {
    if (action === 'refund' && !confirm('Refund this domain purchase? This cannot be undone.')) return
    setBusyId(orderId)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/domain-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setNotice(action === 'retry' ? `Retry → ${data.status}${data.message ? ` (${data.message})` : ''}` : 'Refunded.')
      await load()
    } catch (e: any) {
      setError(e?.message || `${action} failed.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminNav email={session?.user?.email || ''} />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h1 className="text-lg font-bold">Domain orders</h1>
            <p className="text-xs text-muted-foreground">Resolve purchases the webhook couldn’t auto-complete.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-foreground/[0.04]" aria-label="Reload orders">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Reload
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* Filter chips with counts */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  filter === f ? 'bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-500/40' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'all' ? 'All' : (STATUS_STYLE[f]?.label || f)}
                {f !== 'all' && counts[f] != null && <span className="ml-1.5 opacity-70">{counts[f]}</span>}
              </button>
            ))}
          </div>

          {notice && <div className="text-xs px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">{notice}</div>}
          {error && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No orders in “{filter === 'all' ? 'any status' : (STATUS_STYLE[filter]?.label || filter)}”.</div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => {
                const st = STATUS_STYLE[o.status] || { label: o.status, cls: 'bg-zinc-500/15 text-zinc-400', icon: Clock }
                const StIcon = st.icon
                const canRetry = o.status === 'needs_attention' || o.status === 'register_failed'
                const canRefund = canRetry // not yet refunded + has a payment
                const busy = busyId === o._id
                return (
                  <div key={o._id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-card/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold truncate">{o.domain}</span>
                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full', st.cls)}>
                          <StIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                        {o.priceCents != null && <span>${(o.priceCents / 100).toFixed(2)}</span>}
                        <span>reg:{o.registrar?.ok ? '✓' : '✗'}{o.registrar?.mock ? '(mock)' : ''}</span>
                        <span>attach:{o.render?.ok ? '✓' : '✗'}</span>
                        <span>dns:{o.dns?.ok ? '✓' : '✗'}</span>
                        {o.updatedAt && <span>{new Date(o.updatedAt).toLocaleString()}</span>}
                      </div>
                      {(o.registrar?.message || o.refundReason) && (
                        <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{o.refundReason || o.registrar?.message}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canRetry && (
                        <button onClick={() => act(o._id, 'retry')} disabled={busy}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50">
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Retry
                        </button>
                      )}
                      {canRefund && (
                        <button onClick={() => act(o._id, 'refund')} disabled={busy}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 disabled:opacity-50">
                          <DollarSign className="w-3.5 h-3.5" /> Refund
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
