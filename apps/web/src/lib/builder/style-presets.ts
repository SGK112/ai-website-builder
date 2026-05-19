// Style Presets - Design tokens for consistent site generation

export interface StylePreset {
  id: string
  name: string
  description: string
  preview: string // Gradient or color for preview chip
  tokens: {
    // Colors
    background: string
    backgroundAlt: string
    foreground: string
    foregroundMuted: string
    primary: string
    primaryForeground: string
    secondary: string
    accent: string
    border: string
    // Typography
    fontFamily: string
    fontFamilyMono: string
    // Spacing & Radius
    radius: string
    // Effects
    shadow: string
    blur: string
  }
  tailwindConfig: string // Tailwind config to inject
  cssVariables: string // CSS variables to inject
}

export const stylePresets: StylePreset[] = [
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Sleek dark theme with violet accents',
    preview: 'linear-gradient(135deg, #18181b 0%, #3b0764 100%)',
    tokens: {
      background: 'slate-950',
      backgroundAlt: 'slate-900',
      foreground: 'white',
      foregroundMuted: 'slate-400',
      primary: 'violet-500',
      primaryForeground: 'white',
      secondary: 'fuchsia-500',
      accent: 'indigo-500',
      border: 'white/10',
      fontFamily: 'Inter',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.75rem',
      shadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      blur: 'backdrop-blur-xl',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: { primary: '#8b5cf6', secondary: '#d946ef' },
        }
      }
    }`,
    cssVariables: `
      --bg: #0a0a0b;
      --bg-alt: #18181b;
      --fg: #ffffff;
      --fg-muted: #a1a1aa;
      --primary: #8b5cf6;
      --secondary: #d946ef;
      --border: rgba(255,255,255,0.1);
    `,
  },
  {
    id: 'clean-light',
    name: 'Clean Light',
    description: 'Minimal white theme with blue accents',
    preview: 'linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)',
    tokens: {
      background: 'white',
      backgroundAlt: 'slate-50',
      foreground: 'slate-900',
      foregroundMuted: 'slate-500',
      primary: 'blue-600',
      primaryForeground: 'white',
      secondary: 'sky-500',
      accent: 'indigo-600',
      border: 'slate-200',
      fontFamily: 'Inter',
      fontFamilyMono: 'Fira Code',
      radius: '0.5rem',
      shadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
      blur: 'backdrop-blur-sm',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: { primary: '#2563eb', secondary: '#0ea5e9' },
        }
      }
    }`,
    cssVariables: `
      --bg: #ffffff;
      --bg-alt: #f8fafc;
      --fg: #0f172a;
      --fg-muted: #64748b;
      --primary: #2563eb;
      --secondary: #0ea5e9;
      --border: #e2e8f0;
    `,
  },
  {
    id: 'soft-rose',
    name: 'Soft Rose',
    description: 'Elegant light theme with rose accents',
    preview: 'linear-gradient(135deg, #fff1f2 0%, #e11d48 100%)',
    tokens: {
      background: 'rose-50',
      backgroundAlt: 'rose-100',
      foreground: 'gray-800',
      foregroundMuted: 'gray-500',
      primary: 'rose-600',
      primaryForeground: 'white',
      secondary: 'pink-500',
      accent: 'rose-700',
      border: 'rose-200',
      fontFamily: 'Playfair Display',
      fontFamilyMono: 'Fira Code',
      radius: '1rem',
      shadow: '0 10px 40px -10px rgba(225,29,72,0.15)',
      blur: 'backdrop-blur-sm',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Playfair Display', 'serif'] },
          colors: { primary: '#e11d48', secondary: '#ec4899' },
        }
      }
    }`,
    cssVariables: `
      --bg: #fff1f2;
      --bg-alt: #ffe4e6;
      --fg: #1f2937;
      --fg-muted: #6b7280;
      --primary: #e11d48;
      --secondary: #ec4899;
      --border: rgba(225,29,72,0.15);
    `,
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    description: 'Fresh green light theme',
    preview: 'linear-gradient(135deg, #ecfdf5 0%, #059669 100%)',
    tokens: {
      background: 'emerald-50',
      backgroundAlt: 'emerald-100',
      foreground: 'emerald-900',
      foregroundMuted: 'emerald-700',
      primary: 'emerald-600',
      primaryForeground: 'white',
      secondary: 'teal-500',
      accent: 'emerald-700',
      border: 'emerald-200',
      fontFamily: 'Plus Jakarta Sans',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.75rem',
      shadow: '0 10px 40px -10px rgba(5,150,105,0.12)',
      blur: 'backdrop-blur-sm',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
          colors: { primary: '#059669', secondary: '#14b8a6' },
        }
      }
    }`,
    cssVariables: `
      --bg: #ecfdf5;
      --bg-alt: #d1fae5;
      --fg: #064e3b;
      --fg-muted: #047857;
      --primary: #059669;
      --secondary: #14b8a6;
      --border: rgba(5,150,105,0.15);
    `,
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Rich warm tones with orange & amber',
    preview: 'linear-gradient(135deg, #1c1917 0%, #c2410c 100%)',
    tokens: {
      background: 'stone-950',
      backgroundAlt: 'stone-900',
      foreground: 'stone-50',
      foregroundMuted: 'stone-400',
      primary: 'orange-500',
      primaryForeground: 'white',
      secondary: 'amber-500',
      accent: 'red-500',
      border: 'stone-800',
      fontFamily: 'DM Sans',
      fontFamilyMono: 'Fira Code',
      radius: '1rem',
      shadow: '0 25px 50px -12px rgba(194,65,12,0.25)',
      blur: 'backdrop-blur-xl',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['DM Sans', 'sans-serif'] },
          colors: { primary: '#f97316', secondary: '#f59e0b' },
        }
      }
    }`,
    cssVariables: `
      --bg: #0c0a09;
      --bg-alt: #1c1917;
      --fg: #fafaf9;
      --fg-muted: #a8a29e;
      --primary: #f97316;
      --secondary: #f59e0b;
      --border: #292524;
    `,
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool cyan & teal gradients',
    preview: 'linear-gradient(135deg, #083344 0%, #06b6d4 100%)',
    tokens: {
      background: 'cyan-950',
      backgroundAlt: 'cyan-900',
      foreground: 'cyan-50',
      foregroundMuted: 'cyan-300',
      primary: 'cyan-400',
      primaryForeground: 'cyan-950',
      secondary: 'teal-400',
      accent: 'emerald-400',
      border: 'cyan-800',
      fontFamily: 'Plus Jakarta Sans',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.75rem',
      shadow: '0 25px 50px -12px rgba(6,182,212,0.25)',
      blur: 'backdrop-blur-xl',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
          colors: { primary: '#22d3ee', secondary: '#2dd4bf' },
        }
      }
    }`,
    cssVariables: `
      --bg: #083344;
      --bg-alt: #164e63;
      --fg: #ecfeff;
      --fg-muted: #67e8f9;
      --primary: #22d3ee;
      --secondary: #2dd4bf;
      --border: #155e75;
    `,
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural greens with earthy tones',
    preview: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)',
    tokens: {
      background: 'green-950',
      backgroundAlt: 'green-900',
      foreground: 'green-50',
      foregroundMuted: 'green-300',
      primary: 'emerald-500',
      primaryForeground: 'white',
      secondary: 'lime-500',
      accent: 'teal-500',
      border: 'green-800',
      fontFamily: 'Outfit',
      fontFamilyMono: 'Fira Code',
      radius: '0.625rem',
      shadow: '0 25px 50px -12px rgba(34,197,94,0.2)',
      blur: 'backdrop-blur-xl',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Outfit', 'sans-serif'] },
          colors: { primary: '#10b981', secondary: '#84cc16' },
        }
      }
    }`,
    cssVariables: `
      --bg: #052e16;
      --bg-alt: #14532d;
      --fg: #f0fdf4;
      --fg-muted: #86efac;
      --primary: #10b981;
      --secondary: #84cc16;
      --border: #166534;
    `,
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    description: 'Bold cyberpunk vibes',
    preview: 'linear-gradient(135deg, #0f0f0f 0%, #ec4899 100%)',
    tokens: {
      background: 'zinc-950',
      backgroundAlt: 'zinc-900',
      foreground: 'white',
      foregroundMuted: 'zinc-400',
      primary: 'pink-500',
      primaryForeground: 'white',
      secondary: 'purple-500',
      accent: 'cyan-400',
      border: 'pink-500/20',
      fontFamily: 'Space Grotesk',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.25rem',
      shadow: '0 0 60px -12px rgba(236,72,153,0.5)',
      blur: 'backdrop-blur-xl',
    },
    tailwindConfig: `{
      theme: {
        extend: {
          fontFamily: { sans: ['Space Grotesk', 'sans-serif'] },
          colors: { primary: '#ec4899', secondary: '#a855f7' },
        }
      }
    }`,
    cssVariables: `
      --bg: #09090b;
      --bg-alt: #18181b;
      --fg: #ffffff;
      --fg-muted: #a1a1aa;
      --primary: #ec4899;
      --secondary: #a855f7;
      --border: rgba(236,72,153,0.2);
    `,
  },
]

// Generate Tailwind-compatible styles for a preset
export function generatePresetStyles(preset: StylePreset): string {
  const t = preset.tokens
  return `
