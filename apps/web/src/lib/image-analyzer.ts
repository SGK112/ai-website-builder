// Image Context Analyzer - Extracts image contexts from HTML for AI generation

import { BusinessInfo } from './template-matcher'

export interface ImageContext {
  id: string
  type: 'hero' | 'product' | 'team' | 'feature' | 'gallery' | 'background' | 'logo' | 'icon' | 'general'
  placeholder: string      // Current src or placeholder
  contextHint: string      // Alt text or surrounding context for prompt
  size: {
    width: number
    height: number
    aspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16' | '21:9'
  }
  priority: number         // 1-5, lower = generate first
  cssClasses: string[]     // CSS classes for context
  parentSection?: string   // Section type (hero, features, etc.)
}

// Size presets for different image types
const IMAGE_SIZE_PRESETS: Record<ImageContext['type'], ImageContext['size']> = {
  hero: { width: 1920, height: 1080, aspectRatio: '16:9' },
  product: { width: 800, height: 800, aspectRatio: '1:1' },
  team: { width: 400, height: 400, aspectRatio: '1:1' },
  feature: { width: 800, height: 600, aspectRatio: '4:3' },
  gallery: { width: 800, height: 600, aspectRatio: '4:3' },
  background: { width: 1920, height: 1080, aspectRatio: '16:9' },
  logo: { width: 256, height: 256, aspectRatio: '1:1' },
  icon: { width: 128, height: 128, aspectRatio: '1:1' },
  general: { width: 800, height: 600, aspectRatio: '4:3' }
}

// Priority for image types (lower = higher priority)
const TYPE_PRIORITY: Record<ImageContext['type'], number> = {
  hero: 1,
  product: 2,
  feature: 2,
  team: 3,
  gallery: 4,
  background: 4,
  logo: 3,
  icon: 5,
  general: 5
}

// Context keywords to identify image types
const TYPE_INDICATORS = {
  hero: ['hero', 'banner', 'header-image', 'main-image', 'cover', 'splash'],
  product: ['product', 'item', 'merchandise', 'goods', 'shop', 'store'],
  team: ['team', 'staff', 'employee', 'founder', 'ceo', 'member', 'headshot', 'portrait', 'profile'],
  feature: ['feature', 'benefit', 'service', 'capability', 'solution'],
  gallery: ['gallery', 'portfolio', 'showcase', 'project', 'work', 'case-study'],
  background: ['background', 'bg-', 'backdrop', 'pattern'],
  logo: ['logo', 'brand', 'company-logo'],
  icon: ['icon', 'symbol', 'glyph']
}

/**
 * Extracts image contexts from HTML content
 */
export function extractImageContexts(html: string): ImageContext[] {
  const contexts: ImageContext[] = []
  let imageId = 0

  // Find all img tags
  const imgRegex = /<img([^>]*)>/gi
  let match: RegExpExecArray | null

  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1]
    const context = parseImageTag(attrs, ++imageId, html, match.index)
    if (context && shouldGenerateImage(context)) {
      contexts.push(context)
    }
  }

  // Find background images in style attributes
  const bgRegex = /style\s*=\s*["'][^"']*background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/gi

  while ((match = bgRegex.exec(html)) !== null) {
    const url = match[1]
    if (isPlaceholderUrl(url)) {
      contexts.push({
        id: `bg-${++imageId}`,
        type: 'background',
        placeholder: url,
        contextHint: 'website background, abstract, professional',
        size: IMAGE_SIZE_PRESETS.background,
        priority: TYPE_PRIORITY.background,
        cssClasses: []
      })
    }
  }

  // Sort by priority
  contexts.sort((a, b) => a.priority - b.priority)

  return contexts
}

/**
 * Parses an img tag and extracts context
 */
function parseImageTag(attrs: string, id: number, html: string, position: number): ImageContext | null {
  // Extract attributes
  const src = extractAttr(attrs, 'src')
  const alt = extractAttr(attrs, 'alt') || ''
  const className = extractAttr(attrs, 'class') || ''
  const dataType = extractAttr(attrs, 'data-image-type')

  // Skip if not a placeholder
  if (src && !isPlaceholderUrl(src)) {
    return null
  }

  // Determine image type from context
  const type = determineImageType(alt, className, dataType, html, position)

  // Get surrounding text for context hint
  const contextHint = buildContextHint(alt, className, html, position, type)

  return {
    id: `img-${id}`,
    type,
    placeholder: src || '',
    contextHint,
    size: IMAGE_SIZE_PRESETS[type],
    priority: TYPE_PRIORITY[type],
    cssClasses: className.split(/\s+/).filter(Boolean),
    parentSection: findParentSection(html, position) || undefined
  }
}

