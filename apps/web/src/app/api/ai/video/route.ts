import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'

// Caps on user-supplied text/array inputs forwarded to PAID APIs — keeps a
// malicious client from inflating token/transfer cost or smuggling huge payloads.
const MAX_PROMPT = 2000
const MAX_STYLE = 200
const MAX_NEGATIVE = 500
const MAX_IMAGES = 5

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TOKEN = process.env.REPLICATE_API_TOKEN
const XAI_KEY = process.env.XAI_API_KEY

// ── Model registry ──────────────────────────────────────────────────────────
// provider 'replicate':
//   isOfficial=true  → POST to /v1/models/{owner}/{name}/predictions
//   isOfficial=false → POST to /v1/predictions with { version: "sha256..." }
// provider 'xai':
//   POST to https://api.x.ai/v1/videos/generations, poll GET /v1/videos/{id}
//
// Seedance is the default Replicate model — fastest quality-per-second. Grok
// Imagine (xAI) is the only model that accepts MULTIPLE input images and tends
// to handle people/hands/text better, so it's the recommended higher-fidelity
// option. Every entry carries the same keys so the union stays uniform.

const MODELS = {
  seedance: {
    id: 'bytedance/seedance-1-lite:78c9c4b0a7056c911b0483f58349b9931aff30d6465e7ab665e6c852949ce6d5',
    label: 'Seedance 1 Lite',
    provider: 'replicate',
    isOfficial: false,
    supportsImage: true,
    supportsMultiImage: false,
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
  },
  grok: {
    id: 'grok-imagine-video',
    label: 'Grok Imagine (xAI)',
    provider: 'xai',
    isOfficial: false,
    supportsImage: true,
    supportsMultiImage: true,
    maxDuration: 8,
    resolutions: [],
  },
  animatediff: {
    id: 'lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f',
    label: 'AnimateDiff',
    provider: 'replicate',
    isOfficial: false,
    supportsImage: false,
    supportsMultiImage: false,
    maxDuration: 4,
    resolutions: [],
  },
  zeroscope: {
    id: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
    label: 'Zeroscope XL',
    provider: 'replicate',
    isOfficial: false,
    supportsImage: false,
    supportsMultiImage: false,
    maxDuration: 3,
    resolutions: [],
  },
  wan: {
    id: 'wan-video/wan2.1-t2v-480p',
    label: 'Wan 2.1',
    provider: 'replicate',
    isOfficial: true,
    supportsImage: false,
    supportsMultiImage: false,
    maxDuration: 5,
    resolutions: [],
  },
  svd: {
    id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    label: 'Stable Video Diffusion',
    provider: 'replicate',
    isOfficial: false,
    supportsImage: true,
    supportsMultiImage: false,
    maxDuration: 4,
    resolutions: [],
  },
} as const

type ModelKey = keyof typeof MODELS

interface VideoRequest {
  action: 'text-to-video' | 'image-to-video' | 'status'
  prompt?: string
  imageUrl?: string
  imageUrls?: string[]   // multi-image (Grok only) — first frame, references, etc.
  negativePrompt?: string // "what to avoid" — only diffusion models that support it
  model?: string
  duration?: number
  fps?: number
  aspectRatio?: string
  resolution?: string
  predictionId?: string
  style?: string
}

// ── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  // Parse the body defensively — an empty/malformed body used to throw inside
  // the try and surface as a confusing 500 "Unexpected end of JSON input".
  let body: VideoRequest
  try {
    body = await request.json() as VideoRequest
  } catch {
    return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 })
  }

  try {
    const { action } = body || ({} as VideoRequest)

    // NOTE: these MUST be awaited. `return somePromise()` (un-awaited) lets a
    // rejection escape this try/catch — Next then emits an empty-body 500 and
    // the client throws "Unexpected end of JSON input" instead of seeing the
    // real error. Awaiting keeps failures inside the catch → clean JSON 500.
    if (action === 'status') {
      if (!body.predictionId) return NextResponse.json({ error: 'predictionId required' }, { status: 400 })
      return await pollOnce(body.predictionId)
    }

    // Rate-limit only the actual GENERATION starts (each spends real money) —
    // NOT the status polls above, which fire every few seconds. aiGeneration is
    // 20/min/user: generous enough for a multi-clip storyboard, tight enough to
    // stop a script from draining the budget.
    try {
      await checkApiRateLimit(request, 'aiGeneration')
    } catch (error) {
      const limited = handleRateLimitError(error)
      if (limited) return limited
      throw error
    }

    // Reject oversized text before it reaches a paid API.
    if ((body.prompt || '').length > MAX_PROMPT) return NextResponse.json({ error: `Prompt too long (max ${MAX_PROMPT} chars).` }, { status: 400 })
    if ((body.style || '').length > MAX_STYLE) return NextResponse.json({ error: 'Style value too long.' }, { status: 400 })
    if ((body.negativePrompt || '').length > MAX_NEGATIVE) return NextResponse.json({ error: 'Negative prompt too long.' }, { status: 400 })

    const modelKey = (body.model as ModelKey) || 'seedance'
    const model = MODELS[modelKey] ?? MODELS.seedance

    // Provider-aware credential check — Grok needs XAI_API_KEY, the rest need
    // REPLICATE_API_TOKEN. (Was a single early !TOKEN gate that blocked Grok.)
    if (model.provider === 'xai' && !XAI_KEY) {
      return NextResponse.json({
        error: 'Grok video is not available on this instance — XAI_API_KEY is not configured. Pick another model or ask an admin to set it.',
        feature: 'video', reason: 'xai_unconfigured',
      }, { status: 503 })
    }
    if (model.provider === 'replicate' && !TOKEN) {
      return NextResponse.json({
        error: 'AI video is not available on this instance — REPLICATE_API_TOKEN is not configured. Ask an admin to set it, or use the image tools instead.',
        feature: 'video', reason: 'replicate_unconfigured',
      }, { status: 503 })
    }

    if (action === 'image-to-video') {
      // Grok accepts several images; Replicate models take one. Normalize both
      // the legacy single `imageUrl` and the new `imageUrls[]` into one list.
      const rawImages = (body.imageUrls && body.imageUrls.length)
        ? body.imageUrls
        : (body.imageUrl ? [body.imageUrl] : [])
      // Only forward http(s) URLs, and cap the count — both the paid API payload
      // size and the third-party-SSRF surface (the model fetches these URLs).
      const images = rawImages
        .filter((u): u is string => typeof u === 'string' && /^https?:\/\//i.test(u))
        .slice(0, MAX_IMAGES)
      if (!images.length) return NextResponse.json({ error: 'A valid image URL is required.' }, { status: 400 })
      if (model.provider === 'xai') return await startXaiVideo(body, model, images)
      return await startPrediction(buildImageToVideoInput({ ...body, imageUrl: images[0] }, model, modelKey), model)
    }

    // text-to-video
    if (!body.prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    if (model.provider === 'xai') return await startXaiVideo(body, model, [])
    return await startPrediction(buildTextToVideoInput(body, model, modelKey), model)

  } catch (e: any) {
    console.error('[video] error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Video generation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Defense-in-depth (middleware also gates /api/ai/video): don't leak the
  // model list / credential-configured flags or job status to anonymous callers.
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    // Model list — only surface models whose provider is actually configured,
    // and tell the client which support image / multi-image input so it can
    // render the right upload affordance.
    const models = Object.entries(MODELS)
      .filter(([, v]) => (v.provider === 'xai' ? !!XAI_KEY : !!TOKEN))
      .map(([k, v]) => ({
        id: k,
        label: v.label,
        provider: v.provider,
        supportsImage: v.supportsImage,
        supportsMultiImage: v.supportsMultiImage,
        maxDuration: v.maxDuration,
      }))
    return NextResponse.json({ models, configured: !!TOKEN || !!XAI_KEY })
  }
  try {
    return await pollOnce(id)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to check status' }, { status: 500 })
  }
}

// ── Input builders ───────────────────────────────────────────────────────────

// Default "avoid" list — the artifacts users hit most (mangled hands, warped
// text, duplicated subjects). Merged with any user-supplied negative prompt.
// NOTE: only zeroscope + animatediff actually accept a negative prompt (and
// animatediff calls the field `n_prompt`). seedance/svd/wan/grok have no such
// field — for those, artifact control lives in the positive prompt (the AI
// Director bakes it in).
const DEFAULT_NEGATIVE = 'extra fingers, extra hands, deformed hands, mutated limbs, duplicated limbs, distorted faces, warped text, garbled text, blurry, low quality, watermark'

function negativeFor(body: VideoRequest): string {
  const user = (body.negativePrompt || '').trim()
  return user ? `${user}, ${DEFAULT_NEGATIVE}` : DEFAULT_NEGATIVE
}

function buildTextToVideoInput(body: VideoRequest, model: typeof MODELS[ModelKey], key: ModelKey) {
  const prompt = enhancePrompt(body.prompt!, body.style)
  const duration = Math.min(body.duration ?? 5, model.maxDuration)
  const aspectRatio = body.aspectRatio ?? '16:9'

  if (key === 'seedance') {
    return {
      prompt,
      duration,
      aspect_ratio: aspectRatio,
      resolution: body.resolution ?? '480p',
      fps: body.fps ?? 24,
      camera_fixed: false,
    }
  }
  if (key === 'animatediff') {
    // This model's negative field is `n_prompt` and its step field is `steps`
    // — the old code sent `negative_prompt`/`num_inference_steps`/`num_frames`,
    // none of which exist on this version, so they were silently dropped.
    return {
      prompt,
      n_prompt: negativeFor(body),
      steps: 25,
      guidance_scale: 7.5,
    }
  }
  if (key === 'zeroscope') {
    return {
      prompt,
      negative_prompt: negativeFor(body),
      num_frames: Math.min(duration * 8, 24),
      fps: body.fps ?? 8,
    }
  }
  if (key === 'wan') {
    return { prompt, duration }
  }
  return { prompt, num_frames: duration * (body.fps ?? 8) }
}

function buildImageToVideoInput(body: VideoRequest, model: typeof MODELS[ModelKey], key: ModelKey) {
  const duration = Math.min(body.duration ?? 5, model.maxDuration)

  if (key === 'seedance') {
    return {
      image: body.imageUrl,
      prompt: body.prompt ? enhancePrompt(body.prompt) : 'Smooth natural motion',
      duration,
      aspect_ratio: body.aspectRatio ?? '16:9',
      resolution: body.resolution ?? '480p',
      fps: body.fps ?? 24,
      camera_fixed: false,
    }
  }
  if (key === 'svd') {
    return {
      input_image: body.imageUrl,
      motion_bucket_id: 127,
      cond_aug: 0.02,
      fps: body.fps ?? 8,
      seed: Math.floor(Math.random() * 1_000_000),
    }
  }
  // fallback: try seedance anyway
  return {
    image: body.imageUrl,
    prompt: body.prompt ? enhancePrompt(body.prompt) : 'Smooth natural motion',
    duration,
  }
}

// ── Replicate helpers ────────────────────────────────────────────────────────

async function startPrediction(input: Record<string, unknown>, model: typeof MODELS[ModelKey]) {
  const isOfficial = model.isOfficial
  const modelId = model.id

  const url = isOfficial
    ? `https://api.replicate.com/v1/models/${modelId}/predictions`
    : 'https://api.replicate.com/v1/predictions'

  const body = isOfficial
    ? { input }
    : { version: modelId.split(':')[1], input }

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Replicate error ${res.status}`)
  }
  const prediction = await res.json()
  return NextResponse.json({ id: prediction.id, status: prediction.status })
}

async function pollOnce(predictionId: string) {
  // Grok jobs are tagged with an "xai:" prefix at creation so status checks
  // route to xAI instead of Replicate (the client re-sends whatever id we gave).
  if (predictionId.startsWith('xai:')) return pollXai(predictionId)

  const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { Authorization: `Token ${TOKEN}` },
  })
  if (!res.ok) throw new Error('Failed to check prediction status')
  const p = await res.json()
  // Normalize output — Replicate returns an array for most video models
  const output = Array.isArray(p.output) ? p.output[0] : p.output
  return NextResponse.json({
    id: p.id,
    status: p.status,          // starting | processing | succeeded | failed
    videoUrl: output || null,
    error: p.error || null,
    logs: p.logs || null,
  })
}

function enhancePrompt(prompt: string, style?: string): string {
  const suffix = 'high quality, smooth motion, cinematic'
  if (style && style.toLowerCase() !== 'none') {
    return `${prompt}, ${style} style, ${suffix}`
  }
  return `${prompt}, ${suffix}`
}

// ── xAI (Grok Imagine) helpers ───────────────────────────────────────────────
// Async API: POST /v1/videos/generations → { request_id }; poll GET
// /v1/videos/{id} → 202 {status:"pending",progress} until {status:"done",
// video:{url}}. Grok is the only model that accepts MULTIPLE input images,
// passed as reference_images:[{url},…] (1 or many — same field).

async function startXaiVideo(body: VideoRequest, model: typeof MODELS[ModelKey], images: string[]) {
  const basePrompt = body.prompt || (images.length ? 'Animate these images with smooth, natural motion' : '')
  const payload: Record<string, unknown> = { model: model.id, prompt: enhancePrompt(basePrompt, body.style) }
  // xAI takes guidance images via `reference_images: [{url}]` (the older
  // `image`/`images` fields are deprecated and rejected at generation time).
  // One element or several — same field.
  if (images.length) payload.reference_images = images.map((url) => ({ url }))

  const res = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any))
    throw new Error(err.error || err.message || `xAI error ${res.status}`)
  }
  const j = await res.json()
  if (!j.request_id) throw new Error('xAI did not return a request id')
  // Prefix so pollOnce routes the client's status checks back to xAI.
  return NextResponse.json({ id: `xai:${j.request_id}`, status: 'starting' })
}

async function pollXai(prefixedId: string) {
  const rid = prefixedId.slice('xai:'.length)
  const res = await fetch(`https://api.x.ai/v1/videos/${rid}`, {
    headers: { Authorization: `Bearer ${XAI_KEY}` },
  })
  // 202 = still pending (not an error); other non-2xx are real failures.
  if (!res.ok && res.status !== 202) throw new Error(`Failed to check status (xAI ${res.status})`)
  const p = await res.json().catch(() => ({} as any))
  const raw = String(p.status || '').toLowerCase()
  const status = raw === 'done' ? 'succeeded'
    : (raw === 'failed' || raw === 'error') ? 'failed'
    : 'processing'   // pending / processing / unknown → keep polling
  return NextResponse.json({
    id: prefixedId,                              // keep prefix → next poll still hits xAI
    status,
    videoUrl: p.video?.url || null,
    error: p.error || null,
    logs: p.progress != null ? `${p.progress}%` : null,
  })
}
