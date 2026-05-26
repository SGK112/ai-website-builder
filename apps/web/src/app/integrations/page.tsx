'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plug, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

interface Item {
  slug: string
  label: string
  category: string
  description: string
  connected: boolean
  connectionId?: string
  status: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  inbox: 'Inbox',
  crm: 'CRM',
  comms: 'Team comms',
  data: 'Data',
  commerce: 'Commerce',
  social: 'Social',
  dev: 'Dev tools',
  scheduling: 'Scheduling',
}

export default function IntegrationsPage() {
  const params = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // slug currently connecting/disconnecting
  const [flash, setFlash] = useState<string | null>(null)

  // Flash message after OAuth callback
  useEffect(() => {
    const connected = params.get('connected')
    const callbackErr = params.get('error')
    if (connected) setFlash(`Connected ${connected}.`)
    else if (callbackErr) setErr(decodeURIComponent(callbackErr))
  }, [params])

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/integrations', { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setItems(data.items || [])
      // The route returns 200 + a `warning` field when Composio itself is
      // temporarily unreachable — show it as a soft notice instead of a
      // hard error so users still see the catalog and don't think the
      // page is broken.
      if (data.warning) setFlash(data.warning)
    } catch (e: any) {
      setErr(e?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // If we just came back from OAuth, poll once more after a short delay —
    // Composio's status sometimes lags the redirect by a second or two.
    if (params.get('connected')) {
      const t = setTimeout(load, 1500)
      return () => clearTimeout(t)
    }
  }, [params])

  const connect = async (slug: string) => {
    setBusy(slug)
    setErr(null)
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit: slug }),
      })
      const data = await res.json()
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      // Open OAuth in a new tab so we don't lose the user's current state.
      window.open(data.redirectUrl, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setErr(e?.message || 'Failed to start connection')
    } finally {
      setBusy(null)
    }
  }

  const disconnect = async (slug: string, id: string) => {
    setBusy(slug)
    setErr(null)
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      await load()
    } catch (e: any) {
      setErr(e?.message || 'Failed to disconnect')
    } finally {
      setBusy(null)
    }
  }

  const grouped = useMemo(() => {
    const out: Record<string, Item[]> = {}
    for (const it of items) {
      out[it.category] = out[it.category] || []
      out[it.category].push(it)
    }
    return out
  }, [items])

  const connectedCount = items.filter((i) => i.connected).length

  return (
    <div className="min-h-screen px-4 sm:px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Integrations</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
          Connect services to your account, then wire them into your sites. Form
          submissions, content publishing, and AI builder actions all flow
          through these connections.
        </p>
      </div>

      {(flash || err) && (
        <div
          className={`mb-6 p-3 rounded-xl border text-sm flex items-start gap-2 ${
            err
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {err ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <Check className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{err || flash}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            {connectedCount === 0
              ? 'Nothing connected yet.'
              : `${connectedCount} service${connectedCount === 1 ? '' : 's'} connected.`}
          </p>

          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat} className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {CATEGORY_LABEL[cat] || cat}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((it) => (
                  <div
                    key={it.slug}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {it.label}
                          {it.connected && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              Connected
                            </span>
                          )}
                          {it.status && it.status !== 'ACTIVE' && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              {it.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {it.description}
                        </p>
                      </div>
                      <Plug className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <div className="mt-auto pt-1">
                      {it.connected && it.connectionId ? (
                        <button
                          onClick={() => disconnect(it.slug, it.connectionId!)}
                          disabled={busy === it.slug}
                          className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-300 transition"
                        >
                          {busy === it.slug ? 'Disconnecting…' : 'Disconnect'}
                        </button>
                      ) : (
                        <button
                          onClick={() => connect(it.slug)}
                          disabled={busy === it.slug}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white flex items-center gap-1.5"
                        >
                          {busy === it.slug ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Opening…
                            </>
                          ) : (
                            <>
                              Connect <ExternalLink className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <div className="mt-12 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2">
          <strong className="text-slate-700 dark:text-slate-300">Heads up:</strong>{' '}
          OAuth opens in a new tab. After approving, return here and we&apos;ll
          show the connection. If it doesn&apos;t appear within a few seconds,
          refresh the page.
        </p>
        <p>
          Don&apos;t see what you need? Tell us at{' '}
          <a href="mailto:hello@webstew.net" className="text-violet-600 dark:text-violet-300 underline">
            hello@webstew.net
          </a>
          .
        </p>
      </div>
    </div>
  )
}
