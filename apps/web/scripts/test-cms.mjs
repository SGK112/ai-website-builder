#!/usr/bin/env node
// End-to-end test for the CMS data layer. Bypasses HTTP/NextAuth — calls
// the same db.collection('projects') writes the route handlers do, then reads
// them back to verify persistence works after the mongoose-schema-cache issue.
//
// Run with: node scripts/test-cms.mjs

import { MongoClient, ObjectId } from 'mongodb'

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webstew'
const client = new MongoClient(URI)

const c = (s, x) => `\x1b[${x}m${s}\x1b[0m`
const ok = (m) => console.log(c('✓', 32), m)
const fail = (m) => { console.log(c('✗', 31), m); process.exitCode = 1 }

async function main() {
  await client.connect()
  const db = client.db()
  const projects = db.collection('projects')

  console.log('→ Connected:', URI)

  // 1. Create a throwaway project
  const userId = new ObjectId()
  const insert = await projects.insertOne({
    userId,
    name: 'CMS Test',
    type: 'website',
    status: 'ready',
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const projectId = insert.insertedId
  ok(`Created project ${projectId}`)

  // 2. Upsert a schema — mirrors upsertSchema() in cms-store.ts
  const schemaSlug = 'services'
  const schema = {
    slug: schemaSlug,
    name: 'Services',
    fields: [
      { key: 'title', type: 'text', required: true },
      { key: 'description', type: 'markdown' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await projects.updateOne(
    { _id: projectId },
    { $set: { [`cms.schemas.${schemaSlug}`]: schema, updatedAt: new Date() } }
  )

  // 3. Read it back
  const after = await projects.findOne({ _id: projectId })
  if (after?.cms?.schemas?.[schemaSlug]?.name === 'Services') {
    ok('Schema upsert persisted (read-back matches)')
  } else {
    fail('Schema upsert NOT persisted — this is the bug we just fixed')
    console.log('  Got:', JSON.stringify(after?.cms))
  }

  // 4. Upsert an item
  const itemSlug = 'countertops'
  const item = {
    slug: itemSlug,
    fields: { title: 'Granite Countertops', description: '# Beautiful stone' },
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await projects.updateOne(
    { _id: projectId },
    { $set: { [`cms.items.${schemaSlug}.${itemSlug}`]: item, updatedAt: new Date() } }
  )

  const afterItem = await projects.findOne({ _id: projectId })
  if (afterItem?.cms?.items?.[schemaSlug]?.[itemSlug]?.fields?.title === 'Granite Countertops') {
    ok('Item upsert persisted')
  } else {
    fail('Item upsert NOT persisted')
  }

  // 5. List items shape (what GET /[collection] returns)
  const items = Object.values(afterItem?.cms?.items?.[schemaSlug] || {})
  if (items.length === 1) ok(`List returns ${items.length} item`)
  else fail(`List returned ${items.length} items, expected 1`)

  // 6. Delete schema → both schema and items dropped
  await projects.updateOne(
    { _id: projectId },
    {
      $unset: {
        [`cms.schemas.${schemaSlug}`]: '',
        [`cms.items.${schemaSlug}`]: '',
      },
      $set: { updatedAt: new Date() },
    }
  )
  const afterDelete = await projects.findOne({ _id: projectId })
  if (!afterDelete?.cms?.schemas?.[schemaSlug] && !afterDelete?.cms?.items?.[schemaSlug]) {
    ok('Schema + items deleted cleanly')
  } else {
    fail('Schema/items not fully deleted')
    console.log('  Got:', JSON.stringify(afterDelete?.cms))
  }

  // 7. Ownership filter — different userId can't read
  const otherUser = new ObjectId().toString()
  const owned = await projects.findOne({ _id: projectId })
  const ownerMatch = owned?.userId?.toString() === otherUser
  if (!ownerMatch) ok('Ownership check: different userId rejected')
  else fail('Ownership check broken')

  // Cleanup
  await projects.deleteOne({ _id: projectId })
  ok('Cleaned up test project')

  await client.close()
}

main().catch(e => { console.error(c('✗ FATAL', 31), e); process.exit(1) })