/**
 * Extracts an attribute value from attribute string
 */
function extractAttr(attrs: string, name: string): string | null {
  const regex = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')
  const match = attrs.match(regex)
  return match ? match[1] : null
}

/**
 * Checks if URL is a placeholder that should be replaced
 */
function isPlaceholderUrl(url: string): boolean {
  if (!url) return true

  const placeholderPatterns = [
    /images\.unsplash\.com/i,
    /picsum\.photos/i,
    /placeholder\./i,
    /via\.placeholder/i,
    /placehold\.it/i,
    /placekitten/i,
    /loremflickr/i,
    /dummyimage/i,
    /fakeimg/i,
    /^data:image\/svg/i,
    /example\.com/i,
    /\/placeholder/i,
    /\{\{.*\}\}/,  // Template variables
  ]

  return placeholderPatterns.some(pattern => pattern.test(url))
}

/**
 * Determines the type of image based on context
 */
function determineImageType(
  alt: string,
  className: string,
  dataType: string | null,
  html: string,
  position: number
): ImageContext['type'] {
  const combined = `${alt} ${className} ${dataType || ''}`.toLowerCase()

  // Check explicit data-type first
  if (dataType && TYPE_PRIORITY[dataType as ImageContext['type']]) {
    return dataType as ImageContext['type']
  }

  // Check for type indicators
  for (const [type, indicators] of Object.entries(TYPE_INDICATORS)) {
    for (const indicator of indicators) {
      if (combined.includes(indicator)) {
        return type as ImageContext['type']
      }
    }
  }

  // Check parent section
  const section = findParentSection(html, position)
  if (section) {
    if (section.includes('hero')) return 'hero'
    if (section.includes('team')) return 'team'
    if (section.includes('product')) return 'product'
    if (section.includes('gallery') || section.includes('portfolio')) return 'gallery'
    if (section.includes('feature') || section.includes('service')) return 'feature'
  }

  // Check image size classes
  if (className.includes('w-full') || className.includes('h-screen') || className.includes('min-h-')) {
    return 'hero'
  }
  if (className.includes('rounded-full') || className.includes('avatar')) {
    return 'team'
  }
  if (className.includes('aspect-square') || className.includes('w-24') || className.includes('w-32')) {
    return 'product'
  }

  return 'general'
}

/**
 * Finds the parent section type from HTML context
 */
function findParentSection(html: string, position: number): string | null {
  // Look backwards for section/div with id or class
  const beforeImage = html.substring(Math.max(0, position - 500), position)

  // Find section or div with identifying attributes
  const sectionRegex = /<(?:section|div)[^>]*(?:id|class)\s*=\s*["']([^"']*(?:hero|team|product|gallery|feature|service|testimonial|about|contact|pricing|faq)[^"']*)["']/gi

  let lastMatch: string | null = null
  let match: RegExpExecArray | null

  while ((match = sectionRegex.exec(beforeImage)) !== null) {
    lastMatch = match[1].toLowerCase()
  }

  return lastMatch
}

/**
 * Builds a context hint for image generation prompt
 */
function buildContextHint(
  alt: string,
  className: string,
  html: string,
  position: number,
  type: ImageContext['type']
): string {
  const hints: string[] = []

  // Use alt text if meaningful
  if (alt && !alt.toLowerCase().includes('placeholder') && !alt.toLowerCase().includes('image')) {
    hints.push(alt)
  }

  // Add type-specific hints
  const typeHints: Record<ImageContext['type'], string> = {
    hero: 'professional hero image, high quality, editorial',
    product: 'product photography, clean background, studio lighting',
    team: 'professional headshot, corporate, friendly smile, neutral background',
    feature: 'conceptual illustration, modern, abstract representation',
    gallery: 'portfolio piece, high quality photography, artistic',
    background: 'abstract background, subtle pattern, professional',
    logo: 'minimalist logo, clean design, professional brand mark',
    icon: 'simple icon, flat design, single color',
    general: 'professional photograph, high quality, business appropriate'
  }

  hints.push(typeHints[type])

  // Extract nearby text for additional context
  const surroundingText = extractSurroundingText(html, position)
  if (surroundingText) {
    hints.push(surroundingText)
  }

  return hints.join(', ')
}

