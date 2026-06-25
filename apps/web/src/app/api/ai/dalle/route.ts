import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { spendCredits } from '@/lib/credits'
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
      await checkApiRateLimit(request, 'aiGeneration')
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
      return NextResponse.json({
        error: 'DALL-E is not available on this instance — OPENAI_API_KEY is not configured.',
        feature: 'dalle',
        reason: 'openai_unconfigured',
      }, { status: 503 })
    }

    // Meter — DALL-E costs real money per image. Charge up front, refund on
    // failure. (Previously unmetered: free unlimited generation.)
    const charge = await spendCredits(session, 'image_generation')
    if (!charge.ok) {
      return NextResponse.json(
        { error: charge.error || 'Not enough credits.', requireCredits: charge.status === 402 },
        { status: charge.status || 402 },
      )
    }

    // Enhance prompt for better results
    const enhancedPrompt = `Professional high-quality photograph: ${prompt}. Photorealistic, sharp focus, excellent lighting, modern aesthetic.`

    let response
    try {
      response = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      style: style as 'vivid' | 'natural',
      })
    } catch (e) {
      await charge.refund()
      throw e
    }

    const imageData = response.data?.[0]
    const imageUrl = imageData?.url

    if (!imageUrl) {
      await charge.refund()
      return NextResponse.json({
        error: 'DALL-E returned no image. Try a different prompt or check the OpenAI status page.',
        feature: 'dalle',
        reason: 'empty_response',
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      revised_prompt: imageData?.revised_prompt,
    })
  } catch (error: any) {
    console.error('DALL-E error:', error)
    // OpenAI SDK throws errors with .status — pass it through so the client
    // can distinguish rate-limits (429), bad prompts (400), and outages (5xx).
    const status = typeof error?.status === 'number' ? error.status : 502
    return NextResponse.json({
      error: error?.message || 'Image generation failed',
      feature: 'dalle',
      reason: 'generation_failed',
    }, { status })
  }
}
