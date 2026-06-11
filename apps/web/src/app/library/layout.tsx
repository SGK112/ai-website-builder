import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Component Library — Reusable Blocks',
  description: 'A growing library of production-ready components and sections you can drop into your Webstew site.',
  alternates: { canonical: '/library' },
  openGraph: { title: 'Component Library — Reusable Blocks & Sections | Webstew', description: 'A growing library of production-ready components and sections you can drop into your Webstew site.', url: '/library' },
  twitter: { title: 'Component Library — Reusable Blocks & Sections | Webstew', description: 'A growing library of production-ready components and sections you can drop into your Webstew site.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
