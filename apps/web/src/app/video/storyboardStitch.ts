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
import { fetchFile, toBlobURL } from '@ffmpeg/util'

// Pinned single-thread core compatible with @ffmpeg/ffmpeg 0.12.x.
const CORE_BASE = 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/umd'

let _ffmpeg: FFmpeg | null = null
let _loading: Promise<FFmpeg> | null = null

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg
  if (_loading) return _loading
  _loading = (async () => {
    const ff = new FFmpeg()
    if (onLog) ff.on('log', ({ message }) => onLog(message))
    // toBlobURL turns the cross-origin core into same-origin blobs so the
    // browser will run it; st-core has no worker file.
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
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
  audioUrl?: string | null          // optional narration track
  onStage?: (stage: string) => void // human-readable progress
  onProgress?: (ratio: number) => void // 0..1 from ffmpeg
}

// Returns an object URL for the stitched MP4. Caller must URL.revokeObjectURL it.
export async function stitchClips(clipUrls: string[], opts: StitchOptions = {}): Promise<string> {
  if (clipUrls.length === 0) throw new Error('No clips to stitch.')
  const W = opts.width ?? 1280
  const H = opts.height ?? 720
  const FPS = opts.fps ?? 24

  opts.onStage?.('Loading video engine…')
  const ff = await getFFmpeg()
  if (opts.onProgress) ff.on('progress', ({ progress }) => opts.onProgress!(Math.min(1, Math.max(0, progress))))

  // 1. Write each clip into the in-memory FS.
  const names: string[] = []
  for (let i = 0; i < clipUrls.length; i++) {
    opts.onStage?.(`Downloading clip ${i + 1} of ${clipUrls.length}…`)
    const name = `c${i}.mp4`
    await ff.writeFile(name, await fetchFile(clipUrls[i]))
    names.push(name)
  }

  // 2. Build the verified filter graph: normalize every clip to WxH@FPS, concat.
  const chains = names.map((_, i) =>
    `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS}[v${i}]`,
  )
  const labels = names.map((_, i) => `[v${i}]`).join('')
  const filter = `${chains.join(';')};${labels}concat=n=${names.length}:v=1:a=0[outv]`

  const args: string[] = []
  names.forEach((n) => args.push('-i', n))

  let hasAudio = false
  if (opts.audioUrl) {
    opts.onStage?.('Downloading narration…')
    await ff.writeFile('narration.mp3', await fetchFile(opts.audioUrl))
    args.push('-i', 'narration.mp3')
    hasAudio = true
  }

  args.push('-filter_complex', filter, '-map', '[outv]')
  if (hasAudio) {
    // narration is the last input (index = names.length)
    args.push('-map', `${names.length}:a`, '-c:a', 'aac', '-shortest')
  }
  // ultrafast keeps the single-threaded encode tolerable; yuv420p for web playback.
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', 'out.mp4')

  opts.onStage?.('Stitching clips together…')
  await ff.exec(args)

  const data = await ff.readFile('out.mp4')
  // Best-effort FS cleanup so repeat runs don't accumulate. A failure here is
  // genuinely harmless (in-memory FS, freed on reload) — but don't swallow it
  // silently: log so a leak is at least visible in the console.
  await Promise.all(
    [...names, 'out.mp4', ...(hasAudio ? ['narration.mp3'] : [])].map(n =>
      ff.deleteFile(n).catch(e => console.warn(`[stitch] could not delete ${n} from ffmpeg FS:`, e?.message || e)),
    ),
  )

  const blob = new Blob([data as BlobPart], { type: 'video/mp4' })
  return URL.createObjectURL(blob)
}
