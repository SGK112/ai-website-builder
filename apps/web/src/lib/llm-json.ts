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
  // Real Anthropic token usage, summed across every pass/retry. Callers
  // meter credits off this — COGS scales with tokens, not with model alone.
  usage: { inputTokens: number; outputTokens: number }
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

// Back-compat entry point for the React / Next.js / Astro builders.
//
// This USED to be a blocking messages.create() pair capped at 16k with no
// continuation: when a multi-file project overran the cap the JSON was cut
// mid-file, both the first pass AND the "fix your JSON" retry failed (a retry
// can't repair truncation — it just truncates again, at double the cost), and
// the user got "too large to generate". That's the same half-baked failure the
// website pipeline fixed with continuation passes; multi-file targets never
// got it. It now delegates to the streaming implementation, which continues
// from the partial instead of restarting.
export async function generateJson<T = any>(
  opts: GenerateJsonOptions
): Promise<GenerateJsonResult<T>> {
  return generateJsonStreaming<T>(opts)
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
  // 32k, not 16k. Every pass is streamed, so there's no non-streaming SDK
  // ceiling to respect and no HTTP timeout to dodge — and max_tokens is a
  // ceiling, not a spend. A bigger ceiling means a multi-file project lands
  // in ONE pass instead of paying to re-send the whole partial as input on
  // each continuation. Still under Haiku 4.5's 64k output limit, the lowest
  // of the models these routes select.
  const maxTokens = opts.maxTokens ?? 32000
  const maxContinuations = opts.maxContinuations ?? 3

  // Summed across every pass + continuation + retry — the whole job's cost.
  const usage = { inputTokens: 0, outputTokens: 0 }

  const runStream = async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ text: string; stopReason: string }> => {
    const stream = opts.client.messages.stream({
      model: opts.model,
      max_tokens: maxTokens,
      system: opts.systemPrompt,
      messages,
      // Opus 5 / Sonnet 5 think by default, and thinking shares max_tokens
      // with the JSON we're asking for. No-op on every other model.
      ...claudeThinkingOff(opts.model),
    })
    const final = await stream.finalMessage()
    usage.inputTokens += final.usage?.input_tokens || 0
    usage.outputTokens += final.usage?.output_tokens || 0
    // Join EVERY text block, not just the first. A response that opens with a
    // non-text block (or splits across blocks) silently lost its tail here.
    const text = final.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('')
    return { text, stopReason: final.stop_reason || 'end_turn' }
  }

  // Pass 1 + continuation passes while the model keeps hitting the cap.
  let { text: full, stopReason } = await runStream([
    { role: 'user', content: opts.userMessage },
  ])
  let continuations = 0
  // `full` must be non-empty to echo back: the API rejects an empty text
  // content block (400), so a first pass that returned nothing would turn a
  // recoverable blip into a hard invalid_request_error. Retry the clean shot
  // instead of trying to continue from nothing.
  while (stopReason === 'max_tokens' && continuations < maxContinuations) {
    continuations++
    const next = await runStream(
      full.trim()
        ? [
            { role: 'user', content: opts.userMessage },
            { role: 'assistant', content: full },
            {
              role: 'user',
              content:
                'Continue the JSON from exactly where you left off. Output only ' +
                'the remaining characters — no repetition, no markdown fence, no commentary.',
            },
          ]
        : [{ role: 'user', content: opts.userMessage }],
    )
    full += next.text
    stopReason = next.stopReason
  }

  let parsed = safeJsonParse(full)
  let validationError = parsed ? validate(parsed) : 'Could not parse response as JSON.'
  if (!validationError && parsed) {
    return { parsed: parsed as T, rawText: full, attempts: 1 + continuations, usage: { ...usage } }
  }

  // One corrective retry — feed the parse/validation error back. Same
  // empty-content guard as the continuation loop: nothing to echo means a
  // plain re-ask, not a 400.
  const retry = await runStream(
    full.trim()
      ? [
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
        ]
      : [{ role: 'user', content: opts.userMessage }],
  )
  parsed = safeJsonParse(retry.text)
  validationError = parsed ? validate(parsed) : 'Could not parse response as JSON.'
  if (!validationError && parsed) {
    return { parsed: parsed as T, rawText: retry.text, attempts: 2 + continuations, usage: { ...usage } }
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

// Thinking is ON BY DEFAULT on Claude Opus 5 and Sonnet 5 — omitting the
// parameter runs adaptive thinking, unlike Opus 4.8 / Sonnet 4.6 where
// omitting it meant no thinking. That matters here because `max_tokens` caps
// thinking AND response text together: a builder that sized its cap around
// the HTML/JSON it expects would start spending part of that budget on
// reasoning it never reads, and truncate. We generate documents, not
// answers — there's nothing to reason about mid-stream — so turn it off.
//
// Only these two models need it:
//   • Opus 4.8 / Sonnet 4.6 / Haiku 4.5 — thinking already off when omitted.
//   • Fable 5 — thinking is ALWAYS on and `{type:'disabled'}` is a 400.
// Disabling is accepted at effort `high` or below; we never set effort, and
// the API default is `high`, so this is valid as sent.
export function claudeThinkingOff(model: string): { thinking?: { type: 'disabled' } } {
  return /^claude-(opus|sonnet)-5\b/.test(model) ? { thinking: { type: 'disabled' } } : {}
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
