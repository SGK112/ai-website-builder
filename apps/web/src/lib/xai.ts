// xAI Grok support. xAI's API is OpenAI-compatible, so we reuse the OpenAI SDK
// with a different baseURL + key. Centralised so every builder route routes
// Grok the same way (the website generate route inlines the same pattern).

import OpenAI from 'openai'

export const XAI_BASE_URL = 'https://api.x.ai/v1'

// Any model id the UI/router sends that starts with "grok" is an xAI model.
export const isGrokModel = (model?: string): boolean =>
  (model || '').toLowerCase().startsWith('grok')

// xAI retired the grok-2 line and Grok 4.x is multimodal (no separate vision
// id), so every grok-* id we might receive resolves to the current flagship.
export const XAI_FLAGSHIP = 'grok-4.3'

// OpenAI-compatible client pointed at xAI. Prefers a caller-supplied BYOK key,
// then the server's XAI_API_KEY.
export function xaiClient(apiKey?: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey || process.env.XAI_API_KEY,
    baseURL: XAI_BASE_URL,
  })
}
