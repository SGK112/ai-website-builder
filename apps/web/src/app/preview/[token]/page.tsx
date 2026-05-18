import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSnapshotByToken } from '@/lib/preview-store'
import type { Metadata } from 'next'
import { ProposalClient } from './ProposalClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { token: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const snap = await getSnapshotByToken(params.token).catch(() => null)
  const name = snap?.name || 'Preview'
  return {
    title: `${name} — ${snap?.type === 'proposal' ? 'Proposal' : 'Preview'} · Webstew`,
    description: 'Built with Webstew AI Website Builder.',
    robots: { index: false, follow: false },
  }
}

export default async function PreviewPage({ params }: PageProps) {
  const snap = await getSnapshotByToken(params.token).catch(() => null)
  if (!snap) notFound()

  return (
    <div className="fixed inset-0 bg-white dark:bg-black">
      <iframe
        srcDoc={snap.html}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
        title={snap.name || 'Webstew preview'}
      />
      {/* Client component handles view tracking + proposal accept overlay */}
      <ProposalClient
        token={params.token}
        type={snap.type ?? 'preview'}
        proposalName={snap.name ?? 'Proposal'}
        alreadyAccepted={!!snap.acceptedAt}
        viewCount={snap.viewCount ?? 0}
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
        group fixed bottom-4 right-4 z-40
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
