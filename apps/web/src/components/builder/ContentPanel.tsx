'use client'

// ContentPanel — Stage 1 of the CMS UX. Lists collections, shows their items,
// lets you create / edit / delete one item at a time. Forms are schema-driven
// so adding a new field type elsewhere (server + lib/cms.ts) is enough to
// surface it here.
//
// Limitations on purpose (Stage 1):
//   - No bulk operations
//   - No image picker (image fields take a URL string for now)
//   - No markdown preview (markdown fields are textareas)
//   - No schema editor UI — collections are created by the generator or by
//     hitting the PUT /api/cms/.../schemas/[slug] endpoint directly
//
// Stage 2 fills those in.

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, RefreshCw, AlertCircle, ChevronLeft, FileText, Database, Eye, EyeOff } from 'lucide-react'
import type { CmsField, CmsFieldType, CmsSchema, CmsItem } from '@/lib/cms'

interface Props {
  projectId: string | null
  isDark?: boolean
}

interface CollectionSummary {
  slug: string
  name: string
  fieldCount: number
  itemCount: number
}

type View =
  | { type: 'list' }
  | { type: 'new-schema' }
  | { type: 'items'; collection: string }
  | { type: 'edit'; collection: string; itemSlug: string | null } // null = new

export function ContentPanel({ projectId, isDark = true }: Props) {
  const [view, setView] = useState<View>({ type: 'list' })
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch collections whenever we land on the list view.
  useEffect(() => {
    if (!projectId || view.type !== 'list') return
    void refreshCollections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, view])

  async function refreshCollections() {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/${projectId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[CMS] collections list error', res.status, body)
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setCollections(data.schemas || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (!projectId) {
    return (
      <Empty
        icon={Database}
        title="Save your project first"
        body="Content collections live on a saved project. Use Save in the toolbar, then this panel will activate."
        isDark={isDark}
      />
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-3 py-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between shrink-0`}>
        {view.type === 'list' ? (
          <>
            <div className="flex items-center gap-2 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-pink-400" />
              <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>Content collections</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView({ type: 'new-schema' })}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium"
                title="New collection"
              >
                <Plus className="w-3 h-3" />
                New
              </button>
              <button
                onClick={refreshCollections}
                className={`p-1 rounded ${isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                title="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => {
              if (view.type === 'edit') setView({ type: 'items', collection: view.collection })
              else setView({ type: 'list' })
            }}
            className={`flex items-center gap-1 text-xs ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {error && (
          <div className="m-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {view.type === 'list' && (
          <CollectionsList
            collections={collections}
            loading={loading}
            onOpen={(slug) => setView({ type: 'items', collection: slug })}
            onCreate={() => setView({ type: 'new-schema' })}
            isDark={isDark}
          />
        )}
        {view.type === 'new-schema' && (
          <SchemaEditor
            projectId={projectId}
            isDark={isDark}
            onCreated={(slug) => setView({ type: 'items', collection: slug })}
          />
        )}
        {view.type === 'items' && (
          <ItemsList
            projectId={projectId}
            collection={view.collection}
            isDark={isDark}
            onEdit={(itemSlug) => setView({ type: 'edit', collection: view.collection, itemSlug })}
            onNew={() => setView({ type: 'edit', collection: view.collection, itemSlug: null })}
          />
        )}
        {view.type === 'edit' && (
          <ItemEditor
            projectId={projectId}
            collection={view.collection}
            itemSlug={view.itemSlug}
            isDark={isDark}
            onSaved={() => setView({ type: 'items', collection: view.collection })}
          />
        )}
      </div>
    </div>
  )
}

function Empty({ icon: Icon, title, body, isDark }: { icon: any; title: string; body: string; isDark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
      <Icon className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
      <div className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{title}</div>
      <div className={`text-xs max-w-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{body}</div>
    </div>
  )
}

function CollectionsList({ collections, loading, onOpen, onCreate, isDark }: {
  collections: CollectionSummary[]
  loading: boolean
  onOpen: (slug: string) => void
  onCreate: () => void
  isDark: boolean
}) {
  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
      </div>
    )
  }
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
        <FileText className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
        <div className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>No collections yet</div>
        <div className={`text-xs max-w-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          Collections are structured content (blog posts, services, team members) that the deployed site reads as JSON. Create one to get started.
        </div>
        <button
          onClick={onCreate}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Create your first collection
        </button>
        <div className={`text-[10px] mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
          Or ask the agent: <span className="font-mono">"add a blog with 3 posts"</span>
        </div>
      </div>
    )
  }
  return (
    <div className="p-2 space-y-1">
      {collections.map(c => (
        <button
          key={c.slug}
          onClick={() => onOpen(c.slug)}
          className={`w-full text-left rounded-lg px-3 py-2 transition border ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{c.name}</div>
            <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
            </div>
          </div>
          <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
            {c.slug} · {c.fieldCount} fields
          </div>
        </button>
      ))}
    </div>
  )
}

function ItemsList({ projectId, collection, isDark, onEdit, onNew }: {
  projectId: string
  collection: string
  isDark: boolean
  onEdit: (slug: string) => void
  onNew: () => void
}) {
  const [items, setItems] = useState<CmsItem[]>([])
  const [schema, setSchema] = useState<CmsSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/${projectId}/${collection}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[CMS] items list error', res.status, body)
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setItems(data.items || [])
      setSchema(data.schema || null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void refresh() }, [projectId, collection]) // eslint-disable-line

  async function deleteItem(slug: string) {
    if (!confirm(`Delete "${slug}"? This can't be undone.`)) return
    await fetch(`/api/cms/${projectId}/${collection}/${slug}`, { method: 'DELETE' })
    void refresh()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div>
  }
  return (
    <div className="p-2 space-y-1">
      <div className="flex items-center justify-between px-1 py-1">
        <div className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          {schema?.name || collection} · {items.length}
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>
      {error && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">{error}</div>
      )}
      {items.length === 0 && (
        <Empty icon={FileText} title="No items yet" body={`Click "New" to add your first ${schema?.name?.toLowerCase() || 'item'}.`} isDark={isDark} />
      )}
      {items.map(item => (
        <div
          key={item.slug}
          className={`group rounded-lg px-3 py-2 transition border ${
            isDark ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => onEdit(item.slug)} className="flex-1 text-left min-w-0">
              <div className={`text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                {pickTitle(item, schema) || item.slug}
              </div>
              <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-slate-500'} flex items-center gap-2`}>
                <span>{item.slug}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  item.status === 'published'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {item.status === 'published' ? <Eye className="w-2.5 h-2.5 inline mr-0.5" /> : <EyeOff className="w-2.5 h-2.5 inline mr-0.5" />}
                  {item.status}
                </span>
              </div>
            </button>
            {/* Edit + delete for a CMS item. Hover-only meant neither was
                reachable on a phone — the CMS panel opens in the mobile
                bottom sheet like every other tool. */}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
              <button onClick={() => onEdit(item.slug)} className={`p-2 md:p-1 rounded ${isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => deleteItem(item.slug)} className={`p-2 md:p-1 rounded hover:bg-red-500/15 ${isDark ? 'text-zinc-400 hover:text-red-300' : 'text-slate-600 hover:text-red-600'}`}>
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function pickTitle(item: CmsItem, schema: CmsSchema | null): string {
  if (!schema) return ''
  // Prefer a field literally named title, name, or label
  const preferred = schema.fields.find(f => ['title', 'name', 'label', 'headline'].includes(f.key))
  if (preferred && typeof item.fields[preferred.key] === 'string') {
    return item.fields[preferred.key]
  }
  const firstText = schema.fields.find(f => f.type === 'text' || f.type === 'textarea')
  if (firstText && typeof item.fields[firstText.key] === 'string') {
    return String(item.fields[firstText.key]).slice(0, 60)
  }
  return ''
}

function ItemEditor({ projectId, collection, itemSlug, isDark, onSaved }: {
  projectId: string
  collection: string
  itemSlug: string | null
  isDark: boolean
  onSaved: () => void
}) {
  const [schema, setSchema] = useState<CmsSchema | null>(null)
  const [fields, setFields] = useState<Record<string, any>>({})
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        if (itemSlug) {
          const res = await fetch(`/api/cms/${projectId}/${collection}/${itemSlug}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (cancelled) return
          setSchema(data.schema)
          setFields(data.item.fields || {})
          setSlug(data.item.slug)
          setStatus(data.item.status || 'draft')
        } else {
          const res = await fetch(`/api/cms/${projectId}/${collection}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (cancelled) return
          setSchema(data.schema)
          setFields({})
          setSlug('')
          setStatus('draft')
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [projectId, collection, itemSlug])

  async function save() {
    if (!schema) return
    setSaving(true); setError(null)
    try {
      if (itemSlug) {
        const res = await fetch(`/api/cms/${projectId}/${collection}/${itemSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields, status }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
      } else {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          throw new Error('Slug must be lowercase-hyphenated, e.g. "hello-world"')
        }
        const res = await fetch(`/api/cms/${projectId}/${collection}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, fields, status }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
      }
      onSaved()
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div>
  }
  if (!schema) {
    return <Empty icon={AlertCircle} title="Schema missing" body="This collection has no schema defined." isDark={isDark} />
  }

  return (
    <div className="p-3 space-y-3">
      {error && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-300 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {/* Slug + status row — slug only editable on create */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label isDark={isDark}>Slug</Label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!!itemSlug}
            placeholder="hello-world"
            className={inputCls(isDark) + ' font-mono text-xs'}
          />
        </div>
        <div>
          <Label isDark={isDark}>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className={inputCls(isDark) + ' text-xs'}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {schema.fields.map(field => (
        <FieldInput
          key={field.key}
          field={field}
          value={fields[field.key]}
          onChange={(v) => setFields(prev => ({ ...prev, [field.key]: v }))}
          isDark={isDark}
        />
      ))}

      <button
        onClick={save}
        disabled={saving}
        className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {itemSlug ? 'Save' : 'Create'}
      </button>
    </div>
  )
}

function Label({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return <div className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{children}</div>
}

function inputCls(isDark: boolean) {
  return `w-full px-2 py-1.5 rounded-md text-sm outline-none transition ${
    isDark
      ? 'bg-white/[0.04] border border-white/[0.08] text-zinc-100 focus:border-violet-500/50'
      : 'bg-white border border-slate-300 text-slate-900 focus:border-violet-500'
  }`
}

function FieldInput({ field, value, onChange, isDark }: {
  field: CmsField
  value: any
  onChange: (v: any) => void
  isDark: boolean
}) {
  const labelText = field.label || field.key + (field.required ? ' *' : '')
  switch (field.type) {
    case 'textarea':
    case 'markdown':
      return (
        <div>
          <Label isDark={isDark}>{labelText} {field.type === 'markdown' && <span className="opacity-50">(markdown)</span>}</Label>
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className={inputCls(isDark) + ' font-mono text-xs leading-relaxed'}
          />
        </div>
      )
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded accent-violet-500"
          />
          <Label isDark={isDark}>{labelText}</Label>
        </div>
      )
    case 'number':
      return (
        <div>
          <Label isDark={isDark}>{labelText}</Label>
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className={inputCls(isDark)}
          />
        </div>
      )
    case 'date':
      return (
        <div>
          <Label isDark={isDark}>{labelText}</Label>
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            className={inputCls(isDark)}
          />
        </div>
      )
    case 'image':
      return (
        <div>
          <Label isDark={isDark}>{labelText} <span className="opacity-50">(URL)</span></Label>
          <input
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/…"
            className={inputCls(isDark) + ' font-mono text-xs'}
          />
          {value && typeof value === 'string' && /^https?:\/\//.test(value) && (
            <img src={value} alt="" className="mt-1 rounded-md max-h-32 border border-white/10" />
          )}
        </div>
      )
    case 'url':
    case 'reference':
    case 'text':
    default:
      return (
        <div>
          <Label isDark={isDark}>{labelText}</Label>
          <input
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls(isDark)}
          />
        </div>
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SchemaEditor — create a new collection. Stage 1 supports creation only;
// editing an existing schema's fields lands in Stage 2 (field reorder /
// rename surfaces edge cases — what happens to existing items when a field
// type changes — that don't need to block first use).
// ─────────────────────────────────────────────────────────────────────────

const FIELD_TYPES: CmsFieldType[] = ['text', 'textarea', 'markdown', 'image', 'boolean', 'url', 'number', 'date', 'reference']

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

interface SchemaEditorRow extends CmsField {
  // Local-only id so React keys don't collide on rename
  _rowId: string
}

function SchemaEditor({ projectId, isDark, onCreated }: {
  projectId: string
  isDark: boolean
  onCreated: (slug: string) => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [fields, setFields] = useState<SchemaEditorRow[]>([
    { _rowId: 'r1', key: 'title', type: 'text', required: true },
    { _rowId: 'r2', key: 'body',  type: 'markdown' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-slug from name unless the user has manually edited the slug field
  useEffect(() => {
    if (!slugTouched) setSlug(slugifyName(name))
  }, [name, slugTouched])

  function addField() {
    setFields(prev => [...prev, { _rowId: 'r' + Date.now(), key: '', type: 'text' }])
  }
  function removeField(rowId: string) {
    setFields(prev => prev.filter(f => f._rowId !== rowId))
  }
  function updateField(rowId: string, patch: Partial<CmsField>) {
    setFields(prev => prev.map(f => f._rowId === rowId ? { ...f, ...patch } : f))
  }

  async function save() {
    setError(null)
    console.log('[CMS] Create collection clicked', { name, slug, projectId, fields })

    // Client-side projectId sanity check — Mongo ObjectIds are 24 hex chars.
    // If we got a local UUID instead, the server will 400 silently from the
    // user's perspective; flag it here so they know to Save the project first.
    if (!projectId || !/^[a-f0-9]{24}$/i.test(projectId)) {
      setError(`projectId looks invalid ("${projectId || 'none'}"). Save the project first via the disk icon — it needs a real cloud ID, not a local one.`)
      return
    }
    if (!name.trim()) { setError('Name is required'); return }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setError('Slug must be lowercase-hyphenated'); return }
    if (fields.length === 0) { setError('Add at least one field'); return }
    const seen = new Set<string>()
    for (const f of fields) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.key)) {
        setError(`Field key "${f.key}" must be lowercase-hyphenated (tab out of the field to auto-fix)`); return
      }
      if (seen.has(f.key)) { setError(`Duplicate field key "${f.key}"`); return }
      seen.add(f.key)
      if (f.type === 'reference' && !f.ref) { setError(`Reference field "${f.key}" needs a target collection`); return }
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/cms/${projectId}/schemas/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          fields: fields.map(({ _rowId, ...rest }) => ({
            key: rest.key,
            type: rest.type,
            label: rest.label || undefined,
            required: !!rest.required,
            ref: rest.type === 'reference' ? rest.ref : undefined,
          })),
        }),
      })
      console.log('[CMS] Response:', res.status, res.statusText)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[CMS] Error body:', err)
        throw new Error(err.error || `HTTP ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      console.log('[CMS] Created:', data)
      onCreated(slug)
    } catch (e: any) {
      console.error('[CMS] Save threw:', e)
      setError(e?.message || 'Failed to create collection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-3">
      {error && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-300 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Label isDark={isDark}>Collection name</Label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Blog Posts"
          className={inputCls(isDark)}
        />
      </div>
      <div>
        <Label isDark={isDark}>Slug <span className="opacity-50">(URL-safe, auto-generated)</span></Label>
        <input
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
          placeholder="blog-posts"
          className={inputCls(isDark) + ' font-mono text-xs'}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label isDark={isDark}>Fields</Label>
          <button
            onClick={addField}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Add field
          </button>
        </div>
        <div className="space-y-1.5">
          {fields.map(f => (
            <div
              key={f._rowId}
              className={`p-2 rounded-md border space-y-1.5 ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <input
                  value={f.key}
                  onChange={(e) => updateField(f._rowId, { key: e.target.value })}
                  onBlur={(e) => {
                    // Auto-slugify on blur so users can type "Our Services" and
                    // get "our-services" without having to fix the validation
                    // error themselves.
                    const cleaned = slugifyName(e.target.value)
                    if (cleaned !== f.key) updateField(f._rowId, { key: cleaned })
                  }}
                  placeholder="field-key"
                  className={inputCls(isDark) + ' col-span-5 font-mono text-xs py-1'}
                />
                <select
                  value={f.type}
                  onChange={(e) => updateField(f._rowId, { type: e.target.value as CmsFieldType })}
                  className={inputCls(isDark) + ' col-span-5 text-xs py-1'}
                >
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => removeField(f._rowId)}
                  className={`col-span-2 p-1 rounded ${isDark ? 'hover:bg-red-500/15 text-zinc-500 hover:text-red-300' : 'hover:bg-red-50 text-slate-500 hover:text-red-600'} flex items-center justify-center`}
                  title="Remove field"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!f.required}
                    onChange={(e) => updateField(f._rowId, { required: e.target.checked })}
                    className="w-3 h-3 rounded accent-violet-500"
                  />
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>required</span>
                </label>
                {f.type === 'reference' && (
                  <input
                    value={f.ref || ''}
                    onChange={(e) => updateField(f._rowId, { ref: e.target.value })}
                    placeholder="target-collection-slug"
                    className={inputCls(isDark) + ' flex-1 font-mono text-[11px] py-0.5'}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        Create collection
      </button>
    </div>
  )
}

export default ContentPanel
