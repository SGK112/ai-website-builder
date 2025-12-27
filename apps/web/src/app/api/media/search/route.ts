import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/mongodb'
import { decrypt } from '@/lib/encryption'

interface MediaItem {
  id: string
  url: string
  thumbnail: string
  title: string
  source: string
  width?: number
  height?: number
  author?: string
  authorUrl?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'all'
    const query = searchParams.get('q') || searchParams.get('query') || 'business'
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    const orientation = searchParams.get('orientation') || 'landscape'

    // Try to get user's API keys if authenticated
    let userIntegrations: any = null
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const client = await getClient()
      const db = client.db()
      userIntegrations = await db.collection('user_integrations').findOne({
        email: session.user.email,
      })
    }

    let results: MediaItem[] = []

    // Search all sources in parallel
    if (source === 'all') {
      const promises = await Promise.allSettled([
        searchUnsplash(query, page, perPage, userIntegrations?.unsplash),
        searchPexels(query, page, perPage, userIntegrations?.pexels),
        searchPixabay(query, page, perPage, userIntegrations?.pixabay),
      ])

      for (const result of promises) {
        if (result.status === 'fulfilled') {
          results.push(...result.value)
        }
      }

      // Shuffle and limit results
      results.sort(() => Math.random() - 0.5)
      results = results.slice(0, perPage * 3)
    } else {
      switch (source) {
        case 'unsplash':
          results = await searchUnsplash(query, page, perPage, userIntegrations?.unsplash)
          break
        case 'pexels':
          results = await searchPexels(query, page, perPage, userIntegrations?.pexels)
          break
        case 'pixabay':
          results = await searchPixabay(query, page, perPage, userIntegrations?.pixabay)
          break
        case 'canva':
          if (!session?.user?.email) {
            return NextResponse.json({ error: 'Canva requires authentication' }, { status: 401 })
          }
          results = await searchCanva(query, userIntegrations)
          break
        default:
          return NextResponse.json({ error: 'Unknown source' }, { status: 400 })
      }
    }

    // Report available sources
    const sources = {
      unsplash: !!process.env.UNSPLASH_ACCESS_KEY || !!userIntegrations?.unsplash,
      pexels: !!process.env.PEXELS_API_KEY || !!userIntegrations?.pexels,
      pixabay: !!process.env.PIXABAY_API_KEY || !!userIntegrations?.pixabay,
      canva: !!userIntegrations?.canva_access_token,
    }

    return NextResponse.json({ results, sources, source, query, page })
  } catch (error) {
    console.error('Media search failed:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

async function searchUnsplash(
  query: string,
  page: number,
  perPage: number,
  encryptedKey?: string
): Promise<MediaItem[]> {
  // Use user's key or fall back to env key
  const apiKey = encryptedKey ? decrypt(encryptedKey) : process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) return []

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.results.map((photo: any) => ({
      id: `unsplash-${photo.id}`,
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      title: photo.alt_description || photo.description || 'Unsplash Photo',
      source: 'unsplash',
      width: photo.width,
      height: photo.height,
      author: photo.user.name,
      authorUrl: photo.user.links.html,
    }))
  } catch (error) {
    console.error('Unsplash search error:', error)
    return []
  }
}

async function searchPexels(
  query: string,
  page: number,
  perPage: number,
  encryptedKey?: string
): Promise<MediaItem[]> {
  const apiKey = encryptedKey ? decrypt(encryptedKey) : process.env.PEXELS_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.photos.map((photo: any) => ({
      id: `pexels-${photo.id}`,
      url: photo.src.large,
      thumbnail: photo.src.medium,
      title: photo.alt || 'Pexels Photo',
      source: 'pexels',
      width: photo.width,
      height: photo.height,
      author: photo.photographer,
      authorUrl: photo.photographer_url,
    }))
  } catch (error) {
    console.error('Pexels search error:', error)
    return []
  }
}

async function searchPixabay(
  query: string,
  page: number,
  perPage: number,
  encryptedKey?: string
): Promise<MediaItem[]> {
  const apiKey = encryptedKey ? decrypt(encryptedKey) : process.env.PIXABAY_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&image_type=photo`
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.hits.map((photo: any) => ({
      id: `pixabay-${photo.id}`,
      url: photo.largeImageURL,
      thumbnail: photo.webformatURL,
      title: photo.tags || 'Pixabay Photo',
      source: 'pixabay',
      width: photo.imageWidth,
      height: photo.imageHeight,
      author: photo.user,
      authorUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
    }))
  } catch (error) {
    console.error('Pixabay search error:', error)
    return []
  }
}

async function searchCanva(
  query: string,
  userIntegrations: any
): Promise<MediaItem[]> {
  // Canva requires OAuth - this would need the user to be authenticated with Canva
  // For now, return empty array. Full implementation requires OAuth flow.
  if (!userIntegrations?.canva_client_id || !userIntegrations?.canva_access_token) {
    return []
  }

  try {
    const accessToken = decrypt(userIntegrations.canva_access_token)
    const response = await fetch(
      `https://api.canva.com/rest/v1/designs?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.items?.map((design: any) => ({
      id: `canva-${design.id}`,
      url: design.thumbnail?.url || design.url,
      thumbnail: design.thumbnail?.url || design.url,
      title: design.title || 'Canva Design',
      source: 'canva',
    })) || []
  } catch (error) {
    console.error('Canva search error:', error)
    return []
  }
}
