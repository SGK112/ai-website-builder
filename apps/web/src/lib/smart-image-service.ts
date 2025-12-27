// Smart Image Sourcing Service
// Uses Pixabay for stock photos with industry-specific searches
// Falls back to AI generation only when needed

import { ImageContext, generateImagePrompt } from './image-analyzer'
import { BusinessInfo } from './template-matcher'

interface SourcedImage {
  id: string
  url: string
  source: 'pixabay' | 'pexels' | 'unsplash' | 'dalle' | 'curated'
  width: number
  height: number
}

// Industry-specific search terms for high-quality, relevant images
const INDUSTRY_SEARCH_TERMS: Record<string, Record<string, string[]>> = {
  restaurant: {
    hero: ['restaurant interior elegant', 'fine dining ambiance', 'gourmet food table'],
    product: ['gourmet dish plated', 'food photography', 'chef cooking'],
    team: ['chef portrait', 'restaurant staff', 'waiter professional'],
    feature: ['fresh ingredients', 'kitchen professional', 'wine selection'],
    gallery: ['food plating', 'restaurant atmosphere', 'dining experience'],
    background: ['restaurant blur', 'food texture', 'kitchen abstract'],
  },
  mexican: {
    hero: ['mexican restaurant colorful', 'tacos authentic', 'mexican food spread'],
    product: ['tacos plated', 'mexican dish', 'enchiladas', 'guacamole fresh'],
    team: ['mexican chef', 'chef cooking', 'restaurant kitchen'],
    feature: ['mexican ingredients', 'chili peppers', 'mexican spices'],
    gallery: ['mexican food variety', 'tacos close up', 'burrito plate'],
    background: ['mexican pattern', 'colorful tiles', 'festive decor'],
  },
  saas: {
    hero: ['technology abstract', 'digital innovation', 'modern office tech'],
    product: ['laptop dashboard', 'software interface', 'app mockup'],
    team: ['tech professional', 'developer portrait', 'startup team'],
    feature: ['data visualization', 'cloud computing', 'digital network'],
    gallery: ['office modern', 'team collaboration', 'tech workspace'],
    background: ['abstract technology', 'digital gradient', 'code blur'],
  },
  ecommerce: {
    hero: ['shopping lifestyle', 'fashion store', 'retail modern'],
    product: ['product photography white', 'fashion item', 'luxury product'],
    team: ['retail professional', 'fashion model', 'store manager'],
    feature: ['shopping bags', 'delivery package', 'credit card payment'],
    gallery: ['product flat lay', 'fashion collection', 'store display'],
    background: ['minimal texture', 'fabric texture', 'marble surface'],
  },
  portfolio: {
    hero: ['creative workspace', 'designer desk', 'artistic studio'],
    product: ['design mockup', 'creative project', 'portfolio piece'],
    team: ['creative professional', 'designer portrait', 'artist at work'],
    feature: ['design tools', 'creative process', 'sketching'],
    gallery: ['art photography', 'creative work', 'design showcase'],
    background: ['minimal abstract', 'creative texture', 'paper texture'],
  },
  fitness: {
    hero: ['gym modern', 'fitness training', 'workout intense'],
    product: ['fitness equipment', 'gym weights', 'yoga mat'],
    team: ['personal trainer', 'fitness instructor', 'athlete portrait'],
    feature: ['exercise class', 'healthy lifestyle', 'running outdoor'],
    gallery: ['gym interior', 'workout session', 'fitness results'],
    background: ['gym blur', 'exercise abstract', 'energy motion'],
  },
  realestate: {
    hero: ['luxury home exterior', 'modern architecture', 'real estate aerial'],
    product: ['house beautiful', 'apartment interior', 'property listing'],
    team: ['real estate agent', 'business professional', 'realtor portrait'],
    feature: ['home interior', 'kitchen modern', 'living room elegant'],
    gallery: ['property photos', 'home staging', 'architecture detail'],
    background: ['home blur', 'interior abstract', 'architecture pattern'],
  },
  medical: {
    hero: ['medical clinic modern', 'healthcare professional', 'hospital clean'],
    product: ['medical equipment', 'healthcare service', 'medicine'],
    team: ['doctor portrait', 'nurse professional', 'medical team'],
    feature: ['medical care', 'health checkup', 'patient care'],
    gallery: ['clinic interior', 'medical facility', 'healthcare'],
    background: ['medical abstract', 'health blue', 'clean minimal'],
  },
  agency: {
    hero: ['creative agency', 'marketing team', 'modern office'],
    product: ['campaign creative', 'brand design', 'marketing materials'],
    team: ['creative director', 'marketing professional', 'agency team'],
    feature: ['brainstorming', 'strategy meeting', 'creative process'],
    gallery: ['agency work', 'campaign results', 'client projects'],
    background: ['office blur', 'creative abstract', 'brand colors'],
  },
  default: {
    hero: ['business professional', 'modern office', 'corporate team'],
    product: ['professional service', 'business solution', 'quality work'],
    team: ['business portrait', 'professional headshot', 'team member'],
    feature: ['business meeting', 'professional service', 'quality'],
    gallery: ['office environment', 'business success', 'professional work'],
    background: ['abstract business', 'minimal gradient', 'professional'],
  },
}

// Curated high-quality Unsplash photo IDs for guaranteed quality
const CURATED_IMAGES: Record<string, Record<string, string[]>> = {
  restaurant: {
    hero: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1920&q=80',
    ],
    product: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    ],
  },
  mexican: {
    hero: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1920&q=80',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1920&q=80',
    ],
    product: [
      'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80',
      'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&q=80',
      'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=800&q=80',
    ],
  },
  saas: {
    hero: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    ],
    product: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    ],
  },
}

