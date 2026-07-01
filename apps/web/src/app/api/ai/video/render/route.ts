// /api/ai/video/render — ASYNC server-side video stitch + audio mix.
//
// POST starts a render JOB and returns { jobId } immediately; the heavy ffmpeg
// work runs in the background; GET ?id= polls for the result. This is required:
// a 10-clip short film takes well over the ~100s proxy (Cloudflare) limit, so a
// synchronous render dies with HTTP 524. Mirrors how clip generation already polls.
//
// The render downloads the timeline clips (server-side, no CORS), optionally
// generates a voiceover (OpenAI TTS) and pulls a music track, mixes them with a
// bundled static ffmpeg binary, and uploads the finished MP4 to Cloudinary.
//
// Audio model (validated): keep each clip's SCENE audio (only when every clip
// has one), lay a continuous MUSIC bed under it, and the VOICE over it.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { connectDB } from '@/lib/db'
import { trackById, MUSIC_PUBLIC_SUBDIR } from '@/lib/studio-music'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { existsSync, createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function jobsCol() {
  const conn = await connectDB()
  const db = conn.connection.db
  if (!db) throw new Error('DB unavailable')
  return db.collection('video_render_jobs')
}

const MAX_CLIPS = 12
// Memory guard #2: a single ffmpeg filtergraph opens EVERY clip's decoder at
// once. ~10 clips in one xfade graph OOM-killed the 2GB box (confirmed in prod
// logs 2026-06-30 — the whole service 502'd). So we never feed more than
// SEGMENT_MAX clips to one ffmpeg invocation: longer timelines render in
// batches → segments → a final concat-demuxer pass (near-zero RAM, -c copy).
// Bounded inputs per invocation means peak memory is flat regardless of clip
// count, AND a bug in the batched path degrades to "render failed", never OOM.
const SEGMENT_MAX = Math.max(2, parseInt(process.env.RENDER_SEGMENT_MAX || '6', 10) || 6)
// Memory guard: every render holds clip bytes + an ffmpeg child process in RAM.
// On a single 2GB instance, TWO concurrent renders OOM-killed the whole service
// (confirmed in prod logs — every user's session dropped). Cap in-flight renders
// so a render can never take down the instance; extra requests get a clear 429.
const MAX_CONCURRENT_RENDERS = Math.max(1, parseInt(process.env.MAX_CONCURRENT_RENDERS || '1', 10) || 1)
let activeRenders = 0
// Bounded FIFO of waiting renders. Holds only job METADATA (urls + numbers,
// not file bytes), so it's tiny and memory-safe even when full. Renders run
// MAX_CONCURRENT_RENDERS at a time; extras WAIT here instead of being rejected.
// Only a genuinely saturated queue 429s.
const MAX_RENDER_QUEUE = Math.max(1, parseInt(process.env.MAX_RENDER_QUEUE || '10', 10) || 10)
interface QueuedRender { jobId: string; userId: string; body: RenderRequest; sources: Required<RenderSource>[]; W: number; H: number }
const renderQueue: QueuedRender[] = []
// SSRF guard: only fetch clip/music URLs from hosts our own pipeline produces.
const ALLOWED_HOSTS = ['x.ai', 'replicate.delivery', 'replicate.com', 'res.cloudinary.com', 'cloudinary.com', 'soundhelix.com', 'cdn.pixabay.com']
const hostOk = (u: URL) => u.protocol === 'https:' && ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))

// Output resolution per aspect ratio. Back to 720p — 1080p (+ zoompan + per-clip
// audio + overlays) overloaded the 2GB box and renders started timing out/OOMing.
// Higher res needs the dedicated render worker; revisit there, not here.
const DIMS: Record<string, [number, number]> = {
  '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [720, 720], '4:5': [720, 900],
}

// ── The chef's seasoning ─────────────────────────────────────────────────────
// Modern transition rotation (all validated against ffmpeg 6 xfade). A single
// fade reads as a slideshow; a varied cut reads as an ad. Indexed from the 1st
// crossfade (i starts at 1 in the xfade chain).
const TRANSITIONS = ['slideleft', 'smoothup', 'circleopen', 'slideright', 'smoothdown', 'wipeleft', 'dissolve', 'fade']
const transitionAt = (i: number) => TRANSITIONS[(((i - 1) % TRANSITIONS.length) + TRANSITIONS.length) % TRANSITIONS.length]

