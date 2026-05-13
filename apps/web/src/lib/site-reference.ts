// Site-reference scraper — fetches a URL and extracts structural facts the
// LLM can use as INSPIRATION for generating a new site. We don't republish
// the source content; we extract:
//   - page title, meta description, canonical
//   - heading hierarchy (H1/H2/H3 in order, first ~30)
//   - declared color palette (CSS custom properties + inline styles + meta theme-color)
//   - main section labels (semantic <section>, <nav>, <header>, <footer>, classed regions)
//   - representative copy snippets (hero paragraph, CTA buttons)
//   - schema.org JSON-LD types so we know if it's a Restaurant, SaaS, etc.
//   - tech tells (which CSS framework, which CMS) — quick fingerprint
//
// Strict size + timeout limits so a malicious URL can't hang the API route.

// Use the slim build — it skips cheerio's bundled `undici` fetch helper,
// which ships ES2022 private-class-field syntax that Next.js 14's webpack
// can't parse. We do our own fetching anyway.
import * as cheerio from 'cheerio/slim'
import { gradeWebsite, type GraderResult } from './grader'

export interface SiteReference {
  url: string
  title: string
  description: string
  canonical?: string
  ogImage?: string
  themeColors: string[]
  headings: { level: number; text: string }[]
  sections: string[]
  navLinks: string[]
  ctaButtons: string[]
  heroCopy?: string
  schemaTypes: string[]
  techHints: string[]
  wordCount: number
  fetchedAt: string
}

const MAX_HTML_BYTES = 2_000_000 // 2 MB hard cap
const FETCH_TIMEOUT_MS = 12_000

function normalizeUrl(input: string): string {
  let u = input.trim()
  if (!u) throw new Error('URL required')
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u
  try {
    const parsed = new URL(u)
    if (!parsed.hostname) throw new Error('No hostname')
    return parsed.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

// Block obvious attempts to scrape internal services or files.
function rejectIfPrivate(u: URL) {
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    throw new Error('Refusing to scrape localhost')
  }
  // Private IP space — very basic check. This is not a substitute for
  // network-level SSRF defenses, just a guard against obvious misuse.
  if (/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
    throw new Error('Refusing to scrape private network')
  }
  if (/\.local$/i.test(host) || /\.internal$/i.test(host)) {
    throw new Error('Refusing to scrape internal hostname')
  }
}

async function fetchWithLimits(url: string): Promise<{ html: string; finalUrl: string }> {
  const u = new URL(url)
  rejectIfPrivate(u)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Identify ourselves so admins can see who's hitting them. Most sites
        // block obvious bots; we look like a Chrome request.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Webstew/1.0 (+https://webstew.net)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) {
      throw new Error(`Source returned HTTP ${res.status}`)
    }
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('html') && !contentType.includes('xml')) {
      throw new Error(`Source is not HTML (content-type: ${contentType || 'unknown'})`)
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_HTML_BYTES) {
      throw new Error('Source page too large (>2 MB)')
    }
    return { html: new TextDecoder('utf-8', { fatal: false }).decode(buf), finalUrl: res.url }
  } finally {
    clearTimeout(timer)
  }
}

const HEX = /#[0-9a-f]{3,8}\b/gi
const RGB = /rgba?\([^)]+\)/gi
const HSL = /hsla?\([^)]+\)/gi

function extractColors($: cheerio.CheerioAPI): string[] {
  const found = new Set<string>()
  // 1. meta theme-color
  $('meta[name="theme-color"]').each((_, el) => {
    const c = $(el).attr('content')
    if (c) found.add(c.toLowerCase())
  })
  // 2. inline <style> blocks (CSS custom properties + raw values)
  $('style').each((_, el) => {
    const css = $(el).text()
    if (!css) return
    for (const re of [HEX, RGB, HSL]) {
      const matches = css.match(re)
      if (matches) matches.slice(0, 20).forEach((m) => found.add(m.toLowerCase()))
    }
  })
  // 3. style attributes on body/header/hero elements
  $('body, header, [class*="hero"], [class*="banner"]').each((_, el) => {
    const s = $(el).attr('style')
    if (!s) return
    for (const re of [HEX, RGB, HSL]) {
      const matches = s.match(re)
      if (matches) matches.forEach((m) => found.add(m.toLowerCase()))
    }
  })
  // Drop very-light + very-dark obvious neutrals to keep the palette tight.
  return Array.from(found).slice(0, 8)
}

