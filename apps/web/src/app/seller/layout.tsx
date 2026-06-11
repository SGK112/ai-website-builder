import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sell Templates — Earn From Your Designs',
  description: 'Publish and sell your templates on the Webstew marketplace. Track your earnings and payouts in one place.',
  alternates: { canonical: '/seller' },
  openGraph: { title: 'Sell Templates on Webstew — Earn From Your Designs', description: 'Publish and sell your templates on the Webstew marketplace. Track your earnings and payouts in one place.', url: '/seller' },
  twitter: { title: 'Sell Templates on Webstew — Earn From Your Designs', description: 'Publish and sell your templates on the Webstew marketplace. Track your earnings and payouts in one place.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
