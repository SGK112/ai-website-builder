'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Clapperboard, Sparkles, Loader2, X, ArrowLeft, ArrowRight, Plus,
  Film, Download, Link2, Wand2, ImageIcon, AlertCircle, Volume2, PenLine, Play, Music,
  Bookmark, BookmarkCheck, Trash2, Pause, Share2, Tag,
} from 'lucide-react'
import VideoDirectorChat from './VideoDirectorChat'
import SellCreationModal from './SellCreationModal'
import { STUDIO_MUSIC, trackById, trackSrc } from '@/lib/studio-music'

// One unified workspace (YouTube-Studio style): generate clips on the left, see
// them in the preview, line them up on the timeline at the bottom, add a
// voiceover, then stitch + export — no separate Create/Storyboard/Edit/Library
// pages. The timeline IS your library; editing happens inline on each clip.

type Mode = 'text' | 'image'
type ClipStatus = 'generating' | 'done' | 'error'
interface Clip { id: string; prompt: string; status: ClipStatus; url?: string; error?: string; note?: string; audio?: boolean }

const VIDEO_MODELS = [
  { id: 'seedance', label: 'Seedance', hint: 'Fast · Best', multi: false, maxImages: 1 },
  { id: 'grok', label: 'Grok Imagine', hint: 'Premium · Multi-image', multi: true, maxImages: 4 },
  { id: 'wan', label: 'Wan 2.1', hint: 'Open', multi: false, maxImages: 1 },
  { id: 'svd', label: 'Stable Video', hint: 'Image→Video', multi: false, maxImages: 1 },
]
const ASPECTS = ['16:9', '9:16', '1:1', '4:5']
const STYLES = ['Cinematic', 'Realistic', 'Anime', '3D Render', 'Documentary', 'Slow Motion']
const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

// How many source images you can stage at once (each becomes its own clip in
// "Make ad" mode). Independent of a model's per-clip reference-image cap.
const MAX_SOURCE_IMAGES = 6
// Models that accept an image as input. A non-image model selected in image
// mode falls back to Seedance so a stray choice (e.g. Wan) can't waste a job.
const IMAGE_CAPABLE = new Set(['seedance', 'grok', 'svd'])
// Unique clip id — performance.now()+random avoids collisions when a batch
// appends several clips within the same millisecond.
const newClipId = () => `clip_${Math.floor(performance.now())}_${Math.floor(Math.random() * 1e6)}`

// Cross-origin Cloudinary URLs ignore the <a download> attribute (they just
// open). fl_attachment forces a real download via Content-Disposition.
function toDownloadUrl(url: string): string {
  return url.includes('/video/upload/') ? url.replace('/video/upload/', '/video/upload/fl_attachment/') : url
}

