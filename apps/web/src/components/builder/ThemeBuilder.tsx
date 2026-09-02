'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Download,
  Upload,
  Sun,
  Moon,
  Droplets,
  Square,
  Circle,
  RotateCcw,
  Wand2,
  Save,
  Layers,
  Settings,
  X,
  Grid3X3,
  Shuffle,
  Lock,
  Unlock,
  Heart,
  Star,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { stylePresets, StylePreset, applyThemeToHtml } from '@/lib/builder/style-presets'

// ============================================================================
// TYPES
// ============================================================================

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  backgroundAlt: string
  foreground: string
  foregroundMuted: string
  border: string
  success: string
  warning: string
  error: string
}

interface ThemeTypography {
  headingFont: string
  bodyFont: string
  monoFont: string
  baseSize: number
  scaleRatio: number
}

interface ThemeSpacing {
  baseUnit: number
  borderRadius: number
  containerWidth: number
}

interface ThemeEffects {
  shadowIntensity: number
  blurIntensity: number
  glassEffect: boolean
  gradientAccent: boolean
}

interface Theme {
  id: string
  name: string
  mode: 'light' | 'dark'
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  effects: ThemeEffects
  createdAt: Date
  isCustom: boolean
}

type ColorHarmony = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'monochromatic'

interface ThemeBuilderProps {
  currentHtml: string
  onThemeApply: (html: string, theme: Theme) => void
  onClose?: () => void
  className?: string
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) { r = c; g = x; b = 0 }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0 }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateHarmony(baseColor: string, harmony: ColorHarmony): string[] {
  const { h, s, l } = hexToHsl(baseColor)
  const colors: string[] = [baseColor]

  switch (harmony) {
    case 'complementary':
      colors.push(hslToHex((h + 180) % 360, s, l))
      break
    case 'analogous':
      colors.push(hslToHex((h + 30) % 360, s, l))
      colors.push(hslToHex((h + 330) % 360, s, l))
      break
    case 'triadic':
      colors.push(hslToHex((h + 120) % 360, s, l))
      colors.push(hslToHex((h + 240) % 360, s, l))
      break
    case 'split-complementary':
      colors.push(hslToHex((h + 150) % 360, s, l))
      colors.push(hslToHex((h + 210) % 360, s, l))
      break
    case 'tetradic':
      colors.push(hslToHex((h + 90) % 360, s, l))
      colors.push(hslToHex((h + 180) % 360, s, l))
      colors.push(hslToHex((h + 270) % 360, s, l))
      break
    case 'monochromatic':
      colors.push(hslToHex(h, s, Math.max(0, l - 20)))
      colors.push(hslToHex(h, s, Math.min(100, l + 20)))
      break
  }

  return colors
}

function generateColorScale(baseColor: string): string[] {
  const { h, s } = hexToHsl(baseColor)
  return [
    hslToHex(h, Math.min(100, s + 5), 97),  // 50
    hslToHex(h, Math.min(100, s + 5), 94),  // 100
    hslToHex(h, s, 86),                      // 200
    hslToHex(h, s, 77),                      // 300
    hslToHex(h, s, 66),                      // 400
    hslToHex(h, s, 55),                      // 500 (base)
    hslToHex(h, s, 45),                      // 600
    hslToHex(h, s, 35),                      // 700
    hslToHex(h, s, 25),                      // 800
    hslToHex(h, s, 15),                      // 900
  ]
}

// ============================================================================
// PRESET THEMES
// ============================================================================