// Per-clip video filter. Still images get a slow Ken Burns push/pull (zoompan)
// so screenshots feel alive instead of static; real video clips are just
// fit-padded (they already move). Images alternate zoom-IN / zoom-OUT (reveal)
// by index for variety. With motion off, images are looped stills (plain norm)
// — the input args must match (see inputArgsFor). Validated locally on ffmpeg 6.
function clipVideoFilter(kind: 'image' | 'video', secs: number, W: number, H: number, i: number, motion: boolean): string {
  const pad = `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`
  if (kind === 'video' || !motion) {
    return `scale=${W}:${H}:force_original_aspect_ratio=decrease,${pad},setsar=1,fps=24`
  }
  const frames = Math.max(1, Math.round(secs * 24))
  // Upscale the still ~1.5x before the zoom so it stays sharp (max zoom is 1.18)
  // WITHOUT a 2x (=4K at 1080p) intermediate that would strain the 2GB box.
  const W2 = Math.round(W * 1.5), H2 = Math.round(H * 1.5)
  const z = i % 2 === 0
    ? `min(zoom+0.0012,1.18)`                        // slow push in
    : `if(eq(on,1),1.18,max(zoom-0.0019,1.001))`     // pull back / reveal
  return `scale=${W2}:${H2}:force_original_aspect_ratio=decrease,pad=${W2}:${H2}:(ow-iw)/2:(oh-ih)/2,setsar=1,` +
    `zoompan=z='${z}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=24`
}

// ffmpeg input args for one clip. A Ken Burns image drives its own duration via
// zoompan d=, so it's a single -i; a motionless image must be looped to fill its
// hold time; videos are taken as-is.
function inputArgsFor(p: { path: string; kind: 'image' | 'video'; secs: number }, motion: boolean): string[] {
  if (p.kind === 'image' && !motion) return ['-loop', '1', '-t', p.secs.toFixed(3), '-i', p.path]
  return ['-i', p.path]
}

// A timeline entry: a generated/uploaded VIDEO clip, or a still IMAGE that the
// renderer turns into a held segment (the no-AI slideshow path — real pixels,
// no model in the loop). `seconds` is how long an image is shown.
interface RenderSource {
  url: string
  kind?: 'image' | 'video'
  seconds?: number
}

interface RenderRequest {
  sources?: RenderSource[]   // ordered timeline (videos + images); preferred
  clipUrls?: string[]        // legacy: video-only timeline (still accepted)
  script?: string
  voice?: string
  musicUrl?: string | null
  musicTrackId?: string | null
  musicVolume?: number
  aspectRatio?: string
  title?: string
  // The chef's "seasoning": Ken Burns motion on stills + varied transitions.
  // On by default — a render with no pizazz is just a slideshow. Set false for
  // a plain hard slideshow (e.g. when the clips are already animated B-roll).
  motion?: boolean
  // Color grade / look applied to the whole cut — see COLOR_FILTERS keys.
  filter?: string
  // Text overlays — title cards, lower-thirds, contact info. Burned into the cut.
  overlays?: Overlay[]
}

interface Overlay {
  text: string
  position?: 'top' | 'center' | 'bottom'
  size?: 'small' | 'medium' | 'large'
  box?: boolean          // semi-transparent background bar (for contact info)
  start?: number         // show from this second…
  end?: number           // …until this second (both omitted = whole cut)
}

// Bundled font so drawtext works on the Linux render box WITHOUT fontconfig
// (which ffmpeg-static lacks). Overlays are skipped if it's somehow missing.
const OVERLAY_FONT = join(process.cwd(), 'public', 'fonts', 'Inter.ttf')

// Build a comma-chained drawtext filter for the overlays. Uses textfile= (not
// text=) so we never have to escape ffmpeg's delimiter hell — the user's text
// goes to a temp file verbatim. Returns '' when there's nothing to draw.
async function buildOverlayChain(overlays: Overlay[] | undefined, W: number, H: number, dir: string): Promise<string> {
  if (!Array.isArray(overlays) || !overlays.length || !existsSync(OVERLAY_FONT)) return ''
  const parts: string[] = []
  for (let i = 0; i < Math.min(overlays.length, 4); i++) {
    const ov = overlays[i]
    const text = String(ov?.text || '').replace(/[\x00-\x1f]/g, ' ').trim().slice(0, 200)
    if (!text) continue
    const p = join(dir, `ov${i}.txt`)
    await writeFile(p, text)
    const factor = ov.size === 'large' ? 0.085 : ov.size === 'small' ? 0.038 : 0.052
    const fs = Math.round(H * factor)
    const pad = Math.round(H * 0.06)
    const y = ov.position === 'top' ? `${pad}` : ov.position === 'center' ? '(h-th)/2' : `h-th-${pad}`
    const style = ov.box
      ? `:box=1:boxcolor=black@0.5:boxborderw=${Math.round(fs * 0.5)}`
      : `:shadowcolor=black@0.6:shadowx=2:shadowy=2`
    const enable = (typeof ov.start === 'number' && typeof ov.end === 'number' && ov.end > ov.start)
      ? `:enable='between(t,${ov.start.toFixed(2)},${ov.end.toFixed(2)})'`
      : ''
    parts.push(`drawtext=fontfile='${OVERLAY_FONT}':textfile='${p}':fontcolor=white:fontsize=${fs}:x=(w-tw)/2:y=${y}${style}${enable}`)
  }
  return parts.join(',')
}

