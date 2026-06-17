// Client-side video stitching with ffmpeg.wasm.
//
// Concatenates several clips (different sizes OK) into one continuous MP4,
// optionally muxing a narration audio track over the whole thing. Runs ENTIRELY
// in the browser — no server/ffmpeg needed.
//
// We load the SINGLE-THREADED core (@ffmpeg/core-st) on purpose: the
// multi-threaded core needs SharedArrayBuffer, which requires app-wide
// COOP/COEP headers that would break third-party embeds/oauth popups. The
// st-core is slower but self-contained and safe to drop into any page.
//
// The exact filter recipe here was verified with native ffmpeg:
//   scale→pad→setsar→fps per input, then concat=n:v=1:a=0.

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

// Self-hosted single-threaded @ffmpeg/core@0.12.10 (js + wasm) under /public.
// MUST be a FULLY-ABSOLUTE https URL: the FFmpeg class resolves these via
// `new URL(x, import.meta.url)`, and Next mangles import.meta.url to a file://
// base in the bundled worker — so a root-relative '/ffmpeg/…' became
// 'file:///ffmpeg/…' and the browser refused the worker. An absolute origin
// URL ignores the broken base. (Same-origin → no CORS, single-threaded → no
// COOP/COEP.)
const CORE_BASE = (typeof window !== 'undefined' ? window.location.origin : '') + '/ffmpeg'

let _ffmpeg: FFmpeg | null = null
let _loading: Promise<FFmpeg> | null = null
// The ffmpeg instance is a reused singleton, so progress listeners would pile
// up across stitches. Track the active one and detach it before re-binding.
let _progressHandler: ((e: { progress: number }) => void) | null = null

// Generated clips live on cross-origin hosts (xAI vidgen, Replicate) that don't
// send CORS headers, so a direct browser fetch fails. Route http(s) URLs through
// our same-origin proxy; leave blob:/data: (e.g. narration) untouched.
function deliverable(url: string): string {
  return /^https?:\/\//i.test(url) ? `/api/ai/video/clip-proxy?url=${encodeURIComponent(url)}` : url
}

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg
  if (_loading) return _loading
  _loading = (async () => {
    const ff = new FFmpeg()
    if (onLog) ff.on('log', ({ message }) => onLog(message))
    // toBlobURL turns the cross-origin core into same-origin blobs so the
    // browser will run it; st-core has no worker file.
    // Load all three from same-origin PATHS, NOT blob: URLs. Two reasons:
    //  1. classWorkerURL is required under Next.js — otherwise the class does
    //     `new Worker(new URL('./worker.js', import.meta.url), {type:'module'})`
    //     which the bundler can't resolve, and load() hangs with no error.
    //  2. The class worker is a MODULE worker that loads the core via
    //     `await import(coreURL)`. If the worker itself was loaded from a blob:
    //     URL, importing ANOTHER blob: URL fails with "Cannot find module
    //     blob:…". Plain same-origin paths resolve cleanly against the worker's
    //     origin and have no CORS issue (the files live in /public/ffmpeg).
    await ff.load({
      classWorkerURL: `${CORE_BASE}/ffmpeg-class-worker.js`,
      coreURL: `${CORE_BASE}/ffmpeg-core.js`,
      wasmURL: `${CORE_BASE}/ffmpeg-core.wasm`,
    })
    _ffmpeg = ff
    return ff
  })().catch((err) => {
    // Don't cache a rejected promise — otherwise one transient CDN/network
    // failure permanently bricks stitching for the whole session. Reset so the
    // next attempt can retry, and surface a clear message.
    _loading = null
    throw new Error(`Couldn't load the in-browser video engine: ${err?.message || err}`)
  })
  return _loading
}

export interface StitchOptions {
  width?: number
  height?: number
  fps?: number
  audioUrl?: string | null          // optional VOICE track (narration TTS)
  musicUrl?: string | null          // optional MUSIC track (continuous, looped under)
  musicVolume?: number              // 0..1, default 0.3
  clipsHaveAudio?: boolean          // true only if EVERY clip has an audio stream
  onStage?: (stage: string) => void // human-readable progress
  onProgress?: (ratio: number) => void // 0..1 from ffmpeg
}

