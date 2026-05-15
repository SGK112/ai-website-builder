// POST /api/admin/backfill-tenant
//
// One-shot (idempotent) cleanup that stamps `app: 'webstew'` on every
// user in the shared collection who's used Webstew. "Webstew users" =
// anyone matched by:
//   - has at least one document in `projects` (Webstew projects collection)
//   - has authored at least one community_post (marketplace listing)
//   - has authored a community_post comment (when comments land)
//   - has a marketplace_purchase as buyer
//   - has marketplace_earnings_credits > 0 (sold something)
//   - has seed: 'marketplace-v1' (dummy demo accounts)
//
// Admin-only. Safe to re-run; only sets `app` where it's missing.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, isAdminEmail } from '@ai-website-builder/database'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return NextResponse.json({ error: 'DB not connected' }, { status: 500 })

  // Build the set of user IDs that have any Webstew footprint.
  const ids = new Set<string>()
  const addId = (raw: unknown) => {
    if (!raw) return
    const s = String(raw)
    if (ObjectId.isValid(s)) ids.add(s)
  }

  // 1. Project owners (projects.userId)
  const projectOwners = await db.collection('projects').distinct('userId')
  for (const id of projectOwners) addId(id)

  // 2. Community post authors (community_posts.author.id)
  const postAuthors = await db
    .collection('community_posts')
    .aggregate([{ $group: { _id: '$author.id' } }])
    .toArray()
  for (const r of postAuthors) addId(r._id)

  // 3. Marketplace purchase parties (buyer + seller)
  const purchaseParties = await db
    .collection('marketplace_purchases')
    .aggregate([
      {
        $group: {
          _id: null,
          buyers: { $addToSet: '$buyerId' },
          sellers: { $addToSet: '$sellerId' },
        },
      },
    ])
    .toArray()
  for (const r of purchaseParties) {
    for (const id of r.buyers || []) addId(id)
    for (const id of r.sellers || []) addId(id)
  }

  // 4. Sellers who have earnings (might not yet have a purchase row)
  const earners = await db
    .collection('users')
    .find({ marketplace_earnings_credits: { $gt: 0 } }, { projection: { _id: 1 } })
    .toArray()
  for (const r of earners) addId(r._id)

  // 5. Seed dummies + the explicit admin allowlist (joshb / aria)
  const seedOrAdmin = await db
    .collection('users')
    .find(
      {
        $or: [
          { seed: 'marketplace-v1' },
          { email: { $in: ['joshb@surprisegranite.com', 'aria@surprisegranite.com'] } },
        ],
      },
      { projection: { _id: 1 } }
    )
    .toArray()
  for (const r of seedOrAdmin) addId(r._id)

  // Update everyone in the set who doesn't already have an `app` field.
  // updateMany is fine here — set semantics, no concurrency risk.
  const objectIds = Array.from(ids)
    .filter((s) => ObjectId.isValid(s))
    .map((s) => new ObjectId(s))

  if (objectIds.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0, stamped: 0 })
  }

  const res = await db.collection('users').updateMany(
    { _id: { $in: objectIds }, app: { $exists: false } },
    {
      $set: {
        app: 'webstew',
        firstSeenWebstewAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )

  // Also count how many Webstew-tagged users exist now so admin can see
  // the delta.
  const totalWebstew = await db.collection('users').countDocuments({ app: 'webstew' })

  return NextResponse.json({
    ok: true,
    candidates: objectIds.length,
    stamped: res.modifiedCount,
    totalWebstewUsers: totalWebstew,
  })
}
