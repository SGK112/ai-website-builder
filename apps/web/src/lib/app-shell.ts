// A generated site is self-contained HTML. The BUILDER app's OWN document (a
// captured Next.js page) carries __NEXT_DATA__ / _next chunks and the
// workspace's own API calls. Rendered in any sandboxed preview (iframe without
// allow-same-origin → origin null) it can ONLY CORS-block every request and
// show a white page — so we never list, snapshot, or serve it as a "site".
export function isBuilderAppShell(html: unknown): boolean {
  return typeof html === 'string' && (html.includes('__NEXT_DATA__') || html.includes('/_next/static/chunks/'))
}