<script>
  tailwind.config = ${preset.tailwindConfig}
</script>
<style data-theme-preset="${preset.id}">
  :root {
    ${preset.cssVariables}
  }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: '${t.fontFamily}', sans-serif;
  }
</style>
`
}

// Generate ALL themes embedded in one style block with data-theme switching
export function generateAllThemesStyles(activeThemeId: string = 'modern-dark'): string {
  const themeCss = stylePresets.map(preset => {
    const t = preset.tokens
    const isActive = preset.id === activeThemeId
    return `
  /* Theme: ${preset.name} */
  [data-theme="${preset.id}"] {
    ${preset.cssVariables}
    --font-family: '${t.fontFamily}', sans-serif;
    --font-family-mono: '${t.fontFamilyMono}', monospace;
    --radius: ${t.radius};
  }
  ${isActive ? `
  /* Active theme styles applied to :root */
  :root {
    ${preset.cssVariables}
    --font-family: '${t.fontFamily}', sans-serif;
    --font-family-mono: '${t.fontFamilyMono}', monospace;
    --radius: ${t.radius};
  }` : ''}`
  }).join('\n')

  return `
<!-- WebStew Multi-Theme System -->
<style data-webstew-themes="all">
  ${themeCss}

  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-family);
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* Theme switcher utility */
  .theme-transition * {
    transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
  }