// Cinematic color-grade presets → ffmpeg video filter strings (all validated on
// ffmpeg 6). Applied once over the finished cut so the whole thing shares a look.
const COLOR_FILTERS: Record<string, string> = {
  none: '',
  cinematic: 'curves=preset=medium_contrast,eq=saturation=1.12:gamma=0.97,colorbalance=rs=-0.04:bs=0.05',
  vibrant: 'eq=saturation=1.4:contrast=1.08',
  warm: 'colorbalance=rs=0.10:gs=0.02:bs=-0.08,eq=saturation=1.08',
  cool: 'colorbalance=rs=-0.08:bs=0.10,eq=saturation=1.04',
  noir: 'hue=s=0,eq=contrast=1.35:brightness=-0.02',
  vintage: 'curves=preset=vintage,eq=saturation=0.85',
  dramatic: 'eq=contrast=1.28:saturation=1.12:gamma=0.9',
}
const colorFilterFor = (key?: string): string => COLOR_FILTERS[(key || 'none').toLowerCase()] || ''

// Persist a finished render to the user's Saved Creations so it survives even
// if the browser gave up polling. De-duped by URL; mirrors the creations route.
async function saveToCreations(userId: string, url: string, title: string) {
  const conn = await connectDB()
  const db = conn.connection.db
  if (!db) return
  const c = db.collection('video_creations')
  if (await c.findOne({ userId, url })) return
  if (await c.countDocuments({ userId }) >= 200) return
  await c.insertOne({ userId, kind: 'video', url, title: (title || 'Rendered film').slice(0, 120), createdAt: new Date() })
}

async function downloadTo(url: string, path: string) {
  const u = new URL(url)
  if (!hostOk(u)) throw new Error(`Disallowed media host: ${u.hostname}`)
  const r = await fetch(url)
  if (!r.ok || !r.body) throw new Error(`Download failed (${r.status}) for ${u.hostname}`)
  // STREAM the response straight to disk. The old Buffer.from(await
  // arrayBuffer()) held an entire clip (up to ~100MB) in RAM at once — with
  // several clips + a concurrent render that was enough to OOM the 2GB box.
  await pipeline(Readable.fromWeb(r.body as any), createWriteStream(path))
}

// Parse a clip's duration from `ffmpeg -i` stderr (ffmpeg-static has no ffprobe).
// Probe a clip for BOTH its duration and whether it carries an audio stream —
// from the same `ffmpeg -i` stderr. Per-clip audio detection (server-side, not
// trusting the client) is what lets us preserve each clip's own sound (dialogue,
// music) instead of the old all-or-nothing strip.
function probeClip(path: string): Promise<{ dur: number; hasAudio: boolean }> {
  return new Promise(resolve => {
    const proc = spawn(ffmpegPath as unknown as string, ['-i', path])
    let err = ''
    proc.stderr.on('data', d => { err += d.toString() })
    proc.on('error', () => resolve({ dur: 0, hasAudio: false }))
    proc.on('close', () => {
      const m = err.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
      const dur = m ? (+m[1] * 3600 + +m[2] * 60 + parseFloat(m[3])) : 0
      const hasAudio = /Stream #\d+:\d+.*:\s*Audio:/.test(err)
      resolve({ dur, hasAudio })
    })
  })
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as unknown as string, args)
    let err = ''
    proc.stderr.on('data', d => { err += d.toString() })
    proc.on('error', reject)
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-600)}`)))
  })
}

async function uploadToCloudinary(filePath: string): Promise<string> {
  const CN = process.env.CLOUDINARY_CLOUD_NAME, CK = process.env.CLOUDINARY_API_KEY, CS = process.env.CLOUDINARY_API_SECRET
  if (!CN || !CK || !CS) throw new Error('Cloudinary is not configured.')
  const ts = Math.round(Date.now() / 1000)
  const sig = crypto.createHash('sha1').update(`folder=ai-website-builder/renders&timestamp=${ts}${CS}`).digest('hex')
  const fd = new FormData()
  // Buffer is already a Uint8Array — feed it straight to Blob (the old
  // `new Uint8Array(...)` wrapper made a second full-size copy of the output).
  fd.append('file', new Blob([await readFile(filePath)], { type: 'video/mp4' }), 'render.mp4')
  fd.append('folder', 'ai-website-builder/renders')
  fd.append('timestamp', String(ts)); fd.append('api_key', CK); fd.append('signature', sig)
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CN}/video/upload`, { method: 'POST', body: fd })
  const j = await r.json().catch(() => ({} as any))
  if (!r.ok || !j.secure_url) throw new Error(j?.error?.message || `Cloudinary upload failed (${r.status})`)
  return j.secure_url
}

