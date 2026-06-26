'use client'

// Data Studio — the owner-facing admin UI for a generated app's managed
// backend. Lovable has the Supabase table editor; Replit has the DB pane.
// This gives Webstew the same "see and edit your app's data + secrets"
// surface, scoped to the app owner. Reached at /backend?projectId=… (or
// ?appId=…), linked from the workspace deploy panel.

import { useEffect, useState, useCallback } from 'react'
import { IntegrationsManager } from '@/components/backend/IntegrationsManager'

interface Overview {
  appId: string
  name: string
  baseUrl: string
  collections: Array<{ collection: string; count: number }>
  userCount: number
  secrets: Array<{ key: string; masked: string; updatedAt: string }>
}
interface Row { id: string; data: Record<string, any>; createdAt?: string; updatedAt?: string }

function useQueryParam(name: string): string | null {
  const [v, setV] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') setV(new URLSearchParams(window.location.search).get(name))
  }, [name])
  return v
}

export default function DataStudioPage() {
  const projectId = useQueryParam('projectId')
  const appIdParam = useQueryParam('appId')
  const ready = projectId !== null || appIdParam !== null

  const [overview, setOverview] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [loadingRows, setLoadingRows] = useState(false)

  const qs = useCallback(() => {
    const p = new URLSearchParams()
    if (projectId) p.set('projectId', projectId)
    else if (appIdParam) p.set('appId', appIdParam)
    return p.toString()
  }, [projectId, appIdParam])

  const loadOverview = useCallback(async () => {
    try {
      const r = await fetch(`/api/backend/admin?${qs()}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to load backend')
      setOverview(d)
      setError(null)
      if (!active && d.collections?.[0]) setActive(d.collections[0].collection)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    }
  }, [qs, active])

  const loadRows = useCallback(async (collection: string) => {
    setLoadingRows(true)
    try {
      const r = await fetch(`/api/backend/admin/data?${qs()}&collection=${encodeURIComponent(collection)}`)
      const d = await r.json()
      if (r.ok) setRows(d.items || [])
    } finally {
      setLoadingRows(false)
    }
  }, [qs])

  useEffect(() => { if (ready) loadOverview() }, [ready, loadOverview])
  useEffect(() => { if (active) loadRows(active) }, [active, loadRows])

  const deleteRow = async (id: string) => {
    if (!active || !confirm('Delete this row?')) return
    await fetch(`/api/backend/admin/data?${qs()}&collection=${encodeURIComponent(active)}&id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    loadRows(active)
    loadOverview()
  }

  const saveRow = async (id: string, json: string) => {
    let data: any
    try { data = JSON.parse(json) } catch { alert('Invalid JSON'); return }
    const r = await fetch(`/api/backend/admin/data?${qs()}&collection=${encodeURIComponent(active!)}&id=${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }),
    })
    if (!r.ok) { const d = await r.json().catch(() => ({})); alert(d.error || 'Save failed'); return }
    loadRows(active!)
  }

  if (!ready) return <Shell><p className="text-zinc-400">Loading…</p></Shell>
  if (error) return <Shell><div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div></Shell>
  if (!overview) return <Shell><p className="text-zinc-400">Loading backend…</p></Shell>

  const columns = deriveColumns(rows)

  return (
    <Shell>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Data Studio</h1>
          <p className="text-sm text-zinc-500">{overview.name} · <code className="text-zinc-400">{overview.baseUrl}</code></p>
        </div>
        <button onClick={() => { loadOverview(); if (active) loadRows(active) }} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">Refresh</button>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-6">
        {/* Sidebar — collections + users */}
        <aside className="space-y-1">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Collections</div>
          {overview.collections.length === 0 && <p className="text-xs text-zinc-600">No data yet. Your app writes rows here.</p>}
          {overview.collections.map((c) => (
            <button key={c.collection} onClick={() => setActive(c.collection)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${active === c.collection ? 'bg-violet-600/20 text-violet-200' : 'text-zinc-300 hover:bg-white/5'}`}>
              <span className="truncate">{c.collection}</span>
              <span className="ml-2 shrink-0 rounded bg-white/5 px-1.5 text-[10px] text-zinc-400">{c.count}</span>
            </button>
          ))}
          <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-400">
            <span>Users (auth)</span>
            <span className="rounded bg-white/5 px-1.5 text-[10px]">{overview.userCount}</span>
          </div>
        </aside>

        {/* Main — table + secrets */}
        <main className="space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-200">{active || 'Select a collection'}</h2>
            {loadingRows ? <p className="text-xs text-zinc-500">Loading rows…</p> : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">id</th>
                      {columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && <tr><td colSpan={columns.length + 2} className="px-3 py-6 text-center text-zinc-600">No rows.</td></tr>}
                    {rows.map((row) => (
                      <RowView key={row.id} row={row} columns={columns} onDelete={() => deleteRow(row.id)} onSave={(j) => saveRow(row.id, j)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AddRowForm defaultCollection={active || 'products'} qs={qs} onAdded={(col) => { setActive(col); loadRows(col); loadOverview() }} />
          </section>

          <SecretsSection overview={overview} qs={qs} reload={loadOverview} />
          <ActionsSection appId={overview.appId} qs={qs} />
          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-200">Integrations</h2>
            <IntegrationsManager qs={qs()} />
          </section>
        </main>
      </div>
    </Shell>
  )
}

function RowView({ row, columns, onDelete, onSave }: { row: Row; columns: string[]; onDelete: () => void; onSave: (json: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  return (
    <>
      <tr className="border-t border-white/5 text-zinc-300">
        <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{row.id.slice(0, 8)}…</td>
        {columns.map((c) => <td key={c} className="px-3 py-2">{renderCell(row.data?.[c])}</td>)}
        <td className="px-3 py-2 text-right whitespace-nowrap">
          <button onClick={() => { setDraft(JSON.stringify(row.data, null, 2)); setEditing((e) => !e) }} className="text-zinc-500 hover:text-violet-300">edit</button>
          <button onClick={onDelete} className="ml-3 text-zinc-500 hover:text-red-400">del</button>
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-white/5 bg-black/30">
          <td colSpan={columns.length + 2} className="px-3 py-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={Math.min(12, draft.split('\n').length + 1)}
              className="w-full rounded bg-black/40 p-2 font-mono text-[11px] text-zinc-200 outline-none ring-1 ring-white/10" />
            <div className="mt-1 flex gap-2">
              <button onClick={() => { onSave(draft); setEditing(false) }} className="rounded bg-violet-600 px-2 py-1 text-[11px] text-white hover:bg-violet-500">Save</button>
              <button onClick={() => setEditing(false)} className="rounded bg-white/5 px-2 py-1 text-[11px] text-zinc-300">Cancel</button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// Owner-side row creation. Notably how the store's `products` price catalog gets
// seeded — prices set here are trusted at checkout; the public app key can't write them.
const PRODUCT_TEMPLATE = '{\n  "name": "Blue Hoodie",\n  "price": 4500,\n  "active": true\n}'
function AddRowForm({ defaultCollection, qs, onAdded }: { defaultCollection: string; qs: () => string; onAdded: (collection: string) => void }) {
  const [open, setOpen] = useState(false)
  const [collection, setCollection] = useState(defaultCollection)
  const [json, setJson] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const start = () => {
    const col = defaultCollection
    setCollection(col)
    setJson(col === 'products' ? PRODUCT_TEMPLATE : '{\n  \n}')
    setErr(null); setOpen(true)
  }
  const submit = async () => {
    let data: any
    try { data = JSON.parse(json) } catch { setErr('Invalid JSON'); return }
    const col = collection.trim()
    if (!col) { setErr('Collection name required'); return }
    setBusy(true); setErr(null)
    try {
      const r = await fetch(`/api/backend/admin/data?${qs()}&collection=${encodeURIComponent(col)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to add row')
      setOpen(false); setJson(''); onAdded(col)
    } catch (e: any) { setErr(e?.message || 'Failed') } finally { setBusy(false) }
  }

  if (!open) return (
    <button onClick={start} className="mt-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10">+ Add row</button>
  )
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] text-zinc-500">Collection</span>
        <input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="products"
          className="w-40 rounded bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white outline-none ring-1 ring-white/10 placeholder-zinc-600" />
        <span className="text-[10px] text-zinc-600">Use “products” for a trusted store price catalog.</span>
      </div>
      <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={Math.min(12, json.split('\n').length + 1)}
        className="w-full rounded bg-black/40 p-2 font-mono text-[11px] text-zinc-200 outline-none ring-1 ring-white/10" />
      <div className="mt-1 flex items-center gap-2">
        <button onClick={submit} disabled={busy} className="rounded bg-violet-600 px-2 py-1 text-[11px] text-white hover:bg-violet-500 disabled:opacity-50">Add</button>
        <button onClick={() => setOpen(false)} className="rounded bg-white/5 px-2 py-1 text-[11px] text-zinc-300">Cancel</button>
        {err && <span className="text-[11px] text-red-400">{err}</span>}
      </div>
    </div>
  )
}

function SecretsSection({ overview, qs, reload }: { overview: Overview; qs: () => string; reload: () => void }) {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const add = async () => {
    setBusy(true); setErr(null)
    try {
      const r = await fetch(`/api/backend/admin/secrets?${qs()}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setKey(''); setValue(''); reload()
    } catch (e: any) { setErr(e?.message || 'Failed') } finally { setBusy(false) }
  }
  const remove = async (k: string) => {
    if (!confirm(`Delete secret ${k}?`)) return
    await fetch(`/api/backend/admin/secrets?${qs()}&key=${encodeURIComponent(k)}`, { method: 'DELETE' })
    reload()
  }

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-zinc-200">Secrets</h2>
      <p className="mb-3 text-[11px] text-zinc-500">Server-side only. Use these in backend actions (e.g. <code>STRIPE_SECRET_KEY</code>) — never exposed to the browser.</p>
      <div className="space-y-1.5">
        {overview.secrets.map((s) => (
          <div key={s.key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
            <span className="font-mono text-zinc-300">{s.key}</span>
            <span className="flex items-center gap-3">
              <span className="font-mono text-zinc-600">{s.masked}</span>
              <button onClick={() => remove(s.key)} className="text-zinc-500 hover:text-red-400">remove</button>
            </span>
          </div>
        ))}
        {overview.secrets.length === 0 && <p className="text-[11px] text-zinc-600">No secrets yet.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} placeholder="STRIPE_SECRET_KEY"
          className="w-48 rounded-lg bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white outline-none ring-1 ring-white/10 placeholder-zinc-600" />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" type="password"
          className="flex-1 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none ring-1 ring-white/10 placeholder-zinc-600" />
        <button onClick={add} disabled={busy || !key || !value} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50">Add</button>
      </div>
      {err && <p className="mt-1 text-[11px] text-red-400">{err}</p>}
    </section>
  )
}

interface ActionDef { name: string; method: string; url: string; headers: Record<string, string>; forwardBody: boolean }

function ActionsSection({ appId, qs }: { appId: string; qs: () => string }) {
  const [actions, setActions] = useState<ActionDef[]>([])
  const [name, setName] = useState('')
  const [method, setMethod] = useState('POST')
  const [url, setUrl] = useState('')
  const [headersText, setHeadersText] = useState('{\n  "Authorization": "Bearer {{OPENAI_API_KEY}}"\n}')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch(`/api/backend/admin/actions?${qs()}`)
    const d = await r.json()
    if (r.ok) setActions(d.actions || [])
  }, [qs])
  useEffect(() => { load() }, [load])

  const add = async () => {
    setBusy(true); setErr(null)
    let headers: any = {}
    try { headers = headersText.trim() ? JSON.parse(headersText) : {} } catch { setErr('Headers must be valid JSON'); setBusy(false); return }
    try {
      const r = await fetch(`/api/backend/admin/actions?${qs()}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, method, url, headers }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setName(''); setUrl(''); load()
    } catch (e: any) { setErr(e?.message || 'Failed') } finally { setBusy(false) }
  }
  const remove = async (n: string) => {
    if (!confirm(`Delete action ${n}?`)) return
    await fetch(`/api/backend/admin/actions?${qs()}&name=${encodeURIComponent(n)}`, { method: 'DELETE' }); load()
  }

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-zinc-200">Server actions</h2>
      <p className="mb-3 text-[11px] text-zinc-500">
        Named outbound calls that run server-side with your secrets injected (via <code>{'{{SECRET_NAME}}'}</code> in url/headers).
        Call from your app: <code>WebstewDB.action(&apos;{actions[0]?.name || 'name'}&apos;, {'{...}'})</code>. Secrets never reach the browser.
      </p>
      <div className="space-y-1.5">
        {actions.map((a) => (
          <div key={a.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
            <span className="font-mono text-zinc-300"><span className="text-violet-300">{a.method}</span> {a.name}</span>
            <span className="flex items-center gap-3">
              <span className="max-w-[260px] truncate font-mono text-zinc-600">{a.url}</span>
              <button onClick={() => remove(a.name)} className="text-zinc-500 hover:text-red-400">remove</button>
            </span>
          </div>
        ))}
        {actions.length === 0 && <p className="text-[11px] text-zinc-600">No actions yet.</p>}
      </div>
      <div className="mt-3 grid grid-cols-[110px_90px_1fr] gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="send-email" className="rounded-lg bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white outline-none ring-1 ring-white/10 placeholder-zinc-600" />
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs text-white outline-none ring-1 ring-white/10">
          {['POST', 'GET', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m} className="bg-zinc-900">{m}</option>)}
        </select>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.openai.com/v1/chat/completions" className="rounded-lg bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white outline-none ring-1 ring-white/10 placeholder-zinc-600" />
      </div>
      <textarea value={headersText} onChange={(e) => setHeadersText(e.target.value)} rows={3} className="mt-2 w-full rounded-lg bg-white/[0.03] p-2 font-mono text-[11px] text-zinc-200 outline-none ring-1 ring-white/10" />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={add} disabled={busy || !name || !url} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50">Save action</button>
        {err && <span className="text-[11px] text-red-400">{err}</span>}
      </div>
    </section>
  )
}

function deriveColumns(rows: Row[]): string[] {
  const set = new Set<string>()
  for (const r of rows.slice(0, 50)) for (const k of Object.keys(r.data || {})) set.add(k)
  return Array.from(set).slice(0, 8)
}
function renderCell(v: any): string {
  if (v == null) return ''
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60)
  return String(v).slice(0, 80)
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  )
}