</style>
<script data-webstew-theme-switcher>
  // WebStew Theme Switcher
  window.WebStewTheme = {
    current: '${activeThemeId}',
    available: ${JSON.stringify(stylePresets.map(p => ({ id: p.id, name: p.name })))},

    switch: function(themeId) {
      const theme = this.available.find(t => t.id === themeId);
      if (!theme) return false;

      // Add transition class
      document.body.classList.add('theme-transition');

      // Update data-theme attribute on html
      document.documentElement.setAttribute('data-theme', themeId);

      // Update CSS variables on :root
      const preset = ${JSON.stringify(Object.fromEntries(stylePresets.map(p => [p.id, p.cssVariables])))};
      const vars = preset[themeId];
      if (vars) {
        const style = document.createElement('style');
        style.setAttribute('data-active-theme', themeId);
        style.textContent = ':root {' + vars + '}';

        // Remove old active theme style
        const old = document.querySelector('style[data-active-theme]');
        if (old) old.remove();

        document.head.appendChild(style);
      }

      this.current = themeId;

      // Remove transition class after animation
      setTimeout(() => document.body.classList.remove('theme-transition'), 300);

      // Dispatch event for any listeners
      window.dispatchEvent(new CustomEvent('webstew-theme-change', { detail: { theme: themeId } }));

      return true;
    }
  };

  // Initialize theme
  document.documentElement.setAttribute('data-theme', '${activeThemeId}');
