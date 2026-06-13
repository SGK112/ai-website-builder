// Compile a generated site's Tailwind utilities to static CSS at PUBLISH time so
// the live site is production-grade — no runtime cdn.tailwindcss.com (the "not
// for production" JIT CDN), no third-party dependency, faster first paint. The
// in-editor preview keeps the CDN for instant JIT; this is the dev→prod handoff.
//
// Safety: every failure mode falls back to the original HTML (CDN intact), so a
// compile miss can never ship a broken/unstyled page. We honor the site's inline
// `tailwind.config` (custom colors/fonts) via a JSON5 parse — NO eval, so a
// crafted config can't run code on the server.
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import JSON5 from 'json5'

const CDN_MARKER = 'cdn.tailwindcss.com'
const CDN_SCRIPT_RE = /<script\b[^>]*\bsrc=["']https?:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi
const CONFIG_SCRIPT_RE = /<script\b[^>]*>\s*(?:window\.)?tailwind\.config\s*=[\s\S]*?<\/script>/i

// Pull the `tailwind.config = { … }` object out of the HTML and parse it safely.
// Returns {} when there's no config, or null when there IS one but we can't parse
// it (functions/plugins → caller keeps the CDN rather than risk broken styles).
function extractConfig(html: string): any {
  const at = html.search(/tailwind\.config\s*=\s*\{/)
  if (at < 0) return {}
  const start = html.indexOf('{', at)
  let depth = 0
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (c === '{') depth++
    else if (c === '}') {
      if (--depth === 0) {
        // Quote bare numeric keys (Tailwind color scales: 50, 100, … 900) so
        // JSON5 accepts them, then parse.
        const text = html.slice(start, i + 1).replace(/([{,]\s*)(\d+)(\s*:)/g, '$1"$2"$3')
        try { return JSON5.parse(text) } catch { return null }
      }
    }
  }
  return null
}

export async function compileTailwindForHtml(html: string, theme?: any, darkMode?: any): Promise<string> {
  const config: any = { content: [{ raw: html, extension: 'html' }], corePlugins: { preflight: true } }
  if (theme) config.theme = theme
  if (darkMode) config.darkMode = darkMode
  const result = await postcss([tailwindcss(config), autoprefixer]).process(
    '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
    { from: undefined },
  )
  return result.css
}

// Swap the runtime Tailwind CDN <script> for a compiled <style>. Returns the
// HTML unchanged whenever anything is uncertain (no CDN present, unparseable
// custom config, compile error, or suspiciously little CSS) — never a downgrade.
export async function inlineTailwind(html: string): Promise<string> {
  if (typeof html !== 'string' || !html.includes(CDN_MARKER)) return html

  const hasConfig = /tailwind\.config\s*=/.test(html)
  const parsed = hasConfig ? extractConfig(html) : {}
  if (hasConfig && parsed === null) return html // can't safely honor it — keep CDN

  try {
    const css = await compileTailwindForHtml(html, parsed?.theme, parsed?.darkMode)
    if (!css || css.length < 500) return html // too little — likely a miss; keep CDN
    const style = `<style id="webstew-tw">\n${css}\n</style>`
    let out = html.replace(CDN_SCRIPT_RE, '')
    if (hasConfig) out = out.replace(CONFIG_SCRIPT_RE, '')
    return /<\/head>/i.test(out)
      ? out.replace(/<\/head>/i, `${style}\n</head>`)
      : out.replace(/<body[^>]*>/i, (m) => `${m}\n${style}`)
  } catch {
    return html
  }
}
