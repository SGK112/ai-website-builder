import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { USE_CASE_SLUGS, getUseCase } from '@/lib/use-cases'
import { UseCaseView } from './UseCaseView'

// Only the use cases we have real content for — unknown slugs 404.
export const dynamicParams = false

type PageProps = { params: { slug: string } }

export function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const u = getUseCase(params.slug)
  if (!u) return {}
  const url = `/for/${u.slug}`
  return {
    // Plain string → root template appends ' · Webstew AI'; these titles are
    // short enough (≤37 chars) that the final tag stays under 60.
    title: u.metaTitle,
    description: u.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: u.metaTitle, description: u.metaDescription, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: u.metaTitle, description: u.metaDescription },
  }
}

export default function UseCasePage({ params }: PageProps) {
  const u = getUseCase(params.slug)
  if (!u) notFound()

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.webstew.net' },
      { '@type': 'ListItem', position: 2, name: u.metaTitle, item: `https://www.webstew.net/for/${u.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <UseCaseView useCase={u} />
    </>
  )
}
