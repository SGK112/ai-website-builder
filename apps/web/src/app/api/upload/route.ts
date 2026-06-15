import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    // SECURITY: Require authentication to upload files
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectIdRaw = formData.get('projectId') as string | null
    // projectId is interpolated into the Cloudinary signature string + folder
    // path. Reject anything but a safe id so it can't smuggle extra signed
    // params (folder=...&timestamp=0&...) or escape the folder.
    if (projectIdRaw && !/^[a-zA-Z0-9_-]{1,64}$/.test(projectIdRaw)) {
      return NextResponse.json({ error: 'Invalid projectId.' }, { status: 400 })
    }
    const projectId = projectIdRaw

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    // Accept any image or video (incl. iPhone HEIC photos and .mov/quicktime
    // videos — the most common formats for our mostly-mobile audience) plus
    // PDFs. The narrow exact allow-list used to 400 every iPhone photo/video.
    // Empty type (some browsers omit it) passes through to storage to sniff.
    const type = (file.type || '').toLowerCase()
    const isAllowed = type === '' || type.startsWith('image/') || type.startsWith('video/') || type === 'application/pdf'
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'That file type isn’t supported. Upload an image, a video, or a PDF.' },
        { status: 400 }
      )
    }

    // Size cap — checked before buffering. Videos get more headroom (a short
    // phone clip is tens of MB); images/PDFs stay tighter.
    const isVideo = type.startsWith('video/')
    const maxSize = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `That file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is ${isVideo ? '100MB for video' : '15MB'}.` },
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
  // NOTE: do NOT send upload_preset here. This is a SIGNED upload (api_key +
  // signature + timestamp). 'ml_default' is Cloudinary's *unsigned* preset;
  // including it makes Cloudinary expect it inside the signature, but the
  // signature below only covers folder+timestamp → "Invalid Signature".
  // Signed uploads don't need a preset, so we omit it entirely.

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
    throw new Error(`Cloudinary upload failed (${response.status}): ${error.slice(0, 300)}`)
  }

  const data = await response.json()

  // iPhone HEIC/HEIF can be *uploaded* to Cloudinary, but the raw asset is
  // undecodable downstream: browsers can't render it, and the Replicate
  // image-to-video models (PIL-based) throw "cannot identify image file
  // …heic". Deliver a transcoded JPEG instead by injecting an f_jpg
  // transformation into the delivery URL (Cloudinary transcodes + caches it).
  // Only touch HEIC/HEIF — other formats keep their original (and any alpha).
  let url: string = data.secure_url
  let format: string = data.format
  const rawFmt = (data.format || '').toLowerCase()
  const isHeic = rawFmt === 'heic' || rawFmt === 'heif'
  if (data.resource_type === 'image' && isHeic && url.includes('/image/upload/')) {
    url = url.replace('/image/upload/', '/image/upload/f_jpg,q_auto/').replace(/\.(heic|heif)$/i, '.jpg')
    format = 'jpg'
  }

  return {
    id: data.public_id,
    url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format,
    size: data.bytes,
  }
}

// Handle DELETE for removing uploaded files
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Require authentication to delete files
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

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