// Returns an object URL for the stitched MP4. Caller must URL.revokeObjectURL it.
export async function stitchClips(clipUrls: string[], opts: StitchOptions = {}): Promise<string> {
  if (clipUrls.length === 0) throw new Error('No clips to stitch.')
  const W = opts.width ?? 1280
  const H = opts.height ?? 720
  const FPS = opts.fps ?? 24

  opts.onStage?.('Loading video engine (~30MB, first time)…')
  const ff = await getFFmpeg()
  // Detach any listener from a previous stitch before attaching this one.
  if (_progressHandler) ff.off('progress', _progressHandler)
  if (opts.onProgress) {
    _progressHandler = ({ progress }) => opts.onProgress!(Math.min(1, Math.max(0, progress)))
    ff.on('progress', _progressHandler)
  }

  // 1. Write each clip into the in-memory FS (via same-origin proxy → no CORS).
  const names: string[] = []
  for (let i = 0; i < clipUrls.length; i++) {
    opts.onStage?.(`Downloading clip ${i + 1} of ${clipUrls.length}…`)
    const name = `c${i}.mp4`
    await ff.writeFile(name, await fetchFile(deliverable(clipUrls[i])))
    names.push(name)
  }

  // 2. Inputs: clips first, then optional VOICE and MUSIC tracks.
  const args: string[] = []
  names.forEach((n) => args.push('-i', n))
  const written = [...names]

  let voiceIdx = -1
  if (opts.audioUrl) {
    opts.onStage?.('Adding voiceover…')
    await ff.writeFile('voice.mp3', await fetchFile(opts.audioUrl))
    args.push('-i', 'voice.mp3'); written.push('voice.mp3'); voiceIdx = names.length
  }
  let musicIdx = -1
  if (opts.musicUrl) {
    opts.onStage?.('Adding music…')
    await ff.writeFile('music.mp3', await fetchFile(deliverable(opts.musicUrl)))
    args.push('-i', 'music.mp3'); written.push('music.mp3'); musicIdx = names.length + (voiceIdx >= 0 ? 1 : 0)
  }

  // 3a. VIDEO track: normalize each clip to WxH@FPS, concat.
  const chains = names.map((_, i) =>
    `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS}[v${i}]`,
  )
  const vLabels = names.map((_, i) => `[v${i}]`).join('')
  const parts = [`${chains.join(';')};${vLabels}concat=n=${names.length}:v=1:a=0[outv]`]

  // 3b. AUDIO tracks, mixed (validated natively):
  //   - SCENE audio = concat of clip audios — ONLY when every clip has audio
  //     (concat a=1 errors on a missing stream); it's finite = video length.
  //   - MUSIC = looped + lowered, runs continuously under everything.
  //   - VOICE = padded with silence.
  //   amix(longest) of these is "infinite" when music/voice are present, so
  //   -shortest clamps the output to the (finite) VIDEO length.
  const aLabels: string[] = []
  if (opts.clipsHaveAudio && names.length > 0) {
    parts.push(`${names.map((_, i) => `[${i}:a]`).join('')}concat=n=${names.length}:v=0:a=1[sa]`)
    aLabels.push('[sa]')
  }
  if (musicIdx >= 0) {
    const vol = Math.max(0, Math.min(1, opts.musicVolume ?? 0.3))
    parts.push(`[${musicIdx}:a]aloop=loop=-1:size=2147483647,volume=${vol}[mus]`)
    aLabels.push('[mus]')
  }
  if (voiceIdx >= 0) { parts.push(`[${voiceIdx}:a]apad[vo]`); aLabels.push('[vo]') }

  const mapArgs = ['-map', '[outv]']
  let needShortest = false
  if (aLabels.length === 1) {
    mapArgs.push('-map', aLabels[0])
    needShortest = aLabels[0] !== '[sa]' // music/voice are infinite → clamp to video
  } else if (aLabels.length > 1) {
    parts.push(`${aLabels.join('')}amix=inputs=${aLabels.length}:duration=longest:dropout_transition=0:normalize=0[outa]`)
    mapArgs.push('-map', '[outa]')
    needShortest = true
  }

  args.push('-filter_complex', parts.join(';'), ...mapArgs)
  if (aLabels.length) args.push('-c:a', 'aac')
  if (needShortest) args.push('-shortest')
  // ultrafast keeps the single-threaded encode tolerable; yuv420p for web playback.
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', 'out.mp4')

  opts.onStage?.('Mixing & rendering…')
  await ff.exec(args)

  const data = await ff.readFile('out.mp4')
  // Best-effort FS cleanup so repeat runs don't accumulate. Harmless if it fails
  // (in-memory FS) but log rather than swallow.
  await Promise.all(
    [...written, 'out.mp4'].map(n =>
      ff.deleteFile(n).catch(e => console.warn(`[stitch] could not delete ${n} from ffmpeg FS:`, e?.message || e)),
    ),
  )

  const blob = new Blob([data as BlobPart], { type: 'video/mp4' })
  return URL.createObjectURL(blob)
}
