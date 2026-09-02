'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { UsageDashboard } from './UsageDashboard'
import { useRouter } from 'next/navigation'
import { useModalA11y } from '@/hooks/useModalA11y'

interface UsageModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UsageModal({ isOpen, onClose }: UsageModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, onClose)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="usage-modal-title" className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-[#0f0f1a] rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="usage-modal-title" className="text-lg font-semibold text-foreground">Usage & Credits</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <UsageDashboard
            onUpgrade={() => {
              onClose()
              router.push('/upgrade')
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default UsageModal
