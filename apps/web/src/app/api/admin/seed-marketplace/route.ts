// POST /api/admin/seed-marketplace
// Idempotently seeds the community/marketplace with a small set of dummy
// users + a spread of approved listings, so /community + /u/<…> have
// content from the first visit. Admin-only. Safe to re-run — it
// upserts by deterministic _id so we don't get duplicate seed rows.
//
// Knobs: pass ?wipe=1 to delete previous seed data before re-creating
// (useful in dev / staging). The wipe ONLY removes documents marked
// with seed: 'marketplace-v1' — real user data is never touched.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { isAdminEmail } from '@ai-website-builder/database'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// Deterministic ObjectIds so reruns are idempotent. Each seed entry gets
// a 24-char hex string that obviously starts with 'seed' so it's easy to
// spot in Mongo Compass.
const seedId = (n: number) => new ObjectId(`5eed00000000${String(n).padStart(12, '0')}`)

interface SeedAuthor {
  username: string
  name: string
  avatar: string // public URL — uses ui-avatars so each dummy has a unique mark
  realUserEmail?: string // if set, look up the real User and stamp their _id
}

const DUMMY_AUTHORS: SeedAuthor[] = [
  { username: 'maya-reyes',     name: 'Maya Reyes',     avatar: 'https://i.pravatar.cc/150?img=47' },
  { username: 'alex-morgan',    name: 'Alex Morgan',    avatar: 'https://i.pravatar.cc/150?img=12' },
  { username: 'sarah-chen',     name: 'Sarah Chen',     avatar: 'https://i.pravatar.cc/150?img=32' },
  { username: 'devon-walker',   name: 'Devon Walker',   avatar: 'https://i.pravatar.cc/150?img=68' },
  { username: 'priya-nair',     name: 'Priya Nair',     avatar: 'https://i.pravatar.cc/150?img=44' },
  { username: 'jamie-rivera',   name: 'Jamie Rivera',   avatar: 'https://i.pravatar.cc/150?img=11' },
  { username: 'kenji-tanaka',   name: 'Kenji Tanaka',   avatar: 'https://i.pravatar.cc/150?img=33' },
  { username: 'rachel-kim',     name: 'Rachel Kim',     avatar: 'https://i.pravatar.cc/150?img=49' },
  // Joshua's seat — resolved against the live User collection at run time
  // so the seeded posts attach to his real userId/email/username.
  { username: 'aria',           name: 'Joshua Breese',  avatar: 'https://i.pravatar.cc/150?img=15', realUserEmail: 'aria@surprisegranite.com' },
]

interface SeedListing {
  authorIdx: number  // index into DUMMY_AUTHORS
  type: 'website' | 'template' | 'component' | 'blog'
  title: string
  description: string
  category: string
  tags: string[]
  thumbSeed: string
  likes: number
  views: number
  isPremium?: boolean
}

