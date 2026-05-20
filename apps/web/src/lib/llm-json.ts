// Shared LLM-JSON helper used by the four `/api/builder/*` route handlers.
//
// What it does:
//   1. Calls Claude with a system prompt + user prompt
//   2. Tries to parse the response as JSON
//   3. If parsing fails OR the result is missing required fields, makes
//      ONE follow-up call appending the parse error and asking Claude to
//      output valid JSON only. Most Claude failures here are markdown
//      fencing or stray prose, both of which are recoverable on retry.
//   4. Returns parsed object + the raw text + which attempt succeeded.
//
// Why it matters: the e2e audit found Next.js / Expo / React / Astro
// generation routes are 20-30% reliable because any malformed JSON
// silently fails for the user. Retry once with explicit "fix your JSON"
// guidance drives that up substantially with zero extra UX work.

import Anthropic from '@anthropic-ai/sdk'

export interface GenerateJsonOptions {
  client: Anthropic
  model: string
  maxTokens?: number
  systemPrompt: string
  userMessage: string
  // Validate the parsed object. Return null on success, or an error string
  // to feed back into the retry prompt. Default checks `files` is an object.
  validate?: (parsed: any) => string | null
}

export interface GenerateJsonResult<T = any> {
  parsed: T
  rawText: string
  attempts: number
}

export class GenerateJsonError extends Error {
  status: number
  detail: string
  constructor(message: string, status = 502, detail = '') {
    super(message)
    this.status = status
    this.detail = detail
  }
}

const defaultValidate = (parsed: any): string | null => {
  if (!parsed || typeof parsed !== 'object') return 'Response is not an object.'
  if (!parsed.files || typeof parsed.files !== 'object') {
    return 'Missing "files" object.'
  }
  return null
}

// Tolerant JSON parser — strips markdown fences, slices to outermost braces,
// retries with trailing-comma fix.
export function safeJsonParse(text: string): any | null {
  let s = text.trim()
  if (s.startsWith('```')) {
    s = s
      .replace(/^```(?:json|JSON)?\s*/, '')
      .replace(/```\s*$/, '')
      .trim()
  }
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first < 0 || last <= first) return null
  const slice = s.slice(first, last + 1)
  try {
    return JSON.parse(slice)
  } catch {}
  // Common LLM mistake: trailing commas before } or ].
  try {
    return JSON.parse(slice.replace(/,(\s*[}\]])/g, '$1'))
  } catch {}
  // Single quotes around keys/strings.
  try {
    return JSON.parse(
      slice
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
    )
  } catch {}
  return null
}

export async function generateJson<T = any>(
  opts: GenerateJsonOptions
): Promise<GenerateJsonResult<T>> {
  const validate = opts.validate ?? defaultValidate
  // Capped at 16k on purpose: these are NON-streaming messages.create()
  // calls, and the Anthropic SDK rejects a non-streaming request whose
  // max_tokens is high enough to risk a >10-minute response ("Streaming is
  // required…"). Bigger projects can still truncate — that surfaces as the
  // clear error + template suggestion below, not a silent failure.
  const maxTokens = opts.maxTokens ?? 16000

  // Attempt 1 — clean shot
  const first = await opts.client.messages.create({
    model: opts.model,
    max_tokens: maxTokens,
    system: opts.systemPrompt,
    messages: [{ role: 'user', content: opts.userMessage }],
  })
  const firstText =
    first.content.find((b) => b.type === 'text')?.type === 'text'
      ? (first.content.find((b) => b.type === 'text') as any).text
      : ''

  let parsed = safeJsonParse(firstText)
  let validationError = parsed ? validate(parsed) : 'Could not parse response as JSON.'

  if (!validationError && parsed) {
    return { parsed: parsed as T, rawText: firstText, attempts: 1 }
  }

  // Attempt 2 — feed the error back, ask for clean JSON.
  // We include the previous prompt + the assistant's previous reply + a
  // corrective user turn so Claude has full context for the fix.
  const second = await opts.client.messages.create({
    model: opts.model,
    max_tokens: maxTokens,
    system: opts.systemPrompt,
    messages: [
      { role: 'user', content: opts.userMessage },
      { role: 'assistant', content: firstText },
      {
        role: 'user',
        content: [
          `Your previous response could not be processed: ${validationError}`,
          '',
          'Reply with ONLY the JSON object — no markdown fences, no prose, no commentary.',
          'It must start with { and end with } and parse as strict JSON (no trailing commas, no comments, no single quotes).',
          'All required fields from the schema must be present.',
        ].join('\n'),
      },
    ],
  })
  const secondText =
    second.content.find((b) => b.type === 'text')?.type === 'text'
      ? (second.content.find((b) => b.type === 'text') as any).text
      : ''

  parsed = safeJsonParse(secondText)
  validationError = parsed ? validate(parsed) : 'Could not parse response as JSON.'

  if (!validationError && parsed) {
    return { parsed: parsed as T, rawText: secondText, attempts: 2 }
  }

  // Honest, actionable message. "Be more specific" was misleading — a
  // bigger/more-detailed prompt makes truncation *worse*, not better.
  const hitTokenCap = first.stop_reason === 'max_tokens' || second.stop_reason === 'max_tokens'
  throw new GenerateJsonError(
    hitTokenCap
      ? 'The project was too large to generate in one pass — it got cut off mid-file. Try an app with fewer screens, or start from an app template.'
      : "The generated project couldn't be read as valid JSON. Try rephrasing, or start from an app template.",
    502,
    validationError || 'parse failed',
  )
}

