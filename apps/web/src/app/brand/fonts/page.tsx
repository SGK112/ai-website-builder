// /brand/fonts — internal font picker. Renders the Webstew AI wordmark
// + "AI website builder" tagline in ~10 premium Google Fonts side-by-side
// so we can eyeball the right choice for the brand. Loads fonts via the
// Google Fonts CDN <link> (no Next.js font optimization needed — this
// page is one-off, not user-facing).

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand · Font picker',
  description: 'Side-by-side comparison of premium fonts for the Webstew AI wordmark.',
  robots: { index: false, follow: false },
}

interface FontOption {
  name: string
  category: 'serif' | 'sans' | 'display'
  cssFamily: string
  // Style applied to the wordmark text.
  wordmarkStyle: React.CSSProperties
  // Style for the AI mark — usually a more neutral sans-serif.
  aiMarkStyle?: React.CSSProperties
  // Style for the tagline (always Inter or similar).
  taglineStyle?: React.CSSProperties
  notes?: string
}

const FONTS: FontOption[] = [
  {
    name: 'Playfair Display Italic',
    category: 'serif',
    cssFamily: "'Playfair Display', Georgia, serif",
    wordmarkStyle: { fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.025em' },
    notes: 'Current. Editorial, used in Petra & Salt demo.',
  },
  {
    name: 'Fraunces',
    category: 'serif',
    cssFamily: "'Fraunces', Georgia, serif",
    wordmarkStyle: { fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.01em' },
    notes: 'Modulated variable serif. Stripe, Tailwind have used it.',
  },
  {
    name: 'DM Serif Display',
    category: 'serif',
    cssFamily: "'DM Serif Display', Georgia, serif",
    wordmarkStyle: { fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.005em' },
    notes: 'High-contrast display serif. Bold by default.',
  },
  {
    name: 'Instrument Serif',
    category: 'serif',
    cssFamily: "'Instrument Serif', Georgia, serif",
    wordmarkStyle: { fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.005em' },
    notes: 'Premium modern serif. Sharp contrast.',
  },
  {
    name: 'Cormorant Garamond',
    category: 'serif',
    cssFamily: "'Cormorant Garamond', Georgia, serif",
    wordmarkStyle: { fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.005em' },
    notes: 'Refined classical serif. Editorial.',
  },
  {
    name: 'Bricolage Grotesque',
    category: 'display',
    cssFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    wordmarkStyle: { fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.025em' },
    notes: 'Modern sans display. Italic feels expressive.',
  },
  {
    name: 'Outfit',
    category: 'sans',
    cssFamily: "'Outfit', system-ui, sans-serif",
    wordmarkStyle: { fontWeight: 700, letterSpacing: '-0.02em' },
    notes: 'Geometric sans. Premium, used by many AI startups.',
  },
  {
    name: 'Manrope',
    category: 'sans',
    cssFamily: "'Manrope', system-ui, sans-serif",
    wordmarkStyle: { fontWeight: 800, letterSpacing: '-0.025em' },
    notes: 'Clean geometric sans. Tight tracking.',
  },
  {
    name: 'Space Grotesk',
    category: 'sans',
    cssFamily: "'Space Grotesk', system-ui, sans-serif",
    wordmarkStyle: { fontWeight: 700, letterSpacing: '-0.015em' },
    notes: 'Techy premium sans. Distinctive.',
  },
  {
    name: 'Inter Tight',
    category: 'sans',
    cssFamily: "'Inter Tight', system-ui, sans-serif",
    wordmarkStyle: { fontWeight: 800, letterSpacing: '-0.03em' },
    notes: 'Tight variant of Inter. Confident.',
  },
]

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Playfair+Display:ital,wght@0,700;1,700',
    'family=Fraunces:ital,wght@0,700;1,700',
    'family=DM+Serif+Display:ital@0;1',
    'family=Instrument+Serif:ital@0;1',
    'family=Cormorant+Garamond:ital,wght@0,700;1,700',
    'family=Bricolage+Grotesque:wght@700;800',
    'family=Outfit:wght@700;800',
    'family=Manrope:wght@700;800',
    'family=Space+Grotesk:wght@700',
    'family=Inter+Tight:wght@700;800',
    'family=Inter:wght@700;800;900',
    'display=swap',
  ].join('&')

export default function BrandFontsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />

      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8 border-b border-white/5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-violet-700 dark:text-violet-300 font-semibold mb-2">
          Brand · Internal
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Webstew AI wordmark — font picker</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Each card renders the wordmark + tagline in a different premium typeface.
          Pick the one that best fits "Webstew AI" as an AI website builder brand.
          All fonts are free via Google Fonts.
        </p>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FONTS.map((f) => (
            <FontCard key={f.name} font={f} variant="dark" />
          ))}
        </div>
      </section>

      <section className="bg-white text-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-1">Same fonts on a light background</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Some serifs read better on light surfaces — review here before deciding.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FONTS.map((f) => (
              <FontCard key={f.name + '-light'} font={f} variant="light" />
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-white/5 text-xs text-zinc-500">
        Tag your pick: tell Claude "use font X for the wordmark" and it'll wire that font via Next.js font loader + replace the current Playfair Display.
      </footer>
    </main>
  )
}

function FontCard({ font, variant }: { font: FontOption; variant: 'dark' | 'light' }) {
  const isDark = variant === 'dark'
  const wordmarkColor = isDark
    ? 'bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent'
    : 'bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent'
  const aiMarkColor = isDark ? 'text-violet-300' : 'text-violet-700'
  const taglineColor = isDark ? 'text-zinc-400' : 'text-zinc-500'

  return (
    <div
      className={
        isDark
          ? 'rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition'
          : 'rounded-2xl border border-zinc-200 bg-white p-6 hover:bg-zinc-50 transition shadow-sm'
      }
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-semibold mb-0.5">
            {font.category}
          </div>
          <div className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-zinc-900'}>
            {font.name}
          </div>
        </div>
      </div>

      <div className="inline-flex items-baseline gap-2 mb-3">
        <span
          className={`text-4xl sm:text-5xl ${wordmarkColor}`}
          style={{ fontFamily: font.cssFamily, ...font.wordmarkStyle }}
        >
          Webstew
        </span>
        <span
          className={`text-sm sm:text-base font-extrabold tracking-[0.18em] uppercase ${aiMarkColor}`}
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          AI
        </span>
      </div>

      <p
        className={`text-sm ${taglineColor}`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.01em' }}
      >
        AI website builder
      </p>

      {font.notes && (
        <p className={isDark ? 'mt-4 text-xs text-zinc-500' : 'mt-4 text-xs text-zinc-400'}>
          {font.notes}
        </p>
      )}
    </div>
  )
}
