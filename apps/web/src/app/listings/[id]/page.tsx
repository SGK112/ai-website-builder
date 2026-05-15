// Public listing detail page. Anon-accessible — free listings render
// the live HTML iframe; premium listings show metadata + buy CTA.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, Heart, Sparkles, BadgeCheck, ShoppingBag, Crown, ExternalLink, Tag } from 'lucide-react'
import type { Metadata } from 'next'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ListingActions } from '@/components/marketplace/ListingActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { id: string }
}

interface ListingSummary {
  _id: string
  type: string
  title: string
  description?: string
  thumbnail?: string
  author?: { id?: string; name?: string; username?: string; avatar?: string }
  tags?: string[]
  category?: string
  likes?: number
  views?: number
  downloads?: number
  isPremium?: boolean
  priceCredits?: number
  createdAt?: string
  html?: string
}

async function loadListing(id: string): Promise<ListingSummary | null> {
  if (!ObjectId.isValid(id)) return null
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const doc = await db.collection('community_posts').findOne({ _id: new ObjectId(id) })
  if (!doc) return null
  // SSR doesn't have a session so we render the public-safe shape (no html
  // unless free). Client-side mounts ListingActions which calls
  // /api/listings/[id] with the user's session and re-fetches html if
  // they own it.
  const isPremium = !!doc.isPremium && (Number(doc.price_credits) || 0) > 0
  return {
    _id: String(doc._id),
    type: doc.type,
    title: doc.title,
    description: doc.description,
    thumbnail: doc.thumbnail,
    author: doc.author,
    tags: doc.tags,
    category: doc.category,
    likes: doc.likes || 0,
    views: doc.views || 0,
    downloads: doc.downloads || 0,
    isPremium,
    priceCredits: Number(doc.price_credits) || 0,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || ''),
    html: !isPremium ? doc.html : undefined,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const l = await loadListing(params.id)
  if (!l) return { title: 'Listing · Webstew' }
  const author = l.author?.name || l.author?.username || 'a creator'
  return {
    title: `${l.title} · by ${author} · Webstew`,
    description: l.description?.slice(0, 200) || `${l.title} — built on Webstew.`,
    openGraph: {
      title: l.title,
      description: l.description?.slice(0, 200),
      images: l.thumbnail ? [l.thumbnail] : undefined,
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const l = await loadListing(params.id)
  if (!l) notFound()

  const author = l.author || {}
  const authorHref = author.username ? `/u/${author.username}` : undefined

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <Link href="/community" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to community
        </Link>

        {/* Hero strip — title, author, headline counters, premium badge */}
        <header className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-zinc-400">{l.type}</span>
              {l.isPremium && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Crown className="w-3 h-3" /> {l.priceCredits} credits
                </span>
              )}
              {l.category && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                  <Tag className="w-3 h-3" /> {l.category}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{l.title}</h1>
            {authorHref ? (
              <Link href={authorHref} className="mt-3 inline-flex items-center gap-2 group">
                {author.avatar && (
                  <img src={author.avatar} alt={author.name || ''} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                )}
                <span className="text-sm text-zinc-300 group-hover:text-white">
                  by <span className="font-medium">{author.name || author.username}</span>
                </span>
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">by {author.name || 'unknown'}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><Eye className="w-4 h-4" /> {l.views?.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-pink-400/80" /> {l.likes?.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> {l.downloads?.toLocaleString()}</span>
          </div>
        </header>

        {/* Thumbnail / preview area. Free listings get an interactive iframe.
            Premium listings get the thumbnail with a buy overlay. */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden mb-6">
          {l.html ? (
            <iframe
              srcDoc={l.html}
              className="w-full h-[600px] border-0 bg-white"
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
              title={`Preview: ${l.title}`}
            />
          ) : l.thumbnail ? (
            <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-800 to-slate-900">
              <img
                src={l.thumbnail}
                alt={l.title}
                className="w-full h-full object-cover"
              />
              {l.isPremium && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center px-6">
                    <Crown className="w-8 h-8 text-amber-300 mx-auto mb-3" />
                    <p className="text-lg font-semibold mb-1">Preview locked</p>
                    <p className="text-sm text-zinc-400 mb-4">Buy this listing to view the full site + get the source.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No preview available.</div>
          )}
        </section>

        {/* Description + tags */}
        {(l.description || (l.tags && l.tags.length > 0)) && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            {l.description && <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{l.description}</p>}
            {l.tags && l.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {l.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-zinc-400">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Actions — like / save / buy / use. Client-mounted so it can
            read the viewer's session + owned state. */}
        <ListingActions
          listingId={l._id}
          title={l.title}
          isPremium={!!l.isPremium}
          priceCredits={l.priceCredits || 0}
        />

        {/* Author card + remix CTA */}
        <section className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 text-center">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-300" /> Want one like this?
          </h3>
          <p className="text-sm text-zinc-400 mb-5">
            Webstew can generate your own version with the same structure, styled to your brand. Free to try.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href={`/signup?next=${encodeURIComponent(`/workspace?prompt=${encodeURIComponent(`Build a site like "${l.title}" but for my business`)}`)}`}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium text-sm">
              Make your own — free
            </Link>
            <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded-lg font-medium text-sm">
              Browse more <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
