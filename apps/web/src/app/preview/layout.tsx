import type { Metadata } from 'next'

// Private/gated route. robots.txt already blocks crawling; this noindex
// guarantees it stays out of search results even if linked externally.
// (A robots Disallow stops crawling but does NOT prevent indexing.)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function NoindexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
