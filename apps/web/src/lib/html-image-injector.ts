// HTML Image Injector - Injects generated images into HTML and adds fallbacks

/**
 * Injects generated images into HTML, replacing placeholder URLs
 */
export function injectGeneratedImages(
  html: string,
  imageMap: Map<string, string>
): string {
  if (imageMap.size === 0) {
    return html
  }

  let result = html
  let injectedCount = 0

  // Build a map of placeholder patterns to generated URLs
  // The imageMap keys are like "img-1", "img-2", etc.
  // We need to replace the actual placeholder URLs in order

  // Find all img tags and replace their src in order
  const imgRegex = /<img([^>]*)\ssrc\s*=\s*["']([^"']*)["']([^>]*)>/gi
  const imgMatches: { full: string; before: string; src: string; after: string; index: number }[] = []

  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html)) !== null) {
    imgMatches.push({
      full: match[0],
      before: match[1],
      src: match[2],
      after: match[3],
      index: match.index
    })
  }

  // Filter to only placeholder images
  const placeholderMatches = imgMatches.filter(m => isPlaceholderUrl(m.src))

  // Map generated images to placeholders by index
  const imageUrls = Array.from(imageMap.entries())

  for (let i = 0; i < placeholderMatches.length && i < imageUrls.length; i++) {
    const placeholder = placeholderMatches[i]
    const [, generatedUrl] = imageUrls[i]

    // Replace this specific occurrence
    const newImgTag = `<img${placeholder.before} src="${generatedUrl}"${placeholder.after}>`
    result = result.replace(placeholder.full, newImgTag)
    injectedCount++
  }

  // Also handle background-image URLs
  const bgRegex = /background(-image)?\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/gi

  result = result.replace(bgRegex, (match, suffix, url) => {
    if (isPlaceholderUrl(url) && injectedCount < imageUrls.length) {
      const [, generatedUrl] = imageUrls[injectedCount]
      injectedCount++
      return `background${suffix || ''}: url('${generatedUrl}')`
    }
    return match
  })

  return result
}

/**
 * Adds error handlers to all images for graceful fallback
 */
export function ensureImageFallbacks(html: string): string {
  // Add onerror handler and crossorigin to all img tags
  return html.replace(
    /<img([^>]*?)(?!\s+onerror)([^>]*)>/gi,
    (match, before, after) => {
      // Check if it already has onerror
      if (before.includes('onerror') || after.includes('onerror')) {
        return match
      }

      // Create a visually appealing gradient fallback
      const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e1b4b'/%3E%3Cstop offset='100%25' stop-color='%234c1d95'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='300'/%3E%3C/svg%3E`

      // Add crossorigin for Unsplash images
      let crossOrigin = ''
      if (before.includes('unsplash') || after.includes('unsplash')) {
        crossOrigin = ' crossorigin="anonymous" referrerpolicy="no-referrer"'
      }

      return `<img${before}${after}${crossOrigin} onerror="this.onerror=null;this.src='${fallbackSvg}';this.classList.add('image-load-failed')">`
    }
  )
}

/**
 * Adds lazy loading to images for better performance
 */
export function addLazyLoading(html: string): string {
  return html.replace(
    /<img([^>]*?)(?!\s+loading)([^>]*)>/gi,
    (match, before, after) => {
      // Skip if already has loading attribute
      if (before.includes('loading=') || after.includes('loading=')) {
        return match
      }

      // Skip hero images (they should load immediately)
      if (before.includes('hero') || after.includes('hero')) {
        return `<img${before}${after} loading="eager">`
      }

      return `<img${before}${after} loading="lazy">`
    }
  )
}

/**
 * Wraps images in aspect-ratio containers for layout stability
 */
export function addAspectRatioContainers(html: string): string {
  // This is optional and may not be needed if Tailwind classes handle it
  return html
}

/**
 * Adds srcset for responsive images
 */
export function addResponsiveSrcset(html: string): string {
  // For images from Unsplash or similar services that support sizing
  return html.replace(
    /<img([^>]*)\ssrc\s*=\s*["'](https:\/\/images\.unsplash\.com\/[^"'?]+)\?[^"']*["']([^>]*)>/gi,
    (match, before, baseUrl, after) => {
      const srcset = [
        `${baseUrl}?w=400 400w`,
        `${baseUrl}?w=800 800w`,
        `${baseUrl}?w=1200 1200w`,
        `${baseUrl}?w=1920 1920w`
      ].join(', ')

      return `<img${before} src="${baseUrl}?w=800" srcset="${srcset}" sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"${after}>`
    }
  )
}

/**
 * Checks if a URL is a placeholder that should be replaced
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
    /^data:image\/svg.*placeholder/i,
    /example\.com/i,
    /\/placeholder/i,
    /\{\{.*\}\}/,  // Template variables
  ]

  return placeholderPatterns.some(pattern => pattern.test(url))
}

/**
 * Applies all image optimizations to HTML
 */
export function optimizeImages(
  html: string,
  imageMap?: Map<string, string>
): string {
  let result = html

  // Inject generated images if provided
  if (imageMap && imageMap.size > 0) {
    result = injectGeneratedImages(result, imageMap)
  }

  // Add fallback handlers
  result = ensureImageFallbacks(result)

  // Add lazy loading
  result = addLazyLoading(result)

  return result
}

/**
 * Injects image loading styles into HTML head
 */
export function injectImageStyles(html: string): string {
  const styles = `
<style>
  /* Image loading states */
  img {
    transition: opacity 0.3s ease;
  }
  img.image-load-failed {
    opacity: 0.7;
    filter: grayscale(0.5);
  }
  img[loading="lazy"] {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  }

  /* Skeleton loading animation */
  @keyframes image-skeleton {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  img:not([src]), img[src=""] {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: image-skeleton 1.5s infinite;
  }
</style>
`

  // Insert before closing head tag
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styles}</head>`)
  }

  // Fallback: insert at the beginning
  return styles + html
}

/**
 * Full image processing pipeline
 */
export function processImagesInHtml(
  html: string,
  options: {
    generatedImages?: Map<string, string>
    addStyles?: boolean
    addFallbacks?: boolean
    addLazyLoad?: boolean
  } = {}
): string {
  const {
    generatedImages,
    addStyles = true,
    addFallbacks = true,
    addLazyLoad = true
  } = options

  let result = html

  // Inject generated images
  if (generatedImages && generatedImages.size > 0) {
    result = injectGeneratedImages(result, generatedImages)
  }

  // Add fallback handlers
  if (addFallbacks) {
    result = ensureImageFallbacks(result)
  }

  // Add lazy loading
  if (addLazyLoad) {
    result = addLazyLoading(result)
  }

  // Inject styles
  if (addStyles) {
    result = injectImageStyles(result)
  }

  return result
}
