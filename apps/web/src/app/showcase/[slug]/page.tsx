// Demo / template showcase detail page.
// Mirrors /listings/[id] chrome but the source is the static DEMO_SITES
// collection (same HTML that drives the morphing landing-page preview),
// so demos always render even with no Mongo content. No DB read, no auth,
// 404 on unknown slug.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, BadgeCheck, ExternalLink, Tag, Wand2 } from 'lucide-react'
import type { Metadata } from 'next'
import { DEMO_SITES } from '@/lib/demo-sites'
import { seoTitle, seoDescription } from '@/lib/seo'

export const dynamic = 'force-static'

interface PageProps {
  params: { slug: string }
}

const CATEGORY: Record<string, string> = {
  saas: 'Landing page',
  portfolio: 'Portfolio',
  mobile: 'Mobile app',
  ecommerce: 'E-commerce',
  blog: 'Blog',
  restaurant: 'Restaurant',
}

const TAGS: Record<string, string[]> = {
  saas: ['landing', 'analytics', 'dark', 'gradient'],
  portfolio: ['portfolio', 'creative', 'minimal'],
  mobile: ['mobile', 'app', 'product'],
  ecommerce: ['ecommerce', 'shop', 'product-grid'],
  blog: ['blog', 'editorial', 'magazine'],
  restaurant: ['restaurant', 'menu', 'local'],
}

export async function generateStaticParams() {
  return DEMO_SITES.map((d) => ({ slug: d.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const d = DEMO_SITES.find((x) => x.id === params.slug)
  if (!d) return { title: 'Template · Webstew' }
  return {
    title: { absolute: seoTitle(`${d.label} template`) },
    description: seoDescription(`${d.label} — ${d.prompt}. Generated with Webstew; use it as a starting prompt for your own site.`),
    openGraph: {
      title: `${d.label} template · Webstew`,
      description: d.prompt,
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default function ShowcasePage({ params }: PageProps) {
  const d = DEMO_SITES.find((x) => x.id === params.slug)
  if (!d) notFound()

  const cat = CATEGORY[d.id] || 'Template'
  const tags = TAGS[d.id] || []
  const remixHref = `/signup?next=${encodeURIComponent(`/workspace?prompt=${encodeURIComponent(d.prompt)}`)}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to community
        </Link>

        <header className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Webstew template
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                <Tag className="w-3 h-3" /> {cat}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{d.label}</h1>
            <Link href="/u/webstew" className="mt-3 inline-flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold border border-white/10">
                W
              </div>
              <span className="text-sm text-zinc-300 group-hover:text-white">
                by <span className="font-medium">Webstew Team</span>
              </span>
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
            <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
              <span className="text-zinc-500">Prompt:</span> &ldquo;{d.prompt}&rdquo;
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden mb-6">
          <iframe
            srcDoc={d.html}
            className="w-full h-[640px] border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
            title={`Preview: ${d.label}`}
          />
        </section>

        {tags.length > 0 && (
          <section className="mb-6 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-zinc-400">
                #{t}
              </span>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 sm:p-8 text-center">
          <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-300" /> Make this yours
          </h3>
          <p className="text-sm text-zinc-400 mb-5 max-w-md mx-auto">
            Webstew will generate your own version, rewritten for your brand, content, and audience. Free to try, no card required.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href={remixHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium text-sm"
            >
              <Wand2 className="w-4 h-4" /> Use this prompt
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded-lg font-medium text-sm"
            >
              Browse more <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
