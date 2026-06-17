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
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
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
// SSRF guard: only fetch clip/music URLs from hosts our own pipeline produces.
const ALLOWED_HOSTS = ['x.ai', 'replicate.delivery', 'replicate.com', 'res.cloudinary.com', 'cloudinary.com']
const hostOk = (u: URL) => u.protocol === 'https:' && ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))

const DIMS: Record<string, [number, number]> = {
  '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [720, 720], '4:5': [720, 900],
}

interface RenderRequest {
  clipUrls?: string[]
  clipsHaveAudio?: boolean
  script?: string
  voice?: string
  musicUrl?: string | null
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
  if (!r.ok) throw new Error(`Download failed (${r.status}) for ${u.hostname}`)
  await writeFile(path, Buffer.from(await r.arrayBuffer()))
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
  fd.append('file', new Blob([new Uint8Array(await readFile(filePath))], { type: 'video/mp4' }), 'render.mp4')
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
async function stitch(body: RenderRequest, clipUrls: string[], W: number, H: number): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'render-'))
  try {
    // 1. Download clips
    const clipPaths: string[] = []
    for (let i = 0; i < clipUrls.length; i++) {
      const p = join(dir, `c${i}.mp4`)
      await downloadTo(clipUrls[i], p)
      clipPaths.push(p)
    }
    // Total video length = the hard cap for the output (-t). This anchors the
    // render to the VIDEO so looped music / padded voice can't run away.
    const durs: number[] = []
    for (const p of clipPaths) durs.push(await probeDuration(p))
    // Fall back to a nominal length for any clip we couldn't probe.
    for (let i = 0; i < durs.length; i++) if (!(durs[i] > 0)) durs[i] = 8
    // 2. Optional voice + music
    let voicePath = ''
    if (body.script?.trim()) { voicePath = join(dir, 'voice.mp3'); await makeVoice(body.script.trim(), body.voice || 'onyx', voicePath) }
    let musicPath = ''
    if (body.musicUrl) { musicPath = join(dir, 'music.mp3'); await downloadTo(body.musicUrl, musicPath) }

    // 3. Build ffmpeg args (validated recipe)
    const args: string[] = []
    clipPaths.forEach(p => args.push('-i', p))
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
      if (body.clipsHaveAudio) {
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
      if (body.clipsHaveAudio) {
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
async function runJob(jobId: string, userId: string, body: RenderRequest, clipUrls: string[], W: number, H: number) {
  try {
    const url = await stitch(body, clipUrls, W, H)
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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    await checkApiRateLimit(request, 'aiGeneration')
  } catch (e) { const lim = handleRateLimitError(e); if (lim) return lim; throw e }

  let body: RenderRequest
  try { body = await request.json() as RenderRequest } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const clipUrls = (body.clipUrls || []).filter(u => typeof u === 'string' && /^https?:\/\//i.test(u)).slice(0, MAX_CLIPS)
  if (clipUrls.length < 1) return NextResponse.json({ error: 'At least one clip is required.' }, { status: 400 })
  const [W, H] = DIMS[body.aspectRatio || '16:9'] || DIMS['16:9']

  // Create the job, kick off the render in the background, return immediately.
  const jobId = crypto.randomUUID()
  const userId = String(session.user.id)
  const col = await jobsCol()
  await col.insertOne({ jobId, userId, status: 'processing', clips: clipUrls.length, createdAt: new Date(), updatedAt: new Date() })
  // Fire-and-forget background render (NOT awaited — outlives the response).
  // runJob is self-contained try/catch, but guard the call too so a rejection
  // can never surface as an unhandled promise rejection.
  runJob(jobId, userId, body, clipUrls, W, H).catch(err => console.error('[video render] unhandled job error:', err?.message || err))
  return NextResponse.json({ jobId, status: 'processing' }, { status: 202 })
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
