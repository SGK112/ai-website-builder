import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/shared/AuthProvider'
import { AppProvider } from '@/context/AppContext'
import { ClientLayout } from '@/components/shared/ClientLayout'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', style: ['normal', 'italic'] })

// Mobile-first: tell every browser to render at device width and not
// auto-zoom to a fictional desktop. Without this Next.js does NOT
// inject a viewport meta tag and mobile renders at the 980px virtual
// viewport, scaling everything down so text + UI become unreadable.
// Single biggest mobile UX win.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0f' },
  ],
}

// metadataBase resolves the relative `/opengraph-image` URL into an
// absolute one in production. Falls back to a sensible default during
// local dev so the file-conventions resolve.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://webstew.net'),
  title: {
    default: 'Webstew AI — The AI Website Builder',
    template: '%s · Webstew AI',
  },
  description:
    'Webstew AI is an AI website builder that turns one prompt into a production-ready site, app, or store. Multi-target (Next.js, Astro, Expo, React Native), free to start, no code required.',
  keywords: [
    'Webstew AI',
    'Webstew',
    'AI website builder',
    'AI app builder',
    'no-code website builder',
    'AI web design',
    'generate website with AI',
    'AI landing page builder',
    'prompt to website',
    'Next.js AI builder',
    'Astro AI builder',
    'Expo AI builder',
    'React Native AI builder',
  ],
  applicationName: 'Webstew AI',
  authors: [{ name: 'Remodely LLC' }],
  creator: 'Remodely LLC',
  publisher: 'Webstew AI',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Webstew AI — The AI Website Builder',
    description: 'One prompt → production site, app, or store. Free to start, multi-target.',
    type: 'website',
    siteName: 'Webstew AI',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Webstew AI — The AI Website Builder',
    description: 'One prompt → production site, app, or store. Free to start, multi-target.',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Pre-hydration theme setter. Runs synchronously BEFORE React or
            any CSS paints, so `data-theme` (and the `.dark` class) are on
            <html> in time for:
              • CSS variables (--foreground / --card / --theme-bg / …) to
                resolve to the right values immediately
              • Tailwind's `dark:` variant (configured to fire on
                [data-theme="dark"]) to apply on first render
            Without this script, SSR ships <html> with no attribute, so
            CSS falls back to :root (light) values while the page paints
            dark backgrounds — and headings disappear into the body. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search).get('theme');var t=q==='light'||q==='dark'?q:localStorage.getItem('webcraft-theme');if(t!=='light'&&t!=='dark')t='dark';if(q==='light'||q==='dark'){localStorage.setItem('webcraft-theme',t);}document.documentElement.setAttribute('data-theme',t);if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
