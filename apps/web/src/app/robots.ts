import type { MetadataRoute } from 'next'

// Crawl guidance for Webstew. Allow the public marketing pages; keep the
// private app, auth, admin, API, and per-user preview routes out of the index
// so they don't leak into search results. Points crawlers at the sitemap.
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://webstew.net'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/dashboard',
          '/workspace',
          '/backend',
          '/profile',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/integrations/connected',
          '/preview/', // per-token private previews
          '/grader/r/', // per-token report links
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