function extractTechHints($: cheerio.CheerioAPI, html: string): string[] {
  const hints = new Set<string>()
  // Common fingerprints
  if (/cdn\.tailwindcss\.com|tailwind/i.test(html)) hints.add('Tailwind')
  if (/_next\/static|__next_data__/i.test(html)) hints.add('Next.js')
  if (/data-reactroot|__NEXT_DATA__|react-dom/i.test(html)) hints.add('React')
  if (/<meta[^>]+name=["']generator["'][^>]+["']webflow["']/i.test(html)) hints.add('Webflow')
  if (/wp-content|wp-includes/i.test(html)) hints.add('WordPress')
  if (/cdn\.shopify\.com/i.test(html)) hints.add('Shopify')
  if (/squarespace/i.test(html)) hints.add('Squarespace')
  if (/wixstatic|x-wix/i.test(html)) hints.add('Wix')
  if (/<meta[^>]+name=["']generator["'][^>]+astro/i.test(html)) hints.add('Astro')
  if (/svelte-/i.test(html)) hints.add('Svelte')
  if (/data-v-app/i.test(html)) hints.add('Vue')
  // Framework-y CSS
  if (/bootstrap/i.test(html)) hints.add('Bootstrap')
  if (/fontawesome/i.test(html)) hints.add('FontAwesome')
  return Array.from(hints)
}

function clean(s: string | undefined | null): string {
  return (s || '').replace(/\s+/g, ' ').trim()
}

export async function scrapeReference(input: string): Promise<SiteReference> {
  const url = normalizeUrl(input)
  const { html, finalUrl } = await fetchWithLimits(url)
  const $ = cheerio.load(html)

  // Strip script + style + noscript so they don't leak into the text passes.
  // Done on a copy so style colors are still available above.
  const $main = cheerio.load(html)
  $main('script, style, noscript, iframe, svg').remove()

  const title = clean($('title').first().text() || $('h1').first().text())
  const description = clean(
    $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''
  )
  const canonical = clean($('link[rel="canonical"]').attr('href') || '')
  const ogImage = clean($('meta[property="og:image"]').attr('content') || '')

  // Heading hierarchy
  const headings: { level: number; text: string }[] = []
  $main('h1, h2, h3').each((_, el) => {
    if (headings.length >= 30) return
    const tag = (el as any).tagName?.toLowerCase() || 'h2'
    const level = parseInt(tag.replace('h', ''), 10) || 2
    const text = clean($main(el).text())
    if (text && text.length <= 200) headings.push({ level, text })
  })

  // Section labels — prefer aria-label, then nearest H2, then class hints.
  const sections: string[] = []
  $main('section, header, footer, nav, main, [role="region"]').each((_, el) => {
    if (sections.length >= 12) return
    const $el = $main(el)
    const tag = (el as any).tagName?.toLowerCase() || 'section'
    let label = clean(
      $el.attr('aria-label') ||
        $el.attr('data-section') ||
        $el.find('h1,h2,h3').first().text() ||
        ''
    )
    if (!label) {
      const cls = ($el.attr('class') || '').split(/\s+/)
      const hint = cls.find((c) => /hero|features|pricing|menu|gallery|contact|cta|testimonial|about|faq|story/i.test(c))
      if (hint) label = hint
    }
    if (!label) label = tag
    if (label.length <= 120) sections.push(label)
  })

  // Nav links — top-level only, truncated.
  const navLinks: string[] = []
  $main('nav a, header a').each((_, el) => {
    if (navLinks.length >= 20) return
    const t = clean($main(el).text())
    if (t && t.length <= 60 && !navLinks.includes(t)) navLinks.push(t)
  })

  // CTA buttons
  const ctaButtons: string[] = []
  $main('button, a.btn, a[class*="button"], a[class*="cta"], a[role="button"]').each((_, el) => {
    if (ctaButtons.length >= 12) return
    const t = clean($main(el).text())
    if (t && t.length <= 60 && !ctaButtons.includes(t)) ctaButtons.push(t)
  })

  // Hero copy — first <p> long enough to be meaningful inside header/hero region.
  let heroCopy = ''
  $main('header p, [class*="hero"] p, [class*="banner"] p').each((_, el) => {
    if (heroCopy) return
    const t = clean($main(el).text())
    if (t.length >= 30 && t.length <= 400) heroCopy = t
  })
  if (!heroCopy) {
    const firstP = clean($main('p').first().text())
    if (firstP.length >= 30 && firstP.length <= 400) heroCopy = firstP
  }

  // Schema.org JSON-LD types
  const schemaTypes = new Set<string>()
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text())
      const walk = (node: any) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) { node.forEach(walk); return }
        const t = node['@type']
        if (typeof t === 'string') schemaTypes.add(t)
        else if (Array.isArray(t)) t.forEach((x: any) => typeof x === 'string' && schemaTypes.add(x))
        Object.values(node).forEach(walk)
      }
      walk(data)
    } catch {}
  })

  const themeColors = extractColors($)
  const techHints = extractTechHints($, html)
  const wordCount = clean($main('body').text()).split(/\s+/).filter(Boolean).length

  return {
    url: finalUrl,
    title,
    description,
    canonical: canonical || undefined,
    ogImage: ogImage || undefined,
    themeColors,
    headings,
    sections,
    navLinks,
    ctaButtons,
    heroCopy: heroCopy || undefined,
    schemaTypes: Array.from(schemaTypes),
    techHints,
    wordCount,
    fetchedAt: new Date().toISOString(),
  }
}

