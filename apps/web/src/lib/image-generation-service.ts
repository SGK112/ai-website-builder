// Image Generation Service - Orchestrates AI image generation via Replicate/Runpod
// Optimized with smart fallbacks, multi-layer caching, and Supabase storage

import { ImageContext, generateImagePrompt, prioritizeImages } from './image-analyzer'
import { BusinessInfo } from './template-matcher'
import { uploadFromUrl, isSupabaseConfigured } from './supabase'
import imageCache, { getCacheStats } from './image-cache'

export interface ImageGenerationConfig {
  provider: 'dalle' | 'replicate' | 'runpod' | 'auto'
  model: 'dall-e-3' | 'flux-schnell' | 'sdxl'
  maxImages: number
  timeout: number
  quality: 'draft' | 'standard' | 'high'
  enableCaching: boolean
  uploadToCloudinary: boolean  // Deprecated
  uploadToSupabase: boolean    // Use Supabase storage for persistence
}

export interface GeneratedImage {
  id: string
  url: string
  context: ImageContext
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error?: string
}

export interface GenerationProgress {
  current: number
  total: number
  image?: GeneratedImage
}

const DEFAULT_CONFIG: ImageGenerationConfig = {
  provider: 'auto',   // Auto-select best available provider
  model: 'flux-schnell',
  maxImages: 5,
  timeout: 60000,
  quality: 'standard',
  enableCaching: true,
  uploadToCloudinary: false,  // Deprecated, use Supabase
  uploadToSupabase: true,     // Use Supabase storage
}

// Provider priority for auto-selection (cheapest/fastest first)
const PROVIDER_PRIORITY = ['runpod', 'replicate', 'dalle'] as const

// Check which providers are available
function getAvailableProviders(): string[] {
  const available: string[] = []
  if (process.env.RUNPOD_API_KEY && process.env.RUNPOD_FLUX_ENDPOINT) {
    available.push('runpod')
  }
  if (process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN) {
    available.push('replicate')
  }
  if (process.env.OPENAI_API_KEY) {
    available.push('dalle')
  }
  return available
}

// Aspect ratio mapping for Replicate
const ASPECT_RATIO_MAP: Record<string, string> = {
  '16:9': '16:9',
  '1:1': '1:1',
  '4:3': '4:3',
  '3:4': '3:4',
  '9:16': '9:16',
  '21:9': '21:9'
}

/**
 * Main image generation service
 */
export class ImageGenerationService {
  private config: ImageGenerationConfig

  constructor(config: Partial<ImageGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Generates images for all provided contexts
   */
  async generateImages(
    contexts: ImageContext[],
    businessInfo: BusinessInfo,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<Map<string, string>> {
    // Prioritize and limit images
    const prioritized = prioritizeImages(contexts, this.config.maxImages)
    const results = new Map<string, string>()

    if (prioritized.length === 0) {
      return results
    }

    // Generate images in batches of 2 for parallelism without overwhelming the API
    const batchSize = 2
    let completed = 0

    for (let i = 0; i < prioritized.length; i += batchSize) {
      const batch = prioritized.slice(i, i + batchSize)

      const batchPromises = batch.map(async (ctx) => {
        const result = await this.generateSingleImage(ctx, businessInfo)
        completed++

        if (onProgress) {
          onProgress({
            current: completed,
            total: prioritized.length,
            image: result
          })
        }

        return result
      })

      const batchResults = await Promise.allSettled(batchPromises)

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.status === 'completed') {
          results.set(result.value.id, result.value.url)
        }
      }
    }

    return results
  }

