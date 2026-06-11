import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Website Grader — Check Your SEO, Speed & Mobile Score | Webstew',
  description:
    'Grade any website in seconds, free. Get an instant report card on SEO, performance, mobile-friendliness, accessibility, security, and AI discoverability — with specific fixes. No signup to see your score.',
  keywords: [
    'website grader',
    'free website grader',
    'website score checker',
    'website audit tool',
    'check website SEO',
    'website speed test',
    'grade my website',
  ],
  alternates: { canonical: '/grader' },
  openGraph: {
    title: 'Free Website Grader — Check Your SEO, Speed & Mobile Score',
    description:
      'Instant, free report card on any website: SEO, speed, mobile, accessibility, security, and AI discoverability — with fixes you can act on.',
    url: '/grader',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Website Grader — Check Your SEO, Speed & Mobile Score',
    description:
      'Instant, free report card on any website: SEO, speed, mobile, accessibility, security, and AI discoverability.',
  },
}

// Grader-specific structured data. The tool itself as a WebApplication — a
// distinct @type from the site-wide Organization/SoftwareApplication/FAQPage in
// the root layout, so there's no duplicate-schema conflict. Tells Google + AI
// assistants this URL is a free, usable web tool.
const graderSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://www.webstew.net/grader#tool',
  name: 'Webstew Website Grader',
  url: 'https://www.webstew.net/grader',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Free website grader that scores any URL on SEO, performance, mobile-friendliness, accessibility, security, and AI discoverability, then lists the specific issues to fix.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'SEO meta + structured data check',
    'Performance and page-speed grade',
    'Mobile-friendliness check',
    'Accessibility audit',
    'HTTPS / security check',
    'AI-discoverability score',
  ],
  isAccessibleForFree: true,
  publisher: { '@id': 'https://www.webstew.net/#org' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graderSchema) }}
      />
      {children}
    </>
  )
}
