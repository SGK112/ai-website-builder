// GET /api/listings/[id]
// Public listing fetch — used by /listings/[id] page (anon + authed).
// Returns sanitized listing + entitlement flags ("can the viewer use
// the HTML right now?") so the page can render the right CTA.
//
// Hides html_content unless the viewer has access (free listing /
// already purchased / is the author / is admin). Free listings are
// open; premium listings require purchase.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const session = await getServerSession(authOptions).catch(() => null)
  const viewerId = session?.user?.id || ''
  const viewerIsAdmin = !!session?.user?.email && isAdminEmail(session.user.email)

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const listing = await db.collection('community_posts').findOne({ _id: new ObjectId(params.id) })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  // Status gate — same logic as the feed query.
  const status = listing.status
  const isOwner = viewerId && String(listing.author?.id || '') === viewerId
  const visible =
    viewerIsAdmin ||
    isOwner ||
    status === 'approved' ||
    status === undefined // legacy posts without a status field
  if (!visible) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  // View counter bump — fire-and-forget so we don't block the read.
  db.collection('community_posts')
    .updateOne({ _id: listing._id }, { $inc: { views: 1 } })
    .catch(() => {})

  // Entitlement check — can the viewer use the HTML right now?
  const price: number = Number(listing.price_credits) || 0
  const isPremium = !!listing.isPremium && price > 0
  let owned = false
  if (viewerId) {
    if (isOwner || viewerIsAdmin) owned = true
    else if (!isPremium) owned = true
    else {
      const purchase = await db
        .collection('marketplace_purchases')
        .findOne(
          { buyerId: viewerId, listingId: String(listing._id) },
          { projection: { _id: 1 } }
        )
      owned = !!purchase
    }
  } else if (!isPremium) {
    // Anon can read free listings' HTML.
    owned = true
  }

  // Liked / saved badge for the viewer.
  const viewerLiked = viewerId && Array.isArray(listing.likedBy) && listing.likedBy.includes(viewerId)
  const viewerSaved = viewerId && Array.isArray(listing.savedBy) && listing.savedBy.includes(viewerId)

  // Strip internal fields + html when the viewer doesn't have access.
  const safe: any = {
    _id: String(listing._id),
    type: listing.type,
    title: listing.title,
    description: listing.description,
    thumbnail: listing.thumbnail,
    author: listing.author,
    tags: listing.tags || [],
    category: listing.category,
    likes: listing.likes || 0,
    views: (listing.views || 0) + 1,
    downloads: listing.downloads || 0,
    comments: listing.comments || 0,
    status: listing.status,
    isPremium,
    priceCredits: price,
    createdAt: listing.createdAt,
    viewerLiked: !!viewerLiked,
    viewerSaved: !!viewerSaved,
    owned,
    isOwner,
  }
  if (owned && listing.html) safe.html = listing.html
  return NextResponse.json({ listing: safe })
}
