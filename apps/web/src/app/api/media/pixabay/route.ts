import { NextRequest, NextResponse } from 'next/server'

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY

interface PixabayImage {
  id: number
  webformatURL: string
  largeImageURL: string
  previewURL: string
  tags: string
  user: string
  userImageURL: string
  imageWidth: number
  imageHeight: number
}

export async function GET(request: NextRequest) {
  try {
    if (!PIXABAY_API_KEY) {
      return NextResponse.json({ error: 'Pixabay API not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || 'business'
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '20'
    const imageType = searchParams.get('image_type') || 'photo'
    const orientation = searchParams.get('orientation') || 'horizontal'

    const url = new URL('https://pixabay.com/api/')
    url.searchParams.set('key', PIXABAY_API_KEY)
    url.searchParams.set('q', query)
    url.searchParams.set('page', page)
    url.searchParams.set('per_page', perPage)
    url.searchParams.set('image_type', imageType)
    url.searchParams.set('orientation', orientation)
    url.searchParams.set('safesearch', 'true')
    url.searchParams.set('editors_choice', 'true') // High quality images

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error('Pixabay API error')
    }

    const data = await response.json()

    // Transform to our standard format
    const images = data.hits.map((img: PixabayImage) => ({
      id: `pixabay-${img.id}`,
      url: img.largeImageURL,
      thumbnail: img.webformatURL,
      preview: img.previewURL,
      width: img.imageWidth,
      height: img.imageHeight,
      tags: img.tags.split(', '),
      author: img.user,
      authorImage: img.userImageURL,
      source: 'pixabay',
    }))

    return NextResponse.json({
      images,
      total: data.totalHits,
      page: parseInt(page),
      perPage: parseInt(perPage),
    })
  } catch (error) {
    console.error('Pixabay search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
