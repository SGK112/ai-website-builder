import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY

// Helper to fetch from Pixabay and transform to Pexels format
async function fetchPixabayFallback(query: string, perPage: string) {
  if (!PIXABAY_API_KEY) {
    // Ultimate fallback to picsum.photos
    const photos = Array.from({ length: parseInt(perPage) }, (_, i) => ({
      id: Date.now() + i,
      src: {
        large: `https://picsum.photos/seed/${query}${i}/1200/800`,
        medium: `https://picsum.photos/seed/${query}${i}/800/600`,
        small: `https://picsum.photos/seed/${query}${i}/400/300`,
      },
      photographer: 'Picsum',
      alt: query,
    }))
    return { photos, fallback: 'picsum' }
  }

  const pixabayResponse = await fetch(
    `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo&orientation=horizontal`
  )

  if (!pixabayResponse.ok) {
    throw new Error('Pixabay API error')
  }

  const pixabayData = await pixabayResponse.json()

  // Transform Pixabay format to Pexels format
  const photos = pixabayData.hits.map((hit: { id: number; largeImageURL: string; webformatURL: string; previewURL: string; user: string; tags: string }) => ({
    id: hit.id,
    src: {
      large: hit.largeImageURL,
      medium: hit.webformatURL,
      small: hit.previewURL,
    },
    photographer: hit.user,
    alt: hit.tags,
  }))

  return { photos, fallback: 'pixabay', total: pixabayData.totalHits }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'business'
  const perPage = searchParams.get('per_page') || '10'
  const orientation = searchParams.get('orientation') || 'landscape'

  // If no Pexels key, use Pixabay fallback
  if (!PEXELS_API_KEY) {
    try {
      const fallbackData = await fetchPixabayFallback(query, perPage)
      return NextResponse.json(fallbackData)
    } catch (error) {
      console.error('Pixabay fallback error:', error)
      // Ultimate fallback to picsum
      const photos = Array.from({ length: parseInt(perPage) }, (_, i) => ({
        id: Date.now() + i,
        src: {
          large: `https://picsum.photos/seed/${query}${i}/1200/800`,
          medium: `https://picsum.photos/seed/${query}${i}/800/600`,
        },
        photographer: 'Picsum',
        alt: query,
      }))
      return NextResponse.json({ photos, fallback: 'picsum' })
    }
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
    // Fallback to Pixabay
    try {
      const fallbackData = await fetchPixabayFallback(query, perPage)
      return NextResponse.json(fallbackData)
    } catch {
      // Ultimate fallback to picsum
      const photos = Array.from({ length: parseInt(perPage) }, (_, i) => ({
        id: Date.now() + i,
        src: {
          large: `https://picsum.photos/seed/${query}${i}/1200/800`,
          medium: `https://picsum.photos/seed/${query}${i}/800/600`,
        },
        photographer: 'Picsum',
        alt: query,
      }))
      return NextResponse.json({ photos, fallback: 'picsum' })
    }
  }
}
