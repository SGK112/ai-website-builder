import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface FolderDocument {
  _id?: ObjectId
  email: string
  name: string
  parentId?: string | null
  createdAt: Date
  updatedAt: Date
}

// GET - List user's folders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getClient()
    const db = client.db()

    const folders = await db
      .collection<FolderDocument>('upload_folders')
      .find({ email: session.user.email })
      .sort({ name: 1 })
      .toArray()

    // Get image counts for each folder
    const folderIds = folders.map(f => f._id?.toString())
    const counts = await db
      .collection('user_uploads')
      .aggregate([
        {
          $match: {
            email: session.user.email,
            folderId: { $in: folderIds },
          },
        },
        {
          $group: {
            _id: '$folderId',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const countMap = new Map(counts.map(c => [c._id, c.count]))

    // Get uncategorized count
    const uncategorizedCount = await db
      .collection('user_uploads')
      .countDocuments({
        email: session.user.email,
        $or: [{ folderId: null }, { folderId: { $exists: false } }],
      })

    const formattedFolders = folders.map(folder => ({
      id: folder._id?.toString(),
      name: folder.name,
      parentId: folder.parentId,
      imageCount: countMap.get(folder._id?.toString()) || 0,
      createdAt: folder.createdAt,
    }))

    return NextResponse.json({
      folders: formattedFolders,
      uncategorizedCount,
    })
  } catch (error) {
    console.error('GET folders error:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

// POST - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parentId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    // Check for duplicate name
    const existing = await db.collection('upload_folders').findOne({
      email: session.user.email,
      name: name.trim(),
      parentId: parentId || null,
    })

    if (existing) {
      return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 })
    }

    const folderDoc: FolderDocument = {
      email: session.user.email,
      name: name.trim(),
      parentId: parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('upload_folders').insertOne(folderDoc)

    return NextResponse.json({
      folder: {
        id: result.insertedId.toString(),
        name: folderDoc.name,
        parentId: folderDoc.parentId,
        imageCount: 0,
        createdAt: folderDoc.createdAt,
      },
    })
  } catch (error) {
    console.error('POST folder error:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

// PATCH - Rename a folder
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { folderId, name } = body

    if (!folderId || !name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder ID and name are required' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    const result = await db.collection('upload_folders').findOneAndUpdate(
      { _id: new ObjectId(folderId), email: session.user.email },
      { $set: { name: name.trim(), updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json({
      folder: {
        id: result._id.toString(),
        name: result.name,
        parentId: result.parentId,
      },
    })
  } catch (error) {
    console.error('PATCH folder error:', error)
    return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 })
  }
}

// DELETE - Delete a folder (and optionally move images)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const moveToFolder = searchParams.get('moveTo') || null // null = uncategorized

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    // Check if folder exists
    const folder = await db.collection('upload_folders').findOne({
      _id: new ObjectId(folderId),
      email: session.user.email,
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Move images to new location (or uncategorized)
    await db.collection('user_uploads').updateMany(
      { email: session.user.email, folderId },
      { $set: { folderId: moveToFolder } }
    )

    // Delete the folder
    await db.collection('upload_folders').deleteOne({
      _id: new ObjectId(folderId),
      email: session.user.email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE folder error:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