</script>
`
}

// Detect if a hex color is light or dark
function isLightColor(hex: string): boolean {
  // Remove # if present
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

// Apply or replace theme in existing HTML
export function applyThemeToHtml(html: string, preset: StylePreset): string {
  const t = preset.tokens
  let updatedHtml = html

  // Extract background color from CSS variables to determine if light/dark
  const bgMatch = preset.cssVariables.match(/--bg:\s*([^;]+);/)
  const bgColor = bgMatch ? bgMatch[1].trim() : '#000000'
  const isLightTheme = isLightColor(bgColor)

  // Check if using multi-theme system
  if (html.includes('data-webstew-themes="all"')) {
    // Update the active theme in the existing multi-theme setup
    const themeVarsRegex = /\/\* Active theme styles applied to :root \*\/[\s\S]*?:root \{[\s\S]*?\}/g
    updatedHtml = updatedHtml.replace(themeVarsRegex, '')

    const activeThemeBlock = `
  /* Active theme styles applied to :root */
  :root {
    ${preset.cssVariables}
    --font-family: '${t.fontFamily}', sans-serif;
    --font-family-mono: '${t.fontFamilyMono}', monospace;
    --radius: ${t.radius};
  }`

    updatedHtml = updatedHtml.replace(
      /(\/\* Theme: [^*]+\*\/[\s\S]*?\})\s*(\n\s*body \{)/,
      `$1${activeThemeBlock}$2`
    )

    updatedHtml = updatedHtml.replace(/current: '[^']+'/,`current: '${preset.id}'`)
    updatedHtml = updatedHtml.replace(
      /document\.documentElement\.setAttribute\('data-theme', '[^']+'\)/g,
      `document.documentElement.setAttribute('data-theme', '${preset.id}')`
    )

    return updatedHtml
  }

  // Check if there's already a theme preset style block - REPLACE it
  const existingThemePattern = /<style data-theme-preset="[^"]*">[\s\S]*?<\/style>/g
  if (html.match(existingThemePattern)) {
    // Remove ALL existing theme blocks first, then add new one
    updatedHtml = html.replace(existingThemePattern, '')
    // Also remove the comment marker if present
    updatedHtml = updatedHtml.replace(/<!-- WebStew Theme Override: [^>]+ -->\s*/g, '')
  }

  // Generate comprehensive theme override styles
  const themeOverrideStyles = `
