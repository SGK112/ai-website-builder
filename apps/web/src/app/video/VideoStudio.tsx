'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Clapperboard, Sparkles, Loader2, X, ArrowLeft, ArrowRight, Plus,
  Film, Download, Link2, Wand2, ImageIcon, AlertCircle, Volume2, PenLine, Play,
} from 'lucide-react'
import { stitchClips } from './storyboardStitch'
import VideoDirectorChat from './VideoDirectorChat'

// One unified workspace (YouTube-Studio style): generate clips on the left, see
// them in the preview, line them up on the timeline at the bottom, add a
// voiceover, then stitch + export — no separate Create/Storyboard/Edit/Library
// pages. The timeline IS your library; editing happens inline on each clip.

type Mode = 'text' | 'image'
type ClipStatus = 'generating' | 'done' | 'error'
interface Clip { id: string; prompt: string; status: ClipStatus; url?: string; error?: string; note?: string }

const VIDEO_MODELS = [
  { id: 'seedance', label: 'Seedance', hint: 'Fast · Best', multi: false, maxImages: 1 },
  { id: 'grok', label: 'Grok Imagine', hint: 'Premium · Multi-image', multi: true, maxImages: 4 },
  { id: 'wan', label: 'Wan 2.1', hint: 'Open', multi: false, maxImages: 1 },
  { id: 'svd', label: 'Stable Video', hint: 'Image→Video', multi: false, maxImages: 1 },
]
const ASPECTS = ['16:9', '9:16', '1:1', '4:5']
const STYLES = ['Cinematic', 'Realistic', 'Anime', '3D Render', 'Documentary', 'Slow Motion']
const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