  /**
   * Generates a single image
   */
  async generateSingleImage(
    context: ImageContext,
    businessInfo: BusinessInfo
  ): Promise<GeneratedImage> {
    const prompt = generateImagePrompt(context, businessInfo)
    const aspectRatio = ASPECT_RATIO_MAP[context.size.aspectRatio] || '16:9'

    try {
      const url = await this.callGenerationAPI(prompt, aspectRatio)

      return {
        id: context.id,
        url,
        context,
        status: 'completed'
      }
    } catch (error) {
      console.error(`Image generation failed for ${context.id}:`, error)

      // Try fallback
      try {
        const fallbackUrl = await this.getFallbackImage(context, businessInfo)
        return {
          id: context.id,
          url: fallbackUrl,
          context,
          status: 'completed'
        }
      } catch {
        return {
          id: context.id,
          url: this.getPlaceholderSVG(context),
          context,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  /**
   * Calls the image generation API with smart fallbacks and multi-layer caching
   * Priority: RunPod (cheapest) -> Replicate -> DALL-E -> Unsplash
   */
  private async callGenerationAPI(prompt: string, aspectRatio: string): Promise<string> {
    const dimensions = this.getDimensionsFromAspectRatio(aspectRatio)

    // Check multi-layer cache first (L1: memory, L2: Supabase storage)
    if (this.config.enableCaching) {
      const cacheResult = await imageCache.get(prompt, {
        width: dimensions.width,
        height: dimensions.height,
        model: this.config.model,
      })

      if (cacheResult.hit && cacheResult.url) {
        console.log(`[ImageGen] Cache ${cacheResult.source} hit for prompt`)
        return cacheResult.url
      }
    }

    const errors: string[] = []
    let imageUrl: string | null = null
    let usedProvider: string = 'unknown'

    // Try RunPod FLUX (fastest & cheapest for self-hosted)
    if (process.env.RUNPOD_API_KEY && process.env.RUNPOD_FLUX_ENDPOINT) {
      try {
        console.log('[ImageGen] Trying RunPod FLUX...')
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(`https://api.runpod.ai/v2/${process.env.RUNPOD_FLUX_ENDPOINT}/runsync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: {
              prompt: prompt,
              width: dimensions.width,
              height: dimensions.height,
              num_inference_steps: 4,
              guidance_scale: 3.5,
            }
          }),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (response.ok) {
          const data = await response.json()
          console.log('[ImageGen] RunPod response status:', data.status)

          if (data.output?.images?.[0]) {
            imageUrl = `data:image/png;base64,${data.output.images[0]}`
          } else if (data.output?.image) {
            imageUrl = data.output.image
          }

          if (imageUrl) {
            usedProvider = 'runpod'
            console.log('[ImageGen] Success: RunPod FLUX')
          }
        } else {
          errors.push(`RunPod: ${response.status}`)
        }
      } catch (e: any) {
        errors.push(`RunPod: ${e.message}`)
        console.log('[ImageGen] RunPod error:', e.message)
      }
    }

    // Try Replicate FLUX (good quality, pay-per-use)
    const replicateToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
    if (!imageUrl && replicateToken) {
      try {
        console.log('[ImageGen] Trying Replicate FLUX...')
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'black-forest-labs/flux-schnell',
            input: {
              prompt: prompt,
              aspect_ratio: aspectRatio,
              output_format: 'webp',
              output_quality: 90,
            }
          }),
        })

        if (response.ok) {
          const prediction = await response.json()
          // Poll for result
          let result = prediction
          let attempts = 0
          while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
            await new Promise(r => setTimeout(r, 1000))
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
              headers: { 'Authorization': `Token ${replicateToken}` }
            })
            result = await pollRes.json()
            attempts++
          }

          if (result.status === 'succeeded' && result.output?.[0]) {
            imageUrl = result.output[0]
            usedProvider = 'replicate'
            console.log('[ImageGen] Success: Replicate FLUX')
          }
        } else {
          errors.push(`Replicate: ${response.status}`)
        }
      } catch (e: any) {
        errors.push(`Replicate: ${e.message}`)
        console.log('[ImageGen] Replicate error:', e.message)
      }
    }

    // Try DALL-E 3 (highest quality, most expensive)
    if (!imageUrl && process.env.OPENAI_API_KEY) {
      try {
        console.log('[ImageGen] Trying DALL-E 3...')
        const OpenAI = (await import('openai')).default
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const dalleSize = aspectRatio === '1:1' ? '1024x1024' as const
          : aspectRatio === '9:16' ? '1024x1792' as const
          : '1792x1024' as const

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: dalleSize,
          quality: this.config.quality === 'high' ? 'hd' : 'standard',
          style: 'vivid'
        })

        if (response.data?.[0]?.url) {
          imageUrl = response.data[0].url
          usedProvider = 'dalle'
          console.log('[ImageGen] Success: DALL-E 3')
        }
      } catch (e: any) {
        errors.push(`DALL-E: ${e.message}`)
        console.log('[ImageGen] DALL-E error:', e.message)
      }
    }

    // Upload to Supabase for persistent storage (if enabled and we have an image)
    if (imageUrl && this.config.uploadToSupabase && isSupabaseConfigured()) {
      try {
        const supabaseResult = await this.uploadToSupabase(imageUrl, prompt)
        if (supabaseResult) {
          imageUrl = supabaseResult
          console.log('[ImageGen] Uploaded to Supabase')
        }
      } catch (e) {
        console.log('[ImageGen] Supabase upload failed, using original URL')
      }
    }

    // Legacy: Upload to Cloudinary if configured (deprecated)
    if (imageUrl && this.config.uploadToCloudinary && process.env.CLOUDINARY_URL) {
      try {
        const cloudinaryUrl = await this.uploadToCloudinary(imageUrl, prompt)
        if (cloudinaryUrl) {
          imageUrl = cloudinaryUrl
          console.log('[ImageGen] Uploaded to Cloudinary')
        }
      } catch (e) {
        console.log('[ImageGen] Cloudinary upload failed, using original URL')
      }
    }

    // Cache the result in multi-layer cache (memory + Supabase storage)
    if (imageUrl && this.config.enableCaching) {
      // Note: imageCache.set() uploads to Supabase storage internally if not already stored
      // This supersedes the uploadToSupabase step above when caching is enabled
      const cachedUrl = await imageCache.set(prompt, imageUrl, usedProvider, {
        width: dimensions.width,
        height: dimensions.height,
        model: this.config.model,
      })
      imageUrl = cachedUrl // Use the cached URL (may be from Supabase)
      console.log(`[ImageGen] Cached with provider: ${usedProvider}`)
    }

    if (imageUrl) {
      return imageUrl
    }

    // All providers failed
    console.log('[ImageGen] All providers failed:', errors.join(', '))
    throw new Error(`Image generation failed: ${errors.join(', ') || 'No providers available'}`)
  }

  /**
   * Upload image to Supabase for persistent storage
   */
  private async uploadToSupabase(imageUrl: string, prompt: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null

    try {
      const result = await uploadFromUrl(imageUrl, {
        folder: 'generated',
        fileName: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`,
      })

      if (result.success && result.url) {
        return result.url
      }

      console.log('[ImageGen] Supabase upload failed:', result.error)
    } catch (e) {
      console.log('[ImageGen] Supabase error:', e)
    }

    return null
  }

  /**
   * Upload image to Cloudinary for persistent storage (deprecated)
   */
  private async uploadToCloudinary(imageUrl: string, prompt: string): Promise<string | null> {
    if (!process.env.CLOUDINARY_URL) return null

    try {
      // Parse Cloudinary URL
      const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL)
      const cloudName = cloudinaryUrl.host.split('@')[1] || cloudinaryUrl.pathname.split('/')[1]
      const apiKey = cloudinaryUrl.username
      const apiSecret = cloudinaryUrl.password

      if (!cloudName || !apiKey || !apiSecret) return null

      const formData = new FormData()
      formData.append('file', imageUrl)
      formData.append('upload_preset', 'ai_generated')
      formData.append('folder', 'ai-website-builder')
      formData.append('context', `prompt=${prompt.slice(0, 100)}`)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.secure_url
      }
    } catch (e) {
      console.log('[ImageGen] Cloudinary error:', e)
    }

    return null
  }

  /**
   * Convert aspect ratio to dimensions
   */
  private getDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
    const ratioMap: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1024, height: 576 },
      '1:1': { width: 1024, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
      '9:16': { width: 576, height: 1024 },
      '21:9': { width: 1280, height: 548 }
    }
    return ratioMap[aspectRatio] || { width: 1024, height: 1024 }
  }

