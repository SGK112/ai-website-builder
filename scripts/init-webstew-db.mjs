// One-shot: copy ONLY Webstew-relevant data from the shared voiceflow-crm
// database into a new clean `webstew` database.
//
// What we keep:
//   - The current admin user (joshb@surprisegranite.com) so login works
//   - Any users that look like Webstew users (plan in Webstew tier names
//     AND no VoiceNow-only fields like `businesses` or `aiPersonality`)
//   - Any projects (workspace site builds — clearly Webstew)
//   - Empty `templates` + `admin_audit` collections
//
// What we DROP:
//   - VoiceNow business records, leads, calls, SMS, Aria activity, etc.
//   - User fields that are VoiceNow-only (we strip them when copying)

import mongoose from 'mongoose'

const SOURCE = 'mongodb://127.0.0.1:27017/voiceflow-crm'
const TARGET = 'mongodb://127.0.0.1:27017/webstew'

const VOICENOW_USER_FIELDS = [
  'businesses', 'activeBusinessId', 'aiPersonality', 'archivedAgents',
  'businessName', 'businessType', 'company', 'creditBalance', 'mediaCredits',
  'phoneNumbers', 'savedVoices', 'pricingTier', 'emailConfig', 'importedData',
  'stripeConnectChargesEnabled', 'stripeConnectPayoutsEnabled',
]

const WEBSTEW_PLANS = new Set(['free', 'starter', 'pro', 'scale', 'enterprise', 'custom'])
const ADMIN_EMAILS = new Set(['joshb@surprisegranite.com'])

function stripVoiceNowFields(u) {
  const clean = { ...u }
  for (const f of VOICENOW_USER_FIELDS) delete clean[f]
  return clean
}

async function main() {
  console.log('Connecting to source (voiceflow-crm)…')
  const src = await mongoose.createConnection(SOURCE).asPromise()
  console.log('Connecting to target (webstew)…')
  const dst = await mongoose.createConnection(TARGET).asPromise()

  // 1. Users — keep admins + users with a Webstew plan + users without VoiceNow markers.
  console.log('\n[users]')
  const allUsers = await src.db.collection('users').find({}).toArray()
  const kept = []
  for (const u of allUsers) {
    const email = (u.email || '').toLowerCase()
    const isAdmin = ADMIN_EMAILS.has(email)
    const plan = (u.plan || '').toLowerCase()
    const hasWebstewPlan = WEBSTEW_PLANS.has(plan)
    const looksLikeVoiceNow = u.businesses?.length > 0 || u.businessName || u.aiPersonality || (u.phoneNumbers && Object.keys(u.phoneNumbers).length > 0)
    // Keep: admin OR (webstew plan AND not clearly a VoiceNow tenant user)
    if (isAdmin || (hasWebstewPlan && !looksLikeVoiceNow)) {
      kept.push(stripVoiceNowFields(u))
      console.log(`  KEEP ${email} (plan=${plan}, admin=${isAdmin})`)
    } else {
      console.log(`  drop ${email} (plan=${plan}, voicenow=${looksLikeVoiceNow})`)
    }
  }
  if (kept.length > 0) {
    try { await dst.db.collection('users').drop() } catch {}
    await dst.db.collection('users').insertMany(kept)
    // Index by email for fast login lookups
    await dst.db.collection('users').createIndex({ email: 1 }, { unique: true })
  }
  console.log(`  → ${kept.length} users copied`)

  // 2. Projects — Webstew workspace sites. Filter to keep only those belonging
  //    to kept users.
  console.log('\n[projects]')
  const keptIds = new Set(kept.map((u) => String(u._id)))
  const allProjects = await src.db.collection('projects').find({}).toArray()
  const projects = allProjects.filter((p) => keptIds.has(String(p.userId)))
  if (projects.length > 0) {
    try { await dst.db.collection('projects').drop() } catch {}
    await dst.db.collection('projects').insertMany(projects)
    await dst.db.collection('projects').createIndex({ userId: 1, updatedAt: -1 })
  }
  console.log(`  → ${projects.length} projects copied (of ${allProjects.length})`)

  // 3. Initialize empty Webstew-specific collections.
  console.log('\n[templates]')
  await dst.db.createCollection('templates').catch(() => {})
  console.log('  → templates collection ready')

  console.log('\n[admin_audit]')
  await dst.db.createCollection('admin_audit').catch(() => {})
  console.log('  → admin_audit collection ready')

  // 4. Verify
  console.log('\n[verify]')
  console.log('  users:', await dst.db.collection('users').countDocuments())
  console.log('  projects:', await dst.db.collection('projects').countDocuments())
  console.log('  templates:', await dst.db.collection('templates').countDocuments())
  console.log('  admin_audit:', await dst.db.collection('admin_audit').countDocuments())

  await src.close()
  await dst.close()
  console.log('\n✓ Done. New database `webstew` is ready.')
  console.log('  Update apps/web/.env.local:')
  console.log('  MONGODB_URI=mongodb://127.0.0.1:27017/webstew')
}

main().catch((e) => {
  console.error('Failed:', e?.message || e)
  process.exit(1)
})
