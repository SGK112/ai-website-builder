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
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Find `element` in `targetHtml` and replace it. `replacement` is either the
 * literal new markup or a fn receiving the matched markup (for duplicate).
 * Returns the new HTML, or null if the element couldn't be located.
 * Multi-strategy: exact → whitespace-normalized → tag+attribute regex →
 * text-content regex.
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

  // Strategy 2: whitespace-normalized line-window match.
  const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
  const normalizedOuter = normalizeWs(outerHTML)
  if (normalizeWs(targetHtml).includes(normalizedOuter)) {
    const lines = targetHtml.split('\n')
    for (let i = 0; i < lines.length; i++) {
      for (let j = i; j < lines.length; j++) {
        const chunk = lines.slice(i, j + 1).join('\n')
        if (normalizeWs(chunk) === normalizedOuter || chunk.includes(outerHTML.slice(0, 50))) {
          const newContent = typeof replacement === 'function' ? replacement(chunk) : replacement
          const before = lines.slice(0, i).join('\n')
          const after = lines.slice(j + 1).join('\n')
          return before + (before ? '\n' : '') + newContent + (after ? '\n' : '') + after
        }
      }
    }
  }

  // Strategy 3: tag + a distinguishing attribute (id / class / src / href).
  const tag = element.tagName.toLowerCase()
  let pattern = `<${tag}`
  if (element.id) pattern += `[^>]*id=["']${escapeRe(element.id)}["']`
  else if (element.className) {
    const firstClass = element.className.split(' ')[0]
    if (firstClass) pattern += `[^>]*class=["'][^"']*${escapeRe(firstClass)}[^"']*["']`
  } else if (element.src) pattern += `[^>]*src=["']${escapeRe(element.src)}["']`
  else if (element.href) pattern += `[^>]*href=["']${escapeRe(element.href)}["']`
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag)
  pattern += selfClosing ? `[^>]*/?>` : `[^>]*>[\\s\\S]*?</${tag}>`
  try {
    const match = targetHtml.match(new RegExp(pattern, 'i'))
    if (match) {
      const newContent = typeof replacement === 'function' ? replacement(match[0]) : replacement
      return targetHtml.replace(match[0], newContent)
    }
  } catch { /* bad regex — fall through */ }

  // Strategy 4: text-heavy elements — match by leading text content.
  if (element.textContent && element.textContent.length > 10) {
    const escapedText = escapeRe(element.textContent.slice(0, 50))
    try {
      const match = targetHtml.match(new RegExp(`<${tag}[^>]*>[^<]*${escapedText}[^<]*</${tag}>`, 'i'))
      if (match) {
        const newContent = typeof replacement === 'function' ? replacement(match[0]) : replacement
        return targetHtml.replace(match[0], newContent)
      }
    } catch { /* bad regex — fall through */ }
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
    const sectionPattern = /(<(?:section|nav|header|footer|main|aside|article)\b[^>]*>[\s\S]*?<\/\1>)/g
    const sections: { html: string; start: number; end: number }[] = []
    let m: RegExpExecArray | null
    while ((m = sectionPattern.exec(html)) !== null) {
      sections.push({ html: m[1], start: m.index, end: m.index + m[1].length })
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
