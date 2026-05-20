// The "owl" — validates AI-generated HTML before it's delivered to the user.
//
// The generator used to assemble the final HTML and ship it blind. A broken
// inline <script> (the `about:srcdoc Uncaught SyntaxError` class of bug) would
// go straight to the preview and render a half-blank page with no warning.
//
// This pass catches that BEFORE delivery: it syntax-checks every inline
// <script> and checks the document isn't truncated. It never executes
// anything — vm.Script only *compiles* (parses) the code.

import vm from 'vm'

export type HtmlIssueType = 'js-syntax' | 'unclosed-tag' | 'truncated'

export interface HtmlIssue {
  type: HtmlIssueType
  message: string
  line?: number
}

export interface HtmlValidationResult {
  ok: boolean
  issues: HtmlIssue[]
}

// 1-based line number of a character offset within `text`.
function lineAt(text: string, index: number): number {
  let line = 1
  const stop = Math.min(index, text.length)
  for (let i = 0; i < stop; i++) {
    if (text.charCodeAt(i) === 10) line++
  }
  return line
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) || []).length
}

export function validateGeneratedHtml(html: string): HtmlValidationResult {
  const issues: HtmlIssue[] = []

  // --- inline <script> syntax ---
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = scriptRe.exec(html)) !== null) {
    const attrs = m[1] || ''
    const code = m[2] || ''
    // External scripts have nothing inline to check.
    if (/\bsrc\s*=/i.test(attrs)) continue
    // Only classic JS. Skip JSON-LD, importmaps, <template>-style blocks, and
    // ES modules (module syntax isn't valid in a classic vm.Script).
    const typeMatch = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)
    const type = (typeMatch?.[1] || '').toLowerCase()
    if (type && type !== 'text/javascript' && type !== 'application/javascript') continue
    if (!code.trim()) continue
    try {
      // Compiles only — does not run the script.
      new vm.Script(code, { filename: 'inline-script.js' })
    } catch (e) {
      if (e instanceof SyntaxError) {
        issues.push({
          type: 'js-syntax',
          message: e.message,
          line: lineAt(html, m.index),
        })
      }
    }
  }

  // --- structural completeness ---
  if (countMatches(html, /<script\b/gi) !== countMatches(html, /<\/script>/gi)) {
    issues.push({ type: 'unclosed-tag', message: 'Mismatched <script> tags — the output is likely truncated.' })
  }
  if (countMatches(html, /<style\b/gi) !== countMatches(html, /<\/style>/gi)) {
    issues.push({ type: 'unclosed-tag', message: 'Mismatched <style> tags — the output is likely truncated.' })
  }
  const lower = html.toLowerCase()
  if (!lower.includes('</body>') || !lower.includes('</html>')) {
    issues.push({ type: 'truncated', message: 'Document is missing </body> or </html> — generation was cut off.' })
  }

  return { ok: issues.length === 0, issues }
}

// One-line human summary for logs / UI.
export function summarizeIssues(issues: HtmlIssue[]): string {
  return issues
    .map((i) => (i.line ? `${i.message} (near line ${i.line})` : i.message))
    .join('; ')
}
