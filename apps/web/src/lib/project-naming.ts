// Project auto-naming helpers, shared by the workspace.
//
// Why this exists: premade templates seed the project name with the template's
// LABEL (e.g. "E-Commerce"), and fresh builds start as "Untitled Project". When
// the user then builds a *restaurant* over the E-Commerce template, the name
// stayed "E-Commerce" forever — that's the mislabel seen in the files tab. These
// helpers let us re-derive a real name from the generated content's <title>/<h1>
// once it exists, but only while the name is still a generic placeholder.

// Generic placeholder names we're allowed to overwrite with a content-derived
// name. Includes the Untitled defaults and the premade-template labels (which
// become the project name via setProjectName(template.label)). A name NOT in
// this set is treated as user-chosen and never auto-changed.
const GENERIC_NAMES = new Set(
  [
    'Untitled Project',
    'Untitled site',
    'Untitled',
    'My Site',
    // premade quick-start template labels (apps/web .../workspace/page.tsx)
    'E-Commerce',
    'Restaurant',
    'Portfolio',
    'SaaS Platform',
    'SaaS Startup',
    'Digital Agency',
    'AI Startup',
    'Luxe Boutique',
  ].map((s) => s.toLowerCase())
)

export function isGenericProjectName(name: string | null | undefined): boolean {
  const s = (name || '').trim()
  if (!s) return true
  return GENERIC_NAMES.has(s.toLowerCase())
}

function stripTags(s: string): string {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Clean a raw <title>/<h1> string into a short, presentable project name.
// Mirrors deriveProjectName's title-casing/trim shape so names are consistent
// whether they came from the prompt or the rendered content.
function cleanName(raw: string): string {
  if (!raw) return ''
  let s = raw.replace(/\s+/g, ' ').trim()
  // Reject unreplaced template markers — not a real name.
  if (/\{\{|\}\}|\$\{|\[\[|\]\]/.test(s)) return ''
  // "Title | Brand" / "Title - Brand" → keep the left, richer part.
  s = s.split(/\s*[|–—·-]\s*/)[0].trim() || s
  s = s.replace(/^(welcome to|home\s*[-|:]?|home$)/i, '').trim()
  if (!s) return ''
  let name = s.split(' ').slice(0, 6).join(' ').slice(0, 50).trim()
  // Only force title-case when the source is all-lowercase (a sloppy title);
  // capitalize the first letter of each whitespace word only (never after an
  // apostrophe, which would turn "Sneako's" into "Sneako'S").
  if (name === name.toLowerCase()) {
    name = name.replace(/(^|\s)(\S)/g, (_m, p, c) => p + c.toUpperCase())
  }
  name = name.replace(/\s+(For|With|And|Of|To|A|An|The)$/i, '')
  return name.trim()
}

// Derive a project name from rendered HTML, preferring <title>, then first <h1>,
// then og:title / application-name. Returns '' when nothing usable is present.
export function deriveNameFromHtml(html: string | null | undefined): string {
  const h = html || ''
  if (!h) return ''
  const titleM = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const t = titleM ? cleanName(stripTags(titleM[1])) : ''
  if (t && !/^untitled/i.test(t) && t.length >= 2) return t
  const h1M = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const h1 = h1M ? cleanName(stripTags(h1M[1])) : ''
  if (h1 && h1.length >= 2) return h1
  const ogM = h.match(/<meta[^>]+(?:property|name)=["'](?:og:title|application-name)["'][^>]*content=["']([^"']+)["']/i)
  const og = ogM ? cleanName(stripTags(ogM[1])) : ''
  if (og && og.length >= 2) return og
  return ''
}

// Normalize for loose comparison so we don't "rename" E-Commerce -> "E Commerce".
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

// The name to use, or null to leave as-is. Only suggests a change when the
// current name is a generic placeholder AND the content yields a real name that
// meaningfully differs from it.
export function suggestProjectName(currentName: string, html: string): string | null {
  if (!isGenericProjectName(currentName)) return null
  const derived = deriveNameFromHtml(html)
  if (!derived) return null
  if (norm(derived) === norm(currentName)) return null
  return derived
}
