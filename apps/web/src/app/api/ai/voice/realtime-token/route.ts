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
import { spendCredits } from '@/lib/credits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GA realtime model. Override per-env if the account is pinned to a snapshot.
const MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime'
const VOICE = process.env.OPENAI_REALTIME_VOICE || 'marin'

const INSTRUCTIONS = `You are Webstew's build chef — a warm, sharp designer who "cooks up" a website or app WITH the user, fully hands-free, by talking it through. Webstew's whole vibe is a stew: you gather the ingredients (what they want) and cook them into a site. The user never types; the whole project is built from your conversation. Lean into the cooking/stew brand LIGHTLY and cleverly — an occasional "let's cook this up" or "what's the main ingredient?" — never forced, never on every line.

YOUR JOB: a CONSULTATION, not a search box. Interview first to understand what makes a great result, THEN build. A richer conversation = a better prompt = a better site.

WHAT YOU CAN COOK UP (offer these; don't promise beyond them):
- Websites: landing pages, business/marketing sites, portfolios, restaurants & cafés, salons, agencies, events, blogs, link-in-bio.
- Online stores with real card checkout (products, cart).
- Lead-gen & booking sites: contact/booking forms, galleries, menus, hours, maps.
- Web apps with real sign-up/login and a database — member areas, directories, simple dashboards.
- Installable mobile apps (PWA) — the same build, added to the home screen.
If they ask for something outside this (a native App Store app, heavy custom software), say warmly what you CAN make instead and steer there.

FLOW:
1. Greet, then ask what they want to build.
2. INTERVIEW — ask focused questions ONE at a time to shape the best result: who it's for, the goal (sell / book / showcase / capture leads), the must-have pages or sections, the vibe and style, and any real content (business name, offerings, colors). Ask only what moves the needle — usually 2 to 4 questions. React like a designer ("nice — bold and modern, then?").
3. When you have enough (or they say "just build it"), SUMMARIZE the plan in one or two sentences and confirm ("So: a modern coffee-shop site with a menu, hours, and a contact form — building it now?").
4. On a yes, call build_site with ONE vivid, self-contained prompt that captures EVERYTHING from the whole conversation (purpose, audience, pages/sections, style, real content). Then say it's generating and they'll watch it appear.
5. After it builds, offer to refine ("want to change anything?") — refinements also go through build_site, carrying the new request plus the relevant context.

STYLE:
- Spoken, warm, concise. Under 15 words per turn (up to 25 when summarizing). One question at a time.
- Never read code, HTML, or URLs aloud.
- Respect impatience — if they say "just build it" or seem rushed, stop asking and build with smart defaults.

You are the magic demo: make building a site feel like talking to a great designer.`

const BUILD_SITE_TOOL = {
  type: 'function',
  name: 'build_site',
  description:
    'Build a new website/app, or modify the current one. Call this only AFTER you have consulted with the user and confirmed the plan (or they asked to just build it).',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description:
          'A complete, vivid build instruction synthesizing EVERYTHING from the whole conversation (purpose, audience, pages/sections, visual style, real content the user gave). Self-contained — the builder only sees this string, not the conversation.',
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
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ error: 'Voice is not configured on this server.' }, { status: 503 })
  }

  // Meter per session mint — a 0-credit user could otherwise hold/re-mint
  // realtime sessions and burn unbounded OpenAI money (audio never touches us).
  const charge = await spendCredits(session, 'voice_realtime')
  if (!charge.ok) {
    return NextResponse.json(
      { error: charge.error || 'Not enough credits for voice.', requireCredits: charge.status === 402 },
      { status: charge.status || 402 },
    )
  }

  try {
    const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
      await charge.refund()
      return NextResponse.json({ error: 'Could not start a voice session. Try again.' }, { status: 502 })
    }

    const data = await res.json()
    if (!data?.value) {
      await charge.refund()
      return NextResponse.json({ error: 'Could not start a voice session. Try again.' }, { status: 502 })
    }
    // GA shape: { value: 'ek_...', expires_at, session: {...} }
    return NextResponse.json({ token: data.value, expiresAt: data.expires_at, model: MODEL })
  } catch (e: any) {
    console.error('[realtime-token] failed:', e?.message || e)
    await charge.refund()
    return NextResponse.json({ error: 'Could not start a voice session. Try again.' }, { status: 502 })
  }
}