<!-- WebStew Theme Override: ${preset.name} -->
<style data-theme-preset="${preset.id}">
  /* Theme: ${preset.name} (${isLightTheme ? 'Light' : 'Dark'} Mode) */
  :root {
    ${preset.cssVariables}
    --font-family: '${t.fontFamily}', sans-serif;
    --font-family-mono: '${t.fontFamilyMono}', monospace;
    --radius: ${t.radius};
    --shadow: ${t.shadow};
  }

  /* === GLOBAL OVERRIDES === */
  html, body {
    background: var(--bg) !important;
    background-color: var(--bg) !important;
    color: var(--fg) !important;
    font-family: var(--font-family) !important;
  }

  /* === OVERRIDE DARK BACKGROUNDS FOR LIGHT THEMES ===
     Explicit class names only — broad attribute selectors like
     [class*="-900"] also hit opacity-modifier overlays (bg-slate-900/50)
     which become opaque white and bury hero images. */
  ${isLightTheme ? `
  .bg-slate-950, .bg-zinc-950, .bg-gray-950, .bg-stone-950, .bg-neutral-950,
  .bg-black {
    background-color: var(--bg) !important;
  }

  .bg-slate-900, .bg-zinc-900, .bg-gray-900, .bg-stone-900, .bg-neutral-900,
  .bg-slate-800, .bg-zinc-800, .bg-gray-800, .bg-stone-800, .bg-neutral-800 {
    background-color: var(--bg-alt) !important;
  }

  /* Fix text colors for light theme */
  .text-white {
    color: var(--fg) !important;
  }

  .text-slate-50, .text-zinc-50, .text-gray-50 {
    color: var(--fg) !important;
  }

  .text-slate-100, .text-slate-200, .text-zinc-100, .text-zinc-200 {
    color: var(--fg-muted) !important;
  }

  .text-slate-300, .text-slate-400, .text-zinc-300, .text-zinc-400 {
    color: var(--fg-muted) !important;
  }

  /* Fix borders for light theme */
  .border-white\\/10, .border-white\\/20, .border-white\\/5 {
    border-color: var(--border) !important;
  }

  /* Fix glass effects for light theme */
  .bg-white\\/5, .bg-white\\/10, .bg-white\\/[0.03], .bg-white\\/[0.05] {
    background-color: var(--bg-alt) !important;
  }

  /* Recolor small decorative gradient tints only — NOT full gradient backgrounds */
  .from-indigo-600\\/20, .from-violet-600\\/20, .from-purple-600\\/20,
  .to-violet-600\\/20, .to-fuchsia-600\\/20 {
    --tw-gradient-from: var(--primary) !important;
    --tw-gradient-to: var(--secondary) !important;
    opacity: 0.1;
  }
  ` : `
  /* === DARK THEME OVERRIDES === */
  .bg-slate-950, .bg-zinc-950, .bg-gray-950, .bg-stone-950, .bg-neutral-950 {
    background-color: var(--bg) !important;
  }

  .bg-slate-900, .bg-zinc-900, .bg-gray-900, .bg-stone-900, .bg-neutral-900 {
    background-color: var(--bg-alt) !important;
  }

  .text-white {
    color: var(--fg) !important;
  }

  .text-slate-300, .text-slate-400, .text-zinc-300, .text-zinc-400 {
    color: var(--fg-muted) !important;
  }

  .border-white\\/10, .border-white\\/[0.08], .border-white\\/[0.1] {
    border-color: var(--border) !important;
  }

  .bg-white\\/5, .bg-white\\/10, .bg-white\\/[0.03], .bg-white\\/[0.05] {
    background-color: color-mix(in srgb, var(--bg-alt) 80%, transparent) !important;
  }
  `}

  /* === PRIMARY COLOR OVERRIDES === */
  .bg-indigo-600, .bg-indigo-500, .bg-violet-600, .bg-violet-500,
  .bg-purple-600, .bg-purple-500, .bg-blue-600, .bg-blue-500,
  .bg-cyan-500, .bg-teal-500, .bg-emerald-500, .bg-green-500,
  .bg-orange-500, .bg-amber-500, .bg-pink-500, .bg-rose-500 {
    background-color: var(--primary) !important;
  }

  .hover\\:bg-indigo-500:hover, .hover\\:bg-violet-500:hover,
  .hover\\:bg-purple-500:hover, .hover\\:bg-blue-500:hover {
    background-color: color-mix(in srgb, var(--primary) 85%, white) !important;
  }

  .text-indigo-400, .text-indigo-500, .text-indigo-600,
  .text-violet-400, .text-violet-500, .text-violet-600,
  .text-purple-400, .text-purple-500, .text-purple-600,
  .text-blue-400, .text-blue-500, .text-blue-600,
  .text-cyan-400, .text-cyan-500, .text-teal-400,
  .text-emerald-400, .text-emerald-500, .text-green-400,
  .text-orange-400, .text-orange-500, .text-amber-400,
  .text-pink-400, .text-pink-500, .text-rose-400 {
    color: var(--primary) !important;
  }

  .border-indigo-500, .border-violet-500, .border-purple-500,
  .border-blue-500, .border-indigo-500\\/30, .border-violet-500\\/30 {
    border-color: var(--primary) !important;
  }

  /* === SECONDARY COLOR OVERRIDES === */
  .text-fuchsia-400, .text-fuchsia-500, .text-sky-400, .text-sky-500,
  .text-lime-400, .text-lime-500, .text-yellow-400 {
    color: var(--secondary) !important;
  }

  /* === GRADIENT TEXT === */
  [class*="bg-gradient-to-r"][class*="from-indigo"],
  [class*="bg-gradient-to-r"][class*="from-violet"],
  [class*="bg-gradient-to-r"][class*="from-purple"],
  .bg-clip-text, .text-transparent {
    background: linear-gradient(to right, var(--primary), var(--secondary)) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
  }

  /* === ACCENT BACKGROUNDS === */
  .bg-indigo-500\\/20, .bg-violet-500\\/20, .bg-purple-500\\/20,
  .bg-blue-500\\/20, .bg-indigo-600\\/20, .bg-violet-600\\/20,
  .bg-emerald-500\\/20, .bg-green-500\\/20, .bg-orange-500\\/20,
  .bg-cyan-500\\/20, .bg-pink-500\\/20 {
    background-color: color-mix(in srgb, var(--primary) 20%, transparent) !important;
  }

  .bg-indigo-500\\/10, .bg-violet-500\\/10, .bg-purple-500\\/10,
  .bg-blue-500\\/10 {
    background-color: color-mix(in srgb, var(--primary) 10%, transparent) !important;
  }

  /* === SHADOWS === */
  .shadow-indigo-500\\/25, .shadow-violet-500\\/25, .shadow-purple-500\\/25,
  .shadow-lg.shadow-indigo-600\\/30, .shadow-lg.shadow-violet-600\\/30 {
    --tw-shadow-color: var(--primary) !important;
  }

  /* === SECTION ALTERNATING BACKGROUNDS ===
     Only applies to sections without an inline background-image — hero
     sections use background-image/style and must not be overridden. */
  section:not([style*="background-image"]):not([style*="background:"]):nth-child(even) {
    background-color: var(--bg-alt) !important;
  }

  section:not([style*="background-image"]):not([style*="background:"]):nth-child(odd) {
    background-color: var(--bg) !important;
  }

  /* === NAVIGATION — only tint color, preserve any background-image === */
  nav {
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }

  /* === FOOTER === */
  footer {
    background-color: var(--bg) !important;
    border-color: var(--border) !important;
  }

  /* === CARDS & PANELS === */
  .rounded-xl, .rounded-2xl, .rounded-3xl {
    border-radius: var(--radius) !important;
  }

  /* === REMOVE SPECIFIC DARK GRADIENTS === */
  .from-indigo-600\\/20.via-transparent, .to-violet-600\\/20,
  .bg-gradient-to-br.from-indigo-600\\/20 {
    background: transparent !important;
  }

  /* === HERO GRADIENT RECOLOR ===
     The first hero section commonly uses a full gradient like
     bg-gradient-to-br from-slate-900 to-purple-900 — these were NOT
     getting recolored before because the global gradient rule deliberately
     skipped them to protect background-image hero photos. Now we target
     them explicitly, but ONLY when there's no inline url() / image, so
     photo heroes still survive. Reported by Joshua: "hero header theme
     color doesn't change but all the rest of the site changes."

     Note the :first-of-type + element-specific selectors so we don't blow
     away every gradient on the page — only the hero. */
  section:first-of-type[class*="bg-gradient"]:not([style*="url("]):not([style*="background-image"]),
  header[class*="bg-gradient"]:not([style*="url("]):not([style*="background-image"]),
  [class*="hero"][class*="bg-gradient"]:not([style*="url("]):not([style*="background-image"]) {
    background-image: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    --tw-gradient-from: var(--primary) !important;
    --tw-gradient-to: var(--secondary) !important;
    --tw-gradient-via: color-mix(in srgb, var(--primary) 50%, var(--secondary)) !important;
  }

  /* Solid-color hero (no gradient class) that uses a dark Tailwind shade
     — handled by the global bg-slate-950 rule above, but heroes often
     stack section + inner div with the bg. Also target the FIRST direct
     child of body with a dark bg class. */
  body > section:first-of-type:not([style*="url("]):not([style*="background-image"]),
  body > header:not([style*="url("]):not([style*="background-image"]) {
    color: ${isLightTheme ? 'var(--fg)' : 'var(--fg)'} !important;
  }

  /* Add subtle gradient overlay for depth */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    background: ${isLightTheme
      ? 'radial-gradient(ellipse at top, color-mix(in srgb, var(--primary) 5%, transparent) 0%, transparent 50%)'
      : 'radial-gradient(ellipse at top, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 50%)'
    };
    pointer-events: none;
    z-index: -1;
  }
</style>
`

  // Inject the override styles just before </head>
  if (updatedHtml.includes('</head>')) {
    updatedHtml = updatedHtml.replace('</head>', `${themeOverrideStyles}\n</head>`)
  } else {
    // Fallback: inject after <head>
    updatedHtml = updatedHtml.replace(/<head>/i, `<head>\n${themeOverrideStyles}`)
  }

  return updatedHtml
}

// Get preset by ID
export function getPreset(id: string): StylePreset | undefined {
  return stylePresets.find(p => p.id === id)
}

// Default preset
export const defaultPreset = stylePresets[0]
