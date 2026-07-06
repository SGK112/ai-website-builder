import { NextRequest, NextResponse } from 'next/server'

// Cloudinary config - Free tier: 25GB storage, 25GB bandwidth
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export async function POST(req: NextRequest) {
  try {
    // Fail loudly if storage isn't configured. Previously this returned a
    // random picsum.photos URL as a 200 "success" — silently replacing the
    // user's asset with an unrelated stock photo that looked like it worked.
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Image hosting is not configured on this instance (Cloudinary missing).' },
        { status: 503 }
      )
    }

    // Accept EITHER a multipart file upload OR a JSON { sourceUrl } to re-host
    // an existing image URL. The MCP bridge upload_image tool (the chef's "use
    // this image" over the local bridge) posts { sourceUrl } — it used to hit
    // the file-only path and always 400 with "No file provided".
    const contentType = req.headers.get('content-type') || ''
    let buffer: Buffer
    let mimeType: string

    if (contentType.includes('application/json')) {
      const body = (await req.json().catch(() => ({}))) as { sourceUrl?: string }
      if (!body.sourceUrl) {
        return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 })
      }
      const srcRes = await fetch(body.sourceUrl)
      if (!srcRes.ok) {
        return NextResponse.json(
          { error: `Could not fetch sourceUrl (HTTP ${srcRes.status})` },
          { status: 400 }
        )
      }
      buffer = Buffer.from(await srcRes.arrayBuffer())
      mimeType = srcRes.headers.get('content-type') || 'image/jpeg'
    } else {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      buffer = Buffer.from(await file.arrayBuffer())
      mimeType = file.type || 'image/jpeg'
    }

    // Upload to Cloudinary
    const base64 = buffer.toString('base64')
    const dataURI = `data:${mimeType};base64,${base64}`

    const timestamp = Math.round(Date.now() / 1000)
    const signature = await generateSignature(timestamp)

    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', dataURI)
    cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY)
    cloudinaryFormData.append('timestamp', timestamp.toString())
    cloudinaryFormData.append('signature', signature)
    cloudinaryFormData.append('folder', 'webstew')

    const resourceType = mimeType.startsWith('video/') ? 'video' : 'image'

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
      // `url` is the canonical field (the MCP proxy reads out.url); keep
      // secure_url for any legacy caller.
      url: data.secure_url,
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
