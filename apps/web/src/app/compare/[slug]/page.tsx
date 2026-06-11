import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { COMPETITOR_SLUGS, getCompetitor } from '@/lib/competitors'
import { CompareView } from './CompareView'

// Only the competitors we have real content for — unknown slugs 404 instead of
// rendering thin doorway pages.
export const dynamicParams = false

type PageProps = { params: { slug: string } }

export function generateStaticParams() {
  return COMPETITOR_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const c = getCompetitor(params.slug)
  if (!c) return {}
  const url = `/compare/${c.slug}`
  return {
    // absolute → bypass the root '%s · Webstew AI' template; the title already
    // says "Webstew", so appending the brand again would double it and blow the
    // ~60-char length budget.
    title: { absolute: c.metaTitle },
    description: c.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: c.metaTitle, description: c.metaDescription, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: c.metaTitle, description: c.metaDescription },
  }
}

export default function ComparePage({ params }: PageProps) {
  const c = getCompetitor(params.slug)
  if (!c) notFound()

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.webstew.net' },
      { '@type': 'ListItem', position: 2, name: `Webstew vs ${c.name}`, item: `https://www.webstew.net/compare/${c.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <CompareView competitor={c} />
    </>
  )
}
