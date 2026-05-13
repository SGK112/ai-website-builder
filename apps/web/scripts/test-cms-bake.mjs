#!/usr/bin/env node
// Exercises the deploy-time CMS injection. Recreates the same logic as
// injectPublishedCms() in /api/deploy/route.ts against a real project doc.
// If this passes, the deploy will write the right files to GitHub.
//
// Run: MONGODB_URI=mongodb://127.0.0.1:27017/webstew node scripts/test-cms-bake.mjs

import { MongoClient, ObjectId } from 'mongodb'

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webstew'
const client = new MongoClient(URI)
const c = (s, x) => `\x1b[${x}m${s}\x1b[0m`
const ok = (m) => console.log(c('✓', 32), m)
const fail = (m) => { console.log(c('✗', 31), m); process.exitCode = 1 }

// ── duplicated injectPublishedCms logic, kept identical to route ──
function toAstroMarkdown(item) {
  const fields = { ...item.fields }
  const bodyKey = ['body', 'content', 'markdown', 'description'].find(k => typeof fields[k] === 'string')
  const body = bodyKey ? fields[bodyKey] : ''
  if (bodyKey) delete fields[bodyKey]
  const yaml = Object.entries(fields).map(([k, v]) => `${k}: ${yamlValue(v)}`).join('\n')
  return `---\n${yaml}\n---\n\n${body}\n`
}
function yamlValue(v) {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean' || typeof v === 'number') return String(v)
  if (v instanceof Date) return `"${v.toISOString()}"`
  const s = String(v)
  if (s.includes('\n')) return `|\n  ${s.replace(/\n/g, '\n  ')}`
  return JSON.stringify(s)
}
function injectPublishedCms(files, cms) {
  const counts = {}
  const isAstro = files.some(f =>
    (f.path === 'package.json' || f.path.endsWith('/package.json')) &&
    /"astro"\s*:/.test(f.content)
  )
  const existingPaths = new Set(files.map(f => f.path))
  const extra = []
  for (const slug of Object.keys(cms.schemas)) {
    const items = Object.values(cms.items[slug] || {}).filter(i => i.status === 'published')
    counts[slug] = items.length
    if (items.length === 0) continue
    const jsonPath = `cms/${slug}.json`
    if (!existingPaths.has(jsonPath)) {
      extra.push({
        path: jsonPath,
        content: JSON.stringify(items.map(i => ({ slug: i.slug, ...i.fields, updatedAt: i.updatedAt })), null, 2),
      })
    }
    if (isAstro) {
      for (const item of items) {
        const mdPath = `src/content/${slug}/${item.slug}.md`
        if (existingPaths.has(mdPath)) continue
        extra.push({ path: mdPath, content: toAstroMarkdown(item) })
      }
    }
  }
  return { files: [...files, ...extra], counts }
}

async function main() {
  await client.connect()
  const db = client.db()
  const projects = db.collection('projects')

  const userId = new ObjectId()
  const insert = await projects.insertOne({
    userId, name: 'Bake Test', type: 'website', status: 'ready', files: [],
    createdAt: new Date(), updatedAt: new Date(),
    cms: {
      schemas: {
        services: {
          slug: 'services', name: 'Services',
          fields: [
            { key: 'title', type: 'text', required: true },
            { key: 'body', type: 'markdown' },
            { key: 'price', type: 'number' },
          ],
        },
      },
      items: {
        services: {
          countertops: {
            slug: 'countertops',
            fields: { title: 'Granite Countertops', body: '# Beautiful stone\n\nDurable + elegant.', price: 75 },
            status: 'published',
            updatedAt: new Date(),
          },
          'fireplace-surrounds': {
            slug: 'fireplace-surrounds',
            fields: { title: 'Fireplace Surrounds', body: 'Custom surrounds.', price: 1200 },
            status: 'published',
            updatedAt: new Date(),
          },
          'wip-vanities': {
            slug: 'wip-vanities',
            fields: { title: 'Bathroom Vanities WIP', body: 'not ready', price: 0 },
            status: 'draft',  // ← should be filtered out
            updatedAt: new Date(),
          },
        },
      },
    },
  })
  const projectId = insert.insertedId
  ok(`Project created with 2 published + 1 draft item`)

  // Test 1: website target (no package.json → no astro path)
  const websiteFiles = [{ path: 'index.html', content: '<h1>Hi</h1>' }]
  const project = await projects.findOne({ _id: projectId })
  const r1 = injectPublishedCms(websiteFiles, project.cms)
  if (r1.counts.services === 2) ok(`Website: filtered draft, baked 2 published items`)
  else fail(`Website: expected 2 items, got ${r1.counts.services}`)

  const jsonFile = r1.files.find(f => f.path === 'cms/services.json')
  if (jsonFile) ok(`Website: cms/services.json written (${jsonFile.content.length} bytes)`)
  else fail(`Website: cms/services.json missing`)

  const mdFiles = r1.files.filter(f => f.path.startsWith('src/content/'))
  if (mdFiles.length === 0) ok(`Website: no Astro markdown (correct, no package.json)`)
  else fail(`Website: unexpected markdown files`)

  // Test 2: Astro target — should also write markdown
  const astroFiles = [
    { path: 'package.json', content: JSON.stringify({ dependencies: { astro: '^4.0.0' } }) },
    { path: 'src/pages/index.astro', content: '---\n---\n<h1>Astro</h1>' },
  ]
  const r2 = injectPublishedCms(astroFiles, project.cms)
  const r2md = r2.files.filter(f => f.path.startsWith('src/content/services/'))
  if (r2md.length === 2) ok(`Astro: 2 markdown files written under src/content/services/`)
  else fail(`Astro: expected 2 md files, got ${r2md.length}`)

  // Verify markdown frontmatter looks sane
  const sample = r2md.find(f => f.path.endsWith('countertops.md'))
  if (sample?.content.includes('title: "Granite Countertops"') && sample?.content.includes('price: 75')) {
    ok(`Astro: frontmatter parses (title + price present)`)
  } else {
    fail(`Astro: frontmatter broken`)
    console.log(sample?.content)
  }
  if (sample?.content.includes('# Beautiful stone')) ok(`Astro: markdown body preserved`)
  else fail(`Astro: body missing`)

  // Test 3: existing file preserved
  const filesWithExisting = [
    { path: 'index.html', content: '<h1>Hi</h1>' },
    { path: 'cms/services.json', content: '{"manual": "yes"}' },
  ]
  const r3 = injectPublishedCms(filesWithExisting, project.cms)
  const existingPreserved = r3.files.find(f => f.path === 'cms/services.json')?.content === '{"manual": "yes"}'
  if (existingPreserved) ok(`Existing cms/services.json NOT overwritten`)
  else fail(`Existing file got overwritten — destructive bug`)

  await projects.deleteOne({ _id: projectId })
  await client.close()
}

main().catch(e => { console.error(c('✗ FATAL', 31), e); process.exit(1) })
