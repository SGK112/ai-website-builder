// One-shot password reset.
//
// Usage:
//   cd /Users/homepc/ai-website-builder
//   node scripts/reset-password.mjs <email> <new-password>
//
// Example:
//   node scripts/reset-password.mjs aria@surprisegranite.com webstew-dev-2026
//
// Reads MONGODB_URI from apps/web/.env.local. Hashes via bcryptjs (same
// algorithm + cost factor the User model's pre-save hook uses). We do the
// hash here and write to $set so we don't trigger the pre-save hook (which
// would double-hash).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ENV_PATH = path.resolve(__dirname, '../apps/web/.env.local')

// Tiny .env parser — avoids dotenv dep.
function loadEnv(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[m[1]] = val
  }
  return out
}

async function main() {
  const [email, newPassword] = process.argv.slice(2)
  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-password.mjs <email> <new-password>')
    process.exit(1)
  }
  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const env = loadEnv(ENV_PATH)
  const uri = env.MONGODB_URI || process.env.MONGODB_URI
  if (!uri) {
    console.error(`MONGODB_URI not found in ${ENV_PATH} or process.env`)
    process.exit(1)
  }

  console.log(`Connecting to MongoDB…`)
  await mongoose.connect(uri)
  console.log(`Connected. Looking up user "${email}"…`)

  const User = mongoose.connection.collection('users')
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    console.error(`No user found with email "${email}"`)
    await mongoose.disconnect()
    process.exit(2)
  }

  const hash = await bcrypt.hash(newPassword, 10)
  const result = await User.updateOne(
    { _id: user._id },
    { $set: { password: hash, updatedAt: new Date() } }
  )

  if (result.modifiedCount === 1) {
    console.log(`✓ Password reset for ${email}`)
    console.log(`  user._id: ${user._id}`)
    console.log(`  plan: ${user.plan || '(unset)'}`)
    console.log(`\n  You can now log in at http://localhost:3000/login with:`)
    console.log(`    email:    ${email}`)
    console.log(`    password: ${newPassword}`)
  } else {
    console.error(`Update did not modify the user record (modifiedCount=${result.modifiedCount})`)
    process.exit(3)
  }

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('Failed:', e?.message || e)
  process.exit(1)
})
