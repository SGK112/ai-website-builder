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

// Apply or replace theme in existing HTML
export function applyThemeToHtml(html: string, preset: StylePreset): string {
  const t = preset.tokens
  let updatedHtml = html

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

  // For AI-generated HTML without markers, we need a more aggressive approach:
  // 1. Add CSS variables override that takes precedence
  // 2. Override body background and text colors

  const themeOverrideStyles = `
<!-- WebStew Theme Override: ${preset.name} -->
<style data-theme-preset="${preset.id}">
  /* Theme: ${preset.name} - CSS Variable Overrides */
  :root {
    ${preset.cssVariables}
    --font-family: '${t.fontFamily}', sans-serif;
  }

  /* Force body styles */
  body {
    background: var(--bg) !important;
    color: var(--fg) !important;
    font-family: var(--font-family) !important;
  }

  /* Override common Tailwind dark backgrounds */
  .bg-slate-950, .bg-slate-900, .bg-zinc-950, .bg-zinc-900, .bg-gray-950, .bg-gray-900,
  .bg-stone-950, .bg-stone-900, .bg-neutral-950, .bg-neutral-900 {
    background-color: var(--bg) !important;
  }

  /* Override section backgrounds */
  section, header, footer, nav, main {
    background-color: inherit;
  }

  /* Override primary accent colors */
  .bg-indigo-600, .bg-indigo-500, .bg-violet-600, .bg-violet-500,
  .bg-purple-600, .bg-purple-500, .bg-blue-600, .bg-blue-500 {
    background-color: var(--primary) !important;
  }

  .text-indigo-400, .text-indigo-500, .text-violet-400, .text-violet-500,
  .text-purple-400, .text-purple-500, .text-blue-400, .text-blue-500 {
    color: var(--primary) !important;
  }

  .border-indigo-500, .border-violet-500, .border-purple-500, .border-blue-500 {
    border-color: var(--primary) !important;
  }

  /* Gradient text override */
  .bg-gradient-to-r.from-indigo-400, .bg-gradient-to-r.from-violet-400,
  .bg-gradient-to-r.from-purple-400, .bg-gradient-to-r.from-blue-400 {
    background: linear-gradient(to right, var(--primary), var(--secondary)) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
  }

  /* Glass/card backgrounds */
  .bg-white\\/5, .bg-white\\/10, .backdrop-blur-xl {
    background-color: var(--bg-alt) !important;
    border-color: var(--border) !important;
  }

  /* Muted text */
  .text-slate-300, .text-slate-400, .text-zinc-300, .text-zinc-400,
  .text-gray-300, .text-gray-400 {
    color: var(--fg-muted) !important;
  }

  /* White text (headings) */
  .text-white {
    color: var(--fg) !important;
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
