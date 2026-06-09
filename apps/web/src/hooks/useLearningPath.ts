'use client'

// Logic for the LearningPath card — kept out of the workspace page (which is
// already too big). Holds the dismiss + manual-completion state (localStorage),
// and assembles the build -> go live -> domain -> share -> sell steps from
// signals + action handlers the caller passes in. The page only supplies the
// booleans and the click handlers; everything else lives here.

import { useCallback, useEffect, useState } from 'react'
import type { LearningStep } from '@/components/LearningPath'

const DISMISS_KEY = 'webstew-path-dismissed'
const DONE_KEY = 'webstew-path-done'

export interface LearningPathSignals {
  hasSite: boolean
  isPublished: boolean
  hasDomain: boolean
  onBuild: () => void
  onPublish: () => void
  onAddDomain: () => void
  onShare: () => void
  onSell: () => void
}

export function useLearningPath(s: LearningPathSignals): {
  steps: LearningStep[]
  dismissed: boolean
  dismiss: () => void
} {
  const [dismissed, setDismissed] = useState(false)
  const [manualDone, setManualDone] = useState<string[]>([])

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
      const raw = localStorage.getItem(DONE_KEY)
      if (raw) setManualDone(JSON.parse(raw))
    } catch (e: any) {
      console.warn('[learning-path] load failed:', e?.message)
    }
  }, [])

  const markDone = useCallback((key: string) => {
    setManualDone(prev => {
      const next = Array.from(new Set([...prev, key]))
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)) } catch (e: any) { console.warn('[learning-path] save failed:', e?.message) }
      return next
    })
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch (e: any) { console.warn('[learning-path] dismiss save failed:', e?.message) }
  }, [])

  const steps: LearningStep[] = [
    { key: 'build', label: 'Build your first site', hint: "Describe it in the chat — I'll generate it.", cta: 'Start', done: s.hasSite, onAction: s.onBuild },
    { key: 'publish', label: 'Go live', hint: 'Get a shareable webstew.app URL — no setup.', cta: 'Publish', done: s.isPublished, onAction: s.onPublish },
    { key: 'domain', label: 'Add a custom domain', hint: 'Buy one, or connect a domain you own.', cta: 'Add', done: s.hasDomain, onAction: s.onAddDomain },
    { key: 'share', label: 'Invite collaborators', hint: 'Add teammates or clients as editors/viewers.', cta: 'Share', done: manualDone.includes('share'), onAction: () => { s.onShare(); markDone('share') } },
    { key: 'sell', label: 'List it for sale', hint: 'Publish to the marketplace and earn.', cta: 'Sell', done: manualDone.includes('sell'), onAction: () => { s.onSell(); markDone('sell') } },
  ]

  return { steps, dismissed, dismiss }
}
