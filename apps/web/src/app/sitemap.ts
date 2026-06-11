import type { MetadataRoute } from 'next'
import { getClient } from '@/lib/mongodb'
import { DEMO_SITES } from '@/lib/demo-sites'

// Sitemap = static marketing routes + the demo showcase pages + ALL public,
// indexable user content (community/marketplace listings, public profiles).
// The dynamic half is what gets Webstew's real content discovered — without
// it Google only ever saw ~11 marketing URLs. Regenerated hourly (revalidate)
// so it stays fresh without hitting Mongo on every crawl. A DB hiccup degrades
// gracefully to the static + showcase set rather than breaking the file.
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://webstew.net'
const DB = 'ai-website-builder'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',              priority: 1.0, changeFrequency: 'weekly' },
    { path: '/grader',       priority: 0.9, changeFrequency: 'weekly' },
    { path: '/templates',    priority: 0.8, changeFrequency: 'weekly' },
    { path: '/library',      priority: 0.7, changeFrequency: 'weekly' },
    { path: '/community',    priority: 0.7, changeFrequency: 'daily' },
    { path: '/integrations', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/video',        priority: 0.6, changeFrequency: 'monthly' },
    { path: '/upgrade',      priority: 0.6, changeFrequency: 'monthly' },
    { path: '/seller',       priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy',      priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms',        priority: 0.3, changeFrequency: 'yearly' },
  ]

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Demo showcase pages — static, always present.
  for (const d of DEMO_SITES) {
    entries.push({
      url: `${BASE}/showcase/${d.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // Dynamic, DB-backed content. Never let Mongo break the sitemap.
  try {
    const db = (await getClient()).db(DB)

    // Public community / marketplace posts → /listings/[id]. Mirrors the
    // public-feed query: isPublic + not pending/rejected (missing status =
    // legacy approved, which $nin keeps in).
    const posts = await db
      .collection('community_posts')
      .find(
        { isPublic: true, status: { $nin: ['pending', 'rejected'] } },
        { projection: { _id: 1, updatedAt: 1, createdAt: 1 } },
      )
      .sort({ updatedAt: -1 })
      .limit(10000)
      .toArray()
    for (const p of posts) {
      entries.push({
        url: `${BASE}/listings/${p._id.toString()}`,
        lastModified: (p.updatedAt as Date) || (p.createdAt as Date) || now,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }

    // Public profiles → /u/[username].
    const users = await db
      .collection('users')
      .find(
        { username: { $exists: true, $type: 'string', $ne: '' } },
        { projection: { username: 1, updatedAt: 1 } },
      )
      .limit(10000)
      .toArray()
    for (const u of users) {
      const username = u.username as string | undefined
      if (!username) continue
      entries.push({
        url: `${BASE}/u/${encodeURIComponent(username)}`,
        lastModified: (u.updatedAt as Date) || now,
        changeFrequency: 'weekly',
        priority: 0.4,
      })
    }
  } catch (e) {
    console.error('[sitemap] dynamic content skipped:', (e as Error)?.message)
  }

  return entries
}
