// POST /api/ai/voice/realtime-token
//
// Mints a short-lived ephemeral token for the OpenAI Realtime API so the
// BROWSER can open a WebRTC voice session DIRECTLY to OpenAI — no audio ever
// passes through our server, and the real OPENAI_API_KEY never leaves it. The
// session is pre-configured as Webstew's voice build assistant with a
// `build_site` tool, so speaking a description triggers a real build (the
// client handles the tool call → handleChatMessage). Verified against the GA
// endpoint POST /v1/realtime/client_secrets (the old /v1/realtime/sessions 404s).

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GA realtime model. Override per-env if the account is pinned to a snapshot.
const MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime'
const VOICE = process.env.OPENAI_REALTIME_VOICE || 'marin'

const INSTRUCTIONS = `You are Webstew's voice build assistant — talk the user through creating a website or app, hands-free.

WHEN TO BUILD: The moment the user describes a site/app to create, or a change to the current one, call the build_site tool with a single vivid, self-contained prompt that captures everything they said (purpose, audience, pages/sections, style, content). Don't ask for permission to start — just confirm briefly out loud ("On it — building your coffee shop site now") and call the tool.

CONVERSATION STYLE:
- Short, warm, spoken-not-written. Under 15 words per reply, up to 25 when summarizing what you'll build.
- One question at a time. If the request is vague, ask ONE clarifying question, then build.
- Never read code, HTML, or URLs aloud.
- After a build kicks off, tell them it's generating and they'll see it appear, and offer to refine ("want me to change anything?").

You are the demo — make building feel effortless and magical.`

const BUILD_SITE_TOOL = {
  type: 'function',
  name: 'build_site',
  description:
    'Build a new website/app, or modify the current one, from a plain-English description. Call this whenever the user describes what they want.',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description:
          'A complete, vivid build instruction capturing everything the user asked for (purpose, audience, pages/sections, visual style, content). Self-contained — the builder only sees this string.',
      },
    },
    required: ['prompt'],
  },
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    // Realtime voice burns paid tokens fast — signed-in only.
    return NextResponse.json({ error: 'Sign in to use voice building.', requireAuth: true }, { status: 401 })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Voice is not configured on this server.' }, { status: 503 })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: MODEL,
          instructions: INSTRUCTIONS,
          audio: {
            input: {
              transcription: { model: 'whisper-1' },
              turn_detection: { type: 'server_vad', threshold: 0.5, silence_duration_ms: 600 },
            },
            output: { voice: VOICE },
          },
          tools: [BUILD_SITE_TOOL],
          tool_choice: 'auto',
        },
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[realtime-token] OpenAI error', res.status, detail.slice(0, 300))
      return NextResponse.json({ error: 'Could not start a voice session. Try again.' }, { status: 502 })
    }

    const data = await res.json()
    // GA shape: { value: 'ek_...', expires_at, session: {...} }
    return NextResponse.json({ token: data.value, expiresAt: data.expires_at, model: MODEL })
  } catch (e: any) {
    console.error('[realtime-token] failed:', e?.message || e)
    return NextResponse.json({ error: 'Could not start a voice session. Try again.' }, { status: 502 })
  }
}
