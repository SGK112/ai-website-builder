import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import {
  uploadFile,
  uploadFromUrl,
  uploadGeneratedImage,
  uploadThumbnail,
  isSupabaseConfigured,
  STORAGE_BUCKETS,
  type StorageBucket,
} from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface UploadRequest {
  // For URL uploads
  url?: string
  // For base64 uploads
  base64?: string
  contentType?: string
  // Common options
  bucket?: StorageBucket
  folder?: string
  fileName?: string
  // Project-specific
  projectId?: string
  imageType?: 'hero' | 'product' | 'team' | 'feature' | 'gallery' | 'general' | 'thumbnail'
}

/**
 * POST /api/storage/upload
 * Upload files to Supabase storage
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Storage not configured', message: 'Supabase storage is not configured' },
        { status: 503 }
      )
    }

    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit: 30 uploads per minute
    try {
      checkApiRateLimit(request, 'api')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const contentType = request.headers.get('content-type') || ''

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      return handleFormUpload(request, session.user.id)
    }

    // Handle JSON request (URL or base64 upload)
    const body: UploadRequest = await request.json()
    return handleJsonUpload(body, session.user.id)
  } catch (error: any) {
    console.error('[Storage] Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle multipart form upload
 */
async function handleFormUpload(request: NextRequest, userId: string) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as StorageBucket) || STORAGE_BUCKETS.UPLOADS
  const folder = (formData.get('folder') as string) || `users/${userId}`
  const projectId = formData.get('projectId') as string | null
  const imageType = formData.get('imageType') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type', allowed: allowedTypes },
      { status: 400 }
    )
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large', maxSize: '10MB' },
      { status: 400 }
    )
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Use project-specific upload if projectId provided
  if (projectId && imageType) {
    if (imageType === 'thumbnail') {
      const result = await uploadThumbnail(buffer, projectId)
      return NextResponse.json(result)
    }

    const result = await uploadGeneratedImage(
      buffer,
      projectId,
      imageType as 'hero' | 'product' | 'team' | 'feature' | 'gallery' | 'general'
    )
    return NextResponse.json(result)
  }

  // Generic upload
  const result = await uploadFile(buffer, {
    bucket,
    folder,
    contentType: file.type,
  })

  return NextResponse.json(result)
}

/**
 * Handle JSON upload (URL or base64)
 */
async function handleJsonUpload(body: UploadRequest, userId: string) {
  const {
    url,
    base64,
    contentType,
    bucket = STORAGE_BUCKETS.UPLOADS,
    folder,
    fileName,
    projectId,
    imageType,
  } = body

  if (!url && !base64) {
    return NextResponse.json(
      { error: 'Either url or base64 is required' },
      { status: 400 }
    )
  }

  // Handle project-specific uploads
  if (projectId && imageType) {
    const imageData = url || (base64 ? `data:${contentType || 'image/png'};base64,${base64}` : '')

    if (imageType === 'thumbnail') {
      const result = await uploadThumbnail(imageData, projectId)
      return NextResponse.json(result)
    }

    const result = await uploadGeneratedImage(
      imageData,
      projectId,
      imageType as 'hero' | 'product' | 'team' | 'feature' | 'gallery' | 'general'
    )
    return NextResponse.json(result)
  }

  // Handle URL upload
  if (url) {
    const result = await uploadFromUrl(url, {
      bucket,
      folder: folder || `users/${userId}`,
      fileName,
    })
    return NextResponse.json(result)
  }

  // Handle base64 upload
  if (base64) {
    const dataUrl = `data:${contentType || 'image/png'};base64,${base64}`
    const result = await uploadFromUrl(dataUrl, {
      bucket,
      folder: folder || `users/${userId}`,
      fileName,
    })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

/**
 * GET /api/storage/upload
 * Check storage configuration status
 */
export async function GET() {
  return NextResponse.json({
    configured: isSupabaseConfigured(),
    buckets: Object.values(STORAGE_BUCKETS),
    limits: {
      maxFileSize: '10MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    },
  })
}
