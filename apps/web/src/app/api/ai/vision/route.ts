import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
  }
  return openaiClient
}

// Analyze images for website building
export async function POST(request: NextRequest) {
  // SECURITY: Require authentication for expensive API calls
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Rate limit: 20 AI generations per minute
  try {
    await checkApiRateLimit(request, 'aiGeneration')
  } catch (error) {
    const rateLimitResponse = handleRateLimitError(error)
    if (rateLimitResponse) return rateLimitResponse
    throw error
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: 'AI vision is not available on this instance — OPENAI_API_KEY is not configured.',
      feature: 'vision',
      reason: 'openai_unconfigured',
    }, { status: 503 })
  }

  try {
    const { imageBase64, imageUrl, prompt } = await request.json()

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 })
    }

    // Build the image content
    const imageContent = imageUrl
      ? { type: 'image_url' as const, image_url: { url: imageUrl } }
      : { type: 'image_url' as const, image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a web design expert. Analyze images and describe them for website building.

When analyzing a website screenshot or design mockup:
- Describe the layout structure (header, hero, sections, footer)
- Note the color scheme and typography
- List key UI components (buttons, cards, forms, etc)
- Describe any imagery, icons, or graphics
- Note the overall style (modern, minimal, corporate, playful, etc)

Be concise but thorough. Your description will be used to recreate this design.`
        },
        {
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: prompt || 'Analyze this image for website building. Describe the design, layout, colors, and components in detail so I can recreate it.' }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const analysis = response.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('Vision API error:', error)
    return NextResponse.json(
      { error: error.message || 'Image analysis failed' },
      { status: 500 }
    )
  }
}
