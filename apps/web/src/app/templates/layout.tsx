import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website Templates — Modern & Responsive',
  description: 'Browse a library of clean, responsive website templates. Pick one and customize it with AI, or generate your own from a single prompt.',
  alternates: { canonical: '/templates' },
  openGraph: { title: 'Website Templates — Modern, Responsive Starts | Webstew', description: 'Browse a library of clean, responsive website templates. Pick one and customize it with AI, or generate your own from a single prompt.', url: '/templates' },
  twitter: { title: 'Website Templates — Modern, Responsive Starts | Webstew', description: 'Browse a library of clean, responsive website templates. Pick one and customize it with AI, or generate your own from a single prompt.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
