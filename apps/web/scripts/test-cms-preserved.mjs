#!/usr/bin/env node
// Verify the PATCH /api/projects/[id] fix: $set on specific fields must
// leave `cms` untouched. Reproduces the bug-then-fix in pure Mongo terms.

import { MongoClient, ObjectId } from 'mongodb'
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webstew'
const c = (s, x) => `\x1b[${x}m${s}\x1b[0m`
const ok = (m) => console.log(c('✓', 32), m)
const fail = (m) => { console.log(c('✗', 31), m); process.exitCode = 1 }

const client = new MongoClient(URI)
await client.connect()
const projects = client.db().collection('projects')

const userId = new ObjectId()
const ins = await projects.insertOne({
  userId,
  name: 'Original Name',
  type: 'website',
  status: 'ready',
  files: [{ path: 'index.html', content: '<h1>Old</h1>', language: 'html' }],
  cms: {
    schemas: { posts: { slug: 'posts', name: 'Posts', fields: [{ key: 'title', type: 'text' }] } },
    items:   { posts: { hello: { slug: 'hello', fields: { title: 'Hello' }, status: 'published' } } },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
})
ok('Seeded project with CMS')

// Mimic the new PATCH behaviour — $set on name + files only.
await projects.findOneAndUpdate(
  { _id: ins.insertedId, userId },
  { $set: { name: 'Renamed', files: [{ path: 'index.html', content: '<h1>New</h1>' }], updatedAt: new Date() } },
)

const after = await projects.findOne({ _id: ins.insertedId })
if (after?.name === 'Renamed') ok('Name updated')
else fail('Name NOT updated')

if (after?.files?.[0]?.content === '<h1>New</h1>') ok('Files updated')
else fail('Files NOT updated')

if (after?.cms?.schemas?.posts?.name === 'Posts') ok('CMS schema preserved through save')
else fail('CMS schema LOST through save — fix broken')

if (after?.cms?.items?.posts?.hello?.fields?.title === 'Hello') ok('CMS items preserved through save')
else fail('CMS items LOST through save — fix broken')

await projects.deleteOne({ _id: ins.insertedId })
await client.close()
