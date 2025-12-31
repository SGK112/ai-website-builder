import { NextRequest } from 'next/server'

// DeepSeek API endpoint - free/cheap alternative for code generation
// Can be connected via Hugging Face, Ollama, or direct API

const DEEPSEEK_SYSTEM_PROMPT = `You are DeepSeek Coder, an expert AI coding assistant specialized in web development.
Generate clean, production-ready HTML, CSS, and JavaScript code.

Key Guidelines:
- Use modern HTML5 semantic elements
- Apply Tailwind CSS for styling (via CDN)
- Write clean, readable JavaScript
- Include responsive design patterns
- Add helpful code comments

When generating full pages, always include:
- <!DOCTYPE html> declaration
- Proper meta tags and viewport settings
- Tailwind CSS CDN link
- Inter font from Google Fonts

Return ONLY the code, no explanations unless asked.`

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentHtml, provider = 'huggingface' } = await req.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let userPrompt = prompt
    if (currentHtml) {
      userPrompt = `Modify this HTML based on: "${prompt}"\n\nCurrent HTML:\n${currentHtml}\n\nReturn the complete modified HTML.`
    }

    // Try different providers based on availability
    if (provider === 'ollama') {
      // Local Ollama instance
      return await callOllama(userPrompt)
    } else if (provider === 'groq') {
      // Groq (fast, free tier available)
      return await callGroq(userPrompt)
    } else {
      // Default: Hugging Face Inference API
      return await callHuggingFace(userPrompt)
    }
  } catch (error) {
    console.error('DeepSeek API error:', error)
    return new Response(
      JSON.stringify({ error: 'Code generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Hugging Face Inference API (free tier: ~1000 requests/day)
async function callHuggingFace(prompt: string) {
  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN

  const response = await fetch(
    'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct',
    {
      method: 'POST',
      headers: {
        'Authorization': HF_TOKEN ? `Bearer ${HF_TOKEN}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<|system|>\n${DEEPSEEK_SYSTEM_PROMPT}<|end|>\n<|user|>\n${prompt}<|end|>\n<|assistant|>`,
        parameters: {
          max_new_tokens: 4096,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    }
  )

  if (!response.ok) {
    // Fallback to a smaller model if DeepSeek fails
    return await callFallbackModel(prompt)
  }

  const data = await response.json()
  const generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text

  return new Response(JSON.stringify({ code: generatedText }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

// Fallback to CodeGemma or StarCoder
async function callFallbackModel(prompt: string) {
  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN

  // Try StarCoder2
  const response = await fetch(
    'https://api-inference.huggingface.co/models/bigcode/starcoder2-15b',
    {
      method: 'POST',
      headers: {
        'Authorization': HF_TOKEN ? `Bearer ${HF_TOKEN}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `// Task: ${prompt}\n// Generate HTML/CSS/JS code:\n`,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error('All models failed')
  }

  const data = await response.json()
  const generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text

  return new Response(JSON.stringify({ code: generatedText }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

// Local Ollama (unlimited, free, private)
async function callOllama(prompt: string) {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-coder:6.7b',
      prompt: `${DEEPSEEK_SYSTEM_PROMPT}\n\nUser: ${prompt}\n\nAssistant:`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Ollama not available')
  }

  const data = await response.json()

  return new Response(JSON.stringify({ code: data.response }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

// Groq (very fast, has free tier)
async function callGroq(prompt: string) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768', // or llama2-70b-4096
      messages: [
        { role: 'system', content: DEEPSEEK_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    throw new Error('Groq API failed')
  }

  const data = await response.json()

  return new Response(JSON.stringify({ code: data.choices[0]?.message?.content }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

// Streaming version for real-time display
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt')

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Return available models info
  return new Response(JSON.stringify({
    models: [
      { id: 'deepseek-coder', name: 'DeepSeek Coder V2', provider: 'huggingface', free: true },
      { id: 'starcoder2', name: 'StarCoder2 15B', provider: 'huggingface', free: true },
      { id: 'deepseek-local', name: 'DeepSeek (Local)', provider: 'ollama', free: true },
      { id: 'mixtral', name: 'Mixtral 8x7B', provider: 'groq', free: true },
    ],
    defaultModel: 'deepseek-coder',
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
