import type { Metadata } from 'next'
import { Inter, Playfair_Display, Inter_Tight } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { AuthProvider } from '@/components/shared/AuthProvider'
import { AppProvider } from '@/context/AppContext'
import { ClientLayout } from '@/components/shared/ClientLayout'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', style: ['normal', 'italic'] })
// Inter Tight — chosen for the Webstew wordmark on 2026-05-15. Tighter
// metrics than regular Inter, confident at display sizes.
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['600', '700', '800', '900'],
})

// Mobile-first: tell every browser to render at device width and not
// auto-zoom to a fictional desktop. Without this Next.js does NOT
// inject a viewport meta tag and mobile renders at the 980px virtual
// viewport, scaling everything down so text + UI become unreadable.
// Single biggest mobile UX win.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // viewportFit:cover lets the page paint behind the iPhone notch + home
  // bar — required for PWA installs to feel native. Pair with
  // `env(safe-area-inset-*)` in CSS for any fixed bars (workspace top bar,
  // chat composer, install banner) so they don't sit under the notch.
  viewportFit: 'cover',
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
  // Kept under 160 chars — our own grader flagged the previous 186-char
  // description for SEO snippet truncation. Reduces to a single tight
  // sentence that still hits "Webstew AI" + the value prop + "free."
  description:
    'Webstew AI — turn one prompt into a production-ready site, app, or store. Multi-target (Next.js, Astro, Expo, React Native). Free to start.',
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
  // iOS treats sites added to the home screen as PWAs only when these tags
  // are present. apple-mobile-web-app-capable=yes hides Safari chrome;
  // status-bar-style=black-translucent lets the app paint behind the notch.
  // The 180x180 Apple touch icon comes from the existing brand pngs — iOS
  // downscales the 256 cleanly.
  appleWebApp: {
    capable: true,
    title: 'Webstew',
    statusBarStyle: 'black-translucent',
    startupImage: ['/brand/webstew-logo-1024.png'],
  },
  icons: {
    icon: [
      { url: '/brand/webstew-logo-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/brand/webstew-logo-256.png', sizes: '256x256', type: 'image/png' },
      { url: '/brand/webstew-logo-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/webstew-logo-256.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${interTight.variable}`}>
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

        {/* Structured data — flagged by our own /grader (AI visibility 25/F
            before this). Three JSON-LD blocks: Organization for the
            publisher, SoftwareApplication for the product itself, and FAQ
            so AI assistants (ChatGPT, Claude, Perplexity, Grok) can cite
            the most common questions directly. Each block is independent
            so updating one doesn't risk the others. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://www.webstew.net/#org',
              name: 'Webstew AI',
              url: 'https://www.webstew.net',
              logo: 'https://www.webstew.net/icon.png',
              description: 'AI website builder that turns one prompt into a production-ready site, app, or store.',
              parentOrganization: { '@type': 'Organization', name: 'Remodely LLC' },
              sameAs: [
                'https://github.com/SGK112/ai-website-builder',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              '@id': 'https://www.webstew.net/#app',
              name: 'Webstew AI',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web',
              url: 'https://www.webstew.net',
              description: 'Multi-target AI website builder — generates Next.js, Astro, Expo (React Native), and React projects from a single prompt.',
              offers: [
                { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
                { '@type': 'Offer', name: 'Starter', price: '19', priceCurrency: 'USD', billingIncrement: 'month' },
                { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'USD', billingIncrement: 'month' },
                { '@type': 'Offer', name: 'Scale', price: '149', priceCurrency: 'USD', billingIncrement: 'month' },
              ],
              featureList: [
                'AI website generation from a prompt',
                'Multi-target output (Next.js, Astro, React, Expo)',
                'One-click deploy to GitHub + Render',
                'CMS for blog posts, services, team members',
                'Template marketplace with Stripe Connect',
                'Background builds with browser notifications',
              ],
              publisher: { '@id': 'https://www.webstew.net/#org' },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is Webstew AI?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Webstew AI is an AI website builder that generates production-ready websites, mobile apps, and e-commerce stores from a single text prompt. It supports Next.js, Astro, React (Vite), and Expo (React Native) targets.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How much does Webstew AI cost?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Free to start with demo credits, no credit card required. Paid plans start at $19/month for Starter (more credits + premium models). Pro is $49/month, Scale is $149/month.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I sell my Webstew sites?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Publish any site you build to the Webstew marketplace, set a price, and keep 70% of every sale. Payouts go directly to your connected Stripe account. Webstew takes 30% to cover Stripe fees and platform hosting.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does Webstew generate real code?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Webstew outputs the actual source files (Next.js project, Astro project, React Vite project, or Expo React Native app) that you can edit, deploy, and own. Code can be exported as a zip or pushed to your GitHub.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I convert a website I built into a mobile app?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — the Convert to App button in the workspace takes a website you built and generates an Expo (React Native) version with the same branding, content, and structure, ready to ship to iOS and Android.',
                  },
                },
              ],
            }),
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
              <PwaInstallPrompt />
              <MobileBottomNav />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
