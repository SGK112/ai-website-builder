'use client'

// Connectors panel — ONE 1-click connect experience, powered by Composio.
// Replaces the old paste-your-API-keys "integrations" catalog (Stripe/Supabase
// with envKeys + code snippets), which duplicated the same services with a
// clunkier flow. Now: fetch the Composio toolkit list (+ per-user connection
// status) and connect/disconnect in one click via OAuth. Same source as the
// /integrations page — one system, one name.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plug, Loader2, Check, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandIcon, hasBrandIcon } from '@/lib/brand-icons'

interface Connector {
  slug: string
  label: string
  description: string
  category: string
  connected: boolean
  connectionId?: string
  status?: string
}

interface IntegrationsPanelProps {
  isDark: boolean
}

export function IntegrationsPanel({ isDark }: IntegrationsPanelProps) {
  const [items, setItems] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/integrations', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setItems(Array.isArray(data.items) ? data.items : [])
      setErr(data?.warning || null)
    } catch (e: any) {
      setErr(e?.message || 'Could not load connectors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const connect = async (slug: string) => {
    setBusy(slug); setErr(null)
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit: slug }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Could not start the connection')
      // Hand off to the provider's OAuth consent screen; we return to the
      // workspace via the Composio callback.
      window.location.href = data.url
    } catch (e: any) {
      setErr(e?.message || 'Failed to start connection')
      setBusy(null)
    }
  }

  const disconnect = async (slug: string, id: string) => {
    setBusy(slug); setErr(null)
    try {
      const res = await fetch(`/api/integrations/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error || 'Failed to disconnect') }
      await load()
    } catch (e: any) {
      setErr(e?.message || 'Failed to disconnect')
    } finally {
      setBusy(null)
    }
  }

  const connectedCount = items.filter((i) => i.connected).length

  return (
    <motion.div
      key="integrations"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className={cn('px-3 py-2.5 border-b flex items-center justify-between', isDark ? 'border-white/[0.06]' : 'border-slate-200')}>
        <div>
          <h3 className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Connectors</h3>
          <p className={cn('text-[10px]', isDark ? 'text-zinc-500' : 'text-slate-500')}>
            {loading ? 'Loading…' : connectedCount === 0 ? 'One click to connect your tools' : `${connectedCount} connected`}
          </p>
        </div>
        <button onClick={() => { setLoading(true); void load() }} className={cn('w-7 h-7 rounded-lg grid place-items-center', isDark ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')} aria-label="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {err && (
        <div className={cn('mx-2 mt-2 p-2 rounded-lg border text-[11px] flex items-start gap-1.5', 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300')}>
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className={cn('flex items-center justify-center py-16 text-xs', isDark ? 'text-zinc-500' : 'text-slate-400')}>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading connectors…
          </div>
        ) : items.length === 0 ? (
          <div className={cn('flex flex-col items-center text-center gap-1.5 py-14 px-4', isDark ? 'text-zinc-600' : 'text-slate-400')}>
            <Plug className="w-6 h-6 opacity-50" />
            <p className="text-xs font-medium">No connectors available yet</p>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.slug}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-xl border',
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200'
              )}
            >
              {/* brand mark (real logo where we have it, else a neutral initial tile) */}
              <div className={cn('w-8 h-8 rounded-lg grid place-items-center shrink-0 overflow-hidden',
                hasBrandIcon(it.label)
                  ? 'bg-white dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 p-1.5'
                  : isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-slate-100 text-slate-600')}>
                {hasBrandIcon(it.label)
                  ? <BrandIcon name={it.label} className="w-full h-full" />
                  : <span className="text-xs font-semibold">{it.label.slice(0, 2)}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-xs font-medium truncate', isDark ? 'text-white' : 'text-slate-900')}>{it.label}</span>
                  {it.connected && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                      <Check className="w-2.5 h-2.5 inline -mt-px" />
                    </span>
                  )}
                </div>
                <p className={cn('text-[10px] leading-snug line-clamp-1', isDark ? 'text-zinc-500' : 'text-slate-500')}>{it.description}</p>
              </div>
              {it.connected && it.connectionId ? (
                <button
                  onClick={() => disconnect(it.slug, it.connectionId!)}
                  disabled={busy === it.slug}
                  className={cn('text-[11px] shrink-0 px-2 py-1 rounded-lg transition-colors', isDark ? 'text-zinc-400 hover:text-red-300 hover:bg-white/5' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100')}
                >
                  {busy === it.slug ? '…' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => connect(it.slug)}
                  disabled={busy === it.slug}
                  className="text-[11px] font-medium shrink-0 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white flex items-center gap-1"
                >
                  {busy === it.slug ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Connect <ExternalLink className="w-2.5 h-2.5" /></>}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
