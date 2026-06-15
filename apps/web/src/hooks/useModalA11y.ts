'use client'

import { useEffect, useRef } from 'react'

/**
 * Accessibility for hand-rolled modals/dialogs without migrating their layout.
 *
 * Attach the returned ref to the dialog PANEL element (the inner box, not the
 * backdrop). While `open`, this:
 *   - closes on Escape,
 *   - traps Tab focus inside the panel,
 *   - moves focus into the panel on open and restores it to the previously
 *     focused element on close.
 *
 * The panel should also carry `role="dialog" aria-modal="true"` and an
 * accessible name (`aria-label` or `aria-labelledby`). This hook handles the
 * keyboard/focus behavior the bespoke modals were all missing.
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
): React.RefObject<T> {
  const panelRef = useRef<T>(null)
  // Keep the latest onClose without re-running the effect every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusableSelector =
      'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]'
    const focusables = (): HTMLElement[] =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => el.offsetParent !== null || el === document.activeElement) : []

    // Move focus into the dialog (first focusable, else the panel itself).
    const first = focusables()[0]
    if (first) first.focus()
    else if (panel) { panel.setAttribute('tabindex', '-1'); panel.focus() }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = focusables()
      if (items.length === 0) { e.preventDefault(); return }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === firstEl || !panel.contains(active))) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Restore focus to whatever opened the dialog.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus()
    }
  }, [open])

  return panelRef
}
