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
  const abortRef = useRef(false)

  const generate = useCallback(async (raw: string) => {
    const desc = String(raw || '').trim().slice(0, 500)
    if (!desc) return
    abortRef.current = false
    setPrompt(desc); setError(null); setVideoUrl(null); setStatus('generating')
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
        if (sd?.videoUrl) { if (!abortRef.current) { setVideoUrl(sd.videoUrl); setStatus('ready') } return }
        if (sd?.status === 'failed' || (sd?.error && sd?.status !== 'processing' && sd?.status !== 'starting')) {
          throw new Error(sd?.error || 'Video generation failed.')
        }
      }
      throw new Error('Video timed out — try again.')
    } catch (e: any) {
      if (!abortRef.current) { setError(e?.message || 'Video failed.'); setStatus('error') }
    }
  }, [])

  const dismiss = useCallback(() => { abortRef.current = true; setStatus('idle'); setVideoUrl(null); setError(null) }, [])

  return { status, videoUrl, error, prompt, generate, dismiss, isBusy: status === 'generating' }
}
