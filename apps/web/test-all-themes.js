/**
 * Theme Testing Script
 * Tests all theme presets and saves the results
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// THEME PRESETS (copied from style-presets.ts for testing)
// ============================================================================

const stylePresets = [
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    cssVariables: `
      --bg: #0a0a0b;
      --bg-alt: #18181b;
      --fg: #ffffff;
      --fg-muted: #a1a1aa;
      --primary: #8b5cf6;
      --secondary: #d946ef;
      --border: rgba(255,255,255,0.1);
    `,
    tokens: {
      fontFamily: 'Inter',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.75rem',
      shadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    }
  },
  {
    id: 'clean-light',
    name: 'Clean Light',
    cssVariables: `
      --bg: #ffffff;
      --bg-alt: #f8fafc;
      --fg: #0f172a;
      --fg-muted: #64748b;
      --primary: #2563eb;
      --secondary: #0ea5e9;
      --border: #e2e8f0;
    `,
    tokens: {
      fontFamily: 'Inter',
      fontFamilyMono: 'Fira Code',
      radius: '0.5rem',
      shadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
    }
  },
  {
    id: 'soft-rose',
    name: 'Soft Rose',
    cssVariables: `
      --bg: #fff1f2;
      --bg-alt: #ffe4e6;
      --fg: #1f2937;
      --fg-muted: #6b7280;
      --primary: #e11d48;
      --secondary: #ec4899;
      --border: rgba(225,29,72,0.15);
    `,
    tokens: {
      fontFamily: 'Playfair Display',
      fontFamilyMono: 'Fira Code',
      radius: '1rem',
      shadow: '0 10px 40px -10px rgba(225,29,72,0.15)',
    }
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    cssVariables: `
      --bg: #ecfdf5;
      --bg-alt: #d1fae5;
      --fg: #064e3b;
      --fg-muted: #047857;
      --primary: #059669;
      --secondary: #14b8a6;
      --border: rgba(5,150,105,0.15);
    `,
    tokens: {
      fontFamily: 'Plus Jakarta Sans',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.75rem',
      shadow: '0 10px 40px -10px rgba(5,150,105,0.12)',
    }
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    cssVariables: `
      --bg: #0c0a09;
      --bg-alt: #1c1917;
      --fg: #fafaf9;
      --fg-muted: #a8a29e;
      --primary: #f97316;
      --secondary: #f59e0b;
      --border: #292524;
    `,
    tokens: {
      fontFamily: 'DM Sans',
      fontFamilyMono: 'Fira Code',
      radius: '1rem',
      shadow: '0 25px 50px -12px rgba(194,65,12,0.25)',
    }
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    cssVariables: `
      --bg: #083344;
      --bg-alt: #164e63;
      --fg: #ecfeff;
      --fg-muted: #67e8f9;
      --primary: #22d3ee;
      --secondary: #2dd4bf;
      --border: #155e75;
    `,
    tokens: {
      fontFamily: 'Plus Jakarta Sans',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.75rem',
      shadow: '0 25px 50px -12px rgba(6,182,212,0.25)',
    }
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    cssVariables: `
      --bg: #052e16;
      --bg-alt: #14532d;
      --fg: #f0fdf4;
      --fg-muted: #86efac;
      --primary: #10b981;
      --secondary: #84cc16;
      --border: #166534;
    `,
    tokens: {
      fontFamily: 'Outfit',
      fontFamilyMono: 'Fira Code',
      radius: '0.625rem',
      shadow: '0 25px 50px -12px rgba(34,197,94,0.2)',
    }
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    cssVariables: `
      --bg: #09090b;
      --bg-alt: #18181b;
      --fg: #ffffff;
      --fg-muted: #a1a1aa;
      --primary: #ec4899;
      --secondary: #a855f7;
      --border: rgba(236,72,153,0.2);
    `,
    tokens: {
      fontFamily: 'Space Grotesk',
      fontFamilyMono: 'JetBrains Mono',
      radius: '0.25rem',
      shadow: '0 0 60px -12px rgba(236,72,153,0.5)',
    }
  }
];

// ============================================================================
// THEME APPLICATION FUNCTION (copied from style-presets.ts)
// ============================================================================

function isLightColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function applyThemeToHtml(html, preset) {
  const t = preset.tokens;
  let updatedHtml = html;

  const bgMatch = preset.cssVariables.match(/--bg:\s*([^;]+);/);
  const bgColor = bgMatch ? bgMatch[1].trim() : '#000000';
  const isLightTheme = isLightColor(bgColor);

  // Remove existing theme blocks
  const existingThemePattern = /<style data-theme-preset="[^"]*">[\s\S]*?<\/style>/g;
  if (html.match(existingThemePattern)) {
    updatedHtml = html.replace(existingThemePattern, '');
    updatedHtml = updatedHtml.replace(/<!-- WebStew Theme Override: [^>]+ -->\s*/g, '');
  }

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

  /* === OVERRIDE ALL DARK BACKGROUNDS FOR LIGHT THEMES === */
  ${isLightTheme ? `
  .bg-slate-950, .bg-slate-900, .bg-slate-800,
  .bg-zinc-950, .bg-zinc-900, .bg-zinc-800,
  .bg-gray-950, .bg-gray-900, .bg-gray-800,
  .bg-stone-950, .bg-stone-900, .bg-stone-800,
  .bg-neutral-950, .bg-neutral-900, .bg-neutral-800,
  .bg-black, [class*="bg-"][class*="-950"], [class*="bg-"][class*="-900"] {
    background-color: var(--bg) !important;
  }

  .bg-slate-800, .bg-zinc-800, .bg-gray-800, .bg-stone-800 {
    background-color: var(--bg-alt) !important;
  }

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

  .border-white\\/10, .border-white\\/20, .border-white\\/5 {
    border-color: var(--border) !important;
  }

  .bg-white\\/5, .bg-white\\/10, .bg-white\\/[0.03], .bg-white\\/[0.05] {
    background-color: var(--bg-alt) !important;
  }

  .from-indigo-600\\/20, .from-violet-600\\/20, .from-purple-600\\/20,
  .to-violet-600\\/20, .to-fuchsia-600\\/20 {
    --tw-gradient-from: var(--primary) !important;
    --tw-gradient-to: var(--secondary) !important;
    opacity: 0.1;
  }

  .bg-gradient-to-br, .bg-gradient-to-r, .bg-gradient-to-b {
    background-image: none !important;
    background-color: transparent !important;
  }
  ` : `
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

  .text-fuchsia-400, .text-fuchsia-500, .text-sky-400, .text-sky-500,
  .text-lime-400, .text-lime-500, .text-yellow-400 {
    color: var(--secondary) !important;
  }

  [class*="bg-gradient-to-r"][class*="from-indigo"],
  [class*="bg-gradient-to-r"][class*="from-violet"],
  [class*="bg-gradient-to-r"][class*="from-purple"],
  .bg-clip-text, .text-transparent {
    background: linear-gradient(to right, var(--primary), var(--secondary)) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
  }

  .bg-indigo-500\\/20, .bg-violet-500\\/20, .bg-purple-500\\/20,
  .bg-blue-500\\/20, .bg-indigo-600\\/20, .bg-violet-600\\/20,
  .bg-emerald-500\\/20, .bg-green-500\\/20, .bg-orange-500\\/20,
  .bg-cyan-500\\/20, .bg-pink-500\\/20 {
    background-color: color-mix(in srgb, var(--primary) 20%, transparent) !important;
  }

  .shadow-indigo-500\\/25, .shadow-violet-500\\/25, .shadow-purple-500\\/25,
  .shadow-lg.shadow-indigo-600\\/30, .shadow-lg.shadow-violet-600\\/30 {
    --tw-shadow-color: var(--primary) !important;
  }

  section:nth-child(even) {
    background-color: var(--bg-alt) !important;
  }

  section:nth-child(odd) {
    background-color: var(--bg) !important;
  }

  nav, header {
    background-color: color-mix(in srgb, var(--bg) 80%, transparent) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }

  footer {
    background-color: var(--bg) !important;
    border-color: var(--border) !important;
  }

  .rounded-xl, .rounded-2xl, .rounded-3xl {
    border-radius: var(--radius) !important;
  }

  .from-indigo-600\\/20.via-transparent, .to-violet-600\\/20,
  .bg-gradient-to-br.from-indigo-600\\/20 {
    background: transparent !important;
  }

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
`;

  if (updatedHtml.includes('</head>')) {
    updatedHtml = updatedHtml.replace('</head>', `${themeOverrideStyles}\n</head>`);
  } else {
    updatedHtml = updatedHtml.replace(/<head>/i, `<head>\n${themeOverrideStyles}`);
  }

  return updatedHtml;
}