async function makeVoice(script: string, voice: string, path: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Voiceover unavailable — OPENAI_API_KEY not set.')
  const { default: OpenAI } = await import('openai')
  const allowed = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  const v = allowed.includes(voice) ? voice : 'onyx'
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const speech = await openai.audio.speech.create({ model: 'tts-1', voice: v as any, input: script.slice(0, 4000) })
  await writeFile(path, Buffer.from(await speech.arrayBuffer()))
}

type Clip = { path: string; kind: 'image' | 'video'; secs: number; hasAudio: boolean }

// Render ONE batch of clips (≤ SEGMENT_MAX) into a normalized, video-only mp4
// segment, with xfade between clips inside the batch. Video-only by design:
// audio (music/voice/scene) is mixed once in the final concat pass. Returns the
// segment path + its crossfade-adjusted duration. Bounded input count = bounded
// peak memory — this is what keeps long timelines off the OOM cliff.
async function renderSegment(clips: Clip[], durs: number[], W: number, H: number, dir: string, idx: number, motion: boolean, baseIdx: number, colorFilter: string): Promise<{ seg: string; outDur: number }> {
  const args: string[] = []
  clips.forEach(p => { args.push(...inputArgsFor(p, motion)) })
  const n = clips.length
  const XFADE = 0.4
  const canXfade = n >= 2 && durs.every(d => d > XFADE + 0.2)
  const parts: string[] = [clips.map((p, i) => `[${i}:v]${clipVideoFilter(p.kind, durs[i], W, H, baseIdx + i, motion)}[v${i}]`).join(';')]
  let outDur = durs.reduce((a, b) => a + b, 0)
  if (canXfade) {
    let prevV = '[v0]', acc = durs[0]
    for (let i = 1; i < n; i++) {
      const label = i === n - 1 ? '[outv]' : `[vx${i}]`
      parts.push(`${prevV}[v${i}]xfade=transition=${transitionAt(baseIdx + i)}:duration=${XFADE}:offset=${(acc - XFADE).toFixed(3)}${label}`)
      prevV = label
      acc = acc + durs[i] - XFADE
    }
    outDur = acc
  } else {
    parts.push(`${clips.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[outv]`)
  }
  // Every segment carries a scene-audio track (each clip's own sound, or matched
  // silence) so segments concat uniformly AND dialogue survives into long cuts.
  clips.forEach((c, i) => {
    parts.push(c.hasAudio
      ? `[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo[sa${i}]`
      : `anullsrc=r=44100:cl=stereo,atrim=0:${durs[i].toFixed(3)},aformat=sample_rates=44100:channel_layouts=stereo[sa${i}]`)
  })
  if (canXfade) {
    let prevA = '[sa0]'
    for (let i = 1; i < n; i++) {
      const label = i === n - 1 ? '[outa]' : `[sax${i}]`
      parts.push(`${prevA}[sa${i}]acrossfade=d=${XFADE}${label}`)
      prevA = label
    }
  } else {
    parts.push(`${clips.map((_, i) => `[sa${i}]`).join('')}concat=n=${n}:v=0:a=1[outa]`)
  }
  // Apply the color grade per segment (they already re-encode, so it's free).
  let vOut = '[outv]'
  if (colorFilter) { parts.push(`[outv]${colorFilter}[outvf]`); vOut = '[outvf]' }
  const seg = join(dir, `seg${idx}.mp4`)
  args.push('-filter_complex', parts.join(';'), '-map', vOut, '-map', '[outa]', '-t', outDur.toFixed(3))
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', '-y', seg)
  await runFfmpeg(args)
  return { seg, outDur }
}

