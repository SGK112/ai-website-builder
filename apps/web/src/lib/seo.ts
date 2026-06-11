// SEO length helpers for dynamic (generateMetadata) pages. Search engines flag
// titles over ~60 chars and meta descriptions over ~160 — and user-generated
// values (listing titles, profile names) are unbounded. Use seoTitle as
// `title: { absolute: seoTitle(...) }` so the result already carries branding
// and the root title template doesn't append " · Webstew AI" on top of it.
const BRAND = ' · Webstew'

export function clip(input: string | undefined | null, max: number): string {
  const s = (input || '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  // Cut to a word boundary, strip trailing punctuation, add an ellipsis.
  return s.slice(0, max - 1).replace(/[\s.,;:—–-]+\S*$/, '').trim() + '…'
}

export function seoTitle(content: string): string {
  return clip(content, 60 - BRAND.length) + BRAND
}

export function seoDescription(input: string | undefined | null): string {
  return clip(input, 156)
}
