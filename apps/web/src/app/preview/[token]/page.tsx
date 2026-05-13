import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSnapshotByToken } from '@/lib/preview-store'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { token: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const snap = await getSnapshotByToken(params.token).catch(() => null)
  const name = snap?.name || 'Preview'
  return {
    title: `${name} — Preview · Webstew`,
    description: 'A site preview built with Webstew. Build yours free at webstew.net.',
    robots: { index: false, follow: false }, // share-only links, not search-indexed
  }
}

export default async function PreviewPage({ params }: PageProps) {
  const snap = await getSnapshotByToken(params.token).catch(() => null)
  if (!snap) notFound()

  return (
    // Theme-aware frame: uses Tailwind dark: variant which the layout's
    // pre-hydration script drives via [data-theme="dark"] on <html>. Server
    // component, no React hook needed.
    <div className="fixed inset-0 bg-white dark:bg-black">
      <iframe
        srcDoc={snap.html}
        className="w-full h-full border-0"
        // Match the workspace sandbox: scripts + forms allowed, NO
        // allow-same-origin (the HTML is LLM-authored and could try to read
        // the parent origin's storage).
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
        title={snap.name || 'Webstew preview'}
      />
      <WebstewBadge />
    </div>
  )
}

function WebstewBadge() {
  return (
    <Link
      href="/?utm_source=preview&utm_medium=badge"
      target="_top"
      className="
        group fixed bottom-4 right-4 z-50
        flex items-center gap-2.5 px-3.5 py-2 rounded-full
        backdrop-blur-md
        bg-white/90 border border-slate-200 hover:border-violet-400
        text-slate-700 hover:text-slate-900
        shadow-lg shadow-slate-900/10
        dark:bg-zinc-950/90 dark:border-white/10 dark:hover:border-violet-400/40
        dark:text-zinc-200 dark:hover:text-white
        dark:shadow-black/40
        transition
      "
    >
      <span
        aria-hidden
        className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white"
      >
        W
      </span>
      <span className="text-xs font-medium tracking-tight">
        Made with <span className="text-slate-900 dark:text-white font-semibold">Webstew</span>
      </span>
      <span className="hidden sm:inline text-[11px] text-slate-500 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-300 transition">
        · Build yours free →
      </span>
    </Link>
  )
}
