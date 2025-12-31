import { NextRequest, NextResponse } from 'next/server'

// Cloudinary config - Free tier: 25GB storage, 25GB bandwidth
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check if Cloudinary is configured
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      // Return a mock response for development
      const mockUrl = `https://picsum.photos/seed/${Date.now()}/800/600`

      return NextResponse.json({
        secure_url: mockUrl,
        public_id: `dev-${Date.now()}`,
        resource_type: file.type.startsWith('video/') ? 'video' : 'image',
        message: 'Cloudinary not configured - using placeholder',
      })
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    const timestamp = Math.round(Date.now() / 1000)
    const signature = await generateSignature(timestamp)

    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', dataURI)
    cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY)
    cloudinaryFormData.append('timestamp', timestamp.toString())
    cloudinaryFormData.append('signature', signature)
    cloudinaryFormData.append('folder', 'webstew')

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image'

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cloudinary upload failed: ${error}`)
    }

    const data = await response.json()

    return NextResponse.json({
      secure_url: data.secure_url,
      public_id: data.public_id,
      resource_type: data.resource_type,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Generate Cloudinary signature
async function generateSignature(timestamp: number): Promise<string> {
  const crypto = await import('crypto')
  const toSign = `folder=webstew&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
  return crypto.createHash('sha1').update(toSign).digest('hex')
}
