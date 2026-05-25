// Web App Manifest — surfaces Webstew as an installable PWA on iOS,
// Android, and Chromium desktop. Next.js auto-serves this at
// /manifest.webmanifest when the file is named manifest.ts.
//
// Icon path notes: we reuse the existing brand pngs in /public/brand. The
// 512 is the source of truth for PWA install + splash; Android Chrome
// derives the home-screen icon and the splash background from these.

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Webstew AI',
    short_name: 'Webstew',
    description:
      'One prompt → a production-ready website, app, or store. Built with AI, owned by you.',
    // Start in the workspace so installed users land where they actually
    // work. The query string lets analytics distinguish PWA launches from
    // web sessions without a separate event.
    start_url: '/workspace?source=pwa',
    scope: '/',
    display: 'standalone',
    // Black-to-violet matches our dark theme + the install splash on
    // Android Chrome (which blends background_color with the icon).
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    orientation: 'any',
    categories: ['productivity', 'developer', 'design'],
    icons: [
      {
        src: '/brand/webstew-logo-128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/webstew-logo-256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/webstew-logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Maskable variant — Android crops icons to its platform mask; the
      // 1024 leaves the most safe-area headroom for the crop. Mark as
      // "maskable" so Android applies its adaptive icon background.
      {
        src: '/brand/webstew-logo-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
