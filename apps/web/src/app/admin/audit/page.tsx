'use client'

// /admin/audit — moderation/admin action log. Read-only.

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, AlertCircle, Filter } from 'lucide-react'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

interface Entry {
  _id: string
  action: string
  target: string
  listingId?: string
  by: string
  note?: string | null
  at: string
}

export default function AdminAuditPage() {
  const { data: session, status } = useSession()
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let alive = true
    setLoading(true)
    const qs = new URLSearchParams()
    if (filter) qs.set('action', filter)
    qs.set('limit', '200')
    fetch(`/api/admin/audit?${qs.toString()}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => { if (alive) setEntries(d.entries || []) })
      .catch((e) => alive && setError(e?.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [status, filter])

  if (status === 'loading') return <div className="p-10 text-muted-foreground">Loading…</div>
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Admin · Sign in required</h1>
          <Link href={`/login?callbackUrl=${encodeURIComponent('/admin/audit')}`} className="text-violet-400 hover:text-violet-300">Sign in →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminNav email={session?.user?.email || ''} />
      <main className="flex-1 max-w-5xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Audit log</h1>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All actions</option>
              <option value="listing.approved">Listing approved</option>
              <option value="listing.rejected">Listing rejected</option>
              <option value="listing.delete">Listing deleted</option>
              <option value="listing">Listing — all</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">When</th>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                  <th className="px-4 py-2 text-left font-semibold">Target</th>
                  <th className="px-4 py-2 text-left font-semibold">By</th>
                  <th className="px-4 py-2 text-left font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id} className="border-t border-border">
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.at).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                    <td className="px-4 py-2 text-xs">
                      {e.target}
                      {e.listingId && (
                        <span className="text-muted-foreground"> · <Link href={`/admin/listings`} className="hover:underline">{e.listingId.slice(0, 8)}…</Link></span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground font-mono truncate max-w-[180px]">{e.by}</td>
                    <td className="px-4 py-2 text-xs">{e.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
