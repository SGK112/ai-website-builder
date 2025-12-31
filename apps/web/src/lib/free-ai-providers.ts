/**
 * Free AI Provider Integrations
 *
 * These providers offer free tiers for AI model inference:
 * - Hugging Face: Rate-limited free tier, huge model library
 * - Replicate: $5 free credits for new users
 * - Together AI: Free trial credits
 * - Cloudflare Workers AI: Generous free tier
 */

// ============================================
// HUGGING FACE INFERENCE API (FREE TIER)
// ============================================
// Docs: https://huggingface.co/docs/inference-providers
// Free tier: Rate limited, requires free HF token
// Models: FLUX, Llama, Mistral, etc.

const HF_ROUTER_URL = 'https://router.huggingface.co'
const HF_INFERENCE_URL = 'https://router.huggingface.co/hf-inference/models'
const HF_CHAT_URL = 'https://router.huggingface.co/v1/chat/completions'

export interface HuggingFaceConfig {
  apiKey?: string // Required for most operations now
}

export const HF_FREE_MODELS = {
  // Image Generation (via hf-inference provider)
  'stable-diffusion-xl': 'stabilityai/stable-diffusion-xl-base-1.0',
  'stable-diffusion-2': 'stabilityai/stable-diffusion-2-1',
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
  'flux-dev': 'black-forest-labs/FLUX.1-dev',

  // Text Generation (LLMs) - use chat completions format
  'llama-3.2-3b': 'meta-llama/Llama-3.2-3B-Instruct',
  'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.3',
  'phi-3-mini': 'microsoft/Phi-3-mini-4k-instruct',
  'qwen-2.5': 'Qwen/Qwen2.5-7B-Instruct',
  'gemma-2': 'google/gemma-2-2b-it',
  'deepseek-r1': 'deepseek-ai/DeepSeek-R1',
}

export async function hfGenerateImage(
  prompt: string,
  model: keyof typeof HF_FREE_MODELS | string = 'stable-diffusion-xl',
  apiKey?: string
): Promise<{ image?: string; status?: string; error?: string }> {
  const modelId = HF_FREE_MODELS[model as keyof typeof HF_FREE_MODELS] || model

  if (!apiKey) {
    return {
      error: 'Hugging Face now requires an API token. Get a free one at https://huggingface.co/settings/tokens'
    }
  }

  try {
    const response = await fetch(`${HF_INFERENCE_URL}/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: 'blurry, low quality, distorted, ugly',
          num_inference_steps: 25,
          guidance_scale: 7.5,
        }
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      if (error.error?.includes('loading')) {
        return {
          status: 'loading',
          error: 'Model is loading, please retry in ~20 seconds',
        }
      }
      throw new Error(error.error || `HuggingFace API error: ${response.status}`)
    }

    // For image generation, response is a blob
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('image')) {
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return {
        image: `data:${contentType};base64,${base64}`,
      }
    }

    const result = await response.json()
    return { image: result.image || result }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function hfGenerateText(
  prompt: string,
  model: keyof typeof HF_FREE_MODELS | string = 'mistral-7b',
  apiKey?: string,
  maxTokens: number = 1024
): Promise<{ text?: string; error?: string }> {
  const modelId = HF_FREE_MODELS[model as keyof typeof HF_FREE_MODELS] || model

  if (!apiKey) {
    return {
      error: 'Hugging Face now requires an API token. Get a free one at https://huggingface.co/settings/tokens'
    }
  }

  console.log(`[HF] Calling model: ${modelId} with token: ${apiKey?.slice(0, 10)}...`)

  try {
    // Use OpenAI-compatible chat completions endpoint for instruction models
    const response = await fetch(HF_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[HF] API error ${response.status}:`, errorText)

      // Try to parse as JSON for better error messages
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.includes('loading')) {
          return { error: 'Model is loading. Please try again in ~20 seconds.' }
        }
        throw new Error(errorJson.error || `HuggingFace API error: ${response.status}`)
      } catch {
        throw new Error(`HuggingFace API error: ${response.status} - ${errorText.slice(0, 200)}`)
      }
    }

    const result = await response.json()
    console.log(`[HF] Response received, length: ${JSON.stringify(result).length}`)

    // Handle OpenAI-compatible chat response format
    if (result.choices?.[0]?.message?.content) {
      return { text: result.choices[0].message.content }
    }
    // Fallback for other formats
    if (Array.isArray(result) && result[0]?.generated_text) {
      return { text: result[0].generated_text }
    }
    if (result.generated_text) {
      return { text: result.generated_text }
    }
    if (typeof result === 'string') {
      return { text: result }
    }

    console.error('[HF] Unexpected response format:', result)
    return { error: 'Unexpected response format from HuggingFace' }
  } catch (error: any) {
    console.error('[HF] Error:', error.message)
    return { error: error.message }
  }
}

// Legacy function for backwards compatibility
export async function huggingFaceInference(
  modelId: string,
  inputs: any,
  apiKey?: string
): Promise<any> {
  if (!apiKey) {
    throw new Error('Hugging Face now requires an API token')
  }

  const response = await fetch(`${HF_INFERENCE_URL}/${modelId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(inputs),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `HuggingFace API error: ${response.status}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('image')) {
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { image: `data:${contentType};base64,${base64}`, success: true }
  }

  return response.json()
}


