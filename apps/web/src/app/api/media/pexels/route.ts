import { NextRequest, NextResponse } from 'next/server'

const PEXELS_API_KEY = process.env.PEXELS_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'business'
  const perPage = searchParams.get('per_page') || '10'
  const orientation = searchParams.get('orientation') || 'landscape'

  if (!PEXELS_API_KEY) {
    // Fallback to Unsplash if no Pexels key
    const unsplashUrl = `https://source.unsplash.com/1200x800/?${encodeURIComponent(query)}`
    return NextResponse.json({
      photos: [{ src: { large: unsplashUrl, medium: unsplashUrl } }],
      fallback: 'unsplash'
    })
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Pexels API error')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Pexels error:', error)
    // Fallback to Unsplash
    const unsplashUrl = `https://source.unsplash.com/1200x800/?${encodeURIComponent(query)}`
    return NextResponse.json({
      photos: [{ src: { large: unsplashUrl, medium: unsplashUrl } }],
      fallback: 'unsplash'
    })
  }
}
