'use client'

// Once a site is LIVE, keep the published link in sync with edits. The user
// expects "change it → the live site updates" — without manually re-publishing
// every tweak (especially via voice). We watch a content version that bumps on
// each committed edit; when it changes (and we're idle + already published) we
// debounce-republish. NOT enabled until the user has published once — we never
// auto-publish a site the user hasn't chosen to make live.

import { useEffect, useRef } from 'react'

export function useAutoRepublish(opts: {
  enabled: boolean        // the project is already published (has a live URL)
  busy: boolean           // a build/edit/publish is in flight — wait for it to settle
  version: number         // bumps whenever the live content meaningfully changes
  republish: () => void   // perform a quiet re-publish (same slug, updated content)
  delayMs?: number
}) {
  const { enabled, busy, version, republish, delayMs = 1500 } = opts
  // The version we last synced to the live site. null = no baseline yet, so the
  // first time we see a published project we record its version WITHOUT
  // republishing (the live site already matches).
  const syncedRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) { syncedRef.current = null; return }
    if (syncedRef.current === null) { syncedRef.current = version; return }
    if (busy) return
    if (version === syncedRef.current) return
    const t = setTimeout(() => { syncedRef.current = version; republish() }, delayMs)
    return () => clearTimeout(t)
  }, [enabled, busy, version, republish, delayMs])
}