// ============================================
// REPLICATE (FREE $5 CREDITS)
// ============================================
// Docs: https://replicate.com/docs
// Free tier: $5 credits for new users (14 days)
// Models: FLUX, SDXL, Llama, Whisper, etc.

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

export const REPLICATE_FREE_MODELS = {
  // Image Generation (most popular free-tier friendly)
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux-dev',
  'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  'sdxl-lightning': 'bytedance/sdxl-lightning-4step:5f24084160c9089501c1b3545d9be3c27883ae2239b6f412990e82d4a6210f8f',

  // LLMs
  'llama-3.2-3b': 'meta/meta-llama-3-8b-instruct',
  'llama-3.1-8b': 'meta/meta-llama-3.1-8b-instruct',

  // Audio
  'whisper': 'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
}

export async function replicatePredict(
  model: string,
  input: Record<string, any>,
  apiKey: string
): Promise<any> {
  // Start prediction
  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: model.includes(':') ? model.split(':')[1] : undefined,
      model: model.includes(':') ? undefined : model,
      input,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Replicate API error: ${response.status}`)
  }

  const prediction = await response.json()

  // Poll for completion
  let result = prediction
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    result = await pollResponse.json()
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Prediction failed')
  }

  return result
}

export async function replicateGenerateImage(
  prompt: string,
  model: keyof typeof REPLICATE_FREE_MODELS | string = 'flux-schnell',
  apiKey: string
): Promise<{ image?: string; error?: string }> {
  const modelId = REPLICATE_FREE_MODELS[model as keyof typeof REPLICATE_FREE_MODELS] || model

  try {
    const result = await replicatePredict(
      modelId,
      {
        prompt,
        num_outputs: 1,
        aspect_ratio: '16:9',
        output_format: 'webp',
        output_quality: 90,
      },
      apiKey
    )

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
    return { image: imageUrl }
  } catch (error: any) {
    return { error: error.message }
  }
}


// ============================================
// TOGETHER AI (FREE TRIAL CREDITS)
// ============================================
// Docs: https://docs.together.ai
// Free tier: Trial credits for new users
// Models: Llama, Mistral, FLUX, SDXL

const TOGETHER_API_URL = 'https://api.together.xyz/v1'

export const TOGETHER_FREE_MODELS = {
  // LLMs (most cost-effective)
  'llama-3.2-3b': 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
  'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.3',
  'qwen-2.5-7b': 'Qwen/Qwen2.5-7B-Instruct-Turbo',
  'gemma-2-9b': 'google/gemma-2-9b-it',

  // Image Generation
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell-Free',
  'flux-dev': 'black-forest-labs/FLUX.1.1-pro', // Paid but cheap
}

export async function togetherChat(
  messages: { role: string; content: string }[],
  model: keyof typeof TOGETHER_FREE_MODELS | string = 'llama-3.2-3b',
  apiKey: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<{ text?: string; error?: string }> {
  const modelId = TOGETHER_FREE_MODELS[model as keyof typeof TOGETHER_FREE_MODELS] || model

  try {
    const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Together API error: ${response.status}`)
    }

    const result = await response.json()
    return { text: result.choices[0]?.message?.content || '' }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function togetherGenerateImage(
  prompt: string,
  model: keyof typeof TOGETHER_FREE_MODELS | string = 'flux-schnell',
  apiKey: string
): Promise<{ image?: string; error?: string }> {
  const modelId = TOGETHER_FREE_MODELS[model as keyof typeof TOGETHER_FREE_MODELS] || model

  try {
    const response = await fetch(`${TOGETHER_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        width: 1024,
        height: 768,
        steps: 4,
        n: 1,
        response_format: 'b64_json',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Together API error: ${response.status}`)
    }

    const result = await response.json()
    const b64 = result.data[0]?.b64_json
    return { image: b64 ? `data:image/png;base64,${b64}` : result.data[0]?.url }
  } catch (error: any) {
    return { error: error.message }
  }
}


// ============================================
// CLOUDFLARE WORKERS AI (GENEROUS FREE TIER)
// ============================================
// Docs: https://developers.cloudflare.com/workers-ai
// Free tier: 10,000 neurons/day (~100 images or ~10,000 LLM tokens)
// Models: Stable Diffusion, Llama, Whisper

const CF_API_URL = 'https://api.cloudflare.com/client/v4/accounts'

export const CLOUDFLARE_FREE_MODELS = {
  // Image Generation
  'stable-diffusion-xl': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  'dreamshaper': '@cf/lykon/dreamshaper-8-lcm',

  // LLMs
  'llama-3.1-8b': '@cf/meta/llama-3.1-8b-instruct',
  'llama-3.2-3b': '@cf/meta/llama-3.2-3b-instruct',
  'mistral-7b': '@cf/mistral/mistral-7b-instruct-v0.1',
  'qwen-1.5-7b': '@cf/qwen/qwen1.5-7b-chat-awq',

  // Speech
  'whisper': '@cf/openai/whisper',

  // Translation
  'm2m100': '@cf/meta/m2m100-1.2b',
}

