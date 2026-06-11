import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Integrations — Connect Webstew to Your Stack | Webstew',
  description: 'Connect Webstew to the tools you already use: deploy to Render, sync content, and more.',
  alternates: { canonical: '/integrations' },
  openGraph: { title: 'Integrations — Connect Webstew to Your Stack | Webstew', description: 'Connect Webstew to the tools you already use: deploy to Render, sync content, and more.', url: '/integrations' },
  twitter: { title: 'Integrations — Connect Webstew to Your Stack | Webstew', description: 'Connect Webstew to the tools you already use: deploy to Render, sync content, and more.' },
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
