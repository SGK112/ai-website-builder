import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export interface ChatMessage {
  _id?: ObjectId
  roomId: string // 'global' or specific room/channel id
  userId: string
  userName: string
  userAvatar?: string
  message: string
  type: 'text' | 'image' | 'template' | 'link'
  attachments?: {
    type: string
    url: string
    name?: string
    thumbnail?: string
  }[]
  reactions: { emoji: string; users: string[] }[]
  replyTo?: string // message id
  createdAt: Date
}

// GET - Fetch chat messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId') || 'global'
    const before = searchParams.get('before') // cursor for pagination
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('chat_messages')

    const query: any = { roomId }
    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    const messages = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Return in chronological order
    messages.reverse()

    return NextResponse.json({
      roomId,
      messages,
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId = 'global', userId, userName, userAvatar, message, type = 'text', attachments, replyTo } = body

    if (!userId || !userName || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('chat_messages')

    const chatMessage: ChatMessage = {
      roomId,
      userId,
      userName,
      userAvatar,
      message,
      type,
      attachments,
      reactions: [],
      replyTo,
      createdAt: new Date(),
    }

    const result = await collection.insertOne(chatMessage)

    return NextResponse.json({
      success: true,
      messageId: result.insertedId,
      message: { ...chatMessage, _id: result.insertedId },
    })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// PATCH - Add reaction to message
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, userId, emoji, action = 'add' } = body

    if (!messageId || !userId || !emoji) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const collection = db.collection('chat_messages')

    const message = await collection.findOne({ _id: new ObjectId(messageId) })
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    let reactions = message.reactions || []
    const existingReaction = reactions.find((r: any) => r.emoji === emoji)

    if (action === 'add') {
      if (existingReaction) {
        if (!existingReaction.users.includes(userId)) {
          existingReaction.users.push(userId)
        }
      } else {
        reactions.push({ emoji, users: [userId] })
      }
    } else if (action === 'remove') {
      if (existingReaction) {
        existingReaction.users = existingReaction.users.filter((u: string) => u !== userId)
        if (existingReaction.users.length === 0) {
          reactions = reactions.filter((r: any) => r.emoji !== emoji)
        }
      }
    }

    await collection.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { reactions } }
    )

    return NextResponse.json({ success: true, reactions })
  } catch (error) {
    console.error('Chat PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 })
  }
}
