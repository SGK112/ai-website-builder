// Image Service - Stock photo integration for better site generation

export interface ImageResult {
  id: string
  url: string
  thumbnail: string
  alt: string
  credit: string
  creditUrl: string
  source: 'unsplash' | 'pexels' | 'pixabay' | 'placeholder'
}

export interface ImageSearchOptions {
  query: string
  count?: number
  orientation?: 'landscape' | 'portrait' | 'squarish'
  size?: 'small' | 'medium' | 'large'
}

// Unsplash Source URLs (no API key needed for basic usage)
export function getUnsplashImage(query: string, width = 800, height = 600): string {
  const encodedQuery = encodeURIComponent(query)
  return `https://source.unsplash.com/${width}x${height}/?${encodedQuery}`
}

// Picsum (Lorem Picsum) for random quality images
export function getPicsumImage(width = 800, height = 600, seed?: string): string {
  const base = 'https://picsum.photos'
  if (seed) {
    return `${base}/seed/${seed}/${width}/${height}`
  }
  return `${base}/${width}/${height}`
}

// Placeholder.com for colored placeholders
export function getPlaceholder(width = 800, height = 600, text?: string, bg = '1a1a1a', fg = '666'): string {
  const url = `https://via.placeholder.com/${width}x${height}/${bg}/${fg}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}

// Category-based image suggestions
export const imageCategories: Record<string, string[]> = {
  hero: ['workspace', 'technology', 'abstract', 'modern office', 'team collaboration'],
  business: ['office', 'meeting', 'handshake', 'corporate', 'professional'],
  technology: ['code', 'laptop', 'circuit', 'digital', 'server'],
  nature: ['landscape', 'forest', 'ocean', 'mountain', 'sunset'],
  food: ['restaurant', 'cooking', 'ingredients', 'cuisine', 'healthy'],
  fitness: ['gym', 'workout', 'running', 'yoga', 'sports'],
  travel: ['city', 'adventure', 'vacation', 'destination', 'explore'],
  creative: ['art', 'design', 'studio', 'creative', 'workspace'],
  people: ['portrait', 'team', 'diversity', 'lifestyle', 'community'],
  product: ['minimal', 'showcase', 'elegant', 'mockup', 'display'],
}

// Generate contextual images based on business type
export function getContextualImages(businessType: string, count = 5): ImageResult[] {
  const queries = imageCategories[businessType.toLowerCase()] || imageCategories.business

  return queries.slice(0, count).map((query, i) => ({
    id: `${businessType}-${i}`,
    url: getUnsplashImage(query, 1200, 800),
    thumbnail: getUnsplashImage(query, 400, 300),
    alt: `${query} image`,
    credit: 'Unsplash',
    creditUrl: 'https://unsplash.com',
    source: 'unsplash' as const,
  }))
}

// Avatar placeholder (for testimonials, team sections)
export function getAvatar(seed: number | string, size = 48): string {
  return `https://i.pravatar.cc/${size}?img=${seed}`
}

// Company logo placeholder
export function getLogoPlaceholder(name: string, size = 120): string {
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=8b5cf6&color=fff&bold=true`
}

// Smart image replacement in HTML
export function enhanceImagesInHtml(html: string, context?: string): string {
  let enhanced = html

  // Replace generic placeholder images with contextual ones
  enhanced = enhanced.replace(
    /src=["']https:\/\/via\.placeholder\.com\/(\d+)x(\d+)[^"']*["']/g,
    (_, w, h) => {
      const query = context || 'modern business'
      return `src="${getUnsplashImage(query, parseInt(w), parseInt(h))}"`
    }
  )

  // Replace picsum with more specific images if context is provided
  if (context) {
    enhanced = enhanced.replace(
      /src=["']https:\/\/picsum\.photos\/seed\/[^\/]+\/(\d+)\/(\d+)["']/g,
      (_, w, h) => `src="${getUnsplashImage(context, parseInt(w), parseInt(h))}"`
    )
  }

  return enhanced
}

// Image size presets for different use cases
export const imageSizes = {
  hero: { width: 1920, height: 1080 },
  feature: { width: 800, height: 600 },
  thumbnail: { width: 400, height: 300 },
  avatar: { width: 100, height: 100 },
  logo: { width: 200, height: 60 },
  card: { width: 600, height: 400 },
  banner: { width: 1200, height: 400 },
}

// Generate image URL with proper sizing
export function getOptimizedImage(
  query: string,
  preset: keyof typeof imageSizes = 'feature'
): string {
  const { width, height } = imageSizes[preset]
  return getUnsplashImage(query, width, height)
}

// Pexels API integration (requires API key)
export async function searchPexels(
  query: string,
  apiKey: string,
  options: Partial<ImageSearchOptions> = {}
): Promise<ImageResult[]> {
  const { count = 5, orientation = 'landscape' } = options

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}`,
      {
        headers: { Authorization: apiKey },
      }
    )

    if (!response.ok) throw new Error('Pexels API error')

    const data = await response.json()

    return data.photos.map((photo: any) => ({
      id: photo.id.toString(),
      url: photo.src.large2x || photo.src.large,
      thumbnail: photo.src.medium,
      alt: photo.alt || query,
      credit: photo.photographer,
      creditUrl: photo.photographer_url,
      source: 'pexels' as const,
    }))
  } catch {
    // Fallback to Unsplash
    return getContextualImages(query, count)
  }
}

// Pixabay API integration (requires API key)
export async function searchPixabay(
  query: string,
  apiKey: string,
  options: Partial<ImageSearchOptions> = {}
): Promise<ImageResult[]> {
  const { count = 5, orientation = 'horizontal' } = options

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}&image_type=photo`
    )

    if (!response.ok) throw new Error('Pixabay API error')

    const data = await response.json()

    return data.hits.map((hit: any) => ({
      id: hit.id.toString(),
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags,
      credit: hit.user,
      creditUrl: `https://pixabay.com/users/${hit.user_id}`,
      source: 'pixabay' as const,
    }))
  } catch {
    // Fallback to Unsplash
    return getContextualImages(query, count)
  }
}

// Generate a complete image set for a website
export function generateImageSet(
  businessType: string,
  businessName: string
): {
  hero: string
  features: string[]
  testimonials: string[]
  logo: string
} {
  const category = imageCategories[businessType.toLowerCase()] ? businessType.toLowerCase() : 'business'
  const queries = imageCategories[category]

  return {
    hero: getOptimizedImage(queries[0], 'hero'),
    features: [
      getOptimizedImage(queries[1] || 'technology', 'feature'),
      getOptimizedImage(queries[2] || 'innovation', 'feature'),
      getOptimizedImage(queries[3] || 'solution', 'feature'),
    ],
    testimonials: [
      getAvatar(1),
      getAvatar(12),
      getAvatar(5),
    ],
    logo: getLogoPlaceholder(businessName),
  }
}

// Export all utilities
export const imageService = {
  getUnsplash: getUnsplashImage,
  getPicsum: getPicsumImage,
  getPlaceholder,
  getAvatar,
  getLogo: getLogoPlaceholder,
  getOptimized: getOptimizedImage,
  getContextual: getContextualImages,
  enhance: enhanceImagesInHtml,
  generateSet: generateImageSet,
  searchPexels,
  searchPixabay,
  categories: imageCategories,
  sizes: imageSizes,
}

export default imageService