export async function cloudflareAI(
  accountId: string,
  model: string,
  input: Record<string, any>,
  apiKey: string
): Promise<any> {
  const response = await fetch(
    `${CF_API_URL}/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.errors?.[0]?.message || `Cloudflare AI error: ${response.status}`)
  }

  return response.json()
}

export async function cfGenerateImage(
  prompt: string,
  accountId: string,
  apiKey: string,
  model: keyof typeof CLOUDFLARE_FREE_MODELS | string = 'stable-diffusion-xl'
): Promise<{ image?: string; error?: string }> {
  const modelId = CLOUDFLARE_FREE_MODELS[model as keyof typeof CLOUDFLARE_FREE_MODELS] || model

  try {
    const response = await fetch(
      `${CF_API_URL}/${accountId}/ai/run/${modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: 'blurry, low quality, distorted',
          num_steps: 20,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.errors?.[0]?.message || `Cloudflare AI error: ${response.status}`)
    }

    // Cloudflare returns raw image bytes
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return { image: `data:image/png;base64,${base64}` }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function cfGenerateText(
  prompt: string,
  accountId: string,
  apiKey: string,
  model: keyof typeof CLOUDFLARE_FREE_MODELS | string = 'llama-3.1-8b',
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<{ text?: string; error?: string }> {
  const modelId = CLOUDFLARE_FREE_MODELS[model as keyof typeof CLOUDFLARE_FREE_MODELS] || model

  try {
    const result = await cloudflareAI(
      accountId,
      modelId,
      {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
      },
      apiKey
    )

    return { text: result.result?.response || '' }
  } catch (error: any) {
    return { error: error.message }
  }
}


// ============================================
// UNIFIED FREE AI INTERFACE
// ============================================

export type FreeAIProvider = 'huggingface' | 'replicate' | 'together' | 'cloudflare'

export interface FreeAIConfig {
  provider: FreeAIProvider
  apiKey?: string
  accountId?: string // For Cloudflare
}

export const FREE_PROVIDER_INFO = {
  huggingface: {
    name: 'Hugging Face',
    signupUrl: 'https://huggingface.co/settings/tokens',
    docsUrl: 'https://huggingface.co/docs/inference-providers',
    freeOffer: 'Free tier with HF token (no credit card)',
    requiresKey: true, // Now requires free HF token
  },
  replicate: {
    name: 'Replicate',
    signupUrl: 'https://replicate.com/signin',
    docsUrl: 'https://replicate.com/docs',
    freeOffer: '$5 free credits (14 days)',
    requiresKey: true,
  },
  together: {
    name: 'Together AI',
    signupUrl: 'https://api.together.xyz/signup',
    docsUrl: 'https://docs.together.ai',
    freeOffer: 'Free trial credits',
    requiresKey: true,
  },
  cloudflare: {
    name: 'Cloudflare Workers AI',
    signupUrl: 'https://dash.cloudflare.com/sign-up/workers-and-pages',
    docsUrl: 'https://developers.cloudflare.com/workers-ai',
    freeOffer: '10,000 neurons/day free',
    requiresKey: true,
    requiresAccountId: true,
  },
}

export async function generateImageFree(
  prompt: string,
  config: FreeAIConfig,
  model?: string
): Promise<{ image?: string; error?: string }> {
  switch (config.provider) {
    case 'huggingface':
      return hfGenerateImage(prompt, model || 'stable-diffusion-xl', config.apiKey)

    case 'replicate':
      if (!config.apiKey) return { error: 'Replicate requires an API key' }
      return replicateGenerateImage(prompt, model || 'flux-schnell', config.apiKey)

    case 'together':
      if (!config.apiKey) return { error: 'Together AI requires an API key' }
      return togetherGenerateImage(prompt, model || 'flux-schnell', config.apiKey)

    case 'cloudflare':
      if (!config.apiKey || !config.accountId) {
        return { error: 'Cloudflare requires API key and account ID' }
      }
      return cfGenerateImage(prompt, config.accountId, config.apiKey, model || 'stable-diffusion-xl')

    default:
      return { error: `Unknown provider: ${config.provider}` }
  }
}

export async function generateTextFree(
  prompt: string,
  config: FreeAIConfig,
  model?: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ text?: string; error?: string }> {
  switch (config.provider) {
    case 'huggingface':
      return hfGenerateText(prompt, model || 'mistral-7b', config.apiKey, options?.maxTokens)

    case 'together':
      if (!config.apiKey) return { error: 'Together AI requires an API key' }
      return togetherChat(
        [{ role: 'user', content: prompt }],
        model || 'llama-3.2-3b',
        config.apiKey,
        options
      )

    case 'cloudflare':
      if (!config.apiKey || !config.accountId) {
        return { error: 'Cloudflare requires API key and account ID' }
      }
      return cfGenerateText(prompt, config.accountId, config.apiKey, model || 'llama-3.1-8b', options)

    default:
      return { error: `Text generation not supported for provider: ${config.provider}` }
  }
}
