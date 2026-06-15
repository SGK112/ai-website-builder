'use client'

// CustomDomainCard — attach / view / remove a custom domain for a deployed
// project. Talks to /api/projects/[id]/custom-domain which proxies to Render.
//
// States the user can be in:
//   1. Project not deployed → tell them to deploy first
//   2. Deployed, no custom domain → show input + "Attach" button
//   3. Deployed, custom domain attached but unverified → show DNS records
//      they need to add at their registrar, plus a "Recheck" button
//   4. Deployed, custom domain verified + cert issued → green check + link

import { useEffect, useState } from 'react'
import { Loader2, Globe, ExternalLink, Check, AlertCircle, Trash2, Copy } from 'lucide-react'

interface Props {
  projectId: string | null
  isDeployed: boolean
  // Instant-published sites (Go Live / {slug}.webstew.app) can attach a custom
  // domain too — not just full deploys. Honor this signal so we don't tell a
  // user with a live site to "deploy first".
  isPublished?: boolean
  isDark?: boolean
}

interface CustomDomainState {
  name: string
  renderDomainId?: string
  verificationStatus?: string
  dnsRecords?: Array<{ type: string; name: string; value: string }> | null
}

export function CustomDomainCard({ projectId, isDeployed, isPublished = false, isDark = true }: Props) {
  // A site is "live enough" to attach a domain if it's deployed OR instant-published.
  const canConnect = isDeployed || isPublished
  const [state, setState] = useState<CustomDomainState | null>(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!projectId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/custom-domain`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState(data.customDomain || null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void refresh() }, [projectId])

  async function attach() {
    if (!projectId) return
    const name = input.trim().toLowerCase()
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(name)) {
      setError('Looks invalid — example: shop.example.com')
      return
    }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/custom-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setState(data.customDomain)
      setInput('')
    } catch (e: any) {
      setError(e?.message || 'Attach failed')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!projectId || !state) return
    if (!confirm(`Detach ${state.name}? Your site will go back to the .onrender.com URL.`)) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/custom-domain`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setState(null)
    } catch (e: any) {
      setError(e?.message || 'Remove failed')
    } finally {
      setBusy(false)
    }
  }

  if (!projectId) return null

  return (
    <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2">
        <Globe className={`w-4 h-4 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} />
        <div className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Custom domain</div>
      </div>

      {!canConnect && (
        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          Publish or deploy this project first, then come back to attach your own domain.
        </div>
      )}

      {canConnect && loading && (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div>
      )}

      {canConnect && !loading && !state && (
        <>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="shop.example.com"
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-sm outline-none transition ${
                isDark
                  ? 'bg-white/[0.04] border border-white/[0.08] text-zinc-100 focus:border-violet-500/50'
                  : 'bg-white border border-slate-300 text-slate-900 focus:border-violet-500'
              }`}
            />
            <button
              onClick={attach}
              disabled={busy || !input.trim()}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                busy || !input.trim()
                  ? 'bg-slate-200 text-slate-500 dark:bg-white/[0.04] dark:text-zinc-600 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Attach'}
            </button>
          </div>
          <div className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            Render auto-issues a Let's Encrypt cert once DNS resolves. You'll get the DNS records to add after attaching.
          </div>
        </>
      )}

      {canConnect && !loading && state && (
        <DomainStatus state={state} onRemove={remove} onRecheck={refresh} busy={busy} isDark={isDark} />
      )}

      {error && (
        <div className={`px-2 py-1.5 rounded-md text-xs flex items-start gap-1.5 ${
          isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function DomainStatus({ state, onRemove, onRecheck, busy, isDark }: {
  state: CustomDomainState
  onRemove: () => void
  onRecheck: () => void
  busy: boolean
  isDark: boolean
}) {
  const verified = state.verificationStatus === 'verified'
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <a
          href={`https://${state.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm font-mono ${isDark ? 'text-violet-200 hover:text-violet-100' : 'text-violet-700 hover:text-violet-800'}`}
        >
          {state.name} <ExternalLink className="w-3 h-3" />
        </a>
        <div className="flex items-center gap-1">
          {verified ? (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
              <Check className="w-2.5 h-2.5" /> Verified
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
              Pending DNS
            </span>
          )}
          <button
            onClick={onRecheck}
            disabled={busy}
            className={`p-1 rounded ${isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
            title="Re-check status"
            aria-label="Re-check domain status"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-[10px]">↻</span>}
          </button>
          <button
            onClick={onRemove}
            disabled={busy}
            className={`p-1 rounded ${isDark ? 'hover:bg-red-500/15 text-zinc-400 hover:text-red-300' : 'hover:bg-red-50 text-slate-500 hover:text-red-600'}`}
            title="Detach domain"
            aria-label="Detach domain"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {!verified && state.dnsRecords && state.dnsRecords.length > 0 && (
        <div className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-slate-50 border border-slate-200'}`}>
          <div className={`text-[10px] uppercase tracking-wider font-medium mb-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            Add these DNS records at your registrar
          </div>
          <div className="space-y-1">
            {state.dnsRecords.map((r, i) => (
              <DnsRow key={i} record={r} isDark={isDark} />
            ))}
          </div>
          <div className={`text-[10px] mt-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            DNS can take a few minutes (sometimes hours) to propagate. Click ↻ to re-check.
          </div>
        </div>
      )}
    </div>
  )
}

function DnsRow({ record, isDark }: { record: { type: string; name: string; value: string }; isDark: boolean }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.value)
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch {
      // Only flag "copied" on real success; surface failure so the user knows
      // to copy manually (e.g. clipboard blocked / insecure context).
      setCopyFailed(true); setTimeout(() => setCopyFailed(false), 1500)
    }
  }
  return (
    <div className="grid grid-cols-12 gap-1 items-center text-[11px] font-mono">
      <span className={`col-span-1 px-1 py-0.5 rounded text-center ${isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-slate-200 text-slate-600'}`}>
        {record.type}
      </span>
      <span className={`col-span-3 truncate ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{record.name}</span>
      <span className={`col-span-7 truncate ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{record.value}</span>
      <button
        onClick={copy}
        className={`col-span-1 p-1 rounded justify-self-end ${isDark ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-slate-200 text-slate-500'}`}
        title={copyFailed ? 'Copy failed — copy manually' : 'Copy value'}
        aria-label={copyFailed ? 'Copy failed, copy value manually' : 'Copy value'}
      >
        {copied
          ? <Check className="w-3 h-3 text-emerald-400" />
          : copyFailed
            ? <AlertCircle className="w-3 h-3 text-red-400" />
            : <Copy className="w-3 h-3" />}
      </button>
    </div>
  )
}
