/**
 * Supabase Client & Storage Utility
 *
 * Handles:
 * - Client initialization (server & browser)
 * - Image uploads to storage buckets
 * - File management (list, delete, get URLs)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Storage bucket names
export const STORAGE_BUCKETS = {
  UPLOADS: 'webstew-uploads',
  THUMBNAILS: 'project-thumbnails',
  TEMPLATES: 'template-assets',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

// Singleton clients
let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

/**
 * Get Supabase client for browser/client-side usage
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not configured')
  }

  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return browserClient
}

/**
 * Get Supabase client for server-side usage (with service role key)
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL not configured')
  }

  const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('Supabase key not configured')
  }

  if (!serverClient) {
    serverClient = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return serverClient
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

// ============================================
// Storage Operations
// ============================================

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface UploadOptions {
  bucket?: StorageBucket
  folder?: string
  fileName?: string
  contentType?: string
  upsert?: boolean
}

/**
 * Generate a unique file name
 */
function generateFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.split('.').pop() || 'png'
  const safeName = prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
  return `${safeName}.${ext}`
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File | Blob | Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    bucket = STORAGE_BUCKETS.UPLOADS,
    folder = 'images',
    fileName,
    contentType,
    upsert = false,
  } = options

  try {
    const supabase = getSupabaseServerClient()

    // Generate file name
    const name = fileName || generateFileName(
      file instanceof File ? file.name : 'image.png',
      folder.replace('/', '-')
    )
    const path = folder ? `${folder}/${name}` : name

    // Determine content type
    let mimeType = contentType
    if (!mimeType) {
      if (file instanceof File) {
        mimeType = file.type
      } else if (name.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (name.endsWith('.webp')) {
        mimeType = 'image/webp'
      } else if (name.endsWith('.gif')) {
        mimeType = 'image/gif'
      } else {
        mimeType = 'application/octet-stream'
      }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: mimeType,
        upsert,
        cacheControl: '3600',
      })

    if (error) {
      console.error('[Supabase] Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error('[Supabase] Upload failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Upload an image from URL (fetch and re-upload)
 */
export async function uploadFromUrl(
  imageUrl: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Handle base64 data URLs
    if (imageUrl.startsWith('data:')) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        return { success: false, error: 'Invalid data URL' }
      }

      const [, mimeType, base64Data] = matches
      const buffer = Buffer.from(base64Data, 'base64')
      const ext = mimeType.split('/')[1] || 'png'

      return uploadFile(buffer, {
        ...options,
        contentType: mimeType,
        fileName: options.fileName || generateFileName(`image.${ext}`),
      })
    }

    // Fetch image from URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { success: false, error: `Failed to fetch image: ${response.status}` }
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await response.arrayBuffer())

    // Determine extension from content type
    const ext = contentType.split('/')[1]?.split(';')[0] || 'png'

    return uploadFile(buffer, {
      ...options,
      contentType,
      fileName: options.fileName || generateFileName(`image.${ext}`),
    })
  } catch (error: any) {
    console.error('[Supabase] Upload from URL failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Upload multiple images in parallel
 */
export async function uploadMultiple(
  files: Array<{ file: File | Blob | Buffer; options?: UploadOptions }>,
  concurrency: number = 3
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  // Process in batches
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(({ file, options }) => uploadFile(file, options))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  path: string,
  bucket: StorageBucket = STORAGE_BUCKETS.UPLOADS
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient()

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  folder: string = '',
  bucket: StorageBucket = STORAGE_BUCKETS.UPLOADS,
  limit: number = 100
): Promise<{ files: string[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      return { files: [], error: error.message }
    }

    return {
      files: data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => folder ? `${folder}/${f.name}` : f.name),
    }
  } catch (error: any) {
    return { files: [], error: error.message }
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(
  path: string,
  bucket: StorageBucket = STORAGE_BUCKETS.UPLOADS
): string {
  const supabase = getSupabaseServerClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Get a signed URL for temporary access (for private buckets)
 */
export async function getSignedUrl(
  path: string,
  bucket: StorageBucket = STORAGE_BUCKETS.UPLOADS,
  expiresIn: number = 3600 // 1 hour
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      return { error: error.message }
    }

    return { url: data.signedUrl }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============================================
// Project-specific helpers
// ============================================

/**
 * Upload a generated AI image
 */
export async function uploadGeneratedImage(
  imageData: string | Buffer,
  projectId: string,
  imageType: 'hero' | 'product' | 'team' | 'feature' | 'gallery' | 'general' = 'general'
): Promise<UploadResult> {
  const folder = `projects/${projectId}/${imageType}`

  if (typeof imageData === 'string') {
    return uploadFromUrl(imageData, {
      bucket: STORAGE_BUCKETS.UPLOADS,
      folder,
    })
  }

  return uploadFile(imageData, {
    bucket: STORAGE_BUCKETS.UPLOADS,
    folder,
  })
}

/**
 * Upload a project thumbnail
 */
export async function uploadThumbnail(
  imageData: string | Buffer,
  projectId: string
): Promise<UploadResult> {
  if (typeof imageData === 'string') {
    return uploadFromUrl(imageData, {
      bucket: STORAGE_BUCKETS.THUMBNAILS,
      folder: 'projects',
      fileName: `${projectId}.png`,
      upsert: true,
    })
  }

  return uploadFile(imageData, {
    bucket: STORAGE_BUCKETS.THUMBNAILS,
    folder: 'projects',
    fileName: `${projectId}.png`,
    contentType: 'image/png',
    upsert: true,
  })
}

/**
 * Get all images for a project
 */
export async function getProjectImages(
  projectId: string
): Promise<{ images: string[]; error?: string }> {
  return listFiles(`projects/${projectId}`, STORAGE_BUCKETS.UPLOADS)
}

/**
 * Delete all images for a project
 */
export async function deleteProjectImages(
  projectId: string
): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const { files, error } = await getProjectImages(projectId)

    if (error) {
      return { success: false, deleted: 0, error }
    }

    if (files.length === 0) {
      return { success: true, deleted: 0 }
    }

    const supabase = getSupabaseServerClient()
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKETS.UPLOADS)
      .remove(files)

    if (deleteError) {
      return { success: false, deleted: 0, error: deleteError.message }
    }

    return { success: true, deleted: files.length }
  } catch (error: any) {
    return { success: false, deleted: 0, error: error.message }
  }
}

export default {
  getBrowserClient: getSupabaseBrowserClient,
  getServerClient: getSupabaseServerClient,
  isConfigured: isSupabaseConfigured,
  upload: uploadFile,
  uploadFromUrl,
  uploadMultiple,
  delete: deleteFile,
  list: listFiles,
  getPublicUrl,
  getSignedUrl,
  uploadGeneratedImage,
  uploadThumbnail,
  getProjectImages,
  deleteProjectImages,
  BUCKETS: STORAGE_BUCKETS,
}