// Many-clip path: render in batches → concat the segments cheaply (demuxer) →
// mix music/voice over the whole thing in one final pass. Segments carry their
// own scene audio (stream 0:a after concat), so clip dialogue/sound survives
// into long cuts too — voiceover + music mix ON TOP, never replacing it.
async function stitchBatched(body: RenderRequest, clipPaths: Clip[], durs: number[], W: number, H: number, dir: string, voicePath: string, musicPath: string, voiceDur: number): Promise<string> {
  const motion = body.motion !== false
  const colorFilter = colorFilterFor(body.filter)
  const segs: string[] = []
  let total = 0
  for (let b = 0; b * SEGMENT_MAX < clipPaths.length; b++) {
    const cs = clipPaths.slice(b * SEGMENT_MAX, (b + 1) * SEGMENT_MAX)
    const ds = durs.slice(b * SEGMENT_MAX, (b + 1) * SEGMENT_MAX)
    const { seg, outDur } = await renderSegment(cs, ds, W, H, dir, b, motion, b * SEGMENT_MAX, colorFilter)
    segs.push(seg)
    total += outDur
  }
  const out = join(dir, 'out.mp4')
  // concat demuxer list (segments share codec/W/H/fps, so video copies cleanly)
  const listPath = join(dir, 'segs.txt')
  await writeFile(listPath, segs.map(s => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'))
  const fargs = ['-f', 'concat', '-safe', '0', '-i', listPath]
  let idx = 1, musicIdx = -1, voiceIdx = -1
  if (musicPath) { fargs.push('-i', musicPath); musicIdx = idx++ }
  if (voicePath) { fargs.push('-i', voicePath); voiceIdx = idx++ }
  const fp: string[] = []
  // Cover a longer voiceover by freezing the last frame; only then do we have to
  // re-encode the video (otherwise the concatenated segments copy through cheap).
  const finalDur = Math.max(total, voiceDur)
  const overlayChain = await buildOverlayChain(body.overlays, W, H, dir)
  const vpad = finalDur - total
  let videoMap = '0:v'
  const videoCodec = ['-c:v', 'copy']
  // Re-encode the concatenated video only if we must (freeze tail and/or text
  // overlays); otherwise the segments copy through untouched.
  const vfilters: string[] = []
  if (vpad > 0.05) vfilters.push(`tpad=stop_mode=clone:stop_duration=${vpad.toFixed(3)}`)
  if (overlayChain) vfilters.push(overlayChain)
  if (vfilters.length) {
    fp.push(`[0:v]${vfilters.join(',')}[outv]`)
    videoMap = '[outv]'; videoCodec[1] = 'libx264'; videoCodec.push('-preset', 'veryfast', '-pix_fmt', 'yuv420p')
  }
  // The clips' own sound is stream 0:a (from the concatenated segments). Mix any
  // music + voiceover ON TOP; if there's neither, just copy the scene audio.
  const extras: string[] = []
  if (musicIdx >= 0) {
    const vol = Math.max(0, Math.min(1, body.musicVolume ?? 0.3))
    fp.push(`[${musicIdx}:a]aloop=loop=-1:size=2147483647,volume=${vol}[mus]`); extras.push('[mus]')
  }
  if (voiceIdx >= 0) { fp.push(`[${voiceIdx}:a]apad[vo]`); extras.push('[vo]') }
  let audioMap: string[] = []
  if (extras.length === 0) {
    audioMap = ['-map', '0:a', '-c:a', 'copy']
  } else {
    fp.push(`[0:a]${extras.join('')}amix=inputs=${1 + extras.length}:duration=longest:dropout_transition=0:normalize=0[outa]`)
    audioMap = ['-map', '[outa]', '-c:a', 'aac']
  }
  if (fp.length) fargs.push('-filter_complex', fp.join(';'))
  fargs.push('-map', videoMap, ...videoCodec, ...audioMap)
  fargs.push('-t', finalDur.toFixed(3), '-movflags', '+faststart', '-y', out)
  await runFfmpeg(fargs)
  return await uploadToCloudinary(out)
}

// The heavy lifting: download → probe → (voice/music) → ffmpeg → Cloudinary.
// Returns the finished video URL. Runs in the BACKGROUND (see runJob), so it is
// free to take minutes — no request is waiting on it.
async function stitch(body: RenderRequest, sources: Required<RenderSource>[], W: number, H: number): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'render-'))
  try {
    // 1. Download each source. Videos keep their real duration (probed);
    //    images are held for `seconds` and looped into a still video segment.
    const clipPaths: Clip[] = []
    const durs: number[] = []
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i]
      if (s.kind === 'image') {
        const p = join(dir, `s${i}.img`) // ffmpeg sniffs the format from bytes, not the ext
        await downloadTo(s.url, p)
        clipPaths.push({ path: p, kind: 'image', secs: s.seconds, hasAudio: false })
        durs.push(s.seconds)
      } else {
        const p = join(dir, `c${i}.mp4`)
        await downloadTo(s.url, p)
        // Probe BOTH duration and audio presence — each clip keeps its own sound.
        const { dur, hasAudio } = await probeClip(p)
        const secs = dur > 0 ? dur : 8 // fall back to a nominal length if unprobeable
        clipPaths.push({ path: p, kind: 'video', secs, hasAudio })
        durs.push(secs)
      }
    }
    // Per-clip audio: build a scene track only if AT LEAST one clip carries sound.
    // Silent clips (images, audio-less videos) contribute silence so the audio
    // stays aligned with the video — nobody's dialogue gets stripped.
    const anyClipAudio = clipPaths.some(c => c.hasAudio)
    // 2. Optional voice + music
    let voicePath = ''
    if (body.script?.trim()) {
      // Voiceover is best-effort: if TTS is unavailable (no OPENAI_API_KEY) or
      // fails, render WITHOUT narration rather than failing the whole paid job.
      // Losing the voiceover beats losing the video AND the credits.
      try {
        voicePath = join(dir, 'voice.mp3')
        await makeVoice(body.script.trim(), body.voice || 'onyx', voicePath)
      } catch (e: any) {
        console.warn('[render] voiceover skipped:', e?.message || e)
        voicePath = ''
      }
    }
    let musicPath = ''
    if (body.musicTrackId) {
      // Library track — resolved from OUR manifest (server-authoritative, not
      // the client's URL). A bundled file under /public/music wins; otherwise
      // we fetch the manifest's remote URL through the host allowlist.
      const track = trackById(body.musicTrackId)
      if (!track) throw new Error(`Unknown music track: ${body.musicTrackId}`)
      const onDisk = track.file ? join(process.cwd(), 'public', MUSIC_PUBLIC_SUBDIR, track.file) : ''
      if (onDisk && existsSync(onDisk)) {
        musicPath = onDisk
      } else {
        musicPath = join(dir, 'music.mp3'); await downloadTo(track.url, musicPath)
      }
    } else if (body.musicUrl) {
      musicPath = join(dir, 'music.mp3'); await downloadTo(body.musicUrl, musicPath)
    }

    // Voiceover length drives the floor on output duration: if the narration is
    // longer than the visuals, the video gets a frozen-frame tail to cover it
    // (otherwise the render cut off mid-sentence). Music does NOT extend length —
    // it just fills whatever the visuals/voice establish.
    const voiceDur = voicePath ? (await probeClip(voicePath)).dur : 0

    // Long timelines: batch so no single ffmpeg invocation opens more than
    // SEGMENT_MAX decoders at once (the >2GB OOM was one graph with ~10 inputs).
    if (clipPaths.length > SEGMENT_MAX) {
      return await stitchBatched(body, clipPaths, durs, W, H, dir, voicePath, musicPath, voiceDur)
    }

    // 3. Build ffmpeg args (validated recipe)
    const motion = body.motion !== false // the chef's seasoning: Ken Burns + varied cuts
    const args: string[] = []
    // Inputs: Ken Burns images drive their own duration via zoompan (single -i);
    // motionless images are looped to their hold time; videos taken as-is.
    clipPaths.forEach(p => { args.push(...inputArgsFor(p, motion)) })
    let voiceIdx = -1, musicIdx = -1
    if (voicePath) { args.push('-i', voicePath); voiceIdx = clipPaths.length }
    if (musicPath) { args.push('-i', musicPath); musicIdx = clipPaths.length + (voiceIdx >= 0 ? 1 : 0) }

    const n = clipPaths.length
    const XFADE = 0.4 // crossfade duration between clips (seconds)
    // Crossfade only when there are ≥2 clips and each is comfortably longer than
    // the fade (otherwise xfade offsets go negative). Else a plain hard-cut concat.
    const canXfade = n >= 2 && durs.every(d => d > XFADE + 0.2)

    const parts: string[] = [clipPaths.map((p, i) => `[${i}:v]${clipVideoFilter(p.kind, durs[i], W, H, i, motion)}[v${i}]`).join(';')]
    const aLabels: string[] = []
    let outDur = durs.reduce((a, b) => a + b, 0)

    if (canXfade) {
      // VIDEO: chain xfade across clips. offset = running output length − fade.
      let prevV = '[v0]', acc = durs[0]
      for (let i = 1; i < n; i++) {
        const label = i === n - 1 ? '[vbase]' : `[vx${i}]`
        parts.push(`${prevV}[v${i}]xfade=transition=${transitionAt(i)}:duration=${XFADE}:offset=${(acc - XFADE).toFixed(3)}${label}`)
        prevV = label
        acc = acc + durs[i] - XFADE
      }
      outDur = acc // each crossfade overlaps clips by XFADE, shrinking total
    } else {
      parts.push(`${clipPaths.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[vbase]`)
    }

    // PER-CLIP SCENE AUDIO — each clip keeps its OWN sound (dialogue, music,
    // effects). Silent clips (images, audio-less videos) contribute matched
    // silence so the track stays aligned to the video. Crossfaded like the video
    // (or hard-concatenated). Voiceover + music mix ON TOP — nothing gets
    // stripped just because one sibling clip was silent.
    if (anyClipAudio) {
      clipPaths.forEach((c, i) => {
        parts.push(c.hasAudio
          ? `[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo[sa${i}]`
          : `anullsrc=r=44100:cl=stereo,atrim=0:${durs[i].toFixed(3)},aformat=sample_rates=44100:channel_layouts=stereo[sa${i}]`)
      })
      if (canXfade) {
        let prevA = '[sa0]'
        for (let i = 1; i < n; i++) {
          const label = i === n - 1 ? '[scene]' : `[sax${i}]`
          parts.push(`${prevA}[sa${i}]acrossfade=d=${XFADE}${label}`)
          prevA = label
        }
      } else {
        parts.push(`${clipPaths.map((_, i) => `[sa${i}]`).join('')}concat=n=${n}:v=0:a=1[scene]`)
      }
      aLabels.push('[scene]')
    }
    // If the voiceover runs longer than the visuals, freeze the last frame to
    // cover it so narration never gets cut off mid-sentence. Music doesn't count.
    const finalDur = Math.max(outDur, voiceDur)
    let videoOut = '[vbase]'
    if (finalDur - outDur > 0.05) {
      parts.push(`[vbase]tpad=stop_mode=clone:stop_duration=${(finalDur - outDur).toFixed(3)}[outv]`)
      videoOut = '[outv]'
    }
    // Color grade over the whole cut so it shares one look.
    const colorFilter = colorFilterFor(body.filter)
    if (colorFilter) { parts.push(`${videoOut}${colorFilter}[graded]`); videoOut = '[graded]' }
    // Text overlays (titles / lower-thirds / contact info) burned on top.
    const overlayChain = await buildOverlayChain(body.overlays, W, H, dir)
    if (overlayChain) { parts.push(`${videoOut}${overlayChain}[titled]`); videoOut = '[titled]' }
    if (musicIdx >= 0) {
      const vol = Math.max(0, Math.min(1, body.musicVolume ?? 0.3))
      parts.push(`[${musicIdx}:a]aloop=loop=-1:size=2147483647,volume=${vol}[mus]`); aLabels.push('[mus]')
    }
    if (voiceIdx >= 0) { parts.push(`[${voiceIdx}:a]apad[vo]`); aLabels.push('[vo]') }

    const mapArgs = ['-map', videoOut]
    if (aLabels.length === 1) {
      mapArgs.push('-map', aLabels[0])
    } else if (aLabels.length > 1) {
      parts.push(`${aLabels.join('')}amix=inputs=${aLabels.length}:duration=longest:dropout_transition=0:normalize=0[outa]`)
      mapArgs.push('-map', '[outa]')
    }

    const out = join(dir, 'out.mp4')
    args.push('-filter_complex', parts.join(';'), ...mapArgs)
    if (aLabels.length) args.push('-c:a', 'aac')
    // Hard duration cap = max(visuals, voiceover). Keeps looped music / padded
    // voice from encoding forever (the -shortest approach ran away) while still
    // giving the narration room to finish.
    args.push('-t', finalDur.toFixed(3))
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', out)

    // 4. Render + upload
    await runFfmpeg(args)
    return await uploadToCloudinary(out)
  } finally {
    // Temp dir is in /tmp (freed on restart) so a failure is non-fatal — but log
    // it rather than swallow, so a leak is visible.
    await rm(dir, { recursive: true, force: true }).catch(e => console.warn('[video render] temp cleanup failed:', e?.message || e))
  }
}

