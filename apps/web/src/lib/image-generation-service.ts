// Image Generation Service - Orchestrates AI image generation via Replicate/Runpod

import { ImageContext, generateImagePrompt, prioritizeImages } from './image-analyzer'
import { BusinessInfo } from './template-matcher'

export interface ImageGenerationConfig {
  provider: 'dalle' | 'replicate' | 'runpod'
  model: 'dall-e-3' | 'flux-schnell' | 'sdxl'
  maxImages: number
  timeout: number
  quality: 'draft' | 'standard' | 'high'
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
  provider: 'dalle',  // Use DALL-E 3 by default (OpenAI)
  model: 'dall-e-3',
  maxImages: 3,       // DALL-E is more expensive, limit to 3
  timeout: 30000,
  quality: 'standard'
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
   * Calls the image generation API - tries RunPod directly, then falls back to Unsplash
   */
  private async callGenerationAPI(prompt: string, aspectRatio: string): Promise<string> {
    const dimensions = this.getDimensionsFromAspectRatio(aspectRatio)

    // Try RunPod directly using the runpod library
    if (process.env.RUNPOD_API_KEY && process.env.RUNPOD_FLUX_ENDPOINT) {
      try {
        console.log('[ImageGen] Trying RunPod FLUX...')
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
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[ImageGen] RunPod response status:', data.status)

          if (data.output?.images?.[0]) {
            const base64 = data.output.images[0]
            console.log('[ImageGen] Got image from RunPod')
            return `data:image/png;base64,${base64}`
          }
          if (data.output?.image) {
            console.log('[ImageGen] Got image URL from RunPod')
            return data.output.image
          }
        } else {
          console.log('[ImageGen] RunPod failed:', response.status)
        }
      } catch (e) {
        console.log('[ImageGen] RunPod error:', e)
      }
    }

    // Try DALL-E directly using OpenAI
    if (process.env.OPENAI_API_KEY) {
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

        if (response.data && response.data[0]?.url) {
          console.log('[ImageGen] Got image from DALL-E')
          return response.data[0].url
        }
      } catch (e) {
        console.log('[ImageGen] DALL-E error:', e)
      }
    }

    // Fallback: Return a high-quality Unsplash image
    console.log('[ImageGen] Using Unsplash fallback')
    throw new Error('No image generation API available')
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
