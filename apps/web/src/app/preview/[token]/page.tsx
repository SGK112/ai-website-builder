import Link from 'next/link'
import { NotAvailable } from '@/components/NotAvailable'
import { getSnapshotByToken } from '@/lib/preview-store'
import { isBuilderAppShell } from '@/lib/app-shell'
import type { Metadata } from 'next'
import { ProposalClient } from './ProposalClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// The preview iframe is sandboxed WITHOUT allow-same-origin (the content is
// LLM-authored / user HTML served on webstew.net — same-origin would let it
// read our cookies/session). But that makes localStorage/sessionStorage THROW,
// so any generated site that touches them (theme toggles, the auth SDK, etc.)
// crashes its scripts and the page looks broken — especially "view on your
// phone". The workspace editor injects this same in-memory shim; the shared
// preview must too. Runs before any site script.
const STORAGE_SHIM = `<script>(function(){function mem(){var m={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){for(var k in m)delete m[k]},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}}['localStorage','sessionStorage'].forEach(function(n){var ok=false;try{window[n]&&window[n].getItem('__p__');ok=true}catch(e){}if(!ok){try{Object.defineProperty(window,n,{value:mem(),configurable:true})}catch(e){}}})})();</script>`

function withSandboxShim(html: string): string {
  const h = html || ''
  // Inject right after <head> so it runs before any in-page script.
  const m = h.match(/<head[^>]*>/i)
  if (m) return h.replace(m[0], m[0] + STORAGE_SHIM)
  // No <head> — prepend so it still runs first.
  return STORAGE_SHIM + h
}

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
  if (!snap) return (
    <NotAvailable
      title="This preview has expired"
      message="Preview links are temporary. Build or open your project to get a fresh one."
      primaryHref="/workspace"
      primaryLabel="Open the builder"
    />
  )

  // Old snapshots can hold a captured builder-app shell (not a site). It can
  // only CORS-error to a white page in the sandbox — show a clean message.
  if (isBuilderAppShell(snap.html)) return (
    <NotAvailable
      title="This preview isn't available"
      message="This snapshot didn't capture a built site. Open your project and create a fresh preview."
      primaryHref="/workspace"
      primaryLabel="Open the builder"
    />
  )

  return (
    <div className="fixed inset-0 bg-white dark:bg-black">
      <iframe
        srcDoc={withSandboxShim(snap.html)}
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