const PRESET_THEMES: Omit<Theme, 'id' | 'createdAt'>[] = [
  {
    name: 'Midnight Violet',
    mode: 'dark',
    colors: {
      primary: '#8b5cf6',
      secondary: '#d946ef',
      accent: '#06b6d4',
      background: '#0a0a0b',
      backgroundAlt: '#18181b',
      foreground: '#ffffff',
      foregroundMuted: '#a1a1aa',
      border: 'rgba(255,255,255,0.1)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      monoFont: 'JetBrains Mono',
      baseSize: 16,
      scaleRatio: 1.25,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 12,
      containerWidth: 1280,
    },
    effects: {
      shadowIntensity: 0.5,
      blurIntensity: 12,
      glassEffect: true,
      gradientAccent: true,
    },
    isCustom: false,
  },
  {
    name: 'Ocean Breeze',
    mode: 'dark',
    colors: {
      primary: '#06b6d4',
      secondary: '#22d3ee',
      accent: '#8b5cf6',
      background: '#0c1222',
      backgroundAlt: '#1e293b',
      foreground: '#f8fafc',
      foregroundMuted: '#94a3b8',
      border: 'rgba(148,163,184,0.2)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f43f5e',
    },
    typography: {
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
      monoFont: 'Fira Code',
      baseSize: 16,
      scaleRatio: 1.333,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 16,
      containerWidth: 1200,
    },
    effects: {
      shadowIntensity: 0.4,
      blurIntensity: 16,
      glassEffect: true,
      gradientAccent: true,
    },
    isCustom: false,
  },
  {
    name: 'Warm Sunset',
    mode: 'dark',
    colors: {
      primary: '#f97316',
      secondary: '#fbbf24',
      accent: '#ec4899',
      background: '#1c1917',
      backgroundAlt: '#292524',
      foreground: '#fafaf9',
      foregroundMuted: '#a8a29e',
      border: 'rgba(168,162,158,0.2)',
      success: '#84cc16',
      warning: '#eab308',
      error: '#dc2626',
    },
    typography: {
      headingFont: 'DM Sans',
      bodyFont: 'DM Sans',
      monoFont: 'JetBrains Mono',
      baseSize: 16,
      scaleRatio: 1.25,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 20,
      containerWidth: 1280,
    },
    effects: {
      shadowIntensity: 0.6,
      blurIntensity: 10,
      glassEffect: true,
      gradientAccent: true,
    },
    isCustom: false,
  },
  {
    name: 'Clean White',
    mode: 'light',
    colors: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#0891b2',
      background: '#ffffff',
      backgroundAlt: '#f8fafc',
      foreground: '#0f172a',
      foregroundMuted: '#64748b',
      border: 'rgba(15,23,42,0.1)',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      monoFont: 'Fira Code',
      baseSize: 16,
      scaleRatio: 1.25,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 8,
      containerWidth: 1200,
    },
    effects: {
      shadowIntensity: 0.1,
      blurIntensity: 8,
      glassEffect: false,
      gradientAccent: false,
    },
    isCustom: false,
  },
  {
    name: 'Soft Rose',
    mode: 'light',
    colors: {
      primary: '#e11d48',
      secondary: '#f43f5e',
      accent: '#be185d',
      background: '#fff1f2',
      backgroundAlt: '#ffe4e6',
      foreground: '#1f2937',
      foregroundMuted: '#6b7280',
      border: 'rgba(225,29,72,0.15)',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      monoFont: 'Fira Code',
      baseSize: 16,
      scaleRatio: 1.25,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 16,
      containerWidth: 1200,
    },
    effects: {
      shadowIntensity: 0.1,
      blurIntensity: 8,
      glassEffect: false,
      gradientAccent: true,
    },
    isCustom: false,
  },
  {
    name: 'Mint Fresh',
    mode: 'light',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#0d9488',
      background: '#ecfdf5',
      backgroundAlt: '#d1fae5',
      foreground: '#064e3b',
      foregroundMuted: '#047857',
      border: 'rgba(5,150,105,0.15)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
      monoFont: 'JetBrains Mono',
      baseSize: 16,
      scaleRatio: 1.2,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 12,
      containerWidth: 1280,
    },
    effects: {
      shadowIntensity: 0.08,
      blurIntensity: 6,
      glassEffect: false,
      gradientAccent: false,
    },
    isCustom: false,
  },
  {
    name: 'Forest Night',
    mode: 'dark',
    colors: {
      primary: '#22c55e',
      secondary: '#84cc16',
      accent: '#14b8a6',
      background: '#0a1f0a',
      backgroundAlt: '#14532d',
      foreground: '#ecfdf5',
      foregroundMuted: '#86efac',
      border: 'rgba(134,239,172,0.15)',
      success: '#4ade80',
      warning: '#facc15',
      error: '#f87171',
    },
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      monoFont: 'JetBrains Mono',
      baseSize: 16,
      scaleRatio: 1.2,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 10,
      containerWidth: 1280,
    },
    effects: {
      shadowIntensity: 0.4,
      blurIntensity: 12,
      glassEffect: true,
      gradientAccent: true,
    },
    isCustom: false,
  },
  {
    name: 'Neon Cyberpunk',
    mode: 'dark',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f0f0f',
      backgroundAlt: '#171717',
      foreground: '#fafafa',
      foregroundMuted: '#a3a3a3',
      border: 'rgba(236,72,153,0.3)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
      monoFont: 'JetBrains Mono',
      baseSize: 16,
      scaleRatio: 1.333,
    },
    spacing: {
      baseUnit: 4,
      borderRadius: 4,
      containerWidth: 1280,
    },
    effects: {
      shadowIntensity: 0.8,
      blurIntensity: 20,
      glassEffect: true,
      gradientAccent: true,
    },
    isCustom: false,
  },
]

