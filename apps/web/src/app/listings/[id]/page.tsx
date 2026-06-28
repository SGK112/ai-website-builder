// Public listing detail page. Anon-accessible — free listings render
// the live HTML iframe; premium listings show metadata + buy CTA.

import Link from 'next/link'
import { NotAvailable } from '@/components/NotAvailable'
import { ArrowLeft, Eye, Heart, Sparkles, BadgeCheck, ShoppingBag, Crown, ExternalLink, Tag } from 'lucide-react'
import type { Metadata } from 'next'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminEmail } from '@ai-website-builder/database'
import { ListingActions } from '@/components/marketplace/ListingActions'
import { seoTitle, seoDescription, clip } from '@/lib/seo'

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
  videoUrl?: string
}

async function loadListing(id: string): Promise<ListingSummary | null> {
  if (!ObjectId.isValid(id)) return null
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const doc = await db.collection('community_posts').findOne({ _id: new ObjectId(id) })
  if (!doc) return null
  // Premium listings hide their deliverable (html / video) behind the paywall —
  // EXCEPT for the owner and admins, who must see their own work (otherwise the
  // seller hits a "Preview locked" wall on a site they just listed). Buyers get
  // the entitled content through the /api/listings/[id] + buy/use flow.
  const session = await getServerSession(authOptions).catch(() => null)
  const viewerId = session?.user?.id || ''
  const isOwner = !!viewerId && String(doc.author?.id || '') === String(viewerId)
  const isAdmin = !!session?.user?.email && isAdminEmail(session.user.email)
  const isPremium = !!doc.isPremium && (Number(doc.price_credits) || 0) > 0
  let canSeeContent = !isPremium || isOwner || isAdmin
  // A buyer who purchased it gets the deliverable too (mirrors the entitlement
  // check in /api/listings/[id]). Refunded purchases don't count.
  if (!canSeeContent && viewerId) {
    const purchase = await db.collection('marketplace_purchases').findOne(
      { buyerId: viewerId, listingId: String(doc._id), status: { $ne: 'refunded' } },
      { projection: { _id: 1 } },
    )
    if (purchase) canSeeContent = true
  }
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
    html: canSeeContent ? doc.html : undefined,
    // Gate the playable file like html: free / owner / admin → playable;
    // otherwise premium → poster + buy overlay only.
    videoUrl: canSeeContent ? doc.videoUrl : undefined,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const l = await loadListing(params.id)
  if (!l) return { title: 'Listing · Webstew' }
  const author = l.author?.name || l.author?.username || 'a creator'
  // User-written title/description are unbounded — clamp to search limits.
  return {
    title: { absolute: seoTitle(`${l.title} — by ${author}`) },
    description: seoDescription(l.description || `${l.title} — built on Webstew.`),
    openGraph: {
      title: clip(l.title, 60),
      description: seoDescription(l.description),
      images: l.thumbnail ? [l.thumbnail] : undefined,
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const l = await loadListing(params.id)
  if (!l) return (
    <NotAvailable
      title="This listing isn’t available"
      message="It may have been unpublished or removed. There's plenty more in the marketplace."
      primaryHref="/community"
      primaryLabel="Browse the marketplace"
    />
  )

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
                  <Crown className="w-3 h-3" /> ${((l.priceCredits || 0) / 100).toFixed(2)}
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
          {l.type === 'video' && l.videoUrl ? (
            // Free video listing — playable. (Premium video has no videoUrl
            // here, so it falls through to the locked poster below.)
            <video src={l.videoUrl} poster={l.thumbnail} controls playsInline className="w-full max-h-[600px] bg-black" />
          ) : l.html ? (
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
                    <p className="text-sm text-zinc-400 mb-4">{l.type === 'video' ? 'Buy this listing to get the full video.' : 'Buy this listing to view the full site + get the source.'}</p>
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
