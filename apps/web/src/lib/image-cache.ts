/**
 * Image Cache Utility
 *
 * Provides multi-layer caching for AI-generated images:
 * - L1: In-memory LRU cache for instant responses
 * - L2: Supabase storage for persistent cache across restarts
 *
 * Uses prompt hashing to identify duplicate/similar requests
 */

import crypto from 'crypto'
import { uploadFromUrl, getPublicUrl, isSupabaseConfigured, STORAGE_BUCKETS } from './supabase'
import { getSupabaseServerClient } from './supabase'

// Cache configuration
const CACHE_CONFIG = {
  // In-memory cache settings
  maxMemoryEntries: 500,
  memoryTTLMs: 30 * 60 * 1000, // 30 minutes

  // Supabase cache settings
  cacheFolder: 'cache',
  cacheBucket: STORAGE_BUCKETS.UPLOADS,

  // Hash settings
  similarityThreshold: 0.85, // For future fuzzy matching
}

// In-memory LRU cache
interface CacheEntry {
  url: string
  prompt: string
  hash: string
  provider: string
  createdAt: number
  hits: number
}

class ImageCache {
  private memoryCache: Map<string, CacheEntry> = new Map()
  private accessOrder: string[] = []

  /**
   * Generate a deterministic hash for a prompt + settings combination
   */
  generateHash(prompt: string, options: {
    width?: number
    height?: number
    style?: string
    model?: string
  } = {}): string {
    // Normalize prompt: lowercase, trim, collapse whitespace
    const normalizedPrompt = prompt
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')

    // Create hash input
    const hashInput = JSON.stringify({
      prompt: normalizedPrompt,
      width: options.width || 1024,
      height: options.height || 1024,
      style: options.style || 'default',
      model: options.model || 'flux',
    })

    return crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 16)
  }

  /**
   * Check in-memory cache first (L1)
   */
  getFromMemory(hash: string): CacheEntry | null {
    const entry = this.memoryCache.get(hash)

    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.createdAt > CACHE_CONFIG.memoryTTLMs) {
      this.memoryCache.delete(hash)
      this.accessOrder = this.accessOrder.filter(h => h !== hash)
      return null
    }

    // Update access order for LRU
    this.accessOrder = this.accessOrder.filter(h => h !== hash)
    this.accessOrder.push(hash)

    // Increment hits
    entry.hits++

    return entry
  }

  /**
   * Add to in-memory cache
   */
  addToMemory(hash: string, entry: Omit<CacheEntry, 'hits'>): void {
    // Evict oldest entries if at capacity
    while (this.memoryCache.size >= CACHE_CONFIG.maxMemoryEntries) {
      const oldestHash = this.accessOrder.shift()
      if (oldestHash) {
        this.memoryCache.delete(oldestHash)
      }
    }

    this.memoryCache.set(hash, { ...entry, hits: 1 })
    this.accessOrder.push(hash)
  }

  /**
   * Check Supabase storage cache (L2)
   */
  async getFromStorage(hash: string): Promise<CacheEntry | null> {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = getSupabaseServerClient()
      const path = `${CACHE_CONFIG.cacheFolder}/${hash}`

      // Check if file exists by trying to get its metadata
      const { data: files } = await supabase.storage
        .from(CACHE_CONFIG.cacheBucket)
        .list(CACHE_CONFIG.cacheFolder, {
          search: hash,
          limit: 1,
        })

      if (!files || files.length === 0) return null

      // Find exact match
      const file = files.find(f => f.name.startsWith(hash))
      if (!file) return null

      // Get the public URL
      const url = getPublicUrl(`${CACHE_CONFIG.cacheFolder}/${file.name}`, CACHE_CONFIG.cacheBucket)

      // Extract metadata from filename if possible
      // Format: {hash}-{provider}.{ext}
      const parts = file.name.replace(/\.[^.]+$/, '').split('-')
      const provider = parts[1] || 'unknown'

      const entry: CacheEntry = {
        url,
        prompt: '', // Not stored in filename
        hash,
        provider,
        createdAt: new Date(file.created_at).getTime(),
        hits: 0,
      }

      // Promote to memory cache
      this.addToMemory(hash, entry)

      return entry
    } catch (error) {
      console.error('[ImageCache] Storage lookup failed:', error)
      return null
    }
  }

  /**
   * Save to Supabase storage cache (L2)
   */
  async saveToStorage(
    imageUrl: string,
    hash: string,
    provider: string
  ): Promise<string | null> {
    if (!isSupabaseConfigured()) return null

    try {
      // Determine extension from URL
      const ext = imageUrl.match(/\.(png|jpg|jpeg|webp|gif)(\?|$)/i)?.[1] || 'png'
      const fileName = `${hash}-${provider}.${ext}`

      const result = await uploadFromUrl(imageUrl, {
        bucket: CACHE_CONFIG.cacheBucket,
        folder: CACHE_CONFIG.cacheFolder,
        fileName,
      })

      if (result.success && result.url) {
        console.log(`[ImageCache] Cached image: ${hash} -> ${result.url}`)
        return result.url
      }

      return null
    } catch (error) {
      console.error('[ImageCache] Failed to save to storage:', error)
      return null
    }
  }

  /**
   * Main cache lookup - checks L1, then L2
   */
  async get(prompt: string, options: {
    width?: number
    height?: number
    style?: string
    model?: string
  } = {}): Promise<{ hit: boolean; url?: string; source?: 'memory' | 'storage' }> {
    const hash = this.generateHash(prompt, options)

    // L1: Memory cache
    const memoryEntry = this.getFromMemory(hash)
    if (memoryEntry) {
      console.log(`[ImageCache] Memory hit for: ${hash}`)
      return { hit: true, url: memoryEntry.url, source: 'memory' }
    }

    // L2: Storage cache
    const storageEntry = await this.getFromStorage(hash)
    if (storageEntry) {
      console.log(`[ImageCache] Storage hit for: ${hash}`)
      return { hit: true, url: storageEntry.url, source: 'storage' }
    }

    return { hit: false }
  }

  /**
   * Cache an image after generation
   */
  async set(
    prompt: string,
    imageUrl: string,
    provider: string,
    options: {
      width?: number
      height?: number
      style?: string
      model?: string
    } = {}
  ): Promise<string> {
    const hash = this.generateHash(prompt, options)

    // Save to storage first (L2)
    const cachedUrl = await this.saveToStorage(imageUrl, hash, provider)
    const finalUrl = cachedUrl || imageUrl

    // Add to memory cache (L1)
    this.addToMemory(hash, {
      url: finalUrl,
      prompt,
      hash,
      provider,
      createdAt: Date.now(),
    })

    return finalUrl
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number
    memoryHits: number
    oldestEntry: number | null
    newestEntry: number | null
  } {
    let totalHits = 0
    let oldest: number | null = null
    let newest: number | null = null

    this.memoryCache.forEach(entry => {
      totalHits += entry.hits
      if (oldest === null || entry.createdAt < oldest) oldest = entry.createdAt
      if (newest === null || entry.createdAt > newest) newest = entry.createdAt
    })

    return {
      memoryEntries: this.memoryCache.size,
      memoryHits: totalHits,
      oldestEntry: oldest,
      newestEntry: newest,
    }
  }

  /**
   * Clear memory cache
   */
  clearMemory(): void {
    this.memoryCache.clear()
    this.accessOrder = []
  }

  /**
   * Clear storage cache (dangerous - removes all cached images)
   */
  async clearStorage(): Promise<{ success: boolean; deleted: number; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, deleted: 0, error: 'Storage not configured' }
    }

    try {
      const supabase = getSupabaseServerClient()

      // List all cached files
      const { data: files, error: listError } = await supabase.storage
        .from(CACHE_CONFIG.cacheBucket)
        .list(CACHE_CONFIG.cacheFolder, { limit: 1000 })

      if (listError) {
        return { success: false, deleted: 0, error: listError.message }
      }

      if (!files || files.length === 0) {
        return { success: true, deleted: 0 }
      }

      // Delete all files
      const paths = files
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => `${CACHE_CONFIG.cacheFolder}/${f.name}`)

      if (paths.length === 0) {
        return { success: true, deleted: 0 }
      }

      const { error: deleteError } = await supabase.storage
        .from(CACHE_CONFIG.cacheBucket)
        .remove(paths)

      if (deleteError) {
        return { success: false, deleted: 0, error: deleteError.message }
      }

      return { success: true, deleted: paths.length }
    } catch (error: any) {
      return { success: false, deleted: 0, error: error.message }
    }
  }
}

// Singleton instance
export const imageCache = new ImageCache()

// Export utility functions
export const getCachedImage = imageCache.get.bind(imageCache)
export const cacheImage = imageCache.set.bind(imageCache)
export const getCacheStats = imageCache.getStats.bind(imageCache)
export const clearMemoryCache = imageCache.clearMemory.bind(imageCache)
export const clearStorageCache = imageCache.clearStorage.bind(imageCache)
export const generateImageHash = imageCache.generateHash.bind(imageCache)

export default imageCache
