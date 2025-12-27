'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Palette,
  Type,
  Ruler,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ColorPalette {
  name: string
  colors: {
    name: string
    value: string
    shade?: number
  }[]
}

interface Typography {
  name: string
  fontFamily: string
  fallback: string
  weights: number[]
}

interface Spacing {
  name: string
  value: string
  pixels: number
}

interface DesignTokens {
  colors: ColorPalette[]
  typography: Typography[]
  spacing: Spacing[]
  borderRadius: Spacing[]
  shadows: { name: string; value: string }[]
}

const DEFAULT_TOKENS: DesignTokens = {
  colors: [
    {
      name: 'Primary',
      colors: [
        { name: 'primary-50', value: '#f0f9ff', shade: 50 },
        { name: 'primary-100', value: '#e0f2fe', shade: 100 },
        { name: 'primary-200', value: '#bae6fd', shade: 200 },
        { name: 'primary-300', value: '#7dd3fc', shade: 300 },
        { name: 'primary-400', value: '#38bdf8', shade: 400 },
        { name: 'primary-500', value: '#0ea5e9', shade: 500 },
        { name: 'primary-600', value: '#0284c7', shade: 600 },
        { name: 'primary-700', value: '#0369a1', shade: 700 },
        { name: 'primary-800', value: '#075985', shade: 800 },
        { name: 'primary-900', value: '#0c4a6e', shade: 900 },
      ],
    },
    {
      name: 'Neutral',
      colors: [
        { name: 'gray-50', value: '#f8fafc', shade: 50 },
        { name: 'gray-100', value: '#f1f5f9', shade: 100 },
        { name: 'gray-200', value: '#e2e8f0', shade: 200 },
        { name: 'gray-300', value: '#cbd5e1', shade: 300 },
        { name: 'gray-400', value: '#94a3b8', shade: 400 },
        { name: 'gray-500', value: '#64748b', shade: 500 },
        { name: 'gray-600', value: '#475569', shade: 600 },
        { name: 'gray-700', value: '#334155', shade: 700 },
        { name: 'gray-800', value: '#1e293b', shade: 800 },
        { name: 'gray-900', value: '#0f172a', shade: 900 },
      ],
    },
    {
      name: 'Accent',
      colors: [
        { name: 'accent', value: '#8b5cf6' },
        { name: 'success', value: '#22c55e' },
        { name: 'warning', value: '#f59e0b' },
        { name: 'error', value: '#ef4444' },
      ],
    },
  ],
  typography: [
    {
      name: 'Heading',
      fontFamily: 'Inter',
      fallback: 'system-ui, sans-serif',
      weights: [600, 700, 800],
    },
    {
      name: 'Body',
      fontFamily: 'Inter',
      fallback: 'system-ui, sans-serif',
      weights: [400, 500, 600],
    },
    {
      name: 'Mono',
      fontFamily: 'JetBrains Mono',
      fallback: 'monospace',
      weights: [400, 500],
    },
  ],
  spacing: [
    { name: 'xs', value: '0.25rem', pixels: 4 },
    { name: 'sm', value: '0.5rem', pixels: 8 },
    { name: 'md', value: '1rem', pixels: 16 },
    { name: 'lg', value: '1.5rem', pixels: 24 },
    { name: 'xl', value: '2rem', pixels: 32 },
    { name: '2xl', value: '3rem', pixels: 48 },
    { name: '3xl', value: '4rem', pixels: 64 },
  ],
  borderRadius: [
    { name: 'none', value: '0', pixels: 0 },
    { name: 'sm', value: '0.25rem', pixels: 4 },
    { name: 'md', value: '0.5rem', pixels: 8 },
    { name: 'lg', value: '1rem', pixels: 16 },
    { name: 'xl', value: '1.5rem', pixels: 24 },
    { name: 'full', value: '9999px', pixels: 9999 },
  ],
  shadows: [
    { name: 'sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
    { name: 'md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
    { name: 'lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
    { name: 'xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
  ],
}

// Predefined color schemes
const COLOR_SCHEMES = [
  {
    name: 'Ocean',
    primary: '#0ea5e9',
    accent: '#8b5cf6',
  },
  {
    name: 'Forest',
    primary: '#22c55e',
    accent: '#14b8a6',
  },
  {
    name: 'Sunset',
    primary: '#f97316',
    accent: '#f43f5e',
  },
  {
    name: 'Midnight',
    primary: '#6366f1',
    accent: '#a855f7',
  },
  {
    name: 'Rose',
    primary: '#ec4899',
    accent: '#f43f5e',
  },
  {
    name: 'Golden',
    primary: '#eab308',
    accent: '#f97316',
  },
]

interface DesignSystemProps {
  onUpdateTokens: (tokens: DesignTokens) => void
  onGenerateCSS: (css: string) => void
}

export function DesignSystem({ onUpdateTokens, onGenerateCSS }: DesignSystemProps) {
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['colors']))
  const [copied, setCopied] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Update color
  const updateColor = (paletteIndex: number, colorIndex: number, value: string) => {
    setTokens(prev => {
      const newTokens = { ...prev }
      newTokens.colors = [...prev.colors]
      newTokens.colors[paletteIndex] = {
        ...prev.colors[paletteIndex],
        colors: [...prev.colors[paletteIndex].colors],
      }
      newTokens.colors[paletteIndex].colors[colorIndex] = {
        ...prev.colors[paletteIndex].colors[colorIndex],
        value,
      }
      return newTokens
    })
  }

  // Apply color scheme
  const applyColorScheme = (scheme: typeof COLOR_SCHEMES[0]) => {
    // Generate shades from primary color
    const generateShades = (hex: string): string[] => {
      const shades: string[] = []
      for (let i = 0; i < 10; i++) {
        const lightness = 95 - (i * 9)
        shades.push(adjustBrightness(hex, lightness - 50))
      }
      return shades
    }

    const primaryShades = generateShades(scheme.primary)

    setTokens(prev => ({
      ...prev,
      colors: [
        {
          name: 'Primary',
          colors: primaryShades.map((value, i) => ({
            name: `primary-${(i + 1) * 100 - 50}`,
            value,
            shade: (i + 1) * 100 - 50,
          })),
        },
        prev.colors[1], // Keep neutral
        {
          name: 'Accent',
          colors: [
            { name: 'accent', value: scheme.accent },
            { name: 'success', value: '#22c55e' },
            { name: 'warning', value: '#f59e0b' },
            { name: 'error', value: '#ef4444' },
          ],
        },
      ],
    }))
  }

  // Generate CSS variables
  const generateCSS = useCallback(() => {
    let css = ':root {\n'

    // Colors
    tokens.colors.forEach(palette => {
      palette.colors.forEach(color => {
        css += `  --${color.name}: ${color.value};\n`
      })
    })

    // Spacing
    tokens.spacing.forEach(space => {
      css += `  --spacing-${space.name}: ${space.value};\n`
    })

    // Border radius
    tokens.borderRadius.forEach(radius => {
      css += `  --radius-${radius.name}: ${radius.value};\n`
    })

    // Typography
    tokens.typography.forEach(font => {
      css += `  --font-${font.name.toLowerCase()}: "${font.fontFamily}", ${font.fallback};\n`
    })

    // Shadows
    tokens.shadows.forEach(shadow => {
      css += `  --shadow-${shadow.name}: ${shadow.value};\n`
    })

    css += '}\n'

    return css
  }, [tokens])

  // Copy to clipboard
  const copyColor = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 2000)
  }

  // Generate with AI
  const generateWithAI = async () => {
    setGenerating(true)
    try {
      // This would call your AI endpoint to generate a custom design system
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Generate a modern, professional color palette for a SaaS website. Return as JSON with primary colors (10 shades), accent colors, and semantic colors.',
          type: 'design-system',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Parse and apply the generated design system
        console.log('Generated design:', data)
      }
    } catch (error) {
      console.error('AI generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Update parent when tokens change
  useEffect(() => {
    onUpdateTokens(tokens)
  }, [tokens, onUpdateTokens])

  return (
    <div className="p-3 space-y-3">
      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => onGenerateCSS(generateCSS())}
          size="sm"
          variant="outline"
          className="flex-1 border-slate-700 text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          Export CSS
        </Button>
        <Button
          onClick={generateWithAI}
          disabled={generating}
          size="sm"
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
        >
          {generating ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          AI Generate
        </Button>
      </div>

      {/* Color Schemes */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase">Quick Schemes</h4>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_SCHEMES.map(scheme => (
            <button
              key={scheme.name}
              onClick={() => applyColorScheme(scheme)}
              className="group p-2 rounded-lg border border-slate-700 hover:border-slate-600 transition text-center"
            >
              <div className="flex justify-center gap-1 mb-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: scheme.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: scheme.accent }}
                />
              </div>
              <span className="text-xs text-slate-400 group-hover:text-white transition">
                {scheme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Colors Section */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('colors')}
          className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Colors</span>
          </div>
          {expandedSections.has('colors') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.has('colors') && (
          <div className="p-3 space-y-4">
            {tokens.colors.map((palette, paletteIndex) => (
              <div key={palette.name}>
                <h5 className="text-xs font-medium text-slate-400 mb-2">{palette.name}</h5>
                <div className="grid grid-cols-5 gap-1">
                  {palette.colors.map((color, colorIndex) => (
                    <div key={color.name} className="relative group">
                      <button
                        onClick={() => copyColor(color.value)}
                        className="w-full aspect-square rounded-md border border-slate-700 hover:border-slate-500 transition overflow-hidden"
                        style={{ backgroundColor: color.value }}
                        title={`${color.name}: ${color.value}`}
                      >
                        {copied === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {color.shade || color.name.split('-').pop()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Typography Section */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('typography')}
          className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Typography</span>
          </div>
          {expandedSections.has('typography') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.has('typography') && (
          <div className="p-3 space-y-3">
            {tokens.typography.map((font, index) => (
              <div key={font.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{font.name}</span>
                </div>
                <div
                  className="p-3 bg-slate-800 rounded-lg"
                  style={{ fontFamily: `"${font.fontFamily}", ${font.fallback}` }}
                >
                  <p className="text-lg text-white mb-1">The quick brown fox</p>
                  <p className="text-xs text-slate-500">
                    {font.fontFamily} • Weights: {font.weights.join(', ')}
                  </p>
                </div>
              </div>
            ))}

            {/* Font size scale */}
            <div className="mt-4">
              <h5 className="text-xs font-medium text-slate-400 mb-2">Type Scale</h5>
              <div className="space-y-1">
                {[
                  { name: 'xs', size: '0.75rem' },
                  { name: 'sm', size: '0.875rem' },
                  { name: 'base', size: '1rem' },
                  { name: 'lg', size: '1.125rem' },
                  { name: 'xl', size: '1.25rem' },
                  { name: '2xl', size: '1.5rem' },
                  { name: '3xl', size: '1.875rem' },
                  { name: '4xl', size: '2.25rem' },
                ].map(scale => (
                  <div
                    key={scale.name}
                    className="flex items-center justify-between p-2 hover:bg-slate-800 rounded"
                  >
                    <span className="text-white" style={{ fontSize: scale.size }}>
                      Aa
                    </span>
                    <span className="text-xs text-slate-500">
                      {scale.name} ({scale.size})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacing Section */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('spacing')}
          className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Spacing & Radius</span>
          </div>
          {expandedSections.has('spacing') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSections.has('spacing') && (
          <div className="p-3 space-y-4">
            {/* Spacing scale */}
            <div>
              <h5 className="text-xs font-medium text-slate-400 mb-2">Spacing Scale</h5>
              <div className="space-y-1">
                {tokens.spacing.map(space => (
                  <div
                    key={space.name}
                    className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded"
                  >
                    <div
                      className="bg-purple-500 rounded"
                      style={{ width: space.pixels, height: 16, minWidth: 4 }}
                    />
                    <span className="text-sm text-white flex-1">{space.name}</span>
                    <span className="text-xs text-slate-500">{space.pixels}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Border radius */}
            <div>
              <h5 className="text-xs font-medium text-slate-400 mb-2">Border Radius</h5>
              <div className="grid grid-cols-3 gap-2">
                {tokens.borderRadius.slice(0, 6).map(radius => (
                  <div
                    key={radius.name}
                    className="flex flex-col items-center p-2 hover:bg-slate-800 rounded"
                  >
                    <div
                      className="w-10 h-10 bg-purple-500 mb-1"
                      style={{ borderRadius: radius.value }}
                    />
                    <span className="text-xs text-slate-400">{radius.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div>
              <h5 className="text-xs font-medium text-slate-400 mb-2">Shadows</h5>
              <div className="grid grid-cols-2 gap-2">
                {tokens.shadows.map(shadow => (
                  <div
                    key={shadow.name}
                    className="p-3 bg-slate-800 rounded-lg"
                  >
                    <div
                      className="w-full h-8 bg-white rounded mb-2"
                      style={{ boxShadow: shadow.value }}
                    />
                    <span className="text-xs text-slate-400">{shadow.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}
