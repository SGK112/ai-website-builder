'use client'

// Voice-driven image/logo creation via xAI grok-imagine-image (/api/ai/logo).
// Synchronous (no polling). On success it auto-saves to the user's creations
// library (kind 'logo') so it's never lost. Mirrors useVoiceVideo's shape.

import { useCallback, useRef, useState } from 'react'

export type ImageStatus = 'idle' | 'generating' | 'ready' | 'error'

export function useVoiceImage() {
  const [status, setStatus] = useState<ImageStatus>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [saved, setSaved] = useState(false)
  const abortRef = useRef(false)

  const persist = useCallback((url: string, title: string) => {
    fetch('/api/ai/video/creations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'logo', url, title: title.slice(0, 120) }),
    }).then((r) => { if (r.ok) setSaved(true) }).catch(() => {})
  }, [])

  const generate = useCallback(async (raw: string) => {
    const desc = String(raw || '').trim().slice(0, 500)
    if (!desc) return
    abortRef.current = false
    setPrompt(desc); setError(null); setImageUrl(null); setStatus('generating'); setMinimized(false); setSaved(false)
    try {
      const r = await fetch('/api/ai/logo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: desc }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.error || 'Could not create the image.')
      if (!d?.url) throw new Error('No image came back — try again.')
      if (abortRef.current) return
      setImageUrl(d.url); setStatus('ready'); persist(d.url, desc)
    } catch (e: any) {
      if (!abortRef.current) { setError(e?.message || 'Image failed.'); setStatus('error') }
    }
  }, [persist])

  const minimize = useCallback(() => setMinimized(true), [])
  const reopen = useCallback(() => setMinimized(false), [])
  const discard = useCallback(() => { abortRef.current = true; setStatus('idle'); setImageUrl(null); setError(null); setMinimized(false); setSaved(false) }, [])

  return { status, imageUrl, error, prompt, saved, minimized, generate, minimize, reopen, discard, isBusy: status === 'generating' }
}