const SEED_LISTINGS: SeedListing[] = [
  { authorIdx: 0, type: 'website',   title: 'Aurora — SaaS landing',            description: 'A clean violet-grade landing for a developer-tools SaaS. Hero, social proof, pricing.', category: 'saas',      tags: ['dark','modern','saas','landing'],  thumbSeed: 'aurora-saas',     likes: 142, views: 2340 },
  { authorIdx: 1, type: 'website',   title: 'Brew & Bean — coffee shop',         description: 'Warm-tone restaurant template with menu, gallery, and a working reservation form.',          category: 'restaurant', tags: ['food','warm','restaurant'],         thumbSeed: 'brew-bean',       likes:  87, views: 1402 },
  { authorIdx: 2, type: 'template',  title: 'Portfolio · Maya minimal',          description: 'Hyper-minimal portfolio shell for designers + photographers. Drop in 6 projects.',         category: 'portfolio',  tags: ['minimal','portfolio','dark'],       thumbSeed: 'maya-portfolio',  likes: 311, views: 5102, isPremium: true },
  { authorIdx: 3, type: 'website',   title: 'IndieBuilder — agency one-pager',   description: 'Single-page agency site with case-study scroll, services strip, and inquiry form.',         category: 'business',   tags: ['agency','business','one-page'],     thumbSeed: 'indie-agency',    likes:  56, views:  820 },
  { authorIdx: 4, type: 'blog',      title: 'Notes from a senior PM',            description: 'Blog template tuned for long-form essays. Type-first, sticky reader, clean print.',         category: 'blog',       tags: ['blog','reading','serif'],           thumbSeed: 'pm-notes',        likes:  74, views: 1090 },
  { authorIdx: 5, type: 'website',   title: 'Forge — DTC ecommerce hero',        description: 'Editorial ecom storefront with hero rail, product strip, and quote-driven testimonials.', category: 'ecommerce',  tags: ['dtc','ecom','editorial'],           thumbSeed: 'forge-ecom',      likes: 203, views: 3204, isPremium: true },
  { authorIdx: 6, type: 'website',   title: 'Helix — analytics dashboard demo',  description: 'Polished dashboard landing for a B2B analytics product. KPI strip + chart screens.',       category: 'saas',       tags: ['saas','b2b','dashboard'],            thumbSeed: 'helix-analytics', likes: 168, views: 2240 },
  { authorIdx: 7, type: 'template',  title: 'Event night — gig + RSVP',          description: 'Single-night event template — date, lineup, venue map, free RSVP form.',                   category: 'event',      tags: ['event','rsvp','music'],             thumbSeed: 'event-night',     likes:  95, views: 1530 },
  { authorIdx: 0, type: 'component', title: 'Pricing strip · 3-tier dark',       description: 'Drop-in pricing strip — three tiers, hover lift, free → pro highlight.',                  category: 'general',    tags: ['component','pricing','dark'],        thumbSeed: 'pricing-strip',   likes:  41, views:  720 },
  { authorIdx: 2, type: 'website',   title: 'Local — community nonprofit',       description: 'Warm nonprofit site with donate CTA, programs grid, and volunteer signup.',                category: 'nonprofit',  tags: ['nonprofit','donate','warm'],         thumbSeed: 'local-nonprofit', likes: 124, views: 1882 },
  // Joshua's own (index 8 in DUMMY_AUTHORS — resolved against real account)
  { authorIdx: 8, type: 'website',   title: 'Surprise Granite — fabricator HQ',  description: 'Our flagship — granite/quartz fabricator site with quote form, gallery, and Aria voice agent.', category: 'business',   tags: ['granite','fabricator','az'],         thumbSeed: 'surprise-granite', likes: 287, views: 4521 },
  { authorIdx: 8, type: 'website',   title: 'Remodely · AI for remodelers',     description: 'AI-assisted remodeling platform — landing page with industry copy and waitlist.',          category: 'saas',       tags: ['ai','remodel','contractor'],         thumbSeed: 'remodely-ai',      likes: 156, views: 2780 },
  { authorIdx: 8, type: 'website',   title: 'VoiceNow CRM — phone-first SaaS',   description: 'Voice-AI CRM landing with feature grid, Twilio integration, and pricing comparison.',     category: 'saas',       tags: ['voice','crm','saas'],                thumbSeed: 'voicenow-crm',     likes: 198, views: 3120 },
]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const wipe = req.nextUrl.searchParams.get('wipe') === '1'
  const seedTag = 'marketplace-v1'

  if (wipe) {
    await db.collection('community_posts').deleteMany({ seed: seedTag })
    await db.collection('users').deleteMany({ seed: seedTag })
  }

  // Resolve any "real user" references — look up the live User record
  // and use its actual _id + email + name. Falls back to dummy values
  // if the lookup misses so the seed can still run on a fresh DB.
  const resolved: Array<{ idx: number; userId: string; email: string; name: string; username: string; avatar: string }> = []
  for (let i = 0; i < DUMMY_AUTHORS.length; i++) {
    const a = DUMMY_AUTHORS[i]
    let userId = ''
    let email = `${a.username}@webstew.demo`
    let name = a.name
    let username = a.username
    if (a.realUserEmail) {
      const realUser = await db.collection('users').findOne({ email: a.realUserEmail })
      if (realUser?._id) {
        userId = String(realUser._id)
        email = realUser.email || email
        name = realUser.name || name
        username = realUser.username || (realUser.email ? realUser.email.split('@')[0] : username)
      }
    }
    // For pure dummies, create/upsert a marker user record (seed: tag).
    // Not used for auth — just so they show up consistently in any user
    // queries and have a stable _id for the listing.author.id field.
    if (!userId) {
      const dummyId = seedId(1000 + i)
      await db.collection('users').updateOne(
        { _id: dummyId },
        {
          $setOnInsert: { _id: dummyId, createdAt: new Date(), seed: seedTag },
          $set: { email, name, username, avatar: a.avatar, plan: 'free', updatedAt: new Date() },
        },
        { upsert: true }
      )
      userId = String(dummyId)
    }
    resolved.push({ idx: i, userId, email, name, username, avatar: a.avatar })
  }

  // Upsert listings.
  let inserted = 0
  let updated = 0
  for (let j = 0; j < SEED_LISTINGS.length; j++) {
    const l = SEED_LISTINGS[j]
    const a = resolved[l.authorIdx]
    const _id = seedId(j + 1)
    const exists = await db.collection('community_posts').findOne({ _id }, { projection: { _id: 1 } })
    const doc: any = {
      type: l.type,
      title: l.title,
      description: l.description,
      thumbnail: `https://picsum.photos/seed/${l.thumbSeed}/800/600`,
      author: {
        id: a.userId,
        name: a.name,
        username: a.username,
        avatar: a.avatar,
      },
      tags: l.tags,
      category: l.category,
      likes: l.likes,
      views: l.views,
      downloads: Math.floor(l.likes / 4),
      comments: Math.floor(l.likes / 8),
      isPublic: true,
      isPremium: !!l.isPremium,
      price_credits: l.isPremium ? 10 : 0,
      status: 'approved',          // seed listings ship pre-approved
      seed: seedTag,
      updatedAt: new Date(),
    }
    if (exists) {
      await db.collection('community_posts').updateOne({ _id }, { $set: doc })
      updated++
    } else {
      await db.collection('community_posts').insertOne({ _id, ...doc, createdAt: new Date(Date.now() - (j + 1) * 60 * 60 * 1000) })
      inserted++
    }
  }

  return NextResponse.json({
    ok: true,
    wiped: wipe,
    users: resolved.length,
    listings: { inserted, updated, total: SEED_LISTINGS.length },
    profile_urls: resolved.map((r) => `/u/${r.username}`),
  })
}