export default function VideoStudio() {
  // Create controls
  const [mode, setMode] = useState<Mode>('text')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('seedance')
  const [style, setStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [duration, setDuration] = useState(5)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [directorOpen, setDirectorOpen] = useState(false)

  // Timeline / clips
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genLabel, setGenLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Narration
  const [narrationText, setNarrationText] = useState('')
  const [script, setScript] = useState('')
  const [voice, setVoice] = useState('onyx')
  const [writingScript, setWritingScript] = useState(false)

  // Stitch / export
  const [stitching, setStitching] = useState(false)
  const [stitchStage, setStitchStage] = useState('')
  const [stitchProgress, setStitchProgress] = useState(0)
  const [stitchedUrl, setStitchedUrl] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const stitchedRef = useRef<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const selectedModel = VIDEO_MODELS.find(m => m.id === model)
  const isMultiImage = !!selectedModel?.multi
  const maxImages = selectedModel?.maxImages ?? 1
  const doneClips = clips.filter(c => c.status === 'done' && c.url)
  const selectedClip = clips.find(c => c.id === selectedId) || null
  const previewUrl = stitchedUrl || selectedClip?.url || null
  const busy = generating || stitching || writingScript

  // Persist finished clips so a refresh doesn't wipe your work (generating a
  // clip costs credits + time). We store only DONE clips; their URLs are remote
  // (Cloudinary/provider), so they survive a reload.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('webstew_video_clips')
      if (raw) {
        const saved = JSON.parse(raw)
        if (Array.isArray(saved) && saved.length) setClips(saved)
      }
    } catch { /* ignore corrupt/blocked storage */ }
  }, [])
  useEffect(() => {
    try {
      const done = clips.filter(c => c.status === 'done' && c.url).map(c => ({ id: c.id, prompt: c.prompt, status: c.status, url: c.url }))
      localStorage.setItem('webstew_video_clips', JSON.stringify(done))
    } catch { /* storage full/blocked — non-fatal */ }
  }, [clips])

  const setStitched = (url: string | null) => {
    if (stitchedRef.current && stitchedRef.current !== url) URL.revokeObjectURL(stitchedRef.current)
    stitchedRef.current = url
    setStitchedUrl(url)
  }
  const patch = (id: string, p: Partial<Clip>) => setClips(prev => prev.map(c => (c.id === id ? { ...c, ...p } : c)))

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const toUpload = isMultiImage ? files : files.slice(0, 1)
    setError(null); setUploadingImage(true)
    try {
      const urls: string[] = []
      for (const file of toUpload) {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json().catch(() => ({} as any))
        if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`)
        if (!json.url || json.url.startsWith('data:')) throw new Error('Image storage isn\'t configured on this server.')
        urls.push(json.url)
      }
      setUploadedImages(prev => (isMultiImage ? [...prev, ...urls].slice(0, maxImages) : urls))
    } catch (e: any) {
      setError(e?.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Generate one clip and append it to the timeline.
  async function generateClip() {
    if (mode === 'text' && !prompt.trim()) { setError('Describe your clip first, or use the AI Director.'); return }
    if (mode === 'image' && uploadedImages.length === 0) { setError('Add a source image, or switch to Text.'); return }
    const id = `clip_${clips.length}_${Math.floor(performance.now())}`
    const clipPrompt = prompt.trim() || 'Animate this image with smooth, natural motion'
    setClips(prev => [...prev, { id, prompt: clipPrompt, status: 'generating' }])
    setSelectedId(id); setStitched(null); setShareUrl(null)
    setGenerating(true); setError(null); setGenLabel('Sending to ' + (selectedModel?.label || 'model') + '…')
    try {
      const body: Record<string, unknown> = {
        action: mode === 'text' ? 'text-to-video' : 'image-to-video',
        prompt: clipPrompt, model, aspectRatio, duration, style: style || undefined,
      }
      if (mode === 'image' && uploadedImages.length) {
        if (isMultiImage && uploadedImages.length > 1) body.imageUrls = uploadedImages
        else body.imageUrl = uploadedImages[0]
      }
      const res = await fetch('/api/ai/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok || !data.id) throw new Error(data.error || `Couldn't start generation (HTTP ${res.status}).`)
      setGenLabel('Rendering your clip…')
      const startedAt = Date.now()
      for (let i = 0; i < 80; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`/api/ai/video?id=${encodeURIComponent(data.id)}`)
        const pd = await poll.json().catch(() => ({} as any))
        if (pd.status === 'succeeded' && pd.videoUrl) { patch(id, { status: 'done', url: pd.videoUrl, note: undefined }); setGenerating(false); return }
        if (pd.status === 'failed') throw new Error(pd.error || 'Generation failed')
        // Surface live progress + a nudge if it's dragging (so a slow provider
        // isn't a mystery spinner).
        const elapsed = Math.round((Date.now() - startedAt) / 1000)
        const pct = typeof pd.logs === 'string' && pd.logs.includes('%') ? pd.logs : ''
        const slow = elapsed > 45 ? (model === 'grok' ? ' · Grok/xAI is slow right now — Seedance is faster' : ' · taking longer than usual') : ''
        patch(id, { note: `${pct || 'rendering'} · ${elapsed}s${slow}` })
        setGenLabel(`Rendering… ${pct || elapsed + 's'}`)
      }
      throw new Error(model === 'grok'
        ? 'Grok/xAI didn\'t finish in 4 min — their video service is likely busy. Try Seedance (fast & reliable).'
        : 'Timed out after 4 min waiting for the clip. Try again or a different model.')
    } catch (e: any) {
      patch(id, { status: 'error', error: e?.message || 'Generation failed' })
      setError(e?.message || 'Generation failed')
    } finally {
      setGenerating(false); setGenLabel('')
    }
  }

  async function writeScript() {
    setWritingScript(true); setError(null)
    try {
      const secs = Math.max(3, (doneClips.length || clips.length || 1) * 8)
      const res = await fetch('/api/ai/video/narration', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'write', text: narrationText, topic: clips[0]?.prompt || prompt, totalSeconds: secs }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || 'Couldn\'t write a script')
      setScript(data.script || '')
    } catch (e: any) { setError(e?.message || 'Scriptwriting failed') } finally { setWritingScript(false) }
  }

  async function stitchAndExport() {
    if (doneClips.length < 1) { setError('Generate at least one clip first.'); return }
    setStitching(true); setError(null); setStitchProgress(0); setStitchStage('Starting…'); setStitched(null); setShareUrl(null)
    let audioUrl: string | null = null
    try {
      if (script.trim()) {
        setStitchStage('Generating narration…')
        const res = await fetch('/api/ai/video/narration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'speak', script: script.trim(), voice }) })
        if (!res.ok) { const e = await res.json().catch(() => ({} as any)); throw new Error(e.error || `Narration failed (HTTP ${res.status}).`) }
        audioUrl = URL.createObjectURL(await res.blob())
      }
      const url = await stitchClips(doneClips.map(c => c.url!), { audioUrl, onStage: setStitchStage, onProgress: (r) => setStitchProgress(Math.round(r * 100)) })
      setStitched(url); setSelectedId(null); setStitchStage('Done')
    } catch (e: any) {
      setError(e?.message || 'Stitching failed — you can still download each clip from the timeline.')
    } finally {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setStitching(false)
    }
  }

  async function saveShareLink() {
    if (!stitchedUrl) return
    setSaving(true); setError(null)
    try {
      const blob = await (await fetch(stitchedUrl)).blob()
      const fd = new FormData(); fd.append('file', new File([blob], 'video.mp4', { type: 'video/mp4' }))
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !json.url) throw new Error(json.error || 'Could not save the video.')
      setShareUrl(json.url)
    } catch (e: any) { setError(e?.message || 'Saving failed') } finally { setSaving(false) }
  }

  const move = (i: number, dir: -1 | 1) => setClips(prev => {
    const next = [...prev]; const j = i + dir
    if (j < 0 || j >= next.length) return prev
    ;[next[i], next[j]] = [next[j], next[i]]; return next
  })

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center"><Clapperboard className="w-4 h-4 text-violet-300" /></div>
          <div>
            <div className="text-sm font-semibold text-white">Video Studio</div>
            <div className="text-[10px] text-zinc-500">Generate clips → arrange on the timeline → stitch & export</div>
          </div>
        </div>
        <a href="/workspace" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> Workspace</a>
      </div>

      {/* Top: tools + preview */}
      <div className="flex-1 flex min-h-0">
        {/* CREATE rail */}
        <div className="w-72 shrink-0 border-r border-white/10 overflow-y-auto p-3 space-y-3">
          <div className="flex gap-1.5">
            <button onClick={() => setMode('text')} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${mode === 'text' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'}`}>Text → Video</button>
            <button onClick={() => setMode('image')} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${mode === 'image' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'}`}>Image → Video</button>
          </div>

          {mode === 'image' && (
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((u, i) => (
                <div key={u + i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {uploadedImages.length < maxImages && (
                <button onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-fuchsia-500/50 flex items-center justify-center text-zinc-500">
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" multiple={isMultiImage} className="hidden" onChange={handleImageUpload} />
            </div>
          )}

          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            placeholder={mode === 'text' ? 'Describe this clip…' : 'Optional motion (e.g. slow push-in)…'}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none" />
          <button onClick={() => setDirectorOpen(true)} className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 hover:from-violet-600/25 text-violet-200 text-xs font-medium py-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Director — craft this prompt
          </button>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Style</label>
            <div className="flex flex-wrap gap-1">
              {STYLES.map(s => <button key={s} onClick={() => setStyle(style === s ? '' : s)} className={`px-2 py-0.5 rounded text-[11px] border ${style === s ? 'border-violet-500/50 bg-violet-500/20 text-violet-300' : 'border-white/10 text-zinc-500'}`}>{s}</button>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Format</label>
              <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                {ASPECTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Length: {duration}s</label>
              <input type="range" min={3} max={12} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-violet-500" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
              {VIDEO_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} — {m.hint}</option>)}
            </select>
          </div>

          <button onClick={generateClip} disabled={busy || uploadingImage}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> {genLabel || 'Generating…'}</> : <><Plus className="w-4 h-4" /> Generate clip → timeline</>}
          </button>
          {error && <div className="flex items-start gap-1.5 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{error}</span></div>}
        </div>

        {/* PREVIEW */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-w-0">
          {previewUrl ? (
            <div className="w-full max-w-2xl">
              {stitchedUrl && <div className="text-[11px] text-green-300 mb-1.5 flex items-center gap-1"><Film className="w-3.5 h-3.5" /> Full cut ({doneClips.length} clip{doneClips.length !== 1 ? 's' : ''}{script.trim() ? ' + voiceover' : ''})</div>}
              <video key={previewUrl} src={previewUrl} controls autoPlay loop className="w-full rounded-xl bg-black" />
              {stitchedUrl && (
                <div className="flex gap-2 mt-2">
                  <a href={stitchedUrl} download="webstew-video.mp4" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium py-2"><Download className="w-3.5 h-3.5" /> Download</a>
                  <button onClick={saveShareLink} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium py-2 disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} {shareUrl ? 'Saved ✓' : 'Save & get link'}</button>
                </div>
              )}
              {shareUrl && <input readOnly value={shareUrl} onFocus={e => e.currentTarget.select()} className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300" />}
            </div>
          ) : (
            <div className="text-center text-zinc-600">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3"><Film className="w-7 h-7" /></div>
              <div className="text-sm text-zinc-400">Your video appears here</div>
              <div className="text-xs">Generate a clip — it drops onto the timeline below</div>
            </div>
          )}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="shrink-0 border-t border-white/10 bg-black/30 p-3 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Timeline</span>
          {clips.length > 0 && <button onClick={() => { if (confirm('Clear all clips from the timeline?')) { setClips([]); setSelectedId(null); setStitched(null) } }} disabled={busy} className="text-[10px] text-zinc-500 hover:text-red-300 disabled:opacity-30">Clear</button>}
          <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
            {clips.length === 0 && <span className="text-xs text-zinc-600 py-4">No clips yet — generate one on the left.</span>}
            {clips.map((c, i) => (
              <div key={c.id} onClick={() => { if (c.url) { setStitched(null); setSelectedId(c.id) } }}
                className={`relative shrink-0 w-32 rounded-lg border overflow-hidden cursor-pointer ${selectedId === c.id && !stitchedUrl ? 'border-violet-500' : 'border-white/10'}`}>
                {c.status === 'done' && c.url ? (
                  <video src={c.url} muted className="w-full h-16 object-cover bg-black" />
                ) : (
                  <div className="w-full h-16 flex flex-col items-center justify-center gap-1 bg-zinc-900 text-[9px] text-zinc-400 px-1 text-center">
                    {c.status === 'generating'
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" /><span className="leading-tight">{c.note || 'starting…'}</span></>
                      : <span className="text-red-400 leading-tight" title={c.error}>{c.error?.slice(0, 60) || 'failed'}</span>}
                  </div>
                )}
                <div className="flex items-center justify-between px-1 py-0.5 bg-black/50">
                  <span className="text-[9px] text-zinc-400">Clip {i + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); move(i, -1) }} disabled={i === 0 || busy} className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-30"><ArrowLeft className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); move(i, 1) }} disabled={i === clips.length - 1 || busy} className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-30"><ArrowRight className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); setClips(prev => prev.filter(x => x.id !== c.id)) }} disabled={busy} className="p-0.5 text-zinc-500 hover:text-red-400 disabled:opacity-30"><X className="w-3 h-3" /></button>
                  </div>
                </div>
                {c.status === 'error' && <button onClick={e => { e.stopPropagation(); patch(c.id, { status: 'generating' }); /* retry via regenerate not wired in v1 */ }} className="hidden" />}
              </div>
            ))}
          </div>
        </div>

        {/* Narration + export row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-1.5 mb-1"><Volume2 className="w-3.5 h-3.5 text-violet-400" /><span className="text-[11px] text-zinc-400">Voiceover (optional)</span></div>
            <div className="flex gap-2">
              <input value={script || narrationText} onChange={e => (script ? setScript(e.target.value) : setNarrationText(e.target.value))}
                placeholder="What should the voice say? (rough notes are fine)"
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50" />
              <button onClick={writeScript} disabled={busy} className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 text-xs px-2.5 py-1.5 disabled:opacity-40">{writingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />} Write</button>
              <select value={voice} onChange={e => setVoice(e.target.value)} className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white capitalize">{TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}</select>
            </div>
          </div>
          <button onClick={stitchAndExport} disabled={busy || doneClips.length < 1}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5">
            {stitching ? <><Loader2 className="w-4 h-4 animate-spin" /> {stitchStage}{stitchProgress > 0 ? ` ${stitchProgress}%` : ''}</> : <><Wand2 className="w-4 h-4" /> Stitch & Export {doneClips.length > 1 ? `(${doneClips.length} clips)` : ''}</>}
          </button>
        </div>
        {stitching && <p className="text-[10px] text-zinc-500">Stitching runs in your browser — first run loads the engine (~a few MB), can take a minute.</p>}
      </div>

      <VideoDirectorChat
        open={directorOpen}
        initialPrompt={prompt}
        context={{ mode, model, modelLabel: selectedModel?.label, imageCount: uploadedImages.length, style, aspectRatio, duration }}
        onApply={(p) => setPrompt(p)}
        onClose={() => setDirectorOpen(false)}
      />
    </div>
  )
}
