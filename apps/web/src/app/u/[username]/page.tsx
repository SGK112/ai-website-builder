// Public seller / creator profile.
// /u/<username> — anyone (including anon) can view. Shows the user's
// approved community listings plus light author meta. Username is the
// email-prefix that gets stamped onto community_posts at publish time;
// when collisions happen the older author wins. v2 can introduce real
// username uniqueness on the User model.
//
// Server component so this gets indexed + shows correct OG tags when
// someone shares the URL.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, BadgeCheck, ExternalLink, Calendar, Eye, Heart } from 'lucide-react'
import type { Metadata } from 'next'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { username: string }
}

interface Author {
  id: string
  name: string
  username: string
  avatar?: string
}

interface Listing {
  _id: string
  type: string
  title: string
  description?: string
  thumbnail?: string
  category?: string
  tags?: string[]
  likes?: number
  views?: number
  createdAt: string
}

interface ProfileData {
  username: string
  author: Author
  listings: Listing[]
  totalViews: number
  totalLikes: number
  firstSeenAt: string | null
}

async function loadProfile(username: string): Promise<ProfileData | null> {
  // Username field is restricted to email-prefix-safe chars by upstream
  // (split('@')[0]). Still scrub for the regex to be safe — only a-zA-Z0-9._-.
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(username)) return null
  const client = await clientPromise
  const db = client.db('ai-website-builder')

  const posts = await db
    .collection('community_posts')
    .find(
      {
        'author.username': username,
        isPublic: true,
        // Approved only on the public profile; pending listings aren't
        // surfaced here even to the author (they can still see them on
        // /community via the per-user $or branch).
        $or: [{ status: 'approved' }, { status: { $exists: false } }],
      },
      { projection: { html: 0 } }
    )
    .sort({ createdAt: -1 })
    .limit(60)
    .toArray()

  if (posts.length === 0) return null

  const first = posts[0]
  return {
    username,
    author: {
      id: String(first.author?.id || ''),
      name: first.author?.name || username,
      username: first.author?.username || username,
      avatar: first.author?.avatar,
    },
    listings: posts.map((p) => ({
      _id: String(p._id),
      type: p.type,
      title: p.title,
      description: p.description,
      thumbnail: p.thumbnail,
      category: p.category,
      tags: p.tags,
      likes: p.likes || 0,
      views: p.views || 0,
      createdAt: (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt)).toISOString(),
    })),
    totalViews: posts.reduce((s, p) => s + (p.views || 0), 0),
    totalLikes: posts.reduce((s, p) => s + (p.likes || 0), 0),
    firstSeenAt: posts.length > 0
      ? (posts[posts.length - 1].createdAt instanceof Date
          ? posts[posts.length - 1].createdAt.toISOString()
          : String(posts[posts.length - 1].createdAt))
      : null,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadProfile(params.username)
  if (!data) {
    return { title: `@${params.username} · Webstew` }
  }
  return {
    title: `${data.author.name} (@${data.author.username}) · Webstew`,
    description: `${data.author.name} has shared ${data.listings.length} site${data.listings.length === 1 ? '' : 's'} on Webstew. View the catalog and remix any of them.`,
    openGraph: {
      title: `${data.author.name} on Webstew`,
      description: `${data.listings.length} site${data.listings.length === 1 ? '' : 's'} shared`,
      type: 'profile',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const data = await loadProfile(params.username)
  if (!data) notFound()

  const isSeller = data.listings.length > 0
  const initials = data.author.name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <Link href="/community" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to community
        </Link>

        {/* Profile header */}
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 mb-10">
          <div className="relative shrink-0">
            {data.author.avatar ? (
              <img
                src={data.author.avatar}
                alt={data.author.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-3xl font-bold">
                {initials || '?'}
              </div>
            )}
            {isSeller && (
              <span
                className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] uppercase tracking-wider font-bold text-emerald-300"
                title="Has shared content with the community"
              >
                <BadgeCheck className="w-3 h-3" /> Creator
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">{data.author.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">@{data.author.username}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-400" />
                {data.listings.length} site{data.listings.length === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-zinc-500" />
                {data.totalViews.toLocaleString()} views
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-400/80" />
                {data.totalLikes.toLocaleString()} likes
              </span>
              {data.firstSeenAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  Since {new Date(data.firstSeenAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Listings grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Public sites
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.listings.map((l) => (
              <Link
                key={l._id}
                href={`/community#listing-${l._id}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-violet-500/40 transition"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                  {l.thumbnail ? (
                    <img
                      src={l.thumbnail}
                      alt={l.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const img = e.currentTarget
                        const seed = encodeURIComponent(l._id)
                        const fallback = `https://picsum.photos/seed/${seed}/800/500`
                        if (img.src !== fallback) img.src = fallback
                        else img.style.display = 'none'
                      }}
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight">{l.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 shrink-0">
                      {l.type}
                    </span>
                  </div>
                  {l.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{l.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-600 mt-3">
                    <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {l.views}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {l.likes}</span>
                    <span>·</span>
                    <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA — turn viewers into authors */}
        <section className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 sm:p-8 text-center">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-300" /> Want your own creator page?
          </h3>
          <p className="text-sm text-zinc-400 mb-5">
            Build a site with Webstew, hit publish, your work shows up at /u/&lt;your-handle&gt;.
            Free to start, no card required.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/signup" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium text-sm">
              Get started — free
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded-lg font-medium text-sm"
            >
              Browse all creators <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
