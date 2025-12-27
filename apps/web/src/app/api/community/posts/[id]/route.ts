import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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
  try {
    const body = await request.json()
    const { action, userId } = body

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const postsCollection = db.collection('community_posts')
    const likesCollection = db.collection('post_likes')

    const post = await postsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (action === 'like') {
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
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('community_posts')

    const post = await collection.findOne({ _id: new ObjectId(params.id) })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check ownership
    if (post.author.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await collection.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
