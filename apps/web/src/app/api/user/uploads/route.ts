import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/mongodb'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// GET - Retrieve user's uploaded images with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const client = await getClient()
    const db = client.db()

    // Build query
    const query: any = { email: session.user.email }

    if (folderId === 'uncategorized') {
      query.$or = [{ folderId: null }, { folderId: { $exists: false } }]
    } else if (folderId) {
      query.folderId = folderId
    }

    if (tag) {
      query.tags = tag
    }

    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ]
    }

    const [uploads, total] = await Promise.all([
      db.collection('user_uploads')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection('user_uploads').countDocuments(query),
    ])

    const formattedUploads = uploads.map((upload: any) => ({
      id: upload._id.toString(),
      url: upload.url,
      thumbnail: upload.thumbnail || upload.url,
      title: upload.filename,
      source: upload.source || 'uploads',
      width: upload.width,
      height: upload.height,
      folderId: upload.folderId,
      tags: upload.tags || [],
      createdAt: upload.createdAt,
    }))

    return NextResponse.json({
      uploads: formattedUploads,
      total,
      hasMore: offset + uploads.length < total,
    })
  } catch (error) {
    console.error('Failed to get uploads:', error)
    return NextResponse.json({ error: 'Failed to get uploads' }, { status: 500 })
  }
}

// POST - Upload new images
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Ensure upload directory exists
    const userUploadDir = path.join(UPLOAD_DIR, session.user.email.replace(/[^a-zA-Z0-9]/g, '_'))
    if (!existsSync(userUploadDir)) {
      await mkdir(userUploadDir, { recursive: true })
    }

    const client = await getClient()
    const db = client.db()

    const uploadedFiles = []

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        continue
      }

      // Generate unique filename
      const ext = path.extname(file.name) || '.jpg'
      const filename = `${uuidv4()}${ext}`
      const filepath = path.join(userUploadDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Create URL path
      const relativePath = path.relative(path.join(process.cwd(), 'public'), filepath)
      const url = `/${relativePath.replace(/\\/g, '/')}`

      // Save to database
      const uploadDoc = {
        email: session.user.email,
        filename: file.name,
        storedFilename: filename,
        url,
        thumbnail: url,
        size: file.size,
        type: file.type,
        createdAt: new Date(),
      }

      const result = await db.collection('user_uploads').insertOne(uploadDoc)

      uploadedFiles.push({
        id: result.insertedId.toString(),
        url,
        thumbnail: url,
        title: file.name,
        source: 'uploads',
      })
    }

    return NextResponse.json({ uploads: uploadedFiles })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// PATCH - Update image metadata (tags, folder, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ids, folderId, tags, addTags, removeTags } = body

    const client = await getClient()
    const db = client.db()
    const { ObjectId } = require('mongodb')

    // Support bulk updates
    const targetIds = ids || (id ? [id] : [])

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'No images specified' }, { status: 400 })
    }

    const updateFields: any = {}

    // Update folder
    if (folderId !== undefined) {
      updateFields.folderId = folderId
    }

    // Replace tags
    if (tags !== undefined) {
      updateFields.tags = tags
    }

    const operations: any[] = []

    // Add tags
    if (addTags?.length > 0) {
      operations.push({
        updateMany: {
          filter: {
            _id: { $in: targetIds.map((i: string) => new ObjectId(i)) },
            email: session.user.email,
          },
          update: { $addToSet: { tags: { $each: addTags } } },
        },
      })
    }

    // Remove tags
    if (removeTags?.length > 0) {
      operations.push({
        updateMany: {
          filter: {
            _id: { $in: targetIds.map((i: string) => new ObjectId(i)) },
            email: session.user.email,
          },
          update: { $pull: { tags: { $in: removeTags } } },
        },
      })
    }

    // Direct field updates
    if (Object.keys(updateFields).length > 0) {
      await db.collection('user_uploads').updateMany(
        {
          _id: { $in: targetIds.map((i: string) => new ObjectId(i)) },
          email: session.user.email,
        },
        { $set: updateFields }
      )
    }

    // Execute bulk operations
    if (operations.length > 0) {
      await db.collection('user_uploads').bulkWrite(operations)
    }

    return NextResponse.json({ success: true, updated: targetIds.length })
  } catch (error) {
    console.error('Update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE - Remove uploaded image(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')?.split(',').filter(Boolean)

    const targetIds = ids || (id ? [id] : [])

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Missing id(s)' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()
    const { ObjectId } = require('mongodb')

    // Delete multiple (only if owned by user)
    const result = await db.collection('user_uploads').deleteMany({
      _id: { $in: targetIds.map(i => new ObjectId(i)) },
      email: session.user.email,
    })

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
    })
  } catch (error) {
    console.error('Delete failed:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
