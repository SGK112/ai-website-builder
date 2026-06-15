'use client'

import { useRef, useState } from 'react'
import {
  Clapperboard, Sparkles, Loader2, Plus, X, ArrowUp, ArrowDown,
  Film, Download, Link2, Wand2, ImageIcon, AlertCircle, Check,
  Volume2, PenLine,
} from 'lucide-react'

const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
import { stitchClips } from './storyboardStitch'

type ShotStatus = 'idle' | 'generating' | 'done' | 'error'
interface Shot {
  id: string
  prompt: string
  status: ShotStatus
  clipUrl?: string
  error?: string
}

// Storyboard mode: draft a themed multi-shot sequence, generate each shot as a
// Grok clip (kept consistent via an optional shared reference image), then
// stitch them into one continuous video entirely in the browser.
export default function Storyboard() {
  const [topic, setTopic] = useState('')
  const [shotCount, setShotCount] = useState(3)
  const [theme, setTheme] = useState('')
  const [shots, setShots] = useState<Shot[]>([])
  const [refImage, setRefImage] = useState<string | null>(null)
  const [refUploading, setRefUploading] = useState(false)

  const [drafting, setDrafting] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stitching, setStitching] = useState(false)
  const [stitchStage, setStitchStage] = useState('')
  const [stitchProgress, setStitchProgress] = useState(0)
  const [stitchedUrl, setStitchedUrl] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Narration (AI scriptwriter + voiceover)
  const [narrationText, setNarrationText] = useState('')
  const [script, setScript] = useState('')
  const [voice, setVoice] = useState('onyx')
  const [writingScript, setWritingScript] = useState(false)

  // Stitched videos are blob URLs holding the whole MP4 in memory. Revoke the
  // previous one whenever we replace/clear it, or re-stitching leaks 50–200 MB
  // per run.
  const stitchedRef = useRef<string | null>(null)
  const setStitched = (url: string | null) => {
    if (stitchedRef.current && stitchedRef.current !== url) URL.revokeObjectURL(stitchedRef.current)
    stitchedRef.current = url
    setStitchedUrl(url)
  }

  const newId = () => `s_${shots.length}_${topic.length}_${Math.floor(performance.now())}`
  const doneClips = shots.filter(s => s.status === 'done' && s.clipUrl)
  const allDone = shots.length > 0 && shots.every(s => s.status === 'done')

  function patchShot(id: string, patch: Partial<Shot>) {
    setShots(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  async function draftShots() {
    if (!topic.trim()) return
    setDrafting(true); setError(null)
    try {
      const res = await fetch('/api/ai/video/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), shots: shotCount }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || `Couldn't draft a storyboard (HTTP ${res.status}).`)
      setTheme(data.theme || '')
      setShots((data.shots as string[]).map((p, i) => ({ id: `draft_${i}_${Math.floor(performance.now())}`, prompt: p, status: 'idle' })))
      setStitched(null); setShareUrl(null)
    } catch (e: any) {
      setError(e?.message || 'Drafting failed')
    } finally {
      setDrafting(false)
    }
  }

  async function uploadReference(file: File) {
    setRefUploading(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`)
      if (!json.url || json.url.startsWith('data:')) throw new Error('Image storage isn\'t configured on this server.')
      setRefImage(json.url)
    } catch (e: any) {
      setError(e?.message || 'Reference upload failed')
    } finally {
      setRefUploading(false)
    }
  }

  // Generate one shot via Grok, polling to completion. Returns true on success.
  async function generateShot(shot: Shot): Promise<boolean> {
    patchShot(shot.id, { status: 'generating', error: undefined })
    try {
      const body: Record<string, unknown> = {
        action: refImage ? 'image-to-video' : 'text-to-video',
        prompt: shot.prompt,
        model: 'grok',
        aspectRatio: '16:9',
      }
      if (refImage) body.imageUrls = [refImage]   // shared ref → consistent look
      const res = await fetch('/api/ai/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok || !data.id) throw new Error(data.error || `Couldn't start shot (HTTP ${res.status}).`)

      // Poll up to ~4 min.
      for (let i = 0; i < 80; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`/api/ai/video?id=${data.id}`)
        const pd = await poll.json().catch(() => ({} as any))
        if (pd.status === 'succeeded' && pd.videoUrl) {
          patchShot(shot.id, { status: 'done', clipUrl: pd.videoUrl })
          return true
        }
        if (pd.status === 'failed') throw new Error(pd.error || 'Generation failed')
      }
      throw new Error('Timed out waiting for the clip')
    } catch (e: any) {
      patchShot(shot.id, { status: 'error', error: e?.message || 'Shot failed' })
      return false
    }
  }

  async function generateAll() {
    setGeneratingAll(true); setError(null); setStitched(null); setShareUrl(null)
    // Sequential — keeps the order clear and avoids hammering the API/rate limits.
    for (const shot of shots) {
      if (shot.status === 'done') continue
      // Re-read latest prompt from state at call time.
      const latest = (await new Promise<Shot>(resolve => {
        setShots(prev => { const f = prev.find(s => s.id === shot.id)!; resolve(f); return prev })
      }))
      await generateShot(latest)
    }
    setGeneratingAll(false)
  }

  // Approx total video length (Grok clips run ~8s) — used to pace the script.
  const estimatedSeconds = Math.max(3, (doneClips.length || shots.length || 3) * 8)

  async function writeScript() {
    setWritingScript(true); setError(null)
    try {
      const res = await fetch('/api/ai/video/narration', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'write', text: narrationText, topic, totalSeconds: estimatedSeconds }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || `Couldn't write a script (HTTP ${res.status}).`)
      setScript(data.script || '')
    } catch (e: any) {
      setError(e?.message || 'Scriptwriting failed')
    } finally {
      setWritingScript(false)
    }
  }

  async function stitch() {
    if (doneClips.length < 2) { setError('Generate at least two clips before stitching.'); return }
    setStitching(true); setError(null); setStitchProgress(0); setStitchStage('Starting…')
    setStitched(null); setShareUrl(null)
    let audioUrl: string | null = null
    try {
      // Generate narration audio first (if a script is set), then mux it in.
      if (script.trim()) {
        setStitchStage('Generating narration…')
        const res = await fetch('/api/ai/video/narration', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'speak', script: script.trim(), voice }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({} as any))
          throw new Error(e.error || `Narration failed (HTTP ${res.status}).`)
        }
        audioUrl = URL.createObjectURL(await res.blob())
      }
      const url = await stitchClips(doneClips.map(s => s.clipUrl!), {
        audioUrl,
        onStage: setStitchStage,
        onProgress: (r) => setStitchProgress(Math.round(r * 100)),
      })
      setStitched(url)
      setStitchStage('Done')
    } catch (e: any) {
      setError(e?.message || 'Stitching failed — you can still download each clip below.')
    } finally {
      if (audioUrl) URL.revokeObjectURL(audioUrl) // stitchClips has already read it
      setStitching(false)
    }
  }

  // Upload the stitched blob to get a shareable/insertable public URL.
  async function saveShareLink() {
    if (!stitchedUrl) return
    setSaving(true); setError(null)
    try {
      const blob = await (await fetch(stitchedUrl)).blob()
      const fd = new FormData()
      fd.append('file', new File([blob], 'storyboard.mp4', { type: 'video/mp4' }))
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !json.url) throw new Error(json.error || 'Could not save the video.')
      setShareUrl(json.url)
    } catch (e: any) {
      setError(e?.message || 'Saving failed')
    } finally {
      setSaving(false)
    }
  }

  const move = (i: number, dir: -1 | 1) => {
    setShots(prev => {
      const next = [...prev]; const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const busy = drafting || generatingAll || stitching || writingScript

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-zinc-200">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Clapperboard className="w-4 h-4 text-violet-400" /> Storyboard — clips into one video
      </div>

      {/* Topic + draft */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400">What's the video about?</label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          rows={2}
          placeholder="e.g. A 15-second social ad for Webstew, an AI website builder — energetic, modern, ends on 'Build yours free'."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Clips:</label>
          <select value={shotCount} onChange={e => setShotCount(Number(e.target.value))}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-white">
            {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={draftShots} disabled={!topic.trim() || busy}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-2">
            {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Draft with AI Director
          </button>
        </div>
        {theme && <p className="text-[11px] text-fuchsia-300/80">Theme: {theme}</p>}
      </div>

      {/* Shared reference image for visual consistency */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        {refImage ? (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
            <img src={refImage} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setRefImage(null)} className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-fuchsia-500/50 flex items-center justify-center cursor-pointer shrink-0">
            {refUploading ? <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" /> : <ImageIcon className="w-5 h-5 text-zinc-500" />}
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadReference(f) }} />
          </label>
        )}
        <div className="text-xs text-zinc-400">
          <span className="text-zinc-200 font-medium">Reference image (optional)</span><br />
          Grok reuses it across every clip so your character/product/brand stays consistent.
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Shot list */}
      {shots.length > 0 && (
        <div className="space-y-2">
          {shots.map((shot, i) => (
            <div key={shot.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-violet-300 bg-violet-500/15 rounded px-1.5 py-0.5">Clip {i + 1}</span>
                <StatusPill status={shot.status} />
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0 || busy} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === shots.length - 1 || busy} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setShots(prev => prev.filter(s => s.id !== shot.id))} disabled={busy} className="p-1 rounded hover:bg-white/10 disabled:opacity-30"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <textarea
                value={shot.prompt}
                onChange={e => patchShot(shot.id, { prompt: e.target.value })}
                rows={2}
                disabled={shot.status === 'generating'}
                className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500/50 resize-none"
              />
              {shot.status === 'done' && shot.clipUrl && (
                <video src={shot.clipUrl} muted loop className="mt-2 w-full max-h-40 rounded-lg" controls />
              )}
              {shot.status === 'error' && <p className="mt-1 text-[11px] text-red-300">{shot.error} <button onClick={() => generateShot(shot)} className="underline">retry</button></p>}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button onClick={() => setShots(prev => [...prev, { id: newId(), prompt: '', status: 'idle' }])} disabled={busy}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" /> Add clip
            </button>
            <button onClick={generateAll} disabled={busy || shots.every(s => s.status === 'done')}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-2">
              {generatingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
              {generatingAll ? 'Generating clips…' : 'Generate all clips'}
            </button>
          </div>
        </div>
      )}

      {/* Narration (optional) */}
      {shots.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Volume2 className="w-3.5 h-3.5 text-violet-400" /> Narration <span className="text-zinc-500 font-normal">(optional)</span>
          </div>
          <textarea
            value={narrationText}
            onChange={e => setNarrationText(e.target.value)}
            rows={2}
            placeholder="What should the voiceover say? Rough notes are fine — e.g. 'hype up how fast it is, end with build yours free'."
            className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <button onClick={writeScript} disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 text-xs font-medium px-3 py-1.5 disabled:opacity-40">
            {writingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
            Write with AI
          </button>
          {script && (
            <>
              <label className="block text-[11px] text-zinc-400 pt-1">Voiceover script (edit freely)</label>
              <textarea
                value={script}
                onChange={e => setScript(e.target.value)}
                rows={3}
                className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500/50 resize-none"
              />
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-zinc-400">Voice:</label>
                <select value={voice} onChange={e => setVoice(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white capitalize">
                  {TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <span className="text-[10px] text-zinc-500">~{estimatedSeconds}s of video · spoken when you stitch</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stitch */}
      {doneClips.length >= 2 && (
        <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/[0.06] p-3 space-y-2">
          <button onClick={stitch} disabled={stitching}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5">
            {stitching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {stitching ? (stitchStage || 'Stitching…') : `Stitch ${doneClips.length} clips into one video`}
          </button>
          {stitching && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-fuchsia-500 transition-all" style={{ width: `${stitchProgress}%` }} /></div>
              <p className="text-[10px] text-zinc-400">{stitchStage} {stitchProgress > 0 && `· ${stitchProgress}%`} · runs in your browser, may take a minute</p>
            </div>
          )}
          {!allDone && <p className="text-[10px] text-amber-300/80">Heads up: {shots.length - doneClips.length} clip(s) not generated yet — only the {doneClips.length} ready ones will be included.</p>}
        </div>
      )}

      {/* Result */}
      {stitchedUrl && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-300"><Check className="w-3.5 h-3.5" /> Your video is ready</div>
          <video src={stitchedUrl} controls autoPlay loop className="w-full rounded-lg" />
          <div className="flex gap-2">
            <a href={stitchedUrl} download="webstew-storyboard.mp4" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium py-2">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={saveShareLink} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium py-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} {shareUrl ? 'Saved ✓' : 'Save & get link'}
            </button>
          </div>
          {shareUrl && <input readOnly value={shareUrl} onFocus={e => e.currentTarget.select()} className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300" />}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: ShotStatus }) {
  const map: Record<ShotStatus, { t: string; c: string }> = {
    idle: { t: 'Not generated', c: 'text-zinc-500 bg-white/5' },
    generating: { t: 'Generating…', c: 'text-amber-300 bg-amber-500/15' },
    done: { t: 'Ready', c: 'text-green-300 bg-green-500/15' },
    error: { t: 'Failed', c: 'text-red-300 bg-red-500/15' },
  }
  const { t, c } = map[status]
  return <span className={`text-[10px] rounded px-1.5 py-0.5 ${c}`}>{t}</span>
}