// ============================================================================
// SAMPLE HTML
// ============================================================================

const sampleHtml = fs.readFileSync(path.join(__dirname, 'test-output/1-original.html'), 'utf8');

// ============================================================================
// GENERATE THEMED VERSIONS
// ============================================================================

const outputDir = path.join(__dirname, 'test-output');

console.log('🎨 Theme Testing Script');
console.log('========================\n');

stylePresets.forEach((preset, index) => {
  const themedHtml = applyThemeToHtml(sampleHtml, preset);
  const filename = `${index + 2}-${preset.id}.html`;
  fs.writeFileSync(path.join(outputDir, filename), themedHtml);

  const bgMatch = preset.cssVariables.match(/--bg:\s*([^;]+);/);
  const bgColor = bgMatch ? bgMatch[1].trim() : '#000000';
  const mode = isLightColor(bgColor) ? '☀️ Light' : '🌙 Dark';

  console.log(`✓ ${preset.name} (${mode})`);
  console.log(`  → ${filename}`);
});

console.log('\n========================');
console.log(`\n✅ Generated ${stylePresets.length} themed versions!`);
console.log('\nOpen the files in test-output/ folder to compare:');
console.log('  1-original.html      - Original dark theme');
console.log('  2-modern-dark.html   - Modern Dark (violet/fuchsia)');
console.log('  3-clean-light.html   - Clean Light (white/blue) ☀️');
console.log('  4-soft-rose.html     - Soft Rose (pink) ☀️');
console.log('  5-mint-fresh.html    - Mint Fresh (green) ☀️');
console.log('  6-warm-sunset.html   - Warm Sunset (orange)');
console.log('  7-ocean-breeze.html  - Ocean Breeze (cyan)');
console.log('  8-forest-green.html  - Forest Green');
console.log('  9-neon-pink.html     - Neon Pink (cyberpunk)');
