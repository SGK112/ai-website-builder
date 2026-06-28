'use client'

// Voice-driven short video generation via Grok Imagine (xAI). The chef calls the
// make_video tool with a description; this starts the job (/api/ai/video
// text-to-video) and polls status until the Cloudinary .mp4 lands. Response
// shapes verified end-to-end against prod: start → { id, status }, poll →
// { status: processing|succeeded|failed, videoUrl, error }.

import { useCallback, useRef, useState } from 'react'

export type VideoStatus = 'idle' | 'generating' | 'ready' | 'error'

export function useVoiceVideo() {
  const [status, setStatus] = useState<VideoStatus>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  // Closed-but-not-discarded — the clip stays re-openable (a chip on screen) so
  // it isn't lost the moment the user taps away.
  const [minimized, setMinimized] = useState(false)
  // Persisted to the user's video library (so it survives the session).
  const [saved, setSaved] = useState(false)
  const abortRef = useRef(false)

  // Save to the user's video_creations so it's never lost — findable in the
  // Video Studio and re-openable here. Fire-and-forget; de-duped server-side.
  const persist = useCallback((url: string, title: string) => {
    fetch('/api/ai/video/creations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'clip', url, title: title.slice(0, 120) }),
    }).then((r) => { if (r.ok) setSaved(true) }).catch(() => {})
  }, [])

  const generate = useCallback(async (raw: string) => {
    const desc = String(raw || '').trim().slice(0, 500)
    if (!desc) return
    abortRef.current = false
    setPrompt(desc); setError(null); setVideoUrl(null); setStatus('generating'); setMinimized(false); setSaved(false)
    try {
      const r = await fetch('/api/ai/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'text-to-video', prompt: desc, model: 'grok' }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.error || 'Could not start the video.')
      const id = d?.id || d?.predictionId
      if (!id) throw new Error('Video did not start — try again.')

      // Poll up to ~3 min (verified clips finish in ~30s).
      for (let i = 0; i < 45; i++) {
        await new Promise((res) => setTimeout(res, 4000))
        if (abortRef.current) return
        const sr = await fetch('/api/ai/video', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', predictionId: id }),
        })
        const sd = await sr.json().catch(() => ({}))
        if (sd?.videoUrl) { if (!abortRef.current) { setVideoUrl(sd.videoUrl); setStatus('ready'); persist(sd.videoUrl, desc) } return }
        if (sd?.status === 'failed' || (sd?.error && sd?.status !== 'processing' && sd?.status !== 'starting')) {
          throw new Error(sd?.error || 'Video generation failed.')
        }
      }
      throw new Error('Video timed out — try again.')
    } catch (e: any) {
      if (!abortRef.current) { setError(e?.message || 'Video failed.'); setStatus('error') }
    }
  }, [])

  // Close the overlay but KEEP the clip (re-openable via the chip).
  const minimize = useCallback(() => setMinimized(true), [])
  const reopen = useCallback(() => setMinimized(false), [])
  // Throw it away entirely (stops any in-flight poll).
  const discard = useCallback(() => { abortRef.current = true; setStatus('idle'); setVideoUrl(null); setError(null); setMinimized(false); setSaved(false) }, [])

  return { status, videoUrl, error, prompt, saved, minimized, generate, minimize, reopen, discard, isBusy: status === 'generating' }
}
