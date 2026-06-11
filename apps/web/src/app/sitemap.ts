import type { MetadataRoute } from 'next'

// Static sitemap of Webstew's public, indexable pages. Dynamic content
// (showcase/[slug], u/[username], listings/[id]) can be appended later by
// querying the DB — kept static here so the file is dependency-free and fast.
// App/auth/admin routes are intentionally excluded (see robots.ts).
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://webstew.net'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',             priority: 1.0, changeFrequency: 'weekly' },
    { path: '/grader',      priority: 0.9, changeFrequency: 'weekly' },
    { path: '/templates',   priority: 0.8, changeFrequency: 'weekly' },
    { path: '/library',     priority: 0.7, changeFrequency: 'weekly' },
    { path: '/community',   priority: 0.7, changeFrequency: 'daily' },
    { path: '/integrations',priority: 0.6, changeFrequency: 'monthly' },
    { path: '/video',       priority: 0.6, changeFrequency: 'monthly' },
    { path: '/upgrade',     priority: 0.6, changeFrequency: 'monthly' },
    { path: '/seller',      priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy',     priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms',       priority: 0.3, changeFrequency: 'yearly' },
  ]
  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