// Background worker: run the stitch, then record the outcome on the job doc.
// NOT awaited by the request — it outlives the HTTP response (Render runs a
// persistent Node process, so the promise keeps executing). Must never throw.
async function runJob(jobId: string, userId: string, body: RenderRequest, sources: Required<RenderSource>[], W: number, H: number) {
  try {
    const url = await stitch(body, sources, W, H)
    const col = await jobsCol()
    await col.updateOne({ jobId, userId }, { $set: { status: 'done', url, updatedAt: new Date() } })
    // Save to the library here too — guarantees the film is kept even if the
    // browser closed before polling finished.
    await saveToCreations(userId, url, body.title || '').catch(e => console.warn('[video render] auto-save failed:', e?.message || e))
  } catch (e: any) {
    console.error('[video render] job failed:', e?.message || e)
    try {
      const col = await jobsCol()
      await col.updateOne({ jobId, userId }, { $set: { status: 'failed', error: e?.message || 'Render failed', updatedAt: new Date() } })
    } catch (e2: any) {
      console.error('[video render] could not record job failure:', e2?.message || e2)
    }
  }
}

// Drain the queue: start as many waiting renders as the concurrency cap allows,
// one slot at a time. Each finished render frees its slot and re-pumps, so the
// queue advances FIFO. activeRenders is owned HERE (not in runJob).
function pumpRenderQueue() {
  while (activeRenders < MAX_CONCURRENT_RENDERS && renderQueue.length > 0) {
    const job = renderQueue.shift()!
    activeRenders++
    // Flip the job from 'queued' → 'processing' so polls reflect it started.
    jobsCol()
      .then((c) => c.updateOne({ jobId: job.jobId, userId: job.userId }, { $set: { status: 'processing', updatedAt: new Date() } }))
      .catch(() => { /* best-effort; the render still runs */ })
    runJob(job.jobId, job.userId, job.body, job.sources, job.W, job.H)
      .catch((err) => console.error('[video render] unhandled job error:', err?.message || err))
      .finally(() => { activeRenders = Math.max(0, activeRenders - 1); pumpRenderQueue() })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    await checkApiRateLimit(request, 'aiGeneration')
  } catch (e) { const lim = handleRateLimitError(e); if (lim) return lim; throw e }

  let body: RenderRequest
  try { body = await request.json() as RenderRequest } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  // Normalize the timeline into ordered sources. Prefer `sources` (videos +
  // images); fall back to the legacy `clipUrls` (all video) for older clients.
  const raw: RenderSource[] = Array.isArray(body.sources) && body.sources.length
    ? body.sources
    : (body.clipUrls || []).map(url => ({ url, kind: 'video' as const }))
  const sources: Required<RenderSource>[] = raw
    .filter(s => s && typeof s.url === 'string' && /^https?:\/\//i.test(s.url))
    .map(s => ({
      url: s.url,
      kind: s.kind === 'image' ? 'image' as const : 'video' as const,
      // Images are held 1–20s (default 4); videos use their own length (0 = probe).
      seconds: s.kind === 'image' ? Math.max(1, Math.min(20, Number(s.seconds) || 4)) : 0,
    }))
    .slice(0, MAX_CLIPS)
  if (sources.length < 1) return NextResponse.json({ error: 'At least one clip or image is required.' }, { status: 400 })
  const [W, H] = DIMS[body.aspectRatio || '16:9'] || DIMS['16:9']

  // Saturation guard — only reject when the WAITING queue is full (renders run
  // MAX_CONCURRENT_RENDERS at a time so they can't OOM the instance; the rest
  // wait their turn rather than getting rejected).
  if (renderQueue.length >= MAX_RENDER_QUEUE) {
    return NextResponse.json(
      { error: 'A lot of videos are rendering right now — try again in a few minutes.', busy: true },
      { status: 429 },
    )
  }

  const jobId = crypto.randomUUID()
  const userId = String(session.user.id)
  try {
    const col = await jobsCol()
    await col.insertOne({ jobId, userId, status: 'queued', clips: sources.length, createdAt: new Date(), updatedAt: new Date() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not start the render.' }, { status: 500 })
  }

  // Enqueue, then pump. pump starts it immediately if a slot is free; otherwise
  // it waits. Report whether it started or where it sits in line.
  renderQueue.push({ jobId, userId, body, sources, W, H })
  pumpRenderQueue()
  const idx = renderQueue.findIndex((j) => j.jobId === jobId)
  const queued = idx !== -1
  return NextResponse.json(
    { jobId, status: queued ? 'queued' : 'processing', queuePosition: queued ? idx + 1 : 0 },
    { status: 202 },
  )
}

// Poll a render job. Ownership-scoped — you only see your own jobs.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'A job id is required.' }, { status: 400 })
  const col = await jobsCol()
  const job = await col.findOne({ jobId: id, userId: String(session.user.id) })
  if (!job) return NextResponse.json({ error: 'Render job not found.' }, { status: 404 })
  // For a waiting job, tell the client where it sits in line (1 = next up).
  let queuePosition = 0
  if (job.status === 'queued') {
    const idx = renderQueue.findIndex((j) => j.jobId === id)
    queuePosition = idx === -1 ? 0 : idx + 1
  }
  return NextResponse.json({ status: job.status, url: job.url || null, error: job.error || null, queuePosition })
}
