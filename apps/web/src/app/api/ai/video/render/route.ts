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
// Memory guard: every render holds clip bytes + an ffmpeg child process in RAM.
// On a single 2GB instance, TWO concurrent renders OOM-killed the whole service
// (confirmed in prod logs — every user's session dropped). Cap in-flight renders
// so a render can never take down the instance; extra requests get a clear 429.
const MAX_CONCURRENT_RENDERS = Math.max(1, parseInt(process.env.MAX_CONCURRENT_RENDERS || '1', 10) || 1)
let activeRenders = 0
// SSRF guard: only fetch clip/music URLs from hosts our own pipeline produces.
const ALLOWED_HOSTS = ['x.ai', 'replicate.delivery', 'replicate.com', 'res.cloudinary.com', 'cloudinary.com', 'soundhelix.com', 'cdn.pixabay.com']
const hostOk = (u: URL) => u.protocol === 'https:' && ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))

const DIMS: Record<string, [number, number]> = {
  '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [720, 720], '4:5': [720, 900],
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
  clipsHaveAudio?: boolean
  script?: string
  voice?: string
  musicUrl?: string | null
  musicTrackId?: string | null
  musicVolume?: number
  aspectRatio?: string
  title?: string
}

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
function probeDuration(path: string): Promise<number> {
  return new Promise(resolve => {
    const proc = spawn(ffmpegPath as unknown as string, ['-i', path])
    let err = ''
    proc.stderr.on('data', d => { err += d.toString() })
    proc.on('error', () => resolve(0))
    proc.on('close', () => {
      const m = err.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
      resolve(m ? (+m[1] * 3600 + +m[2] * 60 + parseFloat(m[3])) : 0)
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

// The heavy lifting: download → probe → (voice/music) → ffmpeg → Cloudinary.
// Returns the finished video URL. Runs in the BACKGROUND (see runJob), so it is
// free to take minutes — no request is waiting on it.
async function stitch(body: RenderRequest, sources: Required<RenderSource>[], W: number, H: number): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'render-'))
  try {
    // 1. Download each source. Videos keep their real duration (probed);
    //    images are held for `seconds` and looped into a still video segment.
    const clipPaths: { path: string; kind: 'image' | 'video'; secs: number }[] = []
    const durs: number[] = []
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i]
      if (s.kind === 'image') {
        const p = join(dir, `s${i}.img`) // ffmpeg sniffs the format from bytes, not the ext
        await downloadTo(s.url, p)
        clipPaths.push({ path: p, kind: 'image', secs: s.seconds })
        durs.push(s.seconds)
      } else {
        const p = join(dir, `c${i}.mp4`)
        await downloadTo(s.url, p)
        const d = await probeDuration(p)
        const secs = d > 0 ? d : 8 // fall back to a nominal length if unprobeable
        clipPaths.push({ path: p, kind: 'video', secs })
        durs.push(secs)
      }
    }
    // Scene audio only exists when EVERY source is a video clip that carries it —
    // a still image contributes no audio stream to reference.
    const allVideo = clipPaths.every(c => c.kind === 'video')
    const clipsHaveAudio = !!body.clipsHaveAudio && allVideo
    // 2. Optional voice + music
    let voicePath = ''
    if (body.script?.trim()) { voicePath = join(dir, 'voice.mp3'); await makeVoice(body.script.trim(), body.voice || 'onyx', voicePath) }
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

    // 3. Build ffmpeg args (validated recipe)
    const args: string[] = []
    // Image inputs are looped into a still video bounded to their hold time;
    // video inputs are taken as-is. norm (below) gives images their 24fps.
    clipPaths.forEach(p => {
      if (p.kind === 'image') args.push('-loop', '1', '-t', p.secs.toFixed(3), '-i', p.path)
      else args.push('-i', p.path)
    })
    let voiceIdx = -1, musicIdx = -1
    if (voicePath) { args.push('-i', voicePath); voiceIdx = clipPaths.length }
    if (musicPath) { args.push('-i', musicPath); musicIdx = clipPaths.length + (voiceIdx >= 0 ? 1 : 0) }

    const n = clipPaths.length
    const XFADE = 0.4 // crossfade duration between clips (seconds)
    // Crossfade only when there are ≥2 clips and each is comfortably longer than
    // the fade (otherwise xfade offsets go negative). Else a plain hard-cut concat.
    const canXfade = n >= 2 && durs.every(d => d > XFADE + 0.2)
    const norm = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24`

    const parts: string[] = [clipPaths.map((_, i) => `[${i}:v]${norm}[v${i}]`).join(';')]
    const aLabels: string[] = []
    let outDur = durs.reduce((a, b) => a + b, 0)

    if (canXfade) {
      // VIDEO: chain xfade across clips. offset = running output length − fade.
      let prevV = '[v0]', acc = durs[0]
      for (let i = 1; i < n; i++) {
        const label = i === n - 1 ? '[outv]' : `[vx${i}]`
        parts.push(`${prevV}[v${i}]xfade=transition=fade:duration=${XFADE}:offset=${(acc - XFADE).toFixed(3)}${label}`)
        prevV = label
        acc = acc + durs[i] - XFADE
      }
      outDur = acc // each crossfade overlaps clips by XFADE, shrinking total
      // SCENE AUDIO: matching acrossfade chain so it stays aligned with the video.
      if (clipsHaveAudio) {
        let prevA = '[0:a]'
        for (let i = 1; i < n; i++) {
          const label = i === n - 1 ? '[sa]' : `[ax${i}]`
          parts.push(`${prevA}[${i}:a]acrossfade=d=${XFADE}${label}`)
          prevA = label
        }
        aLabels.push('[sa]')
      }
    } else {
      parts.push(`${clipPaths.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[outv]`)
      if (clipsHaveAudio) {
        parts.push(`${clipPaths.map((_, i) => `[${i}:a]`).join('')}concat=n=${n}:v=0:a=1[sa]`)
        aLabels.push('[sa]')
      }
    }
    if (musicIdx >= 0) {
      const vol = Math.max(0, Math.min(1, body.musicVolume ?? 0.3))
      parts.push(`[${musicIdx}:a]aloop=loop=-1:size=2147483647,volume=${vol}[mus]`); aLabels.push('[mus]')
    }
    if (voiceIdx >= 0) { parts.push(`[${voiceIdx}:a]apad[vo]`); aLabels.push('[vo]') }

    const mapArgs = ['-map', '[outv]']
    if (aLabels.length === 1) {
      mapArgs.push('-map', aLabels[0])
    } else if (aLabels.length > 1) {
      parts.push(`${aLabels.join('')}amix=inputs=${aLabels.length}:duration=longest:dropout_transition=0:normalize=0[outa]`)
      mapArgs.push('-map', '[outa]')
    }

    const out = join(dir, 'out.mp4')
    args.push('-filter_complex', parts.join(';'), ...mapArgs)
    if (aLabels.length) args.push('-c:a', 'aac')
    // Hard duration cap = the (crossfade-adjusted) video length. Keeps looped
    // music / padded voice from encoding forever (the -shortest approach ran away).
    args.push('-t', outDur.toFixed(3))
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
  } finally {
    // Release the concurrency slot no matter how the render ended.
    activeRenders = Math.max(0, activeRenders - 1)
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

  // Concurrency guard — reject (don't queue) when the renderer is saturated, so
  // a second memory-heavy render can't stack and OOM the whole instance. The
  // check + reservation are synchronous (no await between) so two requests
  // can't both pass. runJob's finally releases the slot.
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    return NextResponse.json(
      { error: 'The renderer is busy finishing another video — give it a minute and hit Render again.', busy: true },
      { status: 429 },
    )
  }
  activeRenders++ // reserve the slot before any await

  try {
    // Create the job, kick off the render in the background, return immediately.
    const jobId = crypto.randomUUID()
    const userId = String(session.user.id)
    const col = await jobsCol()
    await col.insertOne({ jobId, userId, status: 'processing', clips: sources.length, createdAt: new Date(), updatedAt: new Date() })
    // Fire-and-forget background render (NOT awaited — outlives the response).
    // runJob is self-contained try/catch + finally (which frees the slot), but
    // guard the call too so a rejection can't surface as an unhandled rejection.
    runJob(jobId, userId, body, sources, W, H).catch(err => console.error('[video render] unhandled job error:', err?.message || err))
    return NextResponse.json({ jobId, status: 'processing' }, { status: 202 })
  } catch (e: any) {
    // Job creation failed before the worker launched — release the slot here
    // (runJob's finally never runs in this path).
    activeRenders = Math.max(0, activeRenders - 1)
    return NextResponse.json({ error: e?.message || 'Could not start the render.' }, { status: 500 })
  }
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
  return NextResponse.json({ status: job.status, url: job.url || null, error: job.error || null })
}