  /**
   * Gets a fallback image from Unsplash based on context
   */
  private async getFallbackImage(
    context: ImageContext,
    businessInfo: BusinessInfo
  ): Promise<string> {
    // Build search query
    const queries: string[] = []

    if (businessInfo.industry) {
      queries.push(businessInfo.industry)
    }

    // Type-specific fallback queries
    const typeQueries: Record<string, string> = {
      hero: 'business office modern',
      product: 'product minimal',
      team: 'professional portrait',
      feature: 'technology abstract',
      gallery: 'portfolio work',
      background: 'abstract pattern',
      general: 'business professional'
    }

    queries.push(typeQueries[context.type] || 'business')

    const query = queries.join(' ')

    // Use Unsplash Source API for direct image
    const width = context.size.width
    const height = context.size.height

    return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`
  }

  /**
   * Generates a placeholder SVG for failed images
   */
  private getPlaceholderSVG(context: ImageContext): string {
    const { width, height } = context.size

    // Generate a nice gradient placeholder
    const colors = {
      hero: ['#6366f1', '#8b5cf6'],
      product: ['#10b981', '#34d399'],
      team: ['#3b82f6', '#60a5fa'],
      feature: ['#f59e0b', '#fbbf24'],
      gallery: ['#ec4899', '#f472b6'],
      background: ['#1e293b', '#334155'],
      logo: ['#6366f1', '#818cf8'],
      icon: ['#64748b', '#94a3b8'],
      general: ['#6366f1', '#8b5cf6']
    }

    const [color1, color2] = colors[context.type] || colors.general

    // Create SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.35em"
            fill="white" font-family="sans-serif" font-size="${Math.min(width, height) / 10}" opacity="0.5">
        ${context.type.charAt(0).toUpperCase() + context.type.slice(1)} Image
      </text>
    </svg>`

    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }
}

/**
 * Quick helper to generate images for HTML
 */
export async function generateImagesForHtml(
  html: string,
  businessInfo: BusinessInfo,
  onProgress?: (progress: GenerationProgress) => void,
  config?: Partial<ImageGenerationConfig>
): Promise<Map<string, string>> {
  const { extractImageContexts } = await import('./image-analyzer')
  const contexts = extractImageContexts(html)

  if (contexts.length === 0) {
    return new Map()
  }

  const service = new ImageGenerationService(config)
  return service.generateImages(contexts, businessInfo, onProgress)
}

/**
 * Checks if image generation is available
 */
export async function isImageGenerationAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' })
    })

    // If we get a 400 (invalid action) or 200, the API is configured
    return response.status !== 500
  } catch {
    return false
  }
}

/**
 * Get image generation cache statistics
 */
export function getImageCacheStats() {
  return getCacheStats()
}

/**
 * Clear image cache (memory only by default)
 */
export async function clearImageCache(includeStorage: boolean = false) {
  imageCache.clearMemory()

  if (includeStorage) {
    return imageCache.clearStorage()
  }

  return { success: true, deleted: 0 }
}
