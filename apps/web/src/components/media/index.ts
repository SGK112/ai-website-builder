// Unified Media Library
export { UnifiedMediaLibrary } from './UnifiedMediaLibrary'
export { MediaPickerModal } from './MediaPickerModal'

// Types
export interface MediaItem {
  id: string
  url: string
  thumbnail: string
  title: string
  source: 'uploads' | 'unsplash' | 'pexels' | 'pixabay' | 'canva' | 'url' | 'ai'
  width?: number
  height?: number
  author?: string
  authorUrl?: string
}