/**
 * Detects specific cuisine or business type from prompt
 */
function detectSpecificType(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase()

  const cuisines = ['mexican', 'italian', 'japanese', 'chinese', 'indian', 'thai', 'french', 'american']
  for (const cuisine of cuisines) {
    if (lowerPrompt.includes(cuisine)) return cuisine
  }

  return null
}

/**
 * Gets search terms for an image context
 */
function getSearchTerms(
  context: ImageContext,
  businessInfo: BusinessInfo,
  prompt: string
): string[] {
  // Check for specific type first (e.g., "mexican" restaurant)
  const specificType = detectSpecificType(prompt)
  if (specificType && INDUSTRY_SEARCH_TERMS[specificType]) {
    const terms = INDUSTRY_SEARCH_TERMS[specificType][context.type]
    if (terms) return terms
  }

  // Fall back to industry
  const industry = businessInfo.industry || 'default'
  const industryTerms = INDUSTRY_SEARCH_TERMS[industry] || INDUSTRY_SEARCH_TERMS.default
  return industryTerms[context.type] || industryTerms.hero
}

/**
 * Fetches images from Pixabay API
 */
async function fetchFromPixabay(
  query: string,
  options: { orientation?: string; perPage?: number } = {}
): Promise<SourcedImage[]> {
  const { orientation = 'horizontal', perPage = 5 } = options

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = new URL('/api/media/pixabay', baseUrl)
    url.searchParams.set('q', query)
    url.searchParams.set('orientation', orientation)
    url.searchParams.set('per_page', perPage.toString())

    const res = await fetch(url.toString())
    if (!res.ok) return []

    const data = await res.json()

    return (data.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      source: 'pixabay' as const,
      width: img.width,
      height: img.height,
    }))
  } catch (error) {
    console.error('Pixabay fetch error:', error)
    return []
  }
}

/**
 * Gets a curated image if available
 */
function getCuratedImage(
  context: ImageContext,
  businessInfo: BusinessInfo,
  prompt: string,
  usedUrls: Set<string>
): SourcedImage | null {
  const specificType = detectSpecificType(prompt)
  const industry = specificType || businessInfo.industry || 'default'

  const curatedForIndustry = CURATED_IMAGES[industry]
  if (!curatedForIndustry) return null

  const curatedForType = curatedForIndustry[context.type]
  if (!curatedForType) return null

  // Find an unused curated image
  for (const url of curatedForType) {
    if (!usedUrls.has(url)) {
      usedUrls.add(url)
      return {
        id: `curated-${Date.now()}`,
        url,
        source: 'curated',
        width: context.size.width,
        height: context.size.height,
      }
    }
  }

  return null
}

/**
 * Gets orientation based on aspect ratio
 */
function getOrientation(aspectRatio: string): string {
  if (aspectRatio === '1:1') return 'all'
  if (aspectRatio === '3:4' || aspectRatio === '9:16') return 'vertical'
  return 'horizontal'
}

/**
 * Smart image sourcing - tries multiple sources in order of preference
 */
export async function sourceImagesForContext(
  contexts: ImageContext[],
  businessInfo: BusinessInfo,
  prompt: string
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>()
  const usedUrls = new Set<string>()

  for (const context of contexts) {
    let imageUrl: string | null = null

    // 1. Try curated images first (guaranteed quality)
    const curated = getCuratedImage(context, businessInfo, prompt, usedUrls)
    if (curated) {
      imageUrl = curated.url
    }

    // 2. Try Pixabay search
    if (!imageUrl) {
      const searchTerms = getSearchTerms(context, businessInfo, prompt)
      const orientation = getOrientation(context.size.aspectRatio)

      for (const term of searchTerms) {
        const images = await fetchFromPixabay(term, { orientation, perPage: 3 })
        const unused = images.find(img => !usedUrls.has(img.url))

        if (unused) {
          imageUrl = unused.url
          usedUrls.add(unused.url)
          break
        }
      }
    }

    // 3. Use a high-quality Unsplash fallback based on type
    if (!imageUrl) {
      const fallbacks: Record<string, string> = {
        hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
        product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        team: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
        feature: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
        gallery: 'https://images.unsplash.com/photo-1545665277-5937489579f2?w=800&q=80',
        background: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
        general: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      }
      imageUrl = fallbacks[context.type] || fallbacks.general
    }

    if (imageUrl) {
      imageMap.set(context.id, imageUrl)
    }
  }

  return imageMap
}

/**
 * Quick image fetch for a specific query (used in real-time)
 */
export async function quickImageSearch(
  query: string,
  count: number = 5
): Promise<string[]> {
  const images = await fetchFromPixabay(query, { perPage: count })
  return images.map(img => img.url)
}

/**
 * Industry-specific image pack
 */
export async function getIndustryImagePack(
  industry: string,
  prompt: string
): Promise<Record<string, string[]>> {
  const pack: Record<string, string[]> = {}

  const specificType = detectSpecificType(prompt)
  const searchTerms = INDUSTRY_SEARCH_TERMS[specificType || industry] || INDUSTRY_SEARCH_TERMS.default

  for (const [type, terms] of Object.entries(searchTerms)) {
    const allImages: string[] = []

    for (const term of terms.slice(0, 2)) { // First 2 terms per type
      const images = await fetchFromPixabay(term, { perPage: 3 })
      allImages.push(...images.map(img => img.url))
    }

    pack[type] = [...new Set(allImages)].slice(0, 5) // Dedupe, max 5 per type
  }

  return pack
}
