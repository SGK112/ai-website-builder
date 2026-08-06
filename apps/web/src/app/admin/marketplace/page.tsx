'use client'

// /admin/marketplace — top sellers, recent purchases, top listings,
// headline stats. Read-only for v1 (no payouts UI yet).

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, AlertCircle, DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

interface Stats {
  listings: { total: number; approved: number }
  purchases: number
  creditsTransacted: number
}
interface Seller {
  _id: string
  email?: string
  name?: string
  username?: string
  marketplace_earnings_credits?: number
  plan?: string
}
interface Purchase {
  _id: string
  buyerId: string
  sellerId: string
  listingTitle: string
  listingType: string
  priceCredits: number
  purchasedAt: string
}
interface TopListing {
  _id: string
  count: number
  title: string
  type: string
  credits: number
}

export default function AdminMarketplacePage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [topSellers, setTopSellers] = useState<Seller[]>([])
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([])
  const [topListings, setTopListings] = useState<TopListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (status !== 'authenticated') return
    fetch('/api/admin/marketplace', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        if (!alive) return
        setStats(d.stats || null)
        setTopSellers(d.topSellers || [])
        setRecentPurchases(d.recentPurchases || [])
        setTopListings(d.topListings || [])
      })
      .catch((e) => alive && setError(e?.message || 'Failed to load'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [status])

  if (status === 'loading') return <div className="p-10 text-muted-foreground">Loading…</div>
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Admin · Sign in required</h1>
          <Link href={`/login?callbackUrl=${encodeURIComponent('/admin/marketplace')}`} className="text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300">Sign in →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminNav email={session?.user?.email || ''} />
      <main className="flex-1 max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Marketplace</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
        ) : (
          <>
            {/* KPI strip */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <Kpi label="Listings" value={stats?.listings.total ?? 0} sub={`${stats?.listings.approved ?? 0} approved`} icon={Package} />
              <Kpi label="Purchases" value={stats?.purchases ?? 0} icon={ShoppingBag} />
              <Kpi label="Credits transacted" value={stats?.creditsTransacted ?? 0} icon={DollarSign} />
              <Kpi label="Active sellers" value={topSellers.length} icon={TrendingUp} />
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top sellers */}
              <section className="rounded-2xl border border-border bg-card">
                <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold">Top sellers</h2>
                  <span className="text-xs text-muted-foreground">by lifetime earnings (credits)</span>
                </header>
                <div className="divide-y divide-border">
                  {topSellers.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No earnings yet.</div>
                  ) : (
                    topSellers.map((s) => (
                      <div key={s._id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{s.name || s.username || s.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-violet-700 dark:text-violet-300">{(s.marketplace_earnings_credits || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">credits</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Top listings */}
              <section className="rounded-2xl border border-border bg-card">
                <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold">Top listings</h2>
                  <span className="text-xs text-muted-foreground">by purchase count</span>
                </header>
                <div className="divide-y divide-border">
                  {topListings.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No purchases yet.</div>
                  ) : (
                    topListings.map((l) => (
                      <div key={l._id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{l.title}</p>
                          <p className="text-xs text-muted-foreground">{l.type} · {l.credits} credits earned</p>
                        </div>
                        <p className="font-bold">{l.count}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Recent purchases */}
            <section className="mt-6 rounded-2xl border border-border bg-card">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold">Recent purchases</h2>
              </header>
              {recentPurchases.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No purchases yet — fire the seed if you'd like demo data.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Listing</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-right font-semibold">Credits</th>
                      <th className="px-4 py-2 text-right font-semibold">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map((p) => (
                      <tr key={p._id} className="border-t border-border">
                        <td className="px-4 py-2">{p.listingTitle}</td>
                        <td className="px-4 py-2 text-muted-foreground">{p.listingType}</td>
                        <td className="px-4 py-2 text-right font-mono">{p.priceCredits}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground text-xs">{new Date(p.purchasedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Kpi({ label, value, sub, icon: Icon }: { label: string; value: number | string; sub?: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}
