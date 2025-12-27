import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/mongodb'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Aspect ratio to DALL-E size mapping
const ASPECT_RATIO_SIZES: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
  '1:1': '1024x1024',
  'square': '1024x1024',
  '16:9': '1792x1024',
  'landscape': '1792x1024',
  '9:16': '1024x1792',
  'portrait': '1024x1792',
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const {
      prompt,
      style = 'photorealistic',
      aspectRatio = 'landscape',
      saveToLibrary = false,
      quality = 'standard',
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Image generation not configured' }, { status: 503 })
    }

    // Build enhanced prompt based on style
    let enhancedPrompt = prompt
    switch (style) {
      case 'photorealistic':
        enhancedPrompt = `Professional high-quality photograph: ${prompt}. Photorealistic, sharp focus, excellent lighting, modern aesthetic, clean composition.`
        break
      case 'illustration':
        enhancedPrompt = `Modern digital illustration: ${prompt}. Clean vector style, vibrant colors, professional design, flat design elements.`
        break
      case 'artistic':
        enhancedPrompt = `Artistic digital artwork: ${prompt}. Creative composition, stylized, visually striking, high quality art.`
        break
      case 'minimal':
        enhancedPrompt = `Minimalist photography: ${prompt}. Clean, simple, lots of negative space, modern aesthetic.`
        break
      default:
        enhancedPrompt = `Professional image: ${prompt}. High quality, modern aesthetic.`
    }

    const size = ASPECT_RATIO_SIZES[aspectRatio] || '1792x1024'

    // Generate with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size,
      quality: quality === 'high' ? 'hd' : 'standard',
      style: style === 'artistic' ? 'vivid' : 'natural',
    })

    const imageData = response.data?.[0]
    const imageUrl = imageData?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    }

    // Optionally save to user's library
    let savedId: string | null = null
    if (saveToLibrary && session?.user?.email) {
      try {
        const client = await getClient()
        const db = client.db()

        const uploadDoc = {
          email: session.user.email,
          filename: `ai-generated-${Date.now()}.png`,
          url: imageUrl,
          thumbnail: imageUrl,
          type: 'image/png',
          source: 'ai-generated',
          prompt,
          style,
          createdAt: new Date(),
        }

        const result = await db.collection('user_uploads').insertOne(uploadDoc)
        savedId = result.insertedId.toString()
      } catch (saveError) {
        console.error('Failed to save to library:', saveError)
        // Continue anyway - the image was still generated
      }
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      revisedPrompt: imageData?.revised_prompt,
      savedId,
      size,
      style,
    })
  } catch (error: any) {
    console.error('Image generation error:', error)

    // Handle specific OpenAI errors
    if (error.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'Content policy violation. Please modify your prompt.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    )
  }
}

// GET - Check if generation is available
export async function GET() {
  const available = !!process.env.OPENAI_API_KEY

  return NextResponse.json({
    available,
    model: 'dall-e-3',
    supportedStyles: ['photorealistic', 'illustration', 'artistic', 'minimal'],
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
  })
}
