import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

interface PageDocument {
  _id?: ObjectId
  projectId: string
  name: string
  slug: string
  isHome: boolean
  html: string
  createdAt: Date
  updatedAt: Date
}

// GET /api/projects/[id]/pages - List all pages for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    const pages = await db
      .collection<PageDocument>('pages')
      .find({ projectId: params.id })
      .sort({ isHome: -1, createdAt: 1 })
      .toArray()

    const formattedPages = pages.map(page => ({
      id: page._id?.toString(),
      name: page.name,
      slug: page.slug,
      isHome: page.isHome,
      html: page.html,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }))

    return NextResponse.json({ pages: formattedPages })
  } catch (error) {
    console.error('GET pages error:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

// POST /api/projects/[id]/pages - Create a new page
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await req.json()
    const { name, slug, html = '', isHome = false } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    // If this is set as home, unset other home pages
    if (isHome) {
      await db.collection('pages').updateMany(
        { projectId: params.id, isHome: true },
        { $set: { isHome: false } }
      )
    }

    const pageDoc: PageDocument = {
      projectId: params.id,
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      isHome,
      html,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('pages').insertOne(pageDoc)

    return NextResponse.json({
      page: {
        id: result.insertedId.toString(),
        ...pageDoc,
      },
    })
  } catch (error) {
    console.error('POST page error:', error)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/pages - Update a page (with pageId in body)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await req.json()
    const { pageId, name, slug, html, isHome } = body

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    // If setting as home, unset other home pages first
    if (isHome) {
      await db.collection('pages').updateMany(
        { projectId: params.id, isHome: true },
        { $set: { isHome: false } }
      )
    }

    const updateFields: Partial<PageDocument> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateFields.name = name
    if (slug !== undefined) updateFields.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (html !== undefined) updateFields.html = html
    if (isHome !== undefined) updateFields.isHome = isHome

    const result = await db.collection('pages').findOneAndUpdate(
      { _id: new ObjectId(pageId), projectId: params.id },
      { $set: updateFields },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({
      page: {
        id: result._id.toString(),
        name: result.name,
        slug: result.slug,
        isHome: result.isHome,
        html: result.html,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    })
  } catch (error) {
    console.error('PATCH page error:', error)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/pages - Delete a page (with pageId in query)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    const client = await getClient()
    const db = client.db()

    // Check if this is the home page
    const page = await db.collection('pages').findOne({
      _id: new ObjectId(pageId),
      projectId: params.id,
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Don't allow deleting the last page
    const pageCount = await db.collection('pages').countDocuments({ projectId: params.id })
    if (pageCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last page' }, { status: 400 })
    }

    await db.collection('pages').deleteOne({
      _id: new ObjectId(pageId),
      projectId: params.id,
    })

    // If we deleted the home page, set another page as home
    if (page.isHome) {
      const newHome = await db.collection('pages').findOne({ projectId: params.id })
      if (newHome) {
        await db.collection('pages').updateOne(
          { _id: newHome._id },
          { $set: { isHome: true } }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE page error:', error)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}
