'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Type,
  Image,
  Link,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Check,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuickEditCardProps {
  isOpen: boolean
  onClose: () => void
  elementType: 'text' | 'image' | 'button' | 'link' | 'section' | 'container'
  initialData: {
    content?: string
    src?: string
    alt?: string
    href?: string
    backgroundColor?: string
    textColor?: string
    fontSize?: string
    fontWeight?: string
    textAlign?: 'left' | 'center' | 'right'
    padding?: string
    borderRadius?: string
  }
  onSave: (data: Record<string, string>) => void
  onDelete?: () => void
  onDuplicate?: () => void
  position?: { x: number; y: number }
}

const COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#8b5cf6', '#a855f7', '#7c3aed', '#6d28d9',
  '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
  '#10b981', '#059669', '#047857', '#065f46',
  '#f59e0b', '#d97706', '#b45309', '#92400e',
  '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
  '#1f2937', '#374151', '#4b5563', '#6b7280',
  '#000000', '#111827', '#1e293b', '#334155',
]

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px', '56px', '64px']

export function QuickEditCard({
  isOpen,
  onClose,
  elementType,
  initialData,
  onSave,
  onDelete,
  onDuplicate,
  position,
}: QuickEditCardProps) {
  const [data, setData] = useState(initialData)
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'ai'>('content')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSave = () => {
    onSave(data as Record<string, string>)
    onClose()
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)

    // Simulate AI generation - in real implementation, call API
    setTimeout(() => {
      if (elementType === 'text') {
        setData(prev => ({ ...prev, content: `AI generated: ${aiPrompt}` }))
      }
      setIsGenerating(false)
      setAiPrompt('')
    }, 1000)
  }

  if (!isOpen) return null

  const cardStyle = position
    ? { left: Math.min(position.x, window.innerWidth - 360), top: Math.min(position.y, window.innerHeight - 400) }
    : {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-[340px] max-h-[85vh] overflow-hidden",
          position ? "absolute" : ""
        )}
        style={cardStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-sm font-medium text-white capitalize">
              Edit {elementType}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {['content', 'style', 'ai'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={cn(
                "flex-1 px-4 py-2 text-xs font-medium transition capitalize",
                activeTab === tab
                  ? "text-purple-400 border-b-2 border-purple-400 bg-slate-800/50"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab === 'ai' ? 'AI Assist' : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {activeTab === 'content' && (
            <>
              {(elementType === 'text' || elementType === 'button') && (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Text Content</label>
                  <textarea
                    value={data.content || ''}
                    onChange={(e) => setData({ ...data, content: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter text..."
                  />
                </div>
              )}

              {elementType === 'image' && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Image URL</label>
                    <input
                      type="text"
                      value={data.src || ''}
                      onChange={(e) => setData({ ...data, src: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Alt Text</label>
                    <input
                      type="text"
                      value={data.alt || ''}
                      onChange={(e) => setData({ ...data, alt: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the image..."
                    />
                  </div>
                </>
              )}

              {(elementType === 'link' || elementType === 'button') && (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Link URL</label>
                  <input
                    type="text"
                    value={data.href || ''}
                    onChange={(e) => setData({ ...data, href: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'style' && (
            <>
              {/* Text Alignment */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Text Align</label>
                <div className="flex gap-1">
                  {[
                    { value: 'left', icon: AlignLeft },
                    { value: 'center', icon: AlignCenter },
                    { value: 'right', icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setData({ ...data, textAlign: value as 'left' | 'center' | 'right' })}
                      className={cn(
                        "flex-1 p-2 rounded-lg transition",
                        data.textAlign === value
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Font Size</label>
                <select
                  value={data.fontSize || '16px'}
                  onChange={(e) => setData({ ...data, fontSize: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Colors */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Background Color</label>
                <div className="grid grid-cols-8 gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setData({ ...data, backgroundColor: color })}
                      className={cn(
                        "w-7 h-7 rounded border-2 transition",
                        data.backgroundColor === color ? "border-purple-500 scale-110" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Text Color</label>
                <div className="grid grid-cols-8 gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setData({ ...data, textColor: color })}
                      className={cn(
                        "w-7 h-7 rounded border-2 transition",
                        data.textColor === color ? "border-purple-500 scale-110" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Border Radius</label>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={parseInt(data.borderRadius || '0')}
                  onChange={(e) => setData({ ...data, borderRadius: `${e.target.value}px` })}
                  className="w-full"
                />
                <div className="text-xs text-slate-500 text-right">{data.borderRadius || '0px'}</div>
              </div>
            </>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">AI Prompt</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what you want..."
                />
              </div>
              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                AI will help create or improve your content
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-700 bg-slate-800/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex-1 bg-purple-600 hover:bg-purple-500"
          >
            <Check className="w-4 h-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}
