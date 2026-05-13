#!/usr/bin/env node
// Verify the BYO-credentials data path:
//   1. Encrypt + store via raw driver (same as credentials-store.ts)
//   2. Decrypt round-trip
//   3. Decryption fails gracefully on tampered ciphertext
//   4. Different users isolated

import { MongoClient, ObjectId } from 'mongodb'
import crypto from 'crypto'

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webstew'
const SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-for-cred-roundtrip'
const c = (s, x) => `\x1b[${x}m${s}\x1b[0m`
const ok = (m) => console.log(c('✓', 32), m)
const fail = (m) => { console.log(c('✗', 31), m); process.exitCode = 1 }

const KEY = crypto.scryptSync(SECRET, 'webstew-credentials', 32)
const ALGO = 'aes-256-gcm'
function encrypt(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, KEY, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}
function decrypt(blob) {
  try {
    if (!blob.startsWith('v1:')) return null
    const [, ivB, tagB, encB] = blob.split(':')
    const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivB, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]).toString('utf8')
  } catch { return null }
}

const client = new MongoClient(URI)
await client.connect()
const col = client.db().collection('user_credentials')

const userA = new ObjectId()
const userB = new ObjectId()
const renderKey = 'rnd_supersecret_FAKE_VALUE_FOR_TEST_12345'
const githubToken = 'ghp_fakeGitHubTokenForRoundTripTest_67890'

await col.deleteMany({ userId: { $in: [userA, userB] } })

// Store userA's render key
await col.updateOne(
  { userId: userA, type: 'render' },
  { $set: { value: encrypt(renderKey), updatedAt: new Date() }, $setOnInsert: { userId: userA, type: 'render', createdAt: new Date() } },
  { upsert: true }
)
ok('Stored userA render key')

// Store userA's github token
await col.updateOne(
  { userId: userA, type: 'github' },
  { $set: { value: encrypt(githubToken), updatedAt: new Date() }, $setOnInsert: { userId: userA, type: 'github', createdAt: new Date() } },
  { upsert: true }
)
ok('Stored userA github token')

// Round-trip both
const fetchedRender = await col.findOne({ userId: userA, type: 'render' })
const fetchedGh = await col.findOne({ userId: userA, type: 'github' })
if (decrypt(fetchedRender.value) === renderKey) ok('Render key round-trip OK')
else fail('Render key round-trip BROKEN')
if (decrypt(fetchedGh.value) === githubToken) ok('GitHub token round-trip OK')
else fail('GitHub token round-trip BROKEN')

// Verify stored value is NOT plaintext
if (fetchedRender.value.includes(renderKey)) fail('Plaintext leaked into Mongo!')
else ok('Stored value is encrypted (no plaintext)')

// Tamper detection
const tampered = fetchedRender.value.slice(0, -4) + 'XXXX'
if (decrypt(tampered) === null) ok('Tampered ciphertext rejected')
else fail('Tampered ciphertext was decrypted — auth tag broken')

// User isolation: userB queries find nothing
const otherUserDocs = await col.find({ userId: userB }).toArray()
if (otherUserDocs.length === 0) ok('Different user gets zero docs (isolation)')
else fail('User isolation broken')

// Wrong-key decryption fails gracefully
const WRONG_KEY = crypto.scryptSync('different-secret', 'webstew-credentials', 32)
try {
  const decipher = crypto.createDecipheriv(ALGO, WRONG_KEY, Buffer.from(fetchedRender.value.split(':')[1], 'base64'))
  decipher.setAuthTag(Buffer.from(fetchedRender.value.split(':')[2], 'base64'))
  decipher.update(Buffer.from(fetchedRender.value.split(':')[3], 'base64'))
  decipher.final()
  fail('Wrong key should not decrypt')
} catch {
  ok('Wrong NEXTAUTH_SECRET cleanly fails decryption')
}

await col.deleteMany({ userId: { $in: [userA, userB] } })
await client.close()
