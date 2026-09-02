import Link from 'next/link'
import { Compass, Sparkles } from 'lucide-react'

// Friendly fallback for public/shareable pages whose target is missing or
// expired (a deleted report, an unpublished listing, a removed video, a bad
// share link). We render this — a helpful, on-brand page with a way forward —
// instead of calling notFound(), because a bare 404 on a link someone clicked
// reads as "this product is broken." House rule: no dead 404 pages.
export function NotAvailable({
  title = 'This link isn’t available',
  message = 'It may have been removed, expired, or the link got garbled in transit.',
  primaryHref = '/grader',
  primaryLabel = 'Grade a site free',
  secondaryHref = '/',
  secondaryLabel = 'Go to Webstew',
}: {
  title?: string
  message?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/30">
          <Compass className="h-7 w-7 text-violet-700 dark:text-violet-300" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{message}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-medium text-sm transition"
          >
            <Sparkles className="h-4 w-4" />
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 font-medium text-sm transition"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </main>
  )
}
