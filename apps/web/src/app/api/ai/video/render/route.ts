// POST /api/ai/video/render — server-side video stitch + audio mix.
//
// Replaces the fragile in-browser ffmpeg.wasm path. Downloads the timeline clips
// (server-side, no CORS), optionally generates a voiceover (OpenAI TTS) and pulls
// a music track, mixes them with a bundled static ffmpeg binary, uploads the
// finished MP4 to Cloudinary, and returns its URL. Nothing loads in the browser.
//
// Audio model (validated): keep each clip's SCENE audio (only when every clip
// has one), lay a continuous MUSIC bed under it, and the VOICE over it.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    checkApiRateLimit(request, 'aiGeneration')
  } catch (e) { const lim = handleRateLimitError(e); if (lim) return lim; throw e }

  let body: RenderRequest
  try { body = await request.json() as RenderRequest } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const clipUrls = (body.clipUrls || []).filter(u => typeof u === 'string' && /^https?:\/\//i.test(u)).slice(0, MAX_CLIPS)
  if (clipUrls.length < 1) return NextResponse.json({ error: 'At least one clip is required.' }, { status: 400 })
  const [W, H] = DIMS[body.aspectRatio || '16:9'] || DIMS['16:9']

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
    let total = 0
    for (const p of clipPaths) total += await probeDuration(p)
    if (!(total > 0)) total = clipPaths.length * 8 // fallback if probe failed
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

    const norm = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24`
    const parts = [
      `${clipPaths.map((_, i) => `[${i}:v]${norm}[v${i}]`).join(';')};${clipPaths.map((_, i) => `[v${i}]`).join('')}concat=n=${clipPaths.length}:v=1:a=0[outv]`,
    ]
    const aLabels: string[] = []
    if (body.clipsHaveAudio) {
      parts.push(`${clipPaths.map((_, i) => `[${i}:a]`).join('')}concat=n=${clipPaths.length}:v=0:a=1[sa]`)
      aLabels.push('[sa]')
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
    // Hard duration cap = the video length. This is what keeps looped music /
    // padded voice from encoding forever (the -shortest approach ran away).
    args.push('-t', total.toFixed(3))
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', out)

    // 4. Render + upload
    await runFfmpeg(args)
    const url = await uploadToCloudinary(out)
    return NextResponse.json({ url })
  } catch (e: any) {
    console.error('[video render] error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Render failed' }, { status: 500 })
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
