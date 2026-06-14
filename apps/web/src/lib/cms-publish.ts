// Bakes a project's PUBLISHED CMS items into the file set at publish/deploy time
// so the live static site can read them — the agent prompt promises these exist.
// Shared by BOTH publish paths (instant Go Live → lib/publish.ts, and GitHub/
// Render deploy → api/deploy) so the behavior is identical and defined once.
//
// Two output shapes:
//   • cms/<collection>.json — array of published items. Universal; any framework
//     can fetch (runtime) or import (build) it.
//   • Astro projects (package.json has `astro`) ALSO get each item as
//     src/content/<collection>/<slug>.md with YAML frontmatter — the idiomatic
//     Astro Content Collections shape.
// Files already present in the project are never overwritten.

import { loadProjectCms } from '@/lib/cms-store'

export interface CmsFile {
  path: string
  content: string
}

export async function injectPublishedCms(
  files: CmsFile[],
  projectId: string,
  userId: string,
): Promise<{ files: CmsFile[]; counts: Record<string, number> }> {
  try {
    const loaded = await loadProjectCms(projectId, userId)
    if (!loaded.ok) {
      console.warn('[cms-publish] CMS load skipped:', loaded.error)
      return { files, counts: {} }
    }
    const { cms } = loaded
    const counts: Record<string, number> = {}
    const isAstro = files.some(
      (f) =>
        (f.path === 'package.json' || f.path.endsWith('/package.json')) &&
        /"astro"\s*:/.test(f.content),
    )
    const existingPaths = new Set(files.map((f) => f.path))
    const extra: CmsFile[] = []

    for (const slug of Object.keys(cms.schemas)) {
      const items = Object.values(cms.items[slug] || {}).filter((item: any) => item.status === 'published')
      counts[slug] = items.length
      if (items.length === 0) continue

      const jsonPath = `cms/${slug}.json`
      if (!existingPaths.has(jsonPath)) {
        extra.push({
          path: jsonPath,
          content: JSON.stringify(
            items.map((i: any) => ({ slug: i.slug, ...i.fields, updatedAt: i.updatedAt })),
            null,
            2,
          ),
        })
      }

      if (isAstro) {
        for (const item of items as any[]) {
          const mdPath = `src/content/${slug}/${item.slug}.md`
          if (existingPaths.has(mdPath)) continue
          extra.push({ path: mdPath, content: toAstroMarkdown(item) })
        }
      }
    }
    return { files: extra.length ? [...files, ...extra] : files, counts }
  } catch (e: any) {
    // Never block a publish/deploy on a CMS injection failure.
    console.error('[cms-publish] CMS injection failed:', e?.message || e)
    return { files, counts: {} }
  }
}

function toAstroMarkdown(item: any): string {
  const fields = { ...item.fields }
  const bodyKey = ['body', 'content', 'markdown', 'description'].find((k) => typeof fields[k] === 'string')
  const body = bodyKey ? fields[bodyKey] : ''
  if (bodyKey) delete fields[bodyKey]
  const yaml = Object.entries(fields)
    .map(([k, v]) => `${k}: ${yamlValue(v)}`)
    .join('\n')
  return `---\n${yaml}\n---\n\n${body}\n`
}

function yamlValue(v: any): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean' || typeof v === 'number') return String(v)
  if (v instanceof Date) return `"${v.toISOString()}"`
  const s = String(v)
  if (s.includes('\n')) return `|\n  ${s.replace(/\n/g, '\n  ')}`
  return JSON.stringify(s)
}