// Streaming variant of generateJson.
//
// Two reasons to prefer it for large projects (a full Expo app — and
// especially a website→app conversion):
//   1. messages.stream() sidesteps the SDK's hard refusal of a
//      non-streaming request whose max_tokens is high enough to risk a
//      >10-minute response.
//   2. When the model hits the token cap mid-JSON it CONTINUES from the
//      partial output (prefilling the assistant turn) rather than failing.
//      A blocking generateJson() just truncates and throws — the
//      conversion of a real multi-screen site needs more than one pass.
export async function generateJsonStreaming<T = any>(
  opts: GenerateJsonOptions & { maxContinuations?: number },
): Promise<GenerateJsonResult<T>> {
  const validate = opts.validate ?? defaultValidate
  const maxTokens = opts.maxTokens ?? 16000
  const maxContinuations = opts.maxContinuations ?? 3

  const runStream = async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ text: string; stopReason: string }> => {
    const stream = opts.client.messages.stream({
      model: opts.model,
      max_tokens: maxTokens,
      system: opts.systemPrompt,
      messages,
    })
    const final = await stream.finalMessage()
    const block = final.content.find((b) => b.type === 'text')
    return {
      text: block && block.type === 'text' ? block.text : '',
      stopReason: final.stop_reason || 'end_turn',
    }
  }

  // Pass 1 + continuation passes while the model keeps hitting the cap.
  let { text: full, stopReason } = await runStream([
    { role: 'user', content: opts.userMessage },
  ])
  let continuations = 0
  while (stopReason === 'max_tokens' && continuations < maxContinuations) {
    continuations++
    const next = await runStream([
      { role: 'user', content: opts.userMessage },
      { role: 'assistant', content: full },
      {
        role: 'user',
        content:
          'Continue the JSON from exactly where you left off. Output only ' +
          'the remaining characters — no repetition, no markdown fence, no commentary.',
      },
    ])
    full += next.text
    stopReason = next.stopReason
  }

  let parsed = safeJsonParse(full)
  let validationError = parsed ? validate(parsed) : 'Could not parse response as JSON.'
  if (!validationError && parsed) {
    return { parsed: parsed as T, rawText: full, attempts: 1 + continuations }
  }

  // One corrective retry — feed the parse/validation error back.
  const retry = await runStream([
    { role: 'user', content: opts.userMessage },
    { role: 'assistant', content: full },
    {
      role: 'user',
      content: [
        `Your previous response could not be processed: ${validationError}`,
        '',
        'Reply with ONLY the JSON object — no markdown fences, no prose, no commentary.',
        'It must start with { and end with } and parse as strict JSON (no trailing commas, no comments, no single quotes).',
        'All required fields from the schema must be present.',
      ].join('\n'),
    },
  ])
  parsed = safeJsonParse(retry.text)
  validationError = parsed ? validate(parsed) : 'Could not parse response as JSON.'
  if (!validationError && parsed) {
    return { parsed: parsed as T, rawText: retry.text, attempts: 2 + continuations }
  }

  const hitTokenCap = stopReason === 'max_tokens' || retry.stopReason === 'max_tokens'
  throw new GenerateJsonError(
    hitTokenCap
      ? 'The project was too large to generate even after continuation passes — try an app with fewer screens, or start from an app template.'
      : "The generated project couldn't be read as valid JSON. Try rephrasing, or start from an app template.",
    502,
    validationError || 'parse failed',
  )
}

// Validation helpers callers can compose into custom validate fns.
export function requireFiles(parsed: any, paths: string[]): string | null {
  if (!parsed?.files || typeof parsed.files !== 'object') return 'Missing "files" object.'
  const missing = paths.filter((p) => typeof parsed.files[p] !== 'string' || !parsed.files[p].length)
  if (missing.length > 0) return `Missing required file(s): ${missing.join(', ')}`
  return null
}

// Wrap a long-running JSON producer in an SSE stream that emits a heartbeat
// comment every 15s + a final `result` (or `error`) event when done.
//
// Why: a single NextResponse.json() blocks the response body until the work
// finishes. Cloudflare's free-tier edge timeout is 100s — any Anthropic call
// that runs past that turns into HTTP 524 at the edge, even though Render
// is happily still computing. Heartbeats (any byte) reset Cloudflare's idle
// timer, so the connection stays alive for the full Render maxDuration.
//
// Consumers (workspace/page.tsx#handleGenerateMultiTarget) read this with
// `readSseJsonResult` below, which unwraps the result event and ignores
// heartbeats.
export function streamJsonWithHeartbeats<T>(
  work: () => Promise<T>,
  opts: { heartbeatMs?: number } = {},
): Response {
  const heartbeatMs = opts.heartbeatMs ?? 15000
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return
        try { controller.enqueue(chunk) } catch { closed = true }
      }
      const safeClose = () => {
        if (closed) return
        closed = true
        try { controller.close() } catch { /* already closed */ }
      }
      // Immediate first byte so the edge starts flushing the response right
      // away — Cloudflare considers the connection "active" from this point.
      safeEnqueue(encoder.encode(': connected\n\n'))
      const heartbeat = setInterval(() => {
        safeEnqueue(encoder.encode(': ping\n\n'))
      }, heartbeatMs)
      try {
        const result = await work()
        safeEnqueue(encoder.encode(`event: result\ndata: ${JSON.stringify(result)}\n\n`))
      } catch (e: any) {
        const status = typeof e?.status === 'number' ? e.status : 502
        const message = e?.message || 'Generation failed'
        const detail = e?.detail || ''
        safeEnqueue(encoder.encode(
          `event: error\ndata: ${JSON.stringify({ error: message, status, detail })}\n\n`
        ))
      } finally {
        clearInterval(heartbeat)
        safeClose()
      }
    },
    cancel() {
      // Client disconnected — start() finally{} handles cleanup via closed flag.
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // Tell upstream proxies (Render's edge, Cloudflare) not to buffer.
      'X-Accel-Buffering': 'no',
    },
  })
}
