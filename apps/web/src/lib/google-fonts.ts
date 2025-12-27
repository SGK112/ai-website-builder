// Google Fonts API Integration
// Free API - no key required for basic usage

export interface GoogleFont {
  family: string
  variants: string[]
  subsets: string[]
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'
}

// Popular fonts curated for web design
export const POPULAR_FONTS: GoogleFont[] = [
  { family: 'Inter', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Roboto', variants: ['400', '500', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Open Sans', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Lato', variants: ['400', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Montserrat', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Poppins', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Raleway', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Nunito', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Ubuntu', variants: ['400', '500', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Rubik', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Work Sans', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Nunito Sans', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Playfair Display', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Merriweather', variants: ['400', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Lora', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'PT Serif', variants: ['400', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Libre Baskerville', variants: ['400', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Crimson Text', variants: ['400', '600', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Source Serif Pro', variants: ['400', '600', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Cormorant Garamond', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'serif' },
  { family: 'Bebas Neue', variants: ['400'], subsets: ['latin'], category: 'display' },
  { family: 'Oswald', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'display' },
  { family: 'Anton', variants: ['400'], subsets: ['latin'], category: 'display' },
  { family: 'Lobster', variants: ['400'], subsets: ['latin'], category: 'display' },
  { family: 'Pacifico', variants: ['400'], subsets: ['latin'], category: 'handwriting' },
  { family: 'Dancing Script', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'handwriting' },
  { family: 'Caveat', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'handwriting' },
  { family: 'Fira Code', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'monospace' },
  { family: 'JetBrains Mono', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'monospace' },
  { family: 'Source Code Pro', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'monospace' },
]

// Font pairings for professional designs
export const FONT_PAIRINGS = [
  { heading: 'Playfair Display', body: 'Lato', style: 'Elegant' },
  { heading: 'Montserrat', body: 'Open Sans', style: 'Modern' },
  { heading: 'Oswald', body: 'Roboto', style: 'Bold' },
  { heading: 'Raleway', body: 'Nunito', style: 'Clean' },
  { heading: 'Bebas Neue', body: 'Poppins', style: 'Impactful' },
  { heading: 'Cormorant Garamond', body: 'Lora', style: 'Classic' },
  { heading: 'Work Sans', body: 'Inter', style: 'Minimal' },
  { heading: 'Lobster', body: 'Open Sans', style: 'Playful' },
]

// Generate Google Fonts URL for embedding
export function generateFontUrl(fonts: string[], weights: string[] = ['400', '500', '600', '700']): string {
  const families = fonts.map(font => {
    const encodedFont = font.replace(/ /g, '+')
    return `family=${encodedFont}:wght@${weights.join(';')}`
  }).join('&')

  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

// Generate CSS import statement
export function generateFontImport(fonts: string[]): string {
  const url = generateFontUrl(fonts)
  return `@import url('${url}');`
}

// Generate font-family CSS value with fallbacks
export function getFontFamily(font: string, category: string): string {
  const fallbacks: Record<string, string> = {
    'sans-serif': 'ui-sans-serif, system-ui, sans-serif',
    'serif': 'ui-serif, Georgia, serif',
    'display': 'ui-sans-serif, system-ui, sans-serif',
    'handwriting': 'cursive',
    'monospace': 'ui-monospace, monospace',
  }

  return `'${font}', ${fallbacks[category] || 'sans-serif'}`
}

// Search fonts by name
export function searchFonts(query: string): GoogleFont[] {
  if (!query) return POPULAR_FONTS
  const lowerQuery = query.toLowerCase()
  return POPULAR_FONTS.filter(font =>
    font.family.toLowerCase().includes(lowerQuery) ||
    font.category.toLowerCase().includes(lowerQuery)
  )
}

// Get fonts by category
export function getFontsByCategory(category: GoogleFont['category']): GoogleFont[] {
  return POPULAR_FONTS.filter(font => font.category === category)
}