const GOOGLE_FONTS = [
  'Inter',
  'Plus Jakarta Sans',
  'DM Sans',
  'Space Grotesk',
  'Outfit',
  'Poppins',
  'Manrope',
  'Sora',
  'Nunito',
  'Raleway',
  'Work Sans',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
  'Merriweather',
  'Source Sans 3',
  'IBM Plex Sans',
  'Fira Sans',
]

const MONO_FONTS = [
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'IBM Plex Mono',
  'Roboto Mono',
  'Space Mono',
]

// ============================================================================
// COMPONENT
// ============================================================================

export function ThemeBuilder({ currentHtml, onThemeApply, onClose, className }: ThemeBuilderProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'spacing' | 'effects'>('presets')
  const [theme, setTheme] = useState<Theme>(() => ({
    id: `theme_${Date.now()}`,
    ...PRESET_THEMES[0],
    createdAt: new Date(),
  }))
  const [colorHarmony, setColorHarmony] = useState<ColorHarmony>('complementary')
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState(0.5)

  // Generate harmony colors when primary changes
  const harmonyColors = useMemo(() => {
    return generateHarmony(theme.colors.primary, colorHarmony)
  }, [theme.colors.primary, colorHarmony])

  // Generate color scale for primary
  const primaryScale = useMemo(() => {
    return generateColorScale(theme.colors.primary)
  }, [theme.colors.primary])

  // Apply theme to HTML
  const applyTheme = useCallback(() => {
    // Generate CSS variables string
    const cssVariables = `
      --bg: ${theme.colors.background};
      --bg-alt: ${theme.colors.backgroundAlt};
      --fg: ${theme.colors.foreground};
      --fg-muted: ${theme.colors.foregroundMuted};
      --primary: ${theme.colors.primary};
      --secondary: ${theme.colors.secondary};
      --accent: ${theme.colors.accent};
      --border: ${theme.colors.border};
      --success: ${theme.colors.success};
      --warning: ${theme.colors.warning};
      --error: ${theme.colors.error};
    `

    // Generate Tailwind config
    const tailwindConfig = `{
      theme: {
        extend: {
          fontFamily: {
            sans: ['${theme.typography.headingFont}', 'sans-serif'],
            body: ['${theme.typography.bodyFont}', 'sans-serif'],
            mono: ['${theme.typography.monoFont}', 'monospace']
          },
          colors: {
            primary: '${theme.colors.primary}',
            secondary: '${theme.colors.secondary}',
            accent: '${theme.colors.accent}'
          },
          borderRadius: {
            DEFAULT: '${theme.spacing.borderRadius}px'
          }
        }
      }
    }`

    // Convert our Theme to StylePreset format for compatibility
    const stylePreset: StylePreset = {
      id: theme.id,
      name: theme.name,
      description: `Custom theme - ${theme.mode} mode`,
      preview: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.primary} 100%)`,
      tokens: {
        background: theme.colors.background,
        backgroundAlt: theme.colors.backgroundAlt,
        foreground: theme.colors.foreground,
        foregroundMuted: theme.colors.foregroundMuted,
        primary: theme.colors.primary,
        primaryForeground: theme.mode === 'dark' ? '#ffffff' : '#000000',
        secondary: theme.colors.secondary,
        accent: theme.colors.accent,
        border: theme.colors.border,
        fontFamily: theme.typography.headingFont,
        fontFamilyMono: theme.typography.monoFont,
        radius: `${theme.spacing.borderRadius}px`,
        shadow: `0 25px 50px -12px rgba(0,0,0,${theme.effects.shadowIntensity})`,
        blur: `backdrop-blur-${theme.effects.blurIntensity > 10 ? 'xl' : 'lg'}`,
      },
      tailwindConfig,
      cssVariables,
    }

    const updatedHtml = applyThemeToHtml(currentHtml, stylePreset)
    onThemeApply(updatedHtml, theme)
  }, [currentHtml, theme, onThemeApply])

  // Update color
  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }))
  }, [])

  // Select preset theme
  const selectPreset = useCallback((preset: Omit<Theme, 'id' | 'createdAt'>) => {
    setTheme({
      id: `theme_${Date.now()}`,
      ...preset,
      createdAt: new Date(),
    })
  }, [])

  // Export theme as JSON
  const exportTheme = useCallback(() => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [theme])

  // Copy CSS variables
  const copyCssVariables = useCallback(() => {
    const css = `:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-background-alt: ${theme.colors.backgroundAlt};
  --color-foreground: ${theme.colors.foreground};
  --color-foreground-muted: ${theme.colors.foregroundMuted};
  --color-border: ${theme.colors.border};
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-error: ${theme.colors.error};
  --font-heading: '${theme.typography.headingFont}', sans-serif;
  --font-body: '${theme.typography.bodyFont}', sans-serif;
  --font-mono: '${theme.typography.monoFont}', monospace;
  --font-size-base: ${theme.typography.baseSize}px;
  --spacing-unit: ${theme.spacing.baseUnit}px;
  --border-radius: ${theme.spacing.borderRadius}px;
  --container-width: ${theme.spacing.containerWidth}px;
}`
    navigator.clipboard.writeText(css)
    setCopied('css')
    setTimeout(() => setCopied(null), 2000)
  }, [theme])

  // Generate random theme
  const generateRandomTheme = useCallback(() => {
    const randomHue = Math.floor(Math.random() * 360)
    const isDark = Math.random() > 0.3
    const primary = hslToHex(randomHue, 70, isDark ? 55 : 45)
    const secondary = hslToHex((randomHue + 30) % 360, 65, isDark ? 50 : 40)
    const accent = hslToHex((randomHue + 180) % 360, 75, isDark ? 50 : 45)

    setTheme(prev => ({
      ...prev,
      id: `theme_${Date.now()}`,
      name: 'Random Theme',
      mode: isDark ? 'dark' : 'light',
      colors: {
        ...prev.colors,
        primary,
        secondary,
        accent,
        background: isDark ? hslToHex(randomHue, 10, 5) : '#ffffff',
        backgroundAlt: isDark ? hslToHex(randomHue, 10, 10) : '#f8fafc',
        foreground: isDark ? '#ffffff' : '#0f172a',
        foregroundMuted: isDark ? '#a1a1aa' : '#64748b',
        border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      },
      isCustom: true,
      createdAt: new Date(),
    }))
  }, [])

  return (
    <div className={cn('flex flex-col h-full bg-zinc-900 text-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Theme Builder</h2>
            <p className="text-xs text-muted-foreground">Customize your website's look</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateRandomTheme}
            className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
            title="Generate random theme"
          >
            <Shuffle className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={exportTheme}
            className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
            title="Export theme"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
        {[
          { id: 'presets', icon: Grid3X3, label: 'Presets' },
          { id: 'colors', icon: Palette, label: 'Colors' },
          { id: 'typography', icon: Type, label: 'Typography' },
          { id: 'spacing', icon: Ruler, label: 'Spacing' },
          { id: 'effects', icon: Sparkles, label: 'Effects' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPreset(preset)}
                    className={cn(
                      'p-3 rounded-xl border transition-all text-left group',
                      theme.name === preset.name
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-border hover:border-border bg-muted'
                    )}
                  >
                    {/* Preview gradient */}
                    <div
                      className="h-16 rounded-lg mb-2 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${preset.colors.background} 0%, ${preset.colors.primary} 50%, ${preset.colors.secondary} 100%)`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center gap-1">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-border0"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border-2 border-border0"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border-2 border-border0"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{preset.name}</span>
                      {preset.mode === 'dark' ? (
                        <Moon className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Sun className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Color Harmony */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Color Harmony</span>
                  <select
                    value={colorHarmony}
                    onChange={(e) => setColorHarmony(e.target.value as ColorHarmony)}
                    className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                  >
                    <option value="complementary">Complementary</option>
                    <option value="analogous">Analogous</option>
                    <option value="triadic">Triadic</option>
                    <option value="split-complementary">Split Complementary</option>
                    <option value="tetradic">Tetradic</option>
                    <option value="monochromatic">Monochromatic</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {harmonyColors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (idx === 1) updateColor('secondary', color)
                        else if (idx === 2) updateColor('accent', color)
                      }}
                      className="flex-1 h-10 rounded-lg border border-border transition-transform hover:scale-105"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Primary Color with Scale */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Primary Scale</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.colors.primary}
                      onChange={(e) => updateColor('primary', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                    />
                    <code className="text-[10px] text-muted-foreground">{theme.colors.primary}</code>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {primaryScale.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-8 first:rounded-l-lg last:rounded-r-lg"
                      style={{ backgroundColor: color }}
                      title={`${(idx + 1) * 100}: ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* All Colors */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">All Colors</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(theme.colors).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border"
                    >
                      <input
                        type="color"
                        value={value.startsWith('#') ? value : '#000000'}
                        onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium capitalize truncate">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <motion.div
              key="typography"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Font Selection */}
              {[
                { key: 'headingFont', label: 'Heading Font', fonts: GOOGLE_FONTS },
                { key: 'bodyFont', label: 'Body Font', fonts: GOOGLE_FONTS },
                { key: 'monoFont', label: 'Mono Font', fonts: MONO_FONTS },
              ].map(({ key, label, fonts }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <select
                    value={theme.typography[key as keyof ThemeTypography] as string}
                    onChange={(e) => setTheme(prev => ({
                      ...prev,
                      typography: { ...prev.typography, [key]: e.target.value },
                    }))}
                    className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                    style={{ fontFamily: theme.typography[key as keyof ThemeTypography] as string }}
                  >
                    {fonts.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <div
                    className="p-3 rounded-lg bg-muted text-center"
                    style={{ fontFamily: theme.typography[key as keyof ThemeTypography] as string }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}

              {/* Type Scale */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Type Scale Ratio</label>
                  <span className="text-xs text-violet-400">{theme.typography.scaleRatio}</span>
                </div>
                <input
                  type="range"
                  min="1.1"
                  max="1.5"
                  step="0.01"
                  value={theme.typography.scaleRatio}
                  onChange={(e) => setTheme(prev => ({
                    ...prev,
                    typography: { ...prev.typography, scaleRatio: parseFloat(e.target.value) },
                  }))}
                  className="w-full accent-violet-500"
                />
                <div className="space-y-1">
                  {['h1', 'h2', 'h3', 'h4', 'body'].map((tag, idx) => {
                    const size = theme.typography.baseSize * Math.pow(theme.typography.scaleRatio, 4 - idx)
                    return (
                      <div
                        key={tag}
                        className="flex items-center gap-2 text-foreground/80"
                        style={{
                          fontSize: `${Math.min(size, 32)}px`,
                          fontFamily: idx < 4 ? theme.typography.headingFont : theme.typography.bodyFont,
                        }}
                      >
                        <span className="text-[10px] text-muted-foreground w-8">{tag}</span>
                        <span className="truncate">Sample Text</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{size.toFixed(0)}px</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Spacing Tab */}
          {activeTab === 'spacing' && (
            <motion.div
              key="spacing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Border Radius */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Border Radius</label>
                  <span className="text-xs text-violet-400">{theme.spacing.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={theme.spacing.borderRadius}
                  onChange={(e) => setTheme(prev => ({
                    ...prev,
                    spacing: { ...prev.spacing, borderRadius: parseInt(e.target.value) },
                  }))}
                  className="w-full accent-violet-500"
                />
                <div className="flex gap-3 justify-center">
                  {[0, 4, 8, 12, 16, 24].map(radius => (
                    <button
                      key={radius}
                      onClick={() => setTheme(prev => ({
                        ...prev,
                        spacing: { ...prev.spacing, borderRadius: radius },
                      }))}
                      className={cn(
                        'w-12 h-12 bg-violet-500/30 border-2 transition-all',
                        theme.spacing.borderRadius === radius
                          ? 'border-violet-500'
                          : 'border-transparent hover:border-border'
                      )}
                      style={{ borderRadius: `${radius}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Container Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Container Width</label>
                  <span className="text-xs text-violet-400">{theme.spacing.containerWidth}px</span>
                </div>
                <input
                  type="range"
                  min="960"
                  max="1536"
                  step="64"
                  value={theme.spacing.containerWidth}
                  onChange={(e) => setTheme(prev => ({
                    ...prev,
                    spacing: { ...prev.spacing, containerWidth: parseInt(e.target.value) },
                  }))}
                  className="w-full accent-violet-500"
                />
                <div className="flex gap-2 justify-center">
                  {[960, 1024, 1152, 1280, 1440, 1536].map(width => (
                    <button
                      key={width}
                      onClick={() => setTheme(prev => ({
                        ...prev,
                        spacing: { ...prev.spacing, containerWidth: width },
                      }))}
                      className={cn(
                        'px-2 py-1 rounded text-[10px] transition-all',
                        theme.spacing.containerWidth === width
                          ? 'bg-violet-500 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/70'
                      )}
                    >
                      {width}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base Spacing Unit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Base Spacing Unit</label>
                  <span className="text-xs text-violet-400">{theme.spacing.baseUnit}px</span>
                </div>
                <div className="flex gap-2">
                  {[2, 4, 8].map(unit => (
                    <button
                      key={unit}
                      onClick={() => setTheme(prev => ({
                        ...prev,
                        spacing: { ...prev.spacing, baseUnit: unit },
                      }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm transition-all',
                        theme.spacing.baseUnit === unit
                          ? 'bg-violet-500 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/70'
                      )}
                    >
                      {unit}px
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(multiplier => (
                    <div
                      key={multiplier}
                      className="flex-1 bg-violet-500/30"
                      style={{ height: `${theme.spacing.baseUnit * multiplier}px` }}
                      title={`${theme.spacing.baseUnit * multiplier}px`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Effects Tab */}
          {activeTab === 'effects' && (
            <motion.div
              key="effects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Shadow Intensity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Shadow Intensity</label>
                  <span className="text-xs text-violet-400">{(theme.effects.shadowIntensity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={theme.effects.shadowIntensity}
                  onChange={(e) => setTheme(prev => ({
                    ...prev,
                    effects: { ...prev.effects, shadowIntensity: parseFloat(e.target.value) },
                  }))}
                  className="w-full accent-violet-500"
                />
                <div
                  className="h-16 rounded-xl bg-violet-500/20"
                  style={{
                    boxShadow: `0 25px 50px -12px rgba(139, 92, 246, ${theme.effects.shadowIntensity})`,
                  }}
                />
              </div>

              {/* Blur Intensity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Blur Intensity</label>
                  <span className="text-xs text-violet-400">{theme.effects.blurIntensity}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={theme.effects.blurIntensity}
                  onChange={(e) => setTheme(prev => ({
                    ...prev,
                    effects: { ...prev.effects, blurIntensity: parseInt(e.target.value) },
                  }))}
                  className="w-full accent-violet-500"
                />
              </div>

              {/* Toggle Effects */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Effects</label>
                {[
                  { key: 'glassEffect', label: 'Glass Effect', icon: Droplets },
                  { key: 'gradientAccent', label: 'Gradient Accents', icon: Palette },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(prev => ({
                      ...prev,
                      effects: { ...prev.effects, [key]: !prev.effects[key as keyof ThemeEffects] },
                    }))}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                      theme.effects[key as keyof ThemeEffects]
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-border bg-muted'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5',
                      theme.effects[key as keyof ThemeEffects] ? 'text-violet-400' : 'text-muted-foreground'
                    )} />
                    <span className="text-sm">{label}</span>
                    <div className={cn(
                      'ml-auto w-8 h-5 rounded-full transition-colors relative',
                      theme.effects[key as keyof ThemeEffects] ? 'bg-violet-500' : 'bg-zinc-700'
                    )}>
                      <div className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                        theme.effects[key as keyof ThemeEffects] ? 'translate-x-3.5' : 'translate-x-0.5'
                      )} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Mode Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Theme Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme(prev => ({ ...prev, mode: 'light' }))}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all',
                      theme.mode === 'light'
                        ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                        : 'border-border bg-muted text-muted-foreground'
                    )}
                  >
                    <Sun className="w-5 h-5" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme(prev => ({ ...prev, mode: 'dark' }))}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all',
                      theme.mode === 'dark'
                        ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                        : 'border-border bg-muted text-muted-foreground'
                    )}
                  >
                    <Moon className="w-5 h-5" />
                    Dark
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <button
            onClick={copyCssVariables}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-muted/70 text-foreground/80 transition-colors text-sm"
          >
            {copied === 'css' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            Copy CSS
          </button>
          <button
            onClick={() => {
              setTheme({
                id: `theme_${Date.now()}`,
                ...PRESET_THEMES[0],
                createdAt: new Date(),
              })
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-foreground/80 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={applyTheme}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 hover:bg-violet-700 text-white font-medium transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Apply Theme
        </button>
      </div>
    </div>
  )
}

export default ThemeBuilder
