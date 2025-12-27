import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

    // Build query
    const query: any = { isPublic: true }
    if (type) query.type = type
    if (category) query.category = category
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    // Build sort
    let sortQuery: any = { createdAt: -1 }
    if (sort === 'popular') sortQuery = { likes: -1, views: -1 }
    if (sort === 'trending') sortQuery = { views: -1, createdAt: -1 }
    if (sort === 'downloads') sortQuery = { downloads: -1 }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      collection
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ])

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
  try {
    const body = await request.json()
    const { type, title, description, html, thumbnail, author, tags, category, isPublic = true } = body

    if (!type || !title || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('community_posts')

    const post: CommunityPost = {
      type,
      title,
      description: description || '',
      html,
      thumbnail,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        avatar: author.avatar,
      },
      tags: tags || [],
      category: category || 'general',
      likes: 0,
      views: 0,
      downloads: 0,
      comments: 0,
      isPublic,
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
