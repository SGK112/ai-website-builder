import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Video — Generate Clips for Your Site',
  description: 'Create video content for your Webstew site with AI, ready to drop straight into your pages.',
  alternates: { canonical: '/video' },
  openGraph: { title: 'AI Video for Your Site — Generate Clips | Webstew', description: 'Create video content for your Webstew site with AI, ready to drop straight into your pages.', url: '/video' },
  twitter: { title: 'AI Video for Your Site — Generate Clips | Webstew', description: 'Create video content for your Webstew site with AI, ready to drop straight into your pages.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
