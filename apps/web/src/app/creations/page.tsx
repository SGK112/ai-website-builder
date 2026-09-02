'use client'

// /creations — ONE place for everything the user has made: sites, videos, and
// images/logos, each tagged by type, newest first, mobile-first. Sites open in
// the builder; videos + images open in a lightbox with download. Pulls sites
// from /api/projects and media from /api/ai/video/creations (which now holds
// images/logos alongside clips).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, Globe, Video as VideoIcon, Image as ImageIcon, Download, X, Play, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Kind = 'site' | 'video' | 'image'
interface Creation {
  id: string
  kind: Kind
  subkind?: string // 'logo' | 'clip' | …
  title: string
  thumb?: string
  mediaUrl?: string
  href?: string
  date?: number
}

const FILTERS: Array<{ k: Kind | 'all'; label: string }> = [
  { k: 'all', label: 'All' },
  { k: 'site', label: 'Sites' },
  { k: 'video', label: 'Videos' },
  { k: 'image', label: 'Images' },
]

const KIND_META: Record<Kind, { label: string; icon: any; color: string }> = {
  site: { label: 'Site', icon: Globe, color: 'bg-violet-500/85' },
  video: { label: 'Video', icon: VideoIcon, color: 'bg-fuchsia-500/85' },
  image: { label: 'Image', icon: ImageIcon, color: 'bg-amber-500/85' },
}

export default function CreationsPage() {
  const { status } = useSession()
  const [items, setItems] = useState<Creation[] | null>(null)
  const [filter, setFilter] = useState<Kind | 'all'>('all')
  const [lightbox, setLightbox] = useState<Creation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let alive = true
    void Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })).catch(() => ({ projects: [] })),
      fetch('/api/ai/video/creations', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { creations: [] })).catch(() => ({ creations: [] })),
    ]).then(([p, c]) => {
      if (!alive) return
      const t = (d: any) => (d ? new Date(d).getTime() || 0 : 0)
      const sites: Creation[] = (p.projects || []).map((x: any) => ({
        id: String(x._id || x.id), kind: 'site' as const, title: x.name || 'Untitled',
        thumb: x.thumbnail, href: `/workspace?project=${x._id || x.id}`, date: t(x.updatedAt || x.createdAt),
      }))
      const media: Creation[] = (c.creations || []).map((x: any) => {
        const isImg = x.kind === 'image' || x.kind === 'logo'
        return {
          id: x.id, kind: (isImg ? 'image' : 'video') as Kind, subkind: x.kind,
          title: x.title || (isImg ? 'Image' : 'Video'), mediaUrl: x.url, thumb: isImg ? x.url : undefined, date: t(x.createdAt),
        }
      })
      setItems([...sites, ...media].sort((a, b) => (b.date || 0) - (a.date || 0)))
    }).catch(() => alive && setError('Could not load your creations'))
    return () => { alive = false }
  }, [status])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items?.length || 0, site: 0, video: 0, image: 0 }
    for (const i of items || []) c[i.kind]++
    return c
  }, [items])

  const shown = useMemo(() => (items || []).filter((i) => filter === 'all' || i.kind === filter), [items, filter])

  if (status === 'loading') return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
  if (status !== 'authenticated') return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-center px-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your creations</h1>
        <Link href={`/login?callbackUrl=${encodeURIComponent('/creations')}`} className="text-violet-400 hover:text-violet-300">Sign in to see them →</Link>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <Link href="/workspace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Builder
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Your creations</h1>
        <p className="text-sm text-muted-foreground mb-4">Every site, video, and image you've made — in one place.</p>

        {/* Filter chips — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-3 mb-2 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition border',
                filter === f.k ? 'bg-foreground text-background border-foreground' : 'bg-muted text-foreground/80 border-border hover:bg-muted/70',
              )}
            >
              {f.label} <span className={cn('ml-1 text-xs', filter === f.k ? 'text-muted-foreground' : 'text-muted-foreground')}>{counts[f.k] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {!items ? (
          <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground/80 mb-1">Nothing here yet</p>
            <p className="text-sm text-muted-foreground mb-4">Build a site, make a video, or design a logo — they'll all land here.</p>
            <Link href="/workspace" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium">Open the builder</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {shown.map((it) => {
              const meta = KIND_META[it.kind]
              const Inner = (
                <>
                  <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden flex items-center justify-center">
                    {it.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.thumb} alt={it.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : it.kind === 'video' && it.mediaUrl ? (
                      <>
                        <video src={it.mediaUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center"><Play className="w-7 h-7 text-foreground/90 drop-shadow-lg" /></span>
                      </>
                    ) : (
                      <meta.icon className="w-7 h-7 text-foreground/30" />
                    )}
                    <span className={cn('absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-foreground', meta.color)}>
                      <meta.icon className="w-3 h-3" /> {it.subkind === 'logo' ? 'Logo' : meta.label}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate">{it.title}</p>
                    {it.date ? <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(it.date).toLocaleDateString()}</p> : null}
                  </div>
                </>
              )
              const cls = 'group rounded-xl border border-border bg-muted/40 overflow-hidden hover:border-violet-500/40 transition text-left'
              return it.kind === 'site'
                ? <Link key={it.id} href={it.href || '/workspace'} className={cls}>{Inner}</Link>
                : <button key={it.id} onClick={() => setLightbox(it)} className={cls}>{Inner}</button>
            })}
          </div>
        )}
      </div>

      {/* Lightbox for video / image */}
      {lightbox && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-5" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Close"><X className="w-5 h-5" /></button>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            {lightbox.kind === 'video'
              ? <video src={lightbox.mediaUrl} controls autoPlay loop className="w-full rounded-2xl border border-border bg-black" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={lightbox.mediaUrl} alt={lightbox.title} className="w-full rounded-2xl border border-border bg-white object-contain max-h-[70vh]" />}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-foreground/80 truncate">{lightbox.title}</p>
              <a href={lightbox.mediaUrl} download target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold"><Download className="w-4 h-4" /> Download</a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
