import { NextRequest, NextResponse } from 'next/server'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Fetch single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('community_posts')

    const post = await collection.findOne({ _id: new ObjectId(params.id) })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Increment view count
    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { views: 1 } }
    )

    return NextResponse.json({ post: { ...post, views: post.views + 1 } })
  } catch (error) {
    console.error('Post GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PATCH - Update post (like, download, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = guardAnonAbuse(request, { rateLimit: 'communityAction' })
  if (blocked) return blocked
  try {
    // SECURITY: Require authentication for likes
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const { action } = body

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const postsCollection = db.collection('community_posts')
    const likesCollection = db.collection('post_likes')

    const post = await postsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (action === 'like') {
      // SECURITY: Require auth for liking
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required to like posts' }, { status: 401 })
      }

      const userId = session.user.id  // Use server-side session, not client-provided

      // Check if already liked
      const existingLike = await likesCollection.findOne({
        postId: params.id,
        userId,
      })

      if (existingLike) {
        // Unlike
        await likesCollection.deleteOne({ postId: params.id, userId })
        await postsCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $inc: { likes: -1 } }
        )
        return NextResponse.json({ success: true, liked: false, likes: post.likes - 1 })
      } else {
        // Like
        await likesCollection.insertOne({
          postId: params.id,
          userId,
          createdAt: new Date(),
        })
        await postsCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $inc: { likes: 1 } }
        )
        return NextResponse.json({ success: true, liked: true, likes: post.likes + 1 })
      }
    }

    if (action === 'download') {
      // Downloads don't require auth (tracking only)
      await postsCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $inc: { downloads: 1 } }
      )
      return NextResponse.json({ success: true, downloads: post.downloads + 1 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Post PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = guardAnonAbuse(request, { rateLimit: 'communityAction' })
  if (blocked) return blocked
  try {
    // SECURITY: Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('community_posts')

    const post = await collection.findOne({ _id: new ObjectId(params.id) })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // SECURITY: Check ownership using server-side session (not client-provided userId)
    if (post.author.id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - you can only delete your own posts' }, { status: 403 })
    }

    await collection.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
