'use client'

// /admin — admin dashboard. Gated by middleware (auth required) + this
// page checks isAdminEmail on the session. Non-admins get a 403-style
// "you don't have access" screen instead of the dashboard.
//
// Three sections:
//   • KPI strip   — users, plan breakdown, generations 24h/7d, signups
//   • Users table — search, filter by plan, inline plan + credits edit
//   • Audit log   — recent admin actions (read-only here)

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Loader2, Search, Users, Activity, TrendingUp, ShieldAlert, Crown,
  Save, X, RefreshCw, Calendar, ChevronLeft, ChevronRight, ExternalLink, AlertCircle,
} from 'lucide-react'

// Client-side admin hint list — server enforces the real auth check on every
// /api/admin/* call. This list just controls whether the dashboard renders
// or shows a "no access" screen on initial load. Include both Joshua's
// accounts since memory notes he signs in as either depending on context.
const ADMIN_EMAIL_HINTS = [
  'joshb@surprisegranite.com',
  'aria@surprisegranite.com',
  'admin@webstew.net',
]

interface Stats {
  users: { total: number; new_7d: number; new_30d: number; by_plan: Record<string, number> }
  projects: { total: number; new_7d: number }
  generations: { last_24h: number; last_7d: number }
  generated_at: string
}

interface AdminUser {
  id: string
  email: string
  name?: string
  plan: string
  credits: number | null
  subscriptionStatus?: string
  image?: string
  provider?: string
  createdAt?: string
  lastLoginAt?: string
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  starter: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  pro: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  scale: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  enterprise: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  custom: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession()
  const userEmail = session?.user?.email?.toLowerCase() || ''
  // Client-side check — server enforces auth too, but this lets us render
  // the right view immediately instead of waiting for an API 403.
  const isAdmin = ADMIN_EMAIL_HINTS.includes(userEmail)

  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editCredits, setEditCredits] = useState<string>('')
  const limit = 50

  const loadStats = useCallback(async () => {
    setStatsError(null)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      setStats(await res.json())
    } catch (e: any) {
      setStatsError(e?.message || 'Failed to load stats')
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (planFilter) params.set('plan', planFilter)
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [q, planFilter, offset])

  useEffect(() => {
    if (sessionStatus === 'loading' || !isAdmin) return
    loadStats()
  }, [sessionStatus, isAdmin, loadStats])

  useEffect(() => {
    if (sessionStatus === 'loading' || !isAdmin) return
    const t = setTimeout(() => { loadUsers() }, 250) // debounce search
    return () => clearTimeout(t)
  }, [sessionStatus, isAdmin, loadUsers])

  const startEdit = (u: AdminUser) => {
    setSaveError(null)
    setEditingId(u.id)
    setEditPlan(u.plan)
    setEditCredits(u.credits != null ? String(u.credits) : '')
  }

  const saveEdit = async (id: string) => {
    setSaveError(null)
    const body: any = { plan: editPlan }
    if (editCredits !== '') {
      const n = parseInt(editCredits, 10)
      if (Number.isFinite(n) && n >= 0) body.credits = n
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setSaveError(j.error || `Update failed (HTTP ${res.status})`)
        return
      }
      setEditingId(null)
      await loadUsers()
    } catch (e: any) {
      setSaveError(e?.message || 'Update failed')
    }
  }

  // GATE — non-admins see a refusal, not a dashboard.
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2">Admin · Sign in required</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in as an admin to view this page.</p>
          <Link href="/login?next=/admin" className="inline-block px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">
            Sign in
          </Link>
        </div>
      </div>
    )
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2">403 · Not an admin</h1>
          <p className="text-muted-foreground mb-1">Signed in as <span className="font-mono">{userEmail}</span>.</p>
          <p className="text-muted-foreground text-sm">Only admin emails (set in <span className="font-mono">ADMIN_EMAILS</span>) can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-400" />
            <h1 className="font-bold text-lg">Webstew Admin</h1>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono">{userEmail}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/listings"
              className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25 transition"
            >
              Listings queue
            </Link>
            <button
              onClick={() => { loadStats(); loadUsers() }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total users" value={stats?.users.total ?? '—'} icon={Users} sub={stats ? `+${stats.users.new_7d} this week` : undefined} />
          <Kpi label="Projects" value={stats?.projects.total ?? '—'} icon={TrendingUp} sub={stats ? `+${stats.projects.new_7d} this week` : undefined} />
          <Kpi label="Generations 24h" value={stats?.generations.last_24h ?? '—'} icon={Activity} sub={stats ? `${stats.generations.last_7d} this week` : undefined} />
          <Kpi label="New signups 30d" value={stats?.users.new_30d ?? '—'} icon={Calendar} />
        </section>

        {statsError && (
          <div className="-mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-red-400">Couldn’t load stats: {statsError}</div>
            </div>
            <button
              onClick={() => loadStats()}
              className="text-xs px-2 py-1 rounded bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25 transition shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Plan breakdown */}
        {stats && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Users by plan</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.users.by_plan)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([plan, count]) => (
                  <div
                    key={plan}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${PLAN_COLORS[plan] || 'bg-muted text-muted-foreground border-border'}`}
                  >
                    <span className="font-bold">{count}</span>
                    <span className="opacity-80">{plan}</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Users table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Users</h2>
            <div className="text-xs text-muted-foreground">{total.toLocaleString()} total</div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 flex items-center bg-card border border-border rounded-lg px-3">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setOffset(0) }}
                placeholder="Search by email…"
                className="flex-1 bg-transparent border-0 px-2 py-2 text-sm focus:outline-none"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setOffset(0) }}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="scale">Scale</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-red-400">{error}</div>
            </div>
          )}

          {saveError && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-red-400">{saveError}</div>
            </div>
          )}

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Credits</th>
                    <th className="px-4 py-3 font-semibold">Sub status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</td></tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No users match this filter.</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/20 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.image
                            ? <img src={u.image} alt="" className="w-7 h-7 rounded-full" />
                            : <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white">{(u.email[0] || '?').toUpperCase()}</div>}
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[260px]">{u.email}</div>
                            {u.name && <div className="text-[11px] text-muted-foreground truncate max-w-[260px]">{u.name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select
                            value={editPlan}
                            onChange={(e) => setEditPlan(e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1 text-xs"
                          >
                            {['free', 'starter', 'pro', 'scale', 'enterprise', 'custom'].map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${PLAN_COLORS[u.plan] || 'bg-muted text-muted-foreground border-border'}`}>
                            {u.plan}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {editingId === u.id ? (
                          <input
                            type="number"
                            value={editCredits}
                            onChange={(e) => setEditCredits(e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1 text-xs w-20"
                            min={0}
                          />
                        ) : (
                          u.credits ?? <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.subscriptionStatus || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === u.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => saveEdit(u.id)} className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" title="Save"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setSaveError(null); setEditingId(null) }} className="p-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(u)} className="text-xs text-violet-300 hover:text-violet-200 font-medium">Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {users.length === 0 ? 0 : offset + 1}-{offset + users.length} of {total.toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + users.length >= total}
                  className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-xs text-muted-foreground pt-4">
          Admin emails are defined in <span className="font-mono">packages/database/src/models/Usage.ts → ADMIN_EMAILS</span>. All mutations are logged to <span className="font-mono">admin_audit</span>.
        </footer>
      </main>
    </div>
  )
}

function Kpi({ label, value, icon: Icon, sub }: { label: string; value: any; icon: any; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}
