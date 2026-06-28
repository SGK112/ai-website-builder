import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'

export const dynamic = 'force-dynamic'

export interface CommunityPost {
  _id?: ObjectId
  type: 'template' | 'website' | 'component' | 'ad' | 'blog'
  title: string
  description: string
  html?: string
  thumbnail?: string
  author: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  tags: string[]
  category: string
  likes: number
  views: number
  downloads: number
  comments: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// GET - Fetch community posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // template, website, component, ad, blog
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'recent' // recent, popular, trending
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('community_posts')

    // Build query. Listings are visible publicly only after admin approval
    // (status: 'approved'). Posts that pre-date the moderation field don't
    // have a status — treat those as approved for backwards compat. Hidden
    // statuses: 'pending' (awaiting review), 'rejected' (admin removed).
    // Admins see everything; signed-in non-admin users see their own
    // pending/rejected posts so they know what's happening with submissions.
    const viewerSession = await getServerSession(authOptions).catch(() => null)
    const viewerEmail = viewerSession?.user?.email || ''
    const viewerIsAdmin = !!viewerEmail && isAdminEmail(viewerEmail)
    const viewerId = viewerSession?.user?.id || ''

    const query: any = { isPublic: true }
    if (!viewerIsAdmin) {
      if (viewerId) {
        // Authed but not admin: approved OR your own (regardless of status).
        query.$or = [
          { status: { $nin: ['pending', 'rejected'] } },
          { 'author.id': viewerId },
        ]
      } else {
        // Anon: only approved.
        query.status = { $nin: ['pending', 'rejected'] }
      }
    }
    if (type) query.type = type
    if (category) query.category = category
    if (search) {
      // Escape regex metachars + cap length — `search` is user input, and an
      // un-escaped pattern (e.g. "(a+)+$") is a ReDoS / injection vector.
      const safe = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { tags: { $in: [new RegExp(safe, 'i')] } },
      ]
    }

    // Build sort
    let sortQuery: any = { createdAt: -1 }
    if (sort === 'popular') sortQuery = { likes: -1, views: -1 }
    if (sort === 'trending') sortQuery = { views: -1, createdAt: -1 }
    if (sort === 'downloads') sortQuery = { downloads: -1 }

    const skip = (page - 1) * limit

    const [postsRaw, total] = await Promise.all([
      collection
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ])

    // Stamp per-viewer engagement state so the client can render the
    // correct "I liked this" / "I saved this" affordance without a
    // second round-trip. likedBy + savedBy stay on the doc; we expose
    // only the boolean membership for this viewer.
    const posts = postsRaw.map((p) => {
      const liked = viewerId && Array.isArray(p.likedBy) && p.likedBy.includes(viewerId)
      const saved = viewerId && Array.isArray(p.savedBy) && p.savedBy.includes(viewerId)
      // Never ship a PREMIUM listing's deliverable (html / file contents) in the
      // feed — that would hand the paid source to everyone for free. Only the
      // author keeps it here; buyers fetch it via the entitled detail/buy route.
      const isPremium = !!p.isPremium && (Number(p.price_credits) || 0) > 0
      const isAuthor = viewerId && String(p.author?.id || '') === String(viewerId)
      const stripped = isPremium && !isAuthor
      return {
        ...p,
        ...(stripped
          ? { html: undefined, files: Array.isArray(p.files) ? p.files.map((f: any) => ({ ...f, content: undefined })) : p.files, locked: true }
          : {}),
        viewerLiked: !!liked,
        viewerSaved: !!saved,
        // Drop the full sets from the response — they can grow large and
        // contain user IDs that aren't anyone's business.
        likedBy: undefined,
        savedBy: undefined,
      }
    })

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Community posts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST - Create a new community post
export async function POST(request: NextRequest) {
  const blocked = await guardAnonAbuse(request, { rateLimit: 'marketplacePublish' })
  if (blocked) return blocked
  try {
    // SECURITY: Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, description, html, thumbnail, tags, category, isPublic = true, priceCredits, videoUrl } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // Video listings (sold from the Video Studio library) carry a media URL
    // instead of HTML. Only accept it from our own CDN / providers.
    let safeVideoUrl: string | undefined
    if (type === 'video') {
      const ok = typeof videoUrl === 'string' && /^https:\/\/([a-z0-9-]+\.)*(cloudinary\.com|replicate\.(com|delivery)|x\.ai)\//i.test(videoUrl)
      if (!ok) return NextResponse.json({ error: 'A valid video URL is required to list a video.' }, { status: 400 })
      safeVideoUrl = videoUrl
    }

    // Guard against listing the BUILDER APP's OWN shell instead of a generated
    // site. A captured app document carries __NEXT_DATA__ / _next chunks and the
    // workspace's own API calls — in the sandboxed listing preview (origin null)
    // it can only ever render as a broken, CORS-blocked white page.
    if (type !== 'video' && typeof html === 'string' && (html.includes('__NEXT_DATA__') || html.includes('/_next/static/chunks/'))) {
      return NextResponse.json({ error: "That isn't a site you built — open it in the builder and publish from there." }, { status: 400 })
    }

    // Optional paid listing — clamp to int, cap at $500 (50000 credits) so a
    // typo can't accidentally publish a 5-figure price. 0 / unset = free.
    const priceNum = Math.max(0, Math.min(50000, Math.floor(Number(priceCredits) || 0)))
    const isPremium = priceNum > 0

    // A PAID site/template/app listing delivers its HTML to buyers, so refuse to
    // sell one with no real content — otherwise buyers get a blank site. Only
    // gate premium listings: free community posts can be text-only (a tip, a
    // showcase note). video/image listings carry a media URL instead. The buy
    // route also guards delivery, so this is the front-line check, not the only one.
    if (isPremium && type !== 'video' && type !== 'image') {
      const htmlStr = typeof html === 'string' ? html.trim() : ''
      if (htmlStr.length < 200) {
        return NextResponse.json(
          { error: 'This project has no content to list for sale. Build the site first, then publish it.' },
          { status: 400 }
        )
      }
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('community_posts')

    // Moderation status. Admins auto-approve their own posts; everyone
    // else starts in 'pending' until an admin reviews. The author can see
    // their own pending posts on /community via the per-user $or branch
    // in the GET handler.
    const authorIsAdmin = !!session.user.email && isAdminEmail(session.user.email)
    const status: 'pending' | 'approved' = authorIsAdmin ? 'approved' : 'pending'

    // SECURITY: Use server-side session for author info (not client-provided)
    const post: any = {
      type,
      title,
      description: description || '',
      html,
      videoUrl: safeVideoUrl,
      thumbnail,
      author: {
        id: session.user.id,
        name: session.user.name || 'Anonymous',
        username: session.user.email?.split('@')[0] || 'user',
        avatar: session.user.image || undefined,
      },
      tags: tags || [],
      category: category || 'general',
      likes: 0,
      views: 0,
      downloads: 0,
      comments: 0,
      isPublic,
      status,
      // Paid-listing fields read by /api/marketplace/buy + /api/listings/[id].
      // Always written (even at 0) so the schema is consistent across rows.
      isPremium,
      price_credits: priceNum,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(post)

    return NextResponse.json({
      success: true,
      postId: result.insertedId,
      post: { ...post, _id: result.insertedId },
    })
  } catch (error) {
    console.error('Community posts POST error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