// Try to scrape a reference URL and append it to a user prompt. If the
// scrape fails (timeout, blocked, etc.) we DON'T fail the whole generation —
// we just note the issue and let the LLM proceed from the user's prompt alone.
// Returns the (possibly augmented) prompt and any non-fatal note.
export async function augmentPromptWithReference(
  basePrompt: string,
  referenceUrl: string | undefined
): Promise<{ prompt: string; reference: SiteReference | null; warning: string | null }> {
  if (!referenceUrl || !referenceUrl.trim()) {
    return { prompt: basePrompt, reference: null, warning: null }
  }
  try {
    const ref = await scrapeReference(referenceUrl.trim())
    const block = formatReferenceForPrompt(ref)
    return {
      prompt: `${basePrompt}\n\n${block}`,
      reference: ref,
      warning: null,
    }
  } catch (e: any) {
    const msg = e?.message || String(e)
    return {
      prompt: basePrompt,
      reference: null,
      warning: `Reference URL could not be scraped: ${msg}. Generation will proceed without it.`,
    }
  }
}

// Format the scraped reference as a prompt fragment the LLM can use as
// inspiration without copying content verbatim. Truncated to keep token use
// reasonable.
export function formatReferenceForPrompt(ref: SiteReference): string {
  const lines: string[] = []
  lines.push(`--- REFERENCE SITE (${ref.url}) ---`)
  if (ref.title) lines.push(`Title: ${ref.title}`)
  if (ref.description) lines.push(`Description: ${ref.description}`)
  if (ref.schemaTypes.length) lines.push(`Schema types: ${ref.schemaTypes.join(', ')}`)
  if (ref.techHints.length) lines.push(`Built with: ${ref.techHints.join(', ')}`)
  if (ref.themeColors.length) lines.push(`Theme colors: ${ref.themeColors.join(', ')}`)
  if (ref.navLinks.length) lines.push(`Navigation: ${ref.navLinks.slice(0, 10).join(' · ')}`)
  if (ref.sections.length) lines.push(`Sections: ${ref.sections.join(' · ')}`)
  if (ref.heroCopy) lines.push(`Hero copy: "${ref.heroCopy.slice(0, 240)}"`)
  if (ref.ctaButtons.length) lines.push(`CTAs seen: ${ref.ctaButtons.slice(0, 6).join(' · ')}`)
  if (ref.headings.length) {
    lines.push('Heading outline (use as STRUCTURAL inspiration, write fresh copy):')
    ref.headings.slice(0, 18).forEach((h) => {
      lines.push(`  ${'  '.repeat(Math.max(0, h.level - 1))}H${h.level}: ${h.text.slice(0, 100)}`)
    })
  }
  lines.push(`--- END REFERENCE ---`)
  lines.push('')
  lines.push(
    'USE THE REFERENCE FOR: information architecture, page sections, voice/tone, color palette, schema.org type. ' +
      'DO NOT copy any visible text or trademarks verbatim. Write fresh, improved copy for every section.'
  )
  return lines.join('\n')
}
