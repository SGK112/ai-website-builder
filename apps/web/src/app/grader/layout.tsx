import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Website Grader — Score Your Design, SEO & Speed | Webstew',
  description: 'Get an instant, free report card on any website: design, SEO, performance, and accessibility, with specific fixes you can act on. No signup required.',
  alternates: { canonical: '/grader' },
  openGraph: { title: 'Free Website Grader — Score Your Design, SEO & Speed | Webstew', description: 'Get an instant, free report card on any website: design, SEO, performance, and accessibility, with specific fixes you can act on. No signup required.', url: '/grader' },
  twitter: { title: 'Free Website Grader — Score Your Design, SEO & Speed | Webstew', description: 'Get an instant, free report card on any website: design, SEO, performance, and accessibility, with specific fixes you can act on. No signup required.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
