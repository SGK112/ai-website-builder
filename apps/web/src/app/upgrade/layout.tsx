import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Free to Start, Plans That Scale | Webstew',
  description: 'Webstew pricing: start free, then Starter, Pro, and Scale. Build production sites, apps, and stores from a prompt.',
  alternates: { canonical: '/upgrade' },
  openGraph: { title: 'Pricing — Free to Start, Plans That Scale | Webstew', description: 'Webstew pricing: start free, then Starter, Pro, and Scale. Build production sites, apps, and stores from a prompt.', url: '/upgrade' },
  twitter: { title: 'Pricing — Free to Start, Plans That Scale | Webstew', description: 'Webstew pricing: start free, then Starter, Pro, and Scale. Build production sites, apps, and stores from a prompt.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
