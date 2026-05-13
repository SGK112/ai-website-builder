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

  throw new GenerateJsonError(
    'Model output was not valid JSON after two attempts. Try a more specific prompt.',
    502,
    validationError || 'parse failed'
  )
}

// Validation helpers callers can compose into custom validate fns.
export function requireFiles(parsed: any, paths: string[]): string | null {
  if (!parsed?.files || typeof parsed.files !== 'object') return 'Missing "files" object.'
  const missing = paths.filter((p) => typeof parsed.files[p] !== 'string' || !parsed.files[p].length)
  if (missing.length > 0) return `Missing required file(s): ${missing.join(', ')}`
  return null
}