interface Creation { id: string; kind: 'clip' | 'video'; url: string; title: string }

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
  const [dragOver, setDragOver] = useState(false)
  const [directorOpen, setDirectorOpen] = useState(false)

  // Timeline / clips
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genLabel, setGenLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Voice track (narration)
  const [narrationText, setNarrationText] = useState('')
  const [script, setScript] = useState('')
  const [voice, setVoice] = useState('onyx')
  const [writingScript, setWritingScript] = useState(false)

  // Music track (continuous soundtrack under everything)
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const [musicName, setMusicName] = useState<string>('')
  const [musicVolume, setMusicVolume] = useState(0.3)
  const [theme, setTheme] = useState('') // established film look — keeps new clips consistent
  const [musicTrackId, setMusicTrackId] = useState<string | null>(null) // bundled library track
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const hasMusic = !!(musicUrl || musicTrackId)
  // Stop any music preview if the studio unmounts.
  useEffect(() => () => { previewAudioRef.current?.pause(); previewAudioRef.current = null }, [])
  const [uploadingMusic, setUploadingMusic] = useState(false)
  const musicInputRef = useRef<HTMLInputElement>(null)

  // Saved Creations (per-user library of clips + finished videos)
  const [creations, setCreations] = useState<Creation[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({})
  const [sharedLinks, setSharedLinks] = useState<Record<string, string>>({}) // creationId → /v/ link
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [sellTarget, setSellTarget] = useState<Creation | null>(null) // creation being listed for sale

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
      const t = localStorage.getItem('webstew_video_theme')
      if (t) setTheme(t)
    } catch { /* ignore corrupt/blocked storage */ }
  }, [])
  useEffect(() => {
    try {
      const done = clips.filter(c => c.status === 'done' && c.url).map(c => ({ id: c.id, prompt: c.prompt, status: c.status, url: c.url, audio: c.audio }))
      localStorage.setItem('webstew_video_clips', JSON.stringify(done))
    } catch { /* storage full/blocked — non-fatal */ }
  }, [clips])
  useEffect(() => {
    try { localStorage.setItem('webstew_video_theme', theme) } catch { /* non-fatal */ }
  }, [theme])

  // The clip prompts already on the timeline — the "series" the Director keeps
  // new shots consistent with.
  const seriesPrompts = clips.filter(c => c.status === 'done').map(c => c.prompt).filter(Boolean)
  // Seed the theme from the first shot's prompt when it's still blank, so a
  // multi-clip film stays coherent even if the user never sets a theme by hand.
  function seedTheme(fromPrompt: string) {
    if (theme.trim() || !fromPrompt.trim()) return
    const base = fromPrompt.trim().slice(0, 200)
    setTheme(style ? `${base} · ${style} look` : base)
  }

  const setStitched = (url: string | null) => {
    // Only blob URLs need revoking; the render now returns a remote Cloudinary URL.
    if (stitchedRef.current && stitchedRef.current !== url && stitchedRef.current.startsWith('blob:')) URL.revokeObjectURL(stitchedRef.current)
    stitchedRef.current = url
    setStitchedUrl(url)
  }
  const patch = (id: string, p: Partial<Clip>) => setClips(prev => prev.map(c => (c.id === id ? { ...c, ...p } : c)))

  // Upload a single file to our CDN and return its remote URL (throws on
  // failure / unconfigured storage). Shared by image staging + video import.
  async function uploadOne(file: File): Promise<string> {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json().catch(() => ({} as any))
    if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`)
    if (!json.url || json.url.startsWith('data:')) throw new Error('Media storage isn\'t configured on this server.')
    return json.url
  }

  // Take in mixed source media (click-to-pick OR drag-and-drop):
  //  • IMAGES stage in the tray — "Generate clip" turns the tray into one clip
  //    (multi-image models use several as refs), "Make ad" makes one per image.
  //  • VIDEOS drop straight onto the timeline as ready clips, so you can mix
  //    your own footage with generated clips, then add music + voice and render.
  async function uploadSourceFiles(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/'))
    const videos = files.filter(f => f.type.startsWith('video/'))
    if (!images.length && !videos.length) {
      if (files.length) setError('Add images or a video — other file types aren’t supported here.')
      return
    }
    setError(null); setUploadingImage(true)
    try {
      // Videos → timeline clips (already finished footage; assume they carry audio).
      for (const file of videos) {
        const url = await uploadOne(file)
        const id = newClipId()
        const name = file.name.replace(/\.[^.]+$/, '').trim() || 'Uploaded clip'
        setClips(prev => [...prev, { id, prompt: name, status: 'done', url, audio: true }])
        setSelectedId(id); setStitched(null); setShareUrl(null)
      }
      // Images → staging tray (capped at MAX_SOURCE_IMAGES total).
      if (images.length) {
        const room = MAX_SOURCE_IMAGES - uploadedImages.length
        if (room <= 0) { setError(`You can stage up to ${MAX_SOURCE_IMAGES} images.`); return }
        const urls: string[] = []
        for (const file of images.slice(0, room)) urls.push(await uploadOne(file))
        setUploadedImages(prev => [...prev, ...urls].slice(0, MAX_SOURCE_IMAGES))
      }
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (imageInputRef.current) imageInputRef.current.value = '' // allow re-picking the same file
    if (mode !== 'image') setMode('image')
    void uploadSourceFiles(files)
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (!files.length) return
    if (mode !== 'image') setMode('image')
    void uploadSourceFiles(files)
  }

  // Append the established look so a generation matches the rest of the film.
  const withTheme = (p: string, t: string) => t ? `${p}. Visual continuity with the rest of the film: ${t}.` : p

  // Run ONE clip's generation to completion: POST → poll → patch the clip row.
  // `images` empty = text-to-video; otherwise image-to-video (one ref per clip,
  // or several refs for a multi-image model). Returns an error string on
  // failure (already recorded on the clip) or null on success. The caller owns
  // the `generating` flag + selection; `label` lets a batch prefix "Clip 2/5".
  async function runClipJob(id: string, genPrompt: string, images: string[], label: (s: string) => void = setGenLabel): Promise<string | null> {
    const useImages = images.length > 0
    // A non-image model picked in image mode falls back to Seedance.
    const useModel = useImages && !IMAGE_CAPABLE.has(model) ? 'seedance' : model
    const modelLabel = VIDEO_MODELS.find(m => m.id === useModel)?.label || 'model'
    try {
      const body: Record<string, unknown> = {
        action: useImages ? 'image-to-video' : 'text-to-video',
        prompt: genPrompt, model: useModel, aspectRatio, duration, style: style || undefined,
      }
      if (useImages) {
        if (isMultiImage && images.length > 1) body.imageUrls = images.slice(0, maxImages)
        else body.imageUrl = images[0]
      }
      label('Sending to ' + modelLabel + '…')
      const res = await fetch('/api/ai/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok || !data.id) throw new Error(data.error || `Couldn't start generation (HTTP ${res.status}).`)
      label('Rendering your clip…')
      const startedAt = Date.now()
      for (let i = 0; i < 80; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`/api/ai/video?id=${encodeURIComponent(data.id)}`)
        const pd = await poll.json().catch(() => ({} as any))
        // Grok Imagine clips carry their own audio (music/ambient); the others are silent.
        if (pd.status === 'succeeded' && pd.videoUrl) { patch(id, { status: 'done', url: pd.videoUrl, note: undefined, audio: useModel === 'grok' }); return null }
        if (pd.status === 'failed') throw new Error(pd.error || 'Generation failed')
        // Surface live progress + a nudge if it's dragging (so a slow provider
        // isn't a mystery spinner).
        const elapsed = Math.round((Date.now() - startedAt) / 1000)
        const pct = typeof pd.logs === 'string' && pd.logs.includes('%') ? pd.logs : ''
        const slow = elapsed > 45 ? (useModel === 'grok' ? ' · Grok/xAI is slow right now — Seedance is faster' : ' · taking longer than usual') : ''
        patch(id, { note: `${pct || 'rendering'} · ${elapsed}s${slow}` })
        label(`Rendering… ${pct || elapsed + 's'}`)
      }
      throw new Error(useModel === 'grok'
        ? 'Grok/xAI didn\'t finish in 4 min — their video service is likely busy. Try Seedance (fast & reliable).'
        : 'Timed out after 4 min waiting for the clip. Try again or a different model.')
    } catch (e: any) {
      const msg = e?.message || 'Generation failed'
      patch(id, { status: 'error', error: msg })
      return msg
    }
  }

  // Generate one clip from the current prompt (+ staged images) → timeline.
  async function generateClip() {
    if (mode === 'text' && !prompt.trim()) { setError('Describe your clip first, or use the AI Director.'); return }
    if (mode === 'image' && uploadedImages.length === 0) { setError('Add a source image, or switch to Text.'); return }
    const id = newClipId()
    const clipPrompt = prompt.trim() || 'Animate this image with smooth, natural motion'
    // First shot seeds the film's theme; later shots inherit it for continuity.
    seedTheme(clipPrompt)
    // The first clip has no theme yet → no continuity suffix.
    const genPrompt = withTheme(clipPrompt, theme.trim())
    setClips(prev => [...prev, { id, prompt: clipPrompt, status: 'generating' }])
    setSelectedId(id); setStitched(null); setShareUrl(null)
    setGenerating(true); setError(null)
    const err = await runClipJob(id, genPrompt, mode === 'image' ? uploadedImages : [])
    if (err) setError(err)
    setGenerating(false); setGenLabel('')
  }

  // Turn EACH staged image into its own clip, all sharing one motion direction
  // + theme so they cut together as a cohesive ad. Generates sequentially (the
  // backend meters credits + rate-limits per start), appending as it goes.
  async function generateAdFromImages() {
    if (uploadedImages.length === 0) { setError('Add some images first — each becomes a clip.'); return }
    const imgs = [...uploadedImages]
    const motion = prompt.trim() || 'Animate this image with smooth, natural cinematic motion'
    setStitched(null); setShareUrl(null); setSelectedId(null)
    setGenerating(true); setError(null)
    // Seed the theme locally — setTheme won't commit between synchronous loop
    // iterations, so we carry the effective theme in a local var.
    let effTheme = theme.trim()
    if (!effTheme) { effTheme = (style ? `${motion.slice(0, 200)} · ${style} look` : motion.slice(0, 200)); setTheme(effTheme) }
    let failures = 0
    for (let k = 0; k < imgs.length; k++) {
      const id = newClipId()
      // First clip carries no suffix (mirrors single-generate); the rest match it.
      const genPrompt = k === 0 ? motion : withTheme(motion, effTheme)
      setClips(prev => [...prev, { id, prompt: motion, status: 'generating' }])
      setSelectedId(id)
      const err = await runClipJob(id, genPrompt, [imgs[k]], s => setGenLabel(`Clip ${k + 1}/${imgs.length} · ${s}`))
      if (err) failures++
    }
    setGenerating(false); setGenLabel('')
    if (failures) setError(`${failures} of ${imgs.length} clips failed — retry those, or render the ones that worked.`)
  }

  async function uploadMusic(file: File) {
    setUploadingMusic(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !json.url) throw new Error(json.error || `Music upload failed (${res.status})`)
      setMusicUrl(json.url); setMusicName(file.name); setMusicTrackId(null)
    } catch (e: any) { setError(e?.message || 'Music upload failed') } finally {
      setUploadingMusic(false)
      if (musicInputRef.current) musicInputRef.current.value = ''
    }
  }

  function stopPreview() {
    previewAudioRef.current?.pause()
    previewAudioRef.current = null
    setPreviewingTrack(null)
  }
  // Play a 1-track preview from the bundled library (toggles off if same track).
  function togglePreview(trackId: string) {
    if (previewingTrack === trackId) { stopPreview(); return }
    stopPreview()
    const t = trackById(trackId)
    if (!t) return
    const a = new Audio(trackSrc(t))
    a.volume = 0.7
    a.onended = () => setPreviewingTrack(null)
    a.onerror = () => { setPreviewingTrack(null); setError(`Preview unavailable for "${t.title}" — the track file isn't installed yet.`) }
    a.play().catch(() => {})
    previewAudioRef.current = a
    setPreviewingTrack(trackId)
  }
  function selectTrack(trackId: string) {
    const t = trackById(trackId)
    if (!t) return
    stopPreview()
    // musicTrackId is the server-authoritative reference (the renderer resolves
    // the real source from the manifest); musicUrl mirrors it for completeness.
    setMusicTrackId(t.id); setMusicUrl(trackSrc(t)); setMusicName(t.title); setShowMusicPicker(false)
  }
  function clearMusic() {
    stopPreview()
    setMusicUrl(null); setMusicTrackId(null); setMusicName('')
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
    setStitching(true); setError(null); setStitchProgress(0); setStitchStage('Starting render…'); setStitched(null); setShareUrl(null)
    try {
      // ASYNC server render: POST kicks off a background job and returns a jobId
      // right away (a 10-clip film takes minutes — far past the proxy's ~100s
      // limit, so a synchronous wait died with HTTP 524). Then we poll for the
      // finished Cloudinary URL, the same pattern clip generation uses.
      const res = await fetch('/api/ai/video/render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipUrls: doneClips.map(c => c.url),
          clipsHaveAudio: doneClips.length > 0 && doneClips.every(c => c.audio === true),
          // Speak whatever's in the Voice box — the polished "Write" output if
          // there is one, else the user's raw typed line. (Previously a line
          // typed without clicking Write was silently dropped from the render.)
          script: (script.trim() || narrationText.trim()) || undefined,
          voice,
          musicUrl: musicUrl || undefined,
          musicTrackId: musicTrackId || undefined,
          musicVolume,
          aspectRatio,
          title: prompt.trim() || script.trim().slice(0, 80) || 'Untitled film',
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok || !data.jobId) throw new Error(data.error || `Couldn't start the render (HTTP ${res.status}).`)

      const startedAt = Date.now()
      setStitchStage('Rendering on the server…')
      // Poll up to ~5 min (100 × 3s). Downloads + ffmpeg + upload for a full film.
      for (let i = 0; i < 100; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`/api/ai/video/render?id=${encodeURIComponent(data.jobId)}`)
        const pd = await poll.json().catch(() => ({} as any))
        if (pd.status === 'done' && pd.url) {
          setStitched(pd.url); setShareUrl(pd.url); setSelectedId(null); setStitchStage('Done')
          // The server already saved this to the library — refetch so the
          // Saved drawer reflects it without a duplicate POST.
          fetch('/api/ai/video/creations').then(r => r.ok ? r.json() : null)
            .then(d => { if (d && Array.isArray(d.creations)) setCreations(d.creations) }).catch(() => {})
          return
        }
        if (pd.status === 'failed') throw new Error(pd.error || 'Render failed.')
        const elapsed = Math.round((Date.now() - startedAt) / 1000)
        setStitchStage(`Rendering on the server… ${elapsed}s`)
      }
      throw new Error('Render is taking longer than expected. It may still finish — check your Saved creations in a minute.')
    } catch (e: any) {
      setError(e?.message || 'Render failed — you can still download each clip from the timeline.')
    } finally {
      setStitching(false)
    }
  }

  // Mint a public watch link on webstew (/v/<id>) for the finished video. The
  // file is already hosted on our CDN; this just creates the shareable page
  // anyone — including signed-out guests — can open, with a CTA back here.
  async function saveShareLink() {
    if (!stitchedUrl) return
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/ai/video/share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: stitchedUrl, title: prompt.trim() || script.trim().slice(0, 80) || 'A Webstew video' }),
      })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !json.shareUrl) throw new Error(json.error || 'Could not create a share link.')
      setShareUrl(json.shareUrl)
    } catch (e: any) { setError(e?.message || 'Could not create a share link.') } finally { setSaving(false) }
  }

  const move = (i: number, dir: -1 | 1) => setClips(prev => {
    const next = [...prev]; const j = i + dir
    if (j < 0 || j >= next.length) return prev
    ;[next[i], next[j]] = [next[j], next[i]]; return next
  })

  // ── Saved Creations ──────────────────────────────────────────────────────
  // Load the user's saved library on mount. 401 (signed out) is silent.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/ai/video/creations')
        if (!res.ok) return
        const data = await res.json().catch(() => ({} as any))
        if (!cancelled && Array.isArray(data.creations)) setCreations(data.creations)
      } catch { /* offline / not signed in — non-fatal */ }
    })()
    return () => { cancelled = true }
  }, [])

  const isSaved = (url: string) => creations.some(c => c.url === url)

  async function saveCreation(kind: 'clip' | 'video', url: string, title: string) {
    if (!url || isSaved(url)) return
    setSavingIds(prev => ({ ...prev, [url]: true }))
    try {
      const res = await fetch('/api/ai/video/creations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, url, title }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data.error || 'Could not save.')
      // Server returns the saved row (or {already:true} on dedupe). Either way,
      // reflect it in the library if it isn't already there.
      if (data.id && !isSaved(url)) {
        setCreations(prev => [{ id: String(data.id), kind, url, title }, ...prev])
      }
    } catch (e: any) {
      setError(e?.message || 'Could not save to your creations.')
    } finally {
      setSavingIds(prev => { const n = { ...prev }; delete n[url]; return n })
    }
  }

  // Mint (or reuse) a public /v/ watch link for a library item and copy it.
  async function shareCreation(cr: Creation) {
    if (sharedLinks[cr.id]) { navigator.clipboard?.writeText(sharedLinks[cr.id]).catch(() => {}); return }
    setSharingId(cr.id)
    try {
      const res = await fetch('/api/ai/video/share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cr.url, title: cr.title || 'A Webstew video' }),
      })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok || !j.shareUrl) throw new Error(j.error || 'Could not create a share link.')
      setSharedLinks(prev => ({ ...prev, [cr.id]: j.shareUrl }))
      navigator.clipboard?.writeText(j.shareUrl).catch(() => {})
    } catch (e: any) { setError(e?.message || 'Could not create a share link.') } finally { setSharingId(null) }
  }

  async function deleteCreation(id: string) {
    const prev = creations
    setCreations(cur => cur.filter(c => c.id !== id)) // optimistic
    try {
      const res = await fetch(`/api/ai/video/creations?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
    } catch {
      setCreations(prev) // roll back on failure
      setError('Could not remove that creation. Try again.')
    }
  }

  // Pull a saved creation back onto the timeline as a ready clip. A saved
  // "video" is a finished cut, but on the timeline it's just another source
  // clip you can stitch with others. Grok clips carried audio; we don't know
  // the source model here, so assume silent (safe — concat a=1 only fires when
  // EVERY clip has audio).
  function addCreationToTimeline(cr: Creation) {
    const id = `clip_${clips.length}_${Math.floor(performance.now())}`
    setClips(prev => [...prev, { id, prompt: cr.title || 'Saved creation', status: 'done', url: cr.url, audio: false }])
    // Adding a saved piece anchors the theme so the Director keeps the rest of
    // the film consistent with it.
    seedTheme(cr.title || '')
    setStitched(null); setSelectedId(id); setShowSaved(false)
  }

  // "Save & start new": stash the finished cut to the library (if any), then
  // clear the timeline for a fresh project. Clips already live in localStorage.
  async function startNew() {
    if (stitchedUrl) await saveCreation('video', stitchedUrl, prompt.trim() || 'Untitled video')
    if (busy && !confirm('A job is still running. Start a new project anyway?')) return
    setClips([]); setSelectedId(null); setStitched(null); setShareUrl(null)
    setPrompt(''); setScript(''); setError(null); setTheme('')
  }

  // Root is sized to the area BELOW the global WorkspaceNav (fixed h-16 + the
  // layout's pt-16). h-screen here overflowed by 64px and pushed the timeline +
  // voice tracks off the bottom of the viewport.
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center"><Clapperboard className="w-4 h-4 text-violet-300" /></div>
          <div>
            <div className="text-sm font-semibold text-white">Video Studio</div>
            <div className="text-[10px] text-zinc-500">Generate clips → arrange on the timeline → stitch & export</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={startNew} disabled={busy} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/25 disabled:opacity-40"><Plus className="w-3.5 h-3.5" /> New</button>
          <button onClick={() => setShowSaved(s => !s)} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${showSaved ? 'border-violet-500 text-violet-200 bg-violet-500/10' : 'border-white/10 text-zinc-300 hover:text-white hover:border-white/25'}`}><Bookmark className="w-3.5 h-3.5" /> Saved{creations.length ? ` (${creations.length})` : ''}</button>
          <a href="/workspace" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> Workspace</a>
        </div>
      </div>

      {/* Top: tools + preview */}
      <div className="flex-1 flex min-h-0">
        {/* CREATE rail */}
        <div className="w-72 shrink-0 border-r border-white/10 overflow-y-auto p-3 space-y-3">
          <div className="flex gap-1.5">
            <button onClick={() => setMode('text')} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${mode === 'text' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'}`}>Text → Video</button>
            <button onClick={() => setMode('image')} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${mode === 'image' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'}`}>Image / Video</button>
          </div>

          {mode === 'image' && (
            <div
              onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true) }}
              onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
              onDrop={handleImageDrop}
              className={`rounded-xl border-2 border-dashed p-2 transition-colors ${dragOver ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10'}`}
            >
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((u, i) => (
                  <div key={u + i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900">
                    <img src={u} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 left-0.5 text-[9px] px-1 rounded bg-black/60 text-white">{i + 1}</span>
                    <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {uploadedImages.length < MAX_SOURCE_IMAGES && (
                  <button onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-fuchsia-500/50 flex items-center justify-center text-zinc-500">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5 px-0.5">
                Drag &amp; drop or click to add up to {MAX_SOURCE_IMAGES} images, or drop a <span className="text-zinc-400">video</span> to drop it straight onto the timeline. {uploadedImages.length >= 2 ? 'Use “Make ad” to turn each image into its own clip.' : 'Add a few images to build an ad from them.'}
              </p>
              <input ref={imageInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>
          )}

          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            placeholder={mode === 'text' ? 'Describe this clip…' : 'Optional motion (e.g. slow push-in)…'}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none" />
          <button onClick={() => setDirectorOpen(true)} className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 hover:from-violet-600/25 text-violet-200 text-xs font-medium py-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Director — craft this prompt
          </button>

          {/* Theme — the film's look. New clips (and the Director) stay
              consistent with it, so a multi-clip story holds together. */}
          <div>
            <label className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
              <span className="flex items-center gap-1"><Film className="w-3 h-3 text-fuchsia-300/70" /> Theme {seriesPrompts.length > 1 && <span className="text-fuchsia-300/70">· keeps {seriesPrompts.length} clips consistent</span>}</span>
              {theme && <button onClick={() => setTheme('')} className="text-zinc-600 hover:text-red-300">clear</button>}
            </label>
            <textarea value={theme} onChange={e => setTheme(e.target.value)} rows={2}
              placeholder="e.g. moody cinematic lighthouse, cold blue + amber, film grain, anamorphic"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-fuchsia-500/40 resize-none" />
            <p className="text-[10px] text-zinc-600 mt-0.5">New clips follow this look so they fit the rest of the film. Auto-set from your first shot — edit anytime.</p>
          </div>

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
          {/* Batch: one clip per staged image → a multi-shot ad on the timeline. */}
          {mode === 'image' && uploadedImages.length >= 2 && (
            <button onClick={generateAdFromImages} disabled={busy || uploadingImage}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-600/15 to-violet-600/15 hover:from-fuchsia-600/25 disabled:opacity-40 text-fuchsia-100 text-sm font-semibold py-2.5">
              <Film className="w-4 h-4" /> Make ad — a clip per image ({uploadedImages.length})
            </button>
          )}
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
                  {/* fl_attachment forces a real download — a bare cross-origin
                      Cloudinary URL ignores the `download` attr and just opens. */}
                  <a href={toDownloadUrl(stitchedUrl)} download="webstew-video.mp4" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium py-2"><Download className="w-3.5 h-3.5" /> Download</a>
                  <button onClick={() => saveCreation('video', stitchedUrl, prompt.trim() || 'Untitled video')} disabled={!!savingIds[stitchedUrl] || isSaved(stitchedUrl)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium py-2 disabled:opacity-50">{savingIds[stitchedUrl] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isSaved(stitchedUrl) ? <BookmarkCheck className="w-3.5 h-3.5 text-violet-300" /> : <Bookmark className="w-3.5 h-3.5" />} {isSaved(stitchedUrl) ? 'In your creations' : 'Save to creations'}</button>
                </div>
              )}
              {/* Single selected clip (not the stitched cut): same Save + Download. */}
              {!stitchedUrl && selectedClip?.url && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => saveCreation('clip', selectedClip.url!, selectedClip.prompt.slice(0, 80))} disabled={!!savingIds[selectedClip.url] || isSaved(selectedClip.url)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium py-2 disabled:opacity-50">{savingIds[selectedClip.url] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isSaved(selectedClip.url) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />} {isSaved(selectedClip.url) ? 'Saved to creations' : 'Save clip'}</button>
                  <a href={toDownloadUrl(selectedClip.url)} download="webstew-clip.mp4" className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium px-3 py-2"><Download className="w-3.5 h-3.5" /> Download</a>
                </div>
              )}
              {stitchedUrl && (
                <button onClick={saveShareLink} disabled={saving} className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 text-zinc-300 text-[11px] font-medium py-1.5 disabled:opacity-50">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />} {shareUrl ? 'Shareable link ready ✓' : 'Get a shareable link'}</button>
              )}
              {shareUrl && (
                <div className="flex gap-1.5 mt-2">
                  <input readOnly value={shareUrl} onFocus={e => e.currentTarget.select()} className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300" />
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-[11px] px-2.5 py-1.5">Open <ArrowRight className="w-3 h-3 -rotate-45" /></a>
                </div>
              )}
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
          <span className="w-16 shrink-0 text-[11px] font-semibold text-violet-300 flex items-center gap-1"><Film className="w-3.5 h-3.5" /> Video</span>
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
                    {c.status === 'done' && c.url && (
                      <button onClick={e => { e.stopPropagation(); saveCreation('clip', c.url!, c.prompt.slice(0, 80)) }} disabled={!!savingIds[c.url] || isSaved(c.url)} title={isSaved(c.url) ? 'Saved to your creations' : 'Save clip to your creations'} className="p-0.5 text-zinc-500 hover:text-violet-300 disabled:opacity-60">{savingIds[c.url] ? <Loader2 className="w-3 h-3 animate-spin" /> : isSaved(c.url) ? <BookmarkCheck className="w-3 h-3 text-violet-300" /> : <Bookmark className="w-3 h-3" />}</button>
                    )}
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

        {/* VOICE track */}
        <div className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-[11px] font-semibold text-violet-300 flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> Voice</span>
          <input value={script || narrationText} onChange={e => (script ? setScript(e.target.value) : setNarrationText(e.target.value))}
            placeholder="Voiceover line / notes (optional)"
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50" />
          <button onClick={writeScript} disabled={busy} className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 text-xs px-2.5 py-1.5 disabled:opacity-40">{writingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />} Write</button>
          <select value={voice} onChange={e => setVoice(e.target.value)} className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white capitalize">{TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}</select>
        </div>

        {/* MUSIC track */}
        <div className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-[11px] font-semibold text-fuchsia-300 flex items-center gap-1"><Music className="w-3.5 h-3.5" /> Music</span>
          {hasMusic ? (
            <>
              <span className="text-xs text-zinc-300 truncate max-w-[200px] flex items-center gap-1">{musicTrackId && <Music className="w-3 h-3 text-fuchsia-300/70" />}{musicName || 'music track'}</span>
              <button onClick={clearMusic} title="Remove music" className="text-zinc-500 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
              <span className="text-[10px] text-zinc-500 ml-2">Volume</span>
              <input type="range" min={0} max={1} step={0.05} value={musicVolume} onChange={e => setMusicVolume(Number(e.target.value))} className="w-28 accent-fuchsia-500" />
              <span className="text-[10px] text-zinc-500 w-8">{Math.round(musicVolume * 100)}%</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMusicPicker(true)} className="flex items-center gap-1 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-200 text-xs px-2.5 py-1.5">
                <Music className="w-3.5 h-3.5" /> Browse music
              </button>
              <button onClick={() => musicInputRef.current?.click()} disabled={uploadingMusic} className="flex items-center gap-1 rounded-lg border border-white/10 hover:border-fuchsia-500/50 text-zinc-300 text-xs px-2.5 py-1.5 disabled:opacity-40">
                {uploadingMusic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Upload
              </button>
            </div>
          )}
          <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadMusic(f) }} />
          <button onClick={stitchAndExport} disabled={busy || doneClips.length < 1}
            className="ml-auto flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5">
            {stitching ? <><Loader2 className="w-4 h-4 animate-spin" /> {stitchStage}{stitchProgress > 0 ? ` ${stitchProgress}%` : ''}</> : <><Wand2 className="w-4 h-4" /> Render film {doneClips.length > 1 ? `(${doneClips.length} clips)` : ''}</>}
          </button>
        </div>
        {stitching && <p className="text-[10px] text-zinc-500">Rendering on our server — downloading clips, mixing audio, and uploading. Usually under a minute.</p>}
      </div>

      {/* Saved Creations drawer — your library of clips + finished videos.
          Reuse them on the timeline, download, or remove. */}
      {showSaved && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label="Saved creations">
          <div className="flex-1 bg-black/50" onClick={() => setShowSaved(false)} />
          <div className="w-full max-w-sm h-full bg-zinc-950 border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><Bookmark className="w-4 h-4 text-violet-300" /> Your creations{creations.length ? ` (${creations.length})` : ''}</div>
              <button onClick={() => setShowSaved(false)} className="p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {creations.length === 0 ? (
                <div className="text-center text-zinc-600 pt-16 px-4">
                  <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <div className="text-sm text-zinc-400">No saved creations yet</div>
                  <div className="text-xs mt-1">Save a clip or a finished video and it lands here — ready to reuse, download, or sell in the community.</div>
                </div>
              ) : creations.map(cr => (
                <div key={cr.id} className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                  <video src={cr.url} muted className="w-full h-32 object-cover bg-black" onClick={e => { (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()) }} />
                  <div className="p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${cr.kind === 'video' ? 'bg-violet-500/20 text-violet-300' : 'bg-fuchsia-500/20 text-fuchsia-300'}`}>{cr.kind}</span>
                      <span className="text-xs text-zinc-300 truncate flex-1">{cr.title || 'Untitled'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => addCreationToTimeline(cr)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-[11px] py-1.5"><Plus className="w-3 h-3" /> Add to timeline</button>
                      <a href={toDownloadUrl(cr.url)} download={`${(cr.title || 'creation').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.mp4`} className="flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 px-2 py-1.5" title="Download"><Download className="w-3.5 h-3.5" /></a>
                      <button onClick={() => deleteCreation(cr.id)} className="flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 px-2 py-1.5" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button onClick={() => shareCreation(cr)} disabled={sharingId === cr.id} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 text-[11px] py-1.5 disabled:opacity-50">{sharingId === cr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />} {sharedLinks[cr.id] ? 'Copied link ✓' : 'Share'}</button>
                      <button onClick={() => setSellTarget(cr)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white/5 hover:bg-emerald-500/15 text-zinc-200 hover:text-emerald-300 text-[11px] py-1.5"><Tag className="w-3 h-3" /> Sell</button>
                    </div>
                    {sharedLinks[cr.id] && <input readOnly value={sharedLinks[cr.id]} onFocus={e => e.currentTarget.select()} className="w-full mt-1.5 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-400" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-white/10 text-[10px] text-zinc-600">Saved creations are private to your account.</div>
          </div>
        </div>
      )}

      {/* Music picker — built-in royalty-free library, grouped by mood. */}
      {showMusicPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Choose music">
          <div className="absolute inset-0 bg-black/60" onClick={() => { stopPreview(); setShowMusicPicker(false) }} />
          <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><Music className="w-4 h-4 text-fuchsia-300" /> Choose a soundtrack</div>
              <button onClick={() => { stopPreview(); setShowMusicPicker(false) }} className="p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-3 space-y-4">
              {Array.from(new Set(STUDIO_MUSIC.map(t => t.mood))).map(mood => (
                <div key={mood}>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1.5 px-1">{mood}</div>
                  <div className="space-y-1">
                    {STUDIO_MUSIC.filter(t => t.mood === mood).map(t => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-2.5 py-2">
                        <button onClick={() => togglePreview(t.id)} title={previewingTrack === t.id ? 'Stop preview' : 'Preview'} className="w-7 h-7 shrink-0 rounded-full bg-fuchsia-500/15 hover:bg-fuchsia-500/30 text-fuchsia-200 flex items-center justify-center">
                          {previewingTrack === t.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                        </button>
                        <span className="flex-1 text-sm text-zinc-200 truncate">{t.title}</span>
                        <button onClick={() => selectTrack(t.id)} className="shrink-0 rounded-lg bg-white/5 hover:bg-fuchsia-500/20 text-zinc-200 text-xs px-2.5 py-1.5">Use</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-600">Royalty-free · clear for commercial use</span>
              <button onClick={() => { stopPreview(); setShowMusicPicker(false); musicInputRef.current?.click() }} className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"><Plus className="w-3 h-3" /> Upload your own</button>
            </div>
          </div>
        </div>
      )}

      {sellTarget && <SellCreationModal target={sellTarget} onClose={() => setSellTarget(null)} />}

      <VideoDirectorChat
        open={directorOpen}
        initialPrompt={prompt}
        context={{ mode, model, modelLabel: selectedModel?.label, imageCount: uploadedImages.length, style, aspectRatio, duration, theme: theme.trim() || undefined, seriesPrompts }}
        onApply={(p) => setPrompt(p)}
        onClose={() => setDirectorOpen(false)}
      />
    </div>
  )
}
