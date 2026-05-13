'use client'

// DeployCredentialsCard — lets the user paste their own GitHub + Render keys
// so deploys land in their own accounts instead of the platform's. Stored
// encrypted via /api/user/credentials. The save call validates against each
// provider's API so the user gets immediate feedback that the key works.

import { useEffect, useState } from 'react'
import { Loader2, Check, AlertCircle, Eye, EyeOff, Trash2, ExternalLink, Lock } from 'lucide-react'

interface CredentialSummary {
  type: 'render' | 'github'
  set: boolean
  hint?: string
  updatedAt?: string
  lastValidatedAt?: string
}

const SPECS = {
  github: {
    label: 'GitHub Personal Access Token',
    placeholder: 'ghp_…',
    docs: 'https://github.com/settings/tokens',
    docsLabel: 'Create token →',
    scopes: 'Requires the `repo` scope. Optional: `delete_repo` for cleanup.',
  },
  render: {
    label: 'Render API Key',
    placeholder: 'rnd_…',
    docs: 'https://dashboard.render.com/u/settings#api-keys',
    docsLabel: 'Create API key →',
    scopes: 'Used to create static_site / web_service deployments in your Render account.',
  },
} as const

interface Props {
  isDark?: boolean
}

export function DeployCredentialsCard({ isDark = true }: Props) {
  const [creds, setCreds] = useState<CredentialSummary[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/user/credentials')
      const data = await res.json()
      setCreds(data.credentials || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [])

  return (
    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
          <Lock className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deploy credentials</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Bring your own GitHub + Render keys so your deploys land in YOUR accounts. Stored encrypted; we validate each key against the provider when you save.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div>
      ) : (
        <div className="space-y-3">
          {(['github', 'render'] as const).map(type => (
            <CredentialRow
              key={type}
              type={type}
              spec={SPECS[type]}
              summary={creds.find(c => c.type === type)}
              isDark={isDark}
              onChange={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CredentialRow({ type, spec, summary, isDark, onChange }: {
  type: 'render' | 'github'
  spec: typeof SPECS[keyof typeof SPECS]
  summary?: CredentialSummary
  isDark: boolean
  onChange: () => void
}) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  async function save() {
    if (!value.trim()) return
    setSaving(true); setStatus(null)
    try {
      const res = await fetch('/api/user/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const meta = data.meta
      const metaText = type === 'github'
        ? ` (logged in as ${meta?.login || '?'})`
        : meta?.ownerEmail ? ` (${meta.ownerEmail})` : ''
      setStatus({ kind: 'ok', msg: `Saved + validated${metaText}` })
      setValue('')
      onChange()
    } catch (e: any) {
      setStatus({ kind: 'err', msg: e?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete your stored ${type} key?`)) return
    setDeleting(true); setStatus(null)
    try {
      const res = await fetch(`/api/user/credentials/${type}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onChange()
    } catch (e: any) {
      setStatus({ kind: 'err', msg: e?.message || 'Delete failed' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{spec.label}</span>
          {summary?.set && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
              <Check className="w-2.5 h-2.5" /> set · {summary.hint}
            </span>
          )}
        </div>
        <a
          href={spec.docs}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-[11px] ${isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-800'}`}
        >
          {spec.docsLabel} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className={`text-[11px] mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{spec.scopes}</p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={summary?.set ? '••• (paste to replace)' : spec.placeholder}
            className={`w-full px-2.5 py-1.5 pr-9 rounded-lg text-sm font-mono outline-none transition ${
              isDark
                ? 'bg-white/[0.04] border border-white/[0.08] text-zinc-100 focus:border-violet-500/50'
                : 'bg-white border border-slate-300 text-slate-900 focus:border-violet-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${isDark ? 'hover:bg-white/10 text-zinc-500' : 'hover:bg-slate-200 text-slate-500'}`}
            title={show ? 'Hide' : 'Show'}
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          onClick={save}
          disabled={!value.trim() || saving}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            !value.trim() || saving
              ? 'bg-slate-200 text-slate-500 dark:bg-white/[0.04] dark:text-zinc-600 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : summary?.set ? 'Update' : 'Save'}
        </button>
        {summary?.set && (
          <button
            onClick={remove}
            disabled={deleting}
            className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-red-500/15 text-zinc-400 hover:text-red-300' : 'hover:bg-red-50 text-slate-500 hover:text-red-600'}`}
            title="Remove key"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {status && (
        <div className={`mt-2 px-2 py-1.5 rounded-md text-xs flex items-start gap-1.5 ${
          status.kind === 'ok'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
        }`}>
          {status.kind === 'ok' ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>{status.msg}</span>
        </div>
      )}
    </div>
  )
}
