import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Showcase — Sites Built with Webstew',
  description: 'See real websites, apps, and stores people built with Webstew from a single prompt. Get inspired, then share your own.',
  alternates: { canonical: '/community' },
  openGraph: { title: 'Community Showcase — Sites Built with Webstew', description: 'See real websites, apps, and stores people built with Webstew from a single prompt. Get inspired, then share your own.', url: '/community' },
  twitter: { title: 'Community Showcase — Sites Built with Webstew', description: 'See real websites, apps, and stores people built with Webstew from a single prompt. Get inspired, then share your own.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
