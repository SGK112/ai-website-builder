'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Type, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  POPULAR_FONTS,
  FONT_PAIRINGS,
  searchFonts,
  generateFontUrl,
  GoogleFont,
} from '@/lib/google-fonts'

interface FontPickerProps {
  selectedHeadingFont: string
  selectedBodyFont: string
  onSelectHeadingFont: (font: string) => void
  onSelectBodyFont: (font: string) => void
  onClose?: () => void
}

type Tab = 'heading' | 'body' | 'pairings'

export function FontPicker({
  selectedHeadingFont,
  selectedBodyFont,
  onSelectHeadingFont,
  onSelectBodyFont,
  onClose,
}: FontPickerProps) {
  const [tab, setTab] = useState<Tab>('heading')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())

  const filteredFonts = searchFonts(search).filter(
    font => category === 'all' || font.category === category
  )

  // Load font for preview
  const loadFont = (fontFamily: string) => {
    if (loadedFonts.has(fontFamily)) return

    const link = document.createElement('link')
    link.href = generateFontUrl([fontFamily])
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    setLoadedFonts(prev => new Set([...prev, fontFamily]))
  }

  // Preload visible fonts
  useEffect(() => {
    filteredFonts.slice(0, 10).forEach(font => loadFont(font.family))
  }, [filteredFonts])

  const handleSelectFont = (font: GoogleFont) => {
    if (tab === 'heading') {
      onSelectHeadingFont(font.family)
    } else if (tab === 'body') {
      onSelectBodyFont(font.family)
    }
  }

  const handleSelectPairing = (pairing: typeof FONT_PAIRINGS[0]) => {
    loadFont(pairing.heading)
    loadFont(pairing.body)
    onSelectHeadingFont(pairing.heading)
    onSelectBodyFont(pairing.body)
  }

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'sans-serif', label: 'Sans Serif' },
    { id: 'serif', label: 'Serif' },
    { id: 'display', label: 'Display' },
    { id: 'handwriting', label: 'Script' },
    { id: 'monospace', label: 'Mono' },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-purple-400" />
            Font Picker
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm"
            >
              Done
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
          {(['heading', 'body', 'pairings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition capitalize',
                tab === t
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {t === 'pairings' ? (
                <span className="flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pairings
                </span>
              ) : (
                t
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Selection */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Heading Font</p>
            <p
              className="text-white font-medium truncate"
              style={{ fontFamily: `'${selectedHeadingFont}', sans-serif` }}
            >
              {selectedHeadingFont}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Body Font</p>
            <p
              className="text-white truncate"
              style={{ fontFamily: `'${selectedBodyFont}', sans-serif` }}
            >
              {selectedBodyFont}
            </p>
          </div>
        </div>
      </div>

      {tab !== 'pairings' && (
        <>
          {/* Search */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="px-3 py-2 border-b border-slate-800 flex gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition',
                  category === cat.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Font List or Pairings */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'pairings' ? (
          <div className="p-3 space-y-2">
            {FONT_PAIRINGS.map((pairing, idx) => {
              // Load fonts for preview
              useEffect(() => {
                loadFont(pairing.heading)
                loadFont(pairing.body)
              }, [])

              const isSelected =
                selectedHeadingFont === pairing.heading &&
                selectedBodyFont === pairing.body

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectPairing(pairing)}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition',
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-400 font-medium">
                      {pairing.style}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <p
                    className="text-xl text-white mb-1"
                    style={{ fontFamily: `'${pairing.heading}', sans-serif` }}
                  >
                    {pairing.heading}
                  </p>
                  <p
                    className="text-sm text-slate-400"
                    style={{ fontFamily: `'${pairing.body}', sans-serif` }}
                  >
                    {pairing.body} - The quick brown fox jumps over the lazy dog.
                  </p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {filteredFonts.map((font) => {
              const isSelected =
                (tab === 'heading' && selectedHeadingFont === font.family) ||
                (tab === 'body' && selectedBodyFont === font.family)

              return (
                <button
                  key={font.family}
                  onClick={() => handleSelectFont(font)}
                  onMouseEnter={() => loadFont(font.family)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg transition',
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <div>
                    <p
                      className="text-lg font-medium"
                      style={{ fontFamily: `'${font.family}', ${font.category}` }}
                    >
                      {font.family}
                    </p>
                    <p className={cn(
                      'text-xs capitalize',
                      isSelected ? 'text-purple-200' : 'text-slate-500'
                    )}>
                      {font.category}
                    </p>
                  </div>
                  {isSelected && <Check className="w-5 h-5" />}
                </button>
              )
            })}

            {filteredFonts.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No fonts found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="p-4 border-t border-slate-800 bg-white">
        <p
          className="text-2xl text-slate-900 mb-2"
          style={{ fontFamily: `'${selectedHeadingFont}', sans-serif` }}
        >
          Heading Preview
        </p>
        <p
          className="text-slate-600"
          style={{ fontFamily: `'${selectedBodyFont}', sans-serif` }}
        >
          Body text preview. The quick brown fox jumps over the lazy dog.
          This is how your website content will look.
        </p>
      </div>
    </div>
  )
}
