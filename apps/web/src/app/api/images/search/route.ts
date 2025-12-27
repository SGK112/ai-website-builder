import { NextRequest, NextResponse } from 'next/server'

// Free Image APIs
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY

export interface ImageResult {
  id: string
  source: 'unsplash' | 'pexels' | 'pixabay'
  url: string // Full size
  thumbnail: string // Preview
  width: number
  height: number
  alt: string
  photographer: string
  photographerUrl: string
  downloadUrl: string
  color?: string
}

// Search all image sources
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'business'
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '20')
  const source = searchParams.get('source') || 'all' // 'unsplash', 'pexels', 'pixabay', 'all'

  try {
    const results: ImageResult[] = []
    const promises: Promise<ImageResult[]>[] = []

    // Fetch from enabled sources
    if ((source === 'all' || source === 'unsplash') && UNSPLASH_ACCESS_KEY) {
      promises.push(searchUnsplash(query, page, perPage))
    }
    if ((source === 'all' || source === 'pexels') && PEXELS_API_KEY) {
      promises.push(searchPexels(query, page, perPage))
    }
    if ((source === 'all' || source === 'pixabay') && PIXABAY_API_KEY) {
      promises.push(searchPixabay(query, page, perPage))
    }

    // If no API keys configured, return curated defaults
    if (promises.length === 0) {
      return NextResponse.json({
        success: true,
        images: getDefaultImages(query),
        source: 'default',
        message: 'Configure API keys for more images',
      })
    }

    const allResults = await Promise.allSettled(promises)

    for (const result of allResults) {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      }
    }

    // Shuffle results to mix sources
    const shuffled = results.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      images: shuffled,
      total: shuffled.length,
      page,
      query,
    })
  } catch (error) {
    console.error('Image search error:', error)
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    )
  }
}

// Unsplash API
async function searchUnsplash(query: string, page: number, perPage: number): Promise<ImageResult[]> {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    }
  )

  if (!response.ok) return []

  const data = await response.json()

  return data.results.map((img: any) => ({
    id: `unsplash-${img.id}`,
    source: 'unsplash',
    url: img.urls.regular,
    thumbnail: img.urls.small,
    width: img.width,
    height: img.height,
    alt: img.alt_description || img.description || query,
    photographer: img.user.name,
    photographerUrl: img.user.links.html,
    downloadUrl: img.urls.full,
    color: img.color,
  }))
}

// Pexels API
async function searchPexels(query: string, page: number, perPage: number): Promise<ImageResult[]> {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': PEXELS_API_KEY!,
      },
    }
  )

  if (!response.ok) return []

  const data = await response.json()

  return data.photos.map((img: any) => ({
    id: `pexels-${img.id}`,
    source: 'pexels',
    url: img.src.large,
    thumbnail: img.src.medium,
    width: img.width,
    height: img.height,
    alt: img.alt || query,
    photographer: img.photographer,
    photographerUrl: img.photographer_url,
    downloadUrl: img.src.original,
    color: img.avg_color,
  }))
}

// Pixabay API
async function searchPixabay(query: string, page: number, perPage: number): Promise<ImageResult[]> {
  const response = await fetch(
    `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&image_type=photo`
  )

  if (!response.ok) return []

  const data = await response.json()

  return data.hits.map((img: any) => ({
    id: `pixabay-${img.id}`,
    source: 'pixabay',
    url: img.largeImageURL,
    thumbnail: img.webformatURL,
    width: img.imageWidth,
    height: img.imageHeight,
    alt: img.tags,
    photographer: img.user,
    photographerUrl: `https://pixabay.com/users/${img.user}-${img.user_id}/`,
    downloadUrl: img.largeImageURL,
  }))
}

// Default curated images when no API keys
function getDefaultImages(query: string): ImageResult[] {
  const categories: Record<string, string[]> = {
    business: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
    ],
    technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    ],
    office: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800',
    ],
    team: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    ],
    nature: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1518173946687-a4c036bc9c14?w=800',
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800',
    ],
    food: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800',
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800',
    ],
    abstract: [
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800',
      'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800',
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
    ],
  }

  // Find matching category or use business as default
  const lowerQuery = query.toLowerCase()
  let images = categories.business

  for (const [cat, urls] of Object.entries(categories)) {
    if (lowerQuery.includes(cat)) {
      images = urls
      break
    }
  }

  return images.map((url, i) => ({
    id: `default-${i}`,
    source: 'unsplash' as const,
    url,
    thumbnail: url.replace('w=800', 'w=400'),
    width: 800,
    height: 600,
    alt: query,
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
    downloadUrl: url.replace('w=800', 'w=1920'),
  }))
}
