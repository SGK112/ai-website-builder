'use client'

// Owner-facing toggle panel (Data Studio) for the Composio passthrough: pick
// which toolkits THIS app may expose to its end-users. Writes the allowlist via
// /api/backend/admin/integrations. End-users then connect their own accounts
// from the published app via WebstewDB.integrations.connect(...).

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Check, Plug } from 'lucide-react'

interface Toolkit { slug: string; label: string; category: string }

const CATEGORY_LABEL: Record<string, string> = {
  inbox: 'Email', comms: 'Messaging', crm: 'CRM & Support', data: 'Data & Sheets',
  commerce: 'Payments & Stores', social: 'Social & Ads', dev: 'Developer', scheduling: 'Scheduling',
}

export function IntegrationsManager({ qs }: { qs: string }) {
  const [available, setAvailable] = useState<Toolkit[]>([])
  const [allowed, setAllowed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/backend/admin/integrations?${qs}`)
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `HTTP ${r.status}`)
      const d = await r.json()
      setAvailable(d.available || [])
      setAllowed(d.allowedToolkits || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [qs])

  useEffect(() => { void load() }, [load])

  const toggle = async (slug: string) => {
    const next = allowed.includes(slug) ? allowed.filter((s) => s !== slug) : [...allowed, slug]
    const prev = allowed
    setAllowed(next)
    setSavingSlug(slug)
    setError(null)
    try {
      const r = await fetch(`/api/backend/admin/integrations?${qs}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolkits: next }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `HTTP ${r.status}`)
    } catch (e: any) {
      setAllowed(prev) // revert on failure
      setError(e?.message || 'Could not save')
    } finally {
      setSavingSlug(null)
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading integrations…</div>
  }

  const byCategory = available.reduce<Record<string, Toolkit[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t); return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3 text-[11px] leading-relaxed text-zinc-400">
        <div className="mb-1 flex items-center gap-1.5 font-medium text-violet-300"><Plug className="h-3.5 w-3.5" /> Let your users connect their own accounts</div>
        Enable a toolkit and your app's end-users can connect <em>their own</em> Stripe, Shopify, Gmail, etc. from the published site
        — <code className="text-violet-300">WebstewDB.integrations.connect(&apos;stripe&apos;)</code>. Your Composio key stays on Webstew&apos;s server.
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}

      {Object.entries(byCategory).map(([cat, kits]) => (
        <div key={cat}>
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">{CATEGORY_LABEL[cat] || cat}</div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {kits.map((t) => {
              const on = allowed.includes(t.slug)
              const busy = savingSlug === t.slug
              return (
                <button
                  key={t.slug}
                  onClick={() => toggle(t.slug)}
                  disabled={busy}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${
                    on ? 'border-violet-500/50 bg-violet-500/15 text-white' : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <span className="truncate">{t.label}</span>
                  {busy ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                    : on ? <Check className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                    : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
