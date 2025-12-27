import { NextRequest, NextResponse } from 'next/server'

// Configure for file uploads
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cloudinary configuration (if available)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

interface UploadResult {
  id: string
  url: string
  publicId?: string
  width?: number
  height?: number
  format?: string
  size?: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, MP4, WebM' },
        { status: 400 }
      )
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let result: UploadResult

    // If Cloudinary is configured, use it
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      result = await uploadToCloudinary(buffer, file.name, file.type, projectId)
    } else {
      // Fallback: Store as base64 data URL (not recommended for production)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`

      result = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: dataUrl,
        size: file.size,
      }

      // For images, try to get dimensions
      if (file.type.startsWith('image/')) {
        // In a real implementation, you'd use sharp or similar to get dimensions
        result.format = file.type.split('/')[1]
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  projectId: string | null
): Promise<UploadResult> {
  // Create form data for Cloudinary
  const formData = new FormData()

  // Convert buffer to Uint8Array then to blob (TypeScript compatibility)
  const uint8Array = new Uint8Array(buffer)
  const blob = new Blob([uint8Array], { type: mimeType })
  formData.append('file', blob, filename)
  formData.append('upload_preset', 'ml_default') // You may need to configure this

  // Add folder based on project
  if (projectId) {
    formData.append('folder', `ai-website-builder/${projectId}`)
  } else {
    formData.append('folder', 'ai-website-builder/uploads')
  }

  // Generate signature for authenticated upload
  const timestamp = Math.round(Date.now() / 1000)
  formData.append('timestamp', timestamp.toString())
  formData.append('api_key', CLOUDINARY_API_KEY!)

  // Create signature
  const crypto = await import('crypto')
  const toSign = `folder=ai-website-builder/${projectId || 'uploads'}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')
  formData.append('signature', signature)

  // Upload to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Cloudinary error:', error)
    throw new Error('Cloudinary upload failed')
  }

  const data = await response.json()

  return {
    id: data.public_id,
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    size: data.bytes,
  }
}

// Handle DELETE for removing uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json(
        { error: 'No publicId provided' },
        { status: 400 }
      )
    }

    // If it's a local (base64) file, just return success
    if (publicId.startsWith('local-')) {
      return NextResponse.json({ success: true })
    }

    // Delete from Cloudinary
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      const timestamp = Math.round(Date.now() / 1000)
      const crypto = await import('crypto')
      const toSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
      const signature = crypto.createHash('sha1').update(toSign).digest('hex')

      const formData = new FormData()
      formData.append('public_id', publicId)
      formData.append('timestamp', timestamp.toString())
      formData.append('api_key', CLOUDINARY_API_KEY)
      formData.append('signature', signature)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete from Cloudinary')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}
