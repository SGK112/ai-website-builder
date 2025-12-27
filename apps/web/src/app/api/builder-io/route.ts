import { NextRequest, NextResponse } from 'next/server'

const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY

// Proxy to Builder.io Content API
// This allows server-side fetching with caching

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const model = searchParams.get('model') || 'page'
  const urlPath = searchParams.get('urlPath')
  const entryId = searchParams.get('id')
  const limit = searchParams.get('limit') || '20'
  const offset = searchParams.get('offset') || '0'

  if (!BUILDER_API_KEY) {
    return NextResponse.json(
      {
        error: 'Builder.io not configured',
        message: 'Add NEXT_PUBLIC_BUILDER_API_KEY to your environment variables',
        docs: 'https://www.builder.io/c/docs/using-your-api-key',
      },
      { status: 503 }
    )
  }

  try {
    // Build the Builder.io API URL
    let apiUrl = `https://cdn.builder.io/api/v3/content/${model}?apiKey=${BUILDER_API_KEY}`

    if (urlPath) {
      apiUrl += `&userAttributes.urlPath=${encodeURIComponent(urlPath)}`
    }

    if (entryId) {
      apiUrl += `&query.id=${entryId}`
    }

    apiUrl += `&limit=${limit}&offset=${offset}`
    apiUrl += `&cachebust=true`

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 60, // Cache for 60 seconds
      },
    })

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      results: data.results || [],
      model,
    })
  } catch (error: any) {
    console.error('Builder.io API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Builder.io content' },
      { status: 500 }
    )
  }
}

// Check Builder.io configuration status
export async function HEAD() {
  if (!BUILDER_API_KEY) {
    return new NextResponse(null, { status: 503 })
  }

  try {
    // Verify API key is valid
    const response = await fetch(
      `https://cdn.builder.io/api/v3/content/page?apiKey=${BUILDER_API_KEY}&limit=1`,
      { method: 'HEAD' }
    )

    if (response.ok) {
      return new NextResponse(null, {
        status: 200,
        headers: { 'X-Builder-Configured': 'true' },
      })
    }

    return new NextResponse(null, { status: 401 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