/**
 * Extracts meaningful text near the image for context
 */
function extractSurroundingText(html: string, position: number): string {
  // Get text within 200 chars before and after
  const start = Math.max(0, position - 200)
  const end = Math.min(html.length, position + 200)
  const surrounding = html.substring(start, end)

  // Strip HTML tags
  const textOnly = surrounding.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // Extract meaningful words (skip common HTML attribute words)
  const skipWords = new Set(['class', 'src', 'alt', 'div', 'img', 'section', 'span', 'href', 'style'])
  const words = textOnly.split(/\s+/).filter(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '')
    return clean.length > 3 && !skipWords.has(clean)
  })

  // Take first few meaningful words
  return words.slice(0, 5).join(' ')
}

/**
 * Checks if we should generate an image for this context
 */
function shouldGenerateImage(context: ImageContext): boolean {
  // Skip icons and logos for now (they need specialized generation)
  if (context.type === 'icon') {
    return false
  }

  // Skip if placeholder URL is a working Unsplash URL (they're already good quality)
  // but for this implementation, we'll generate all placeholders

  return true
}

/**
 * Generates a detailed prompt for image generation based on context
 */
export function generateImagePrompt(
  context: ImageContext,
  businessInfo: BusinessInfo
): string {
  const parts: string[] = []

  // Industry context
  if (businessInfo.industry) {
    const industryDescriptions: Record<string, string> = {
      saas: 'technology company, software, digital',
      agency: 'creative agency, marketing, professional',
      restaurant: 'food, culinary, dining experience',
      ecommerce: 'retail, products, shopping',
      portfolio: 'creative work, artistic, professional',
      realestate: 'real estate, property, homes',
      fitness: 'fitness, health, active lifestyle',
      medical: 'healthcare, medical, professional care',
      legal: 'legal services, law firm, professional',
      construction: 'construction, building, architecture'
    }
    parts.push(industryDescriptions[businessInfo.industry] || '')
  }

  // Type-specific prompts
  const typePrompts: Record<ImageContext['type'], string> = {
    hero: 'stunning hero image, professional photography, high resolution, dramatic lighting',
    product: 'product photography, studio lighting, clean white background, sharp details',
    team: 'professional corporate headshot, friendly expression, neutral background, well-lit',
    feature: 'modern illustration, conceptual, clean design, professional',
    gallery: 'high quality photograph, artistic composition, professional',
    background: 'abstract background pattern, subtle, elegant, non-distracting',
    logo: 'minimalist logo design, professional brand mark, clean lines',
    icon: 'flat icon design, simple, modern, single color',
    general: 'professional stock photo, high quality, business appropriate'
  }
  parts.push(typePrompts[context.type])

  // Style modifications
  if (businessInfo.style) {
    const styleModifiers: Record<string, string> = {
      modern: 'modern aesthetic, contemporary, sleek',
      minimal: 'minimalist, clean, simple, white space',
      bold: 'bold colors, high contrast, striking',
      elegant: 'elegant, sophisticated, refined, luxury feel',
      playful: 'vibrant colors, fun, energetic',
      professional: 'corporate, trustworthy, polished'
    }
    parts.push(styleModifiers[businessInfo.style] || '')
  }

  // Context hint from alt text / surrounding content
  if (context.contextHint) {
    parts.push(context.contextHint)
  }

  // Quality modifiers
  parts.push('8k, high detail, professional quality, photorealistic')

  // Negative prompt considerations (built into positive)
  parts.push('no text, no watermarks, no logos')

  return parts.filter(Boolean).join(', ')
}

/**
 * Limits the number of images to generate based on priority
 */
export function prioritizeImages(
  contexts: ImageContext[],
  maxImages: number = 5
): ImageContext[] {
  // Already sorted by priority in extractImageContexts
  // Take top N, but ensure variety of types
  const selected: ImageContext[] = []
  const typeCount: Record<string, number> = {}

  for (const ctx of contexts) {
    if (selected.length >= maxImages) break

    // Limit 2 images per type
    const count = typeCount[ctx.type] || 0
    if (count >= 2) continue

    selected.push(ctx)
    typeCount[ctx.type] = count + 1
  }

  return selected
}
