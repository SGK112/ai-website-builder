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

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication for expensive API calls
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit: 20 AI generations per minute
    try {
      checkApiRateLimit(request, 'aiGeneration')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const { prompt, size = '1792x1024', quality = 'standard', style = 'vivid' } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 503 })
    }

    // Enhance prompt for better results
    const enhancedPrompt = `Professional high-quality photograph: ${prompt}. Photorealistic, sharp focus, excellent lighting, modern aesthetic.`

    const response = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      style: style as 'vivid' | 'natural',
    })

    const imageData = response.data?.[0]
    const imageUrl = imageData?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      revised_prompt: imageData?.revised_prompt,
    })
  } catch (error: any) {
    console.error('DALL-E error:', error)
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    )
  }
}
