// Public watch page for a shared Webstew video — /v/<shareId>.
//
// Anonymous-friendly (no auth; /v is not in the middleware's gated prefixes).
// Reads the shared_videos record straight from Mongo (the share API is under
// the gated /api/ai/video tree, so we don't call it from here). Renders a
// player + a CTA back to the studio, and emits OpenGraph/Twitter tags so the
// link unfurls with an inline video preview when pasted into chats/social.

import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { connectDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://www.webstew.net').replace(/\/+$/, '')
}

// A still frame from the Cloudinary video for og:image (link unfurls show it).
function posterUrl(videoUrl: string): string | null {
  if (!/res\.cloudinary\.com|cloudinary\.com/.test(videoUrl)) return null
  return videoUrl.replace('/video/upload/', '/video/upload/so_0/').replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg')
}

interface Shared { url: string; title: string; createdAt?: Date }

// Cached so the page render and generateMetadata share one DB read.
const getShared = cache(async (shareId: string): Promise<Shared | null> => {
  try {
    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return null
    const doc = await db.collection('shared_videos').findOne({ shareId })
    if (!doc) return null
    return { url: doc.url, title: doc.title || 'A Webstew video', createdAt: doc.createdAt }
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const shared = await getShared(params.id)
  if (!shared) return { title: 'Video not found · Webstew' }
  const title = `${shared.title} · Made with Webstew`
  const description = 'Watch this AI-generated video, made in Webstew Studio. Create your own in minutes.'
  const url = `${baseUrl()}/v/${params.id}`
  const poster = posterUrl(shared.url)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: 'video.other',
      videos: [{ url: shared.url, type: 'video/mp4' }],
      images: poster ? [{ url: poster }] : undefined,
    },
    twitter: {
      card: 'player',
      title, description,
      images: poster ? [poster] : undefined,
    },
  }
}

export default async function WatchPage({ params }: { params: { id: string } }) {
  const shared = await getShared(params.id)
  if (!shared) notFound()
  const poster = posterUrl(shared.url) || undefined

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Brand bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <a href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">W</span>
          <span className="text-sm font-semibold text-white">Webstew</span>
        </a>
        <a href="/video" className="rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-200 px-3 py-1.5">Open the studio</a>
      </header>

      {/* Player */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl">
          <video src={shared.url} poster={poster} controls autoPlay playsInline className="w-full rounded-2xl bg-black shadow-2xl shadow-black/50" />
          <h1 className="mt-4 text-lg font-semibold text-white">{shared.title}</h1>
          <p className="text-sm text-zinc-500">An AI-generated video, made in Webstew Studio.</p>

          {/* CTA */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-600/10 to-violet-600/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Make your own video</div>
              <div className="text-xs text-zinc-400">Describe a scene, generate clips, and stitch a film — no editing skills needed.</div>
            </div>
            <a href="/video" className="shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 text-white text-sm font-semibold px-4 py-2.5">Try Webstew Studio</a>
          </div>
        </div>
      </main>

      <footer className="px-5 py-4 text-center text-[11px] text-zinc-600 border-t border-white/10">
        Made with <a href="/" className="text-violet-400 hover:text-violet-300">Webstew</a>
      </footer>
    </div>
  )
}
