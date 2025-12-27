'use client'

import { UnifiedMediaLibrary } from './UnifiedMediaLibrary'

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

interface MediaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
  allowMultiple?: boolean
}

export function MediaPickerModal({ isOpen, onClose, onSelect, allowMultiple = false }: MediaPickerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200">
        <UnifiedMediaLibrary
          onSelect={(item) => {
            onSelect(item)
            if (!allowMultiple) {
              onClose()
            }
          }}
          onClose={onClose}
          allowMultiple={allowMultiple}
        />
      </div>
    </div>
  )
}
