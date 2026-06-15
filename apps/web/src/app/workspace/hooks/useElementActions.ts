'use client'

// Element-level edit actions for the in-canvas editor (delete / duplicate /
// move a section). Extracted out of the 14k-line workspace page so the
// mutation logic lives in one tested place instead of being duplicated inline
// across toolbar buttons.
//
// The core is a robust find-and-replace that tolerates the gap between the
// iframe's DOM-serialized outerHTML and the source HTML string (whitespace,
// quote/void-element normalization). The old inline handlers used a plain
// `html.includes(outerHTML)` which frequently failed to match → the edit
// silently did nothing. Each action returns a boolean and surfaces a toast.

import { useCallback } from 'react'

export interface EditableElement {
  tagName: string
  outerHTML: string
  textContent?: string
  id?: string
  className?: string
  src?: string
  href?: string
  attributes?: Record<string, string>
}

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Deps {
  html: string
  setHtml: (html: string) => void
  addToHistory: (html: string, label: string) => void
  addToast: (type: ToastType, message: string) => void
}

const SECTION_TAGS = ['SECTION', 'NAV', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'ARTICLE']

/**
 * Find `element` in `targetHtml` and replace it. `replacement` is either the
 * literal new markup or a fn receiving the matched markup (for duplicate).
 * Returns the new HTML, or null if the element couldn't be located.
 *
 * CONSERVATIVE by design: only an EXACT match, or a whole-element
 * whitespace-normalized match, counts. These callers (delete / duplicate)
 * are structural and destructive, and `SelectedElement` carries no
 * distinguishing attributes — so the looser "tag + first-50-chars" / bare
 * "<tag>…</tag>" / text-content regex strategies are deliberately NOT used:
 * they would match the wrong element or mis-bound nested same-tag elements
 * and silently corrupt the document while reporting success. When we can't
 * locate the element with certainty we return null and the caller shows an
 * honest "re-select it" error instead of mangling the HTML.
 */
export function findAndReplaceElementHtml(
  targetHtml: string,
  element: EditableElement,
  replacement: string | ((found: string) => string),
): string | null {
  const { outerHTML } = element
  if (!outerHTML) return null

  // Strategy 1: exact match (first occurrence).
  const exactIdx = targetHtml.indexOf(outerHTML)
  if (exactIdx !== -1) {
    const newContent = typeof replacement === 'function' ? replacement(outerHTML) : replacement
    return targetHtml.slice(0, exactIdx) + newContent + targetHtml.slice(exactIdx + outerHTML.length)
  }

  // Strategy 2: whole-element whitespace-normalized match. A contiguous block
  // of source lines whose normalized form EQUALS the normalized outerHTML —
  // never a partial/opening-tag-only match.
  const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
  const normalizedOuter = normalizeWs(outerHTML)
  if (normalizeWs(targetHtml).includes(normalizedOuter)) {
    const lines = targetHtml.split('\n')
    for (let i = 0; i < lines.length; i++) {
      for (let j = i; j < lines.length; j++) {
        const chunk = lines.slice(i, j + 1).join('\n')
        if (normalizeWs(chunk) === normalizedOuter) {
          const newContent = typeof replacement === 'function' ? replacement(chunk) : replacement
          const before = lines.slice(0, i).join('\n')
          const after = lines.slice(j + 1).join('\n')
          return before + (before ? '\n' : '') + newContent + (after ? '\n' : '') + after
        }
        // The window's normalized length already exceeds the target — no point
        // extending j further (keeps the O(n^2) loop from running away).
        if (normalizeWs(chunk).length > normalizedOuter.length) break
      }
    }
  }

  return null
}

export function useElementActions({ html, setHtml, addToHistory, addToast }: Deps) {
  const deleteElement = useCallback((element: EditableElement | null): boolean => {
    if (!element) return false
    if (['HTML', 'BODY', 'HEAD'].includes(element.tagName)) {
      addToast('error', 'Cannot delete the page structure.')
      return false
    }
    const tag = element.tagName.toLowerCase()
    const next = findAndReplaceElementHtml(html, element, '')
    if (next !== null && next !== html) {
      setHtml(next)
      addToHistory(next, `Deleted <${tag}>`)
      addToast('success', `Deleted ${tag}`)
      return true
    }
    addToast('error', "Couldn't delete that element — re-select it and try again.")
    return false
  }, [html, setHtml, addToHistory, addToast])

  const duplicateElement = useCallback((element: EditableElement | null): boolean => {
    if (!element) return false
    const tag = element.tagName.toLowerCase()
    const next = findAndReplaceElementHtml(html, element, (found) => `${found}\n${found}`)
    if (next !== null && next !== html) {
      setHtml(next)
      addToHistory(next, `Duplicated <${tag}>`)
      addToast('success', 'Duplicated')
      return true
    }
    addToast('error', "Couldn't duplicate that element — re-select it and try again.")
    return false
  }, [html, setHtml, addToHistory, addToast])

  const moveSection = useCallback((element: EditableElement | null, dir: 'up' | 'down'): boolean => {
    if (!element || !html) return false
    if (!SECTION_TAGS.includes(element.tagName)) {
      addToast('info', 'Only page sections can be moved.')
      return false
    }
    // Capture the tag name (group 1) so the \1 backreference closes the SAME
    // tag — the old /(?:...)\1/ used a non-capturing group, so \1 referenced
    // the whole outer group (never closed) and matched nothing → move was a
    // silent no-op. m[0] is the full <tag>…</tag>.
    const sectionPattern = /<(section|nav|header|footer|main|aside|article)\b[^>]*>[\s\S]*?<\/\1>/gi
    const sections: { html: string; start: number; end: number }[] = []
    let m: RegExpExecArray | null
    while ((m = sectionPattern.exec(html)) !== null) {
      sections.push({ html: m[0], start: m.index, end: m.index + m[0].length })
    }
    const idx = sections.findIndex((s) => s.html === element.outerHTML)
    const tag = element.tagName.toLowerCase()
    if (dir === 'up') {
      if (idx > 0) {
        const prev = sections[idx - 1]
        const cur = sections[idx]
        const next = html.slice(0, prev.start) + cur.html + html.slice(prev.end, cur.start) + prev.html + html.slice(cur.end)
        setHtml(next)
        addToHistory(next, `Moved <${tag}> up`)
        return true
      }
      addToast('info', 'Already at the top.')
      return false
    }
    if (idx >= 0 && idx < sections.length - 1) {
      const cur = sections[idx]
      const nextSec = sections[idx + 1]
      const next = html.slice(0, cur.start) + nextSec.html + html.slice(cur.end, nextSec.start) + cur.html + html.slice(nextSec.end)
      setHtml(next)
      addToHistory(next, `Moved <${tag}> down`)
      return true
    }
    addToast('info', 'Already at the bottom.')
    return false
  }, [html, setHtml, addToHistory, addToast])

  return { deleteElement, duplicateElement, moveSection }
}
