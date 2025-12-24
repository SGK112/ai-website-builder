import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Vertex AI endpoints
const VERTEX_AI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta'

interface VertexRequest {
  action: 'generate' | 'chat' | 'embed' | 'code' | 'image-describe'
  prompt?: string
  messages?: { role: 'user' | 'model'; content: string }[]
  model?: string
  imageUrl?: string
  maxTokens?: number
  temperature?: number
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value

    // Try to use user's Google token, or fall back to API key
    const googleApiKey = process.env.GOOGLE_AI_API_KEY

    if (!accessToken && !googleApiKey) {
      return NextResponse.json(
        { error: 'Not authenticated with Google. Please sign in or configure GOOGLE_AI_API_KEY.' },
        { status: 401 }
      )
    }

    const body: VertexRequest = await request.json()
    const { action, prompt, messages, model = 'gemini-pro', imageUrl, maxTokens = 2048, temperature = 0.7 } = body

    let endpoint: string
    let requestBody: Record<string, unknown>

    switch (action) {
      case 'generate':
        endpoint = `${VERTEX_AI_ENDPOINT}/models/${model}:generateContent`
        requestBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }
        break

      case 'chat':
        endpoint = `${VERTEX_AI_ENDPOINT}/models/${model}:generateContent`
        requestBody = {
          contents: messages?.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }
        break

      case 'code':
        endpoint = `${VERTEX_AI_ENDPOINT}/models/gemini-pro:generateContent`
        requestBody = {
          contents: [{
            parts: [{
              text: `You are an expert web developer. Generate clean, modern code using React, TypeScript, and Tailwind CSS.

${prompt}

Respond with only the code, no explanations.`
            }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3, // Lower temperature for code
          },
        }
        break

      case 'image-describe':
        if (!imageUrl) {
          return NextResponse.json({ error: 'imageUrl required for image-describe' }, { status: 400 })
        }
        endpoint = `${VERTEX_AI_ENDPOINT}/models/gemini-pro-vision:generateContent`

        // Fetch image and convert to base64
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

        requestBody = {
          contents: [{
            parts: [
              { text: prompt || 'Describe this image in detail.' },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }
        break

      case 'embed':
        endpoint = `${VERTEX_AI_ENDPOINT}/models/embedding-001:embedContent`
        requestBody = {
          content: { parts: [{ text: prompt }] },
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Add API key to URL or use OAuth
    const url = new URL(endpoint)
    if (googleApiKey) {
      url.searchParams.set('key', googleApiKey)
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // If using OAuth token instead of API key
    if (accessToken && !googleApiKey) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI error:', errorText)
      return NextResponse.json(
        { error: 'Vertex AI request failed', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()

    // Extract the text content from the response
    if (action === 'embed') {
      return NextResponse.json({
        success: true,
        embedding: result.embedding?.values,
      })
    }

    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return NextResponse.json({
      success: true,
      content: textContent,
      usage: result.usageMetadata,
    })
  } catch (error) {
    console.error('Vertex AI error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper endpoint to check Google auth status
export async function GET() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get('google_access_token')?.value
  const userCookie = cookieStore.get('google_user')?.value

  if (!accessToken) {
    return NextResponse.json({
      authenticated: false,
      hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    })
  }

  try {
    const user = userCookie ? JSON.parse(userCookie) : null
    return NextResponse.json({
      authenticated: true,
      user,
      hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    })
  } catch {
    return NextResponse.json({
      authenticated: false,
      hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    })
  }
}
