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
// Input transcription (display only — the model hears audio directly). 4o-mini
// hallucinates far less than whisper-1 on silence/noise. Override per-env.
const TRANSCRIBE_MODEL = process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe'

// How hard it is for a sound to count as "the user talking". 0.8 ignores
// normal room chatter, a TV, someone else in the shop; the user's own voice
// into their phone still clears it easily. Tunable live (no deploy) so it can
// be dialled against a real room — clamped because <0.5 hears everything and
// >0.95 misses soft speakers. Trailing silence is how long a pause has to run
// before the turn is closed; too short and one sentence gets chopped into
// three turns, each of which the chef tries to answer.
const vadThreshold = (() => {
  const raw = parseFloat(process.env.REALTIME_VAD_THRESHOLD || '0.8')
  return Number.isFinite(raw) ? Math.min(0.95, Math.max(0.5, raw)) : 0.8
})()
const vadSilenceMs = (() => {
  const raw = parseInt(process.env.REALTIME_VAD_SILENCE_MS || '1100', 10)
  return Number.isFinite(raw) ? Math.min(2500, Math.max(500, raw)) : 1100
})()

const INSTRUCTIONS = `You are Webstew's build chef — a warm, sharp designer who "cooks up" a website or app WITH the user, fully hands-free, by talking it through. Webstew's whole vibe is a stew: you gather the ingredients (what they want) and cook them into a site. The user never types; the whole project is built from your conversation. Lean into the cooking/stew brand LIGHTLY and cleverly — an occasional "let's cook this up" or "what's the main ingredient?" — never forced, never on every line.

YOUR JOB: a CONSULTATION, not a search box. Interview first to understand what makes a great result, THEN build. A richer conversation = a better prompt = a better site.

WHAT YOU CAN COOK UP (offer these; don't promise beyond them):
- Websites: landing pages, business/marketing sites, portfolios, restaurants & cafés, salons, agencies, events, blogs, link-in-bio.
- Online stores with real card checkout (products, cart).
- Lead-gen & booking sites: contact/booking forms, galleries, menus, hours, maps.
- Web apps with real sign-up/login and a database — member areas, directories, simple dashboards.
- Installable mobile apps (PWA) — the same build, added to the home screen.
- Short AI video clips (up to ~8s) — a promo, a hero background, a social teaser — via make_video.
- Logos, icons & images you CREATE standalone — a real generated PNG logo / brand mark / app icon / illustration — via make_logo. Just say "make me a logo for my coffee shop". (You can ALSO add photos or a logo directly onto an existing site via an edit.) NEVER tell the user you can't make a logo or image — you can.
If they ask for something outside this (a native App Store app, heavy custom software), say warmly what you CAN make instead and steer there.

FLOW:
1. Greet, then ask what they want to build.
2. INTERVIEW — ask focused questions ONE at a time to shape the best result: who it's for, the goal (sell / book / showcase / capture leads), the must-have pages or sections, the vibe and style, and any real content (business name, offerings, colors). Ask only what moves the needle — usually 2 to 4 questions. React like a designer ("nice — bold and modern, then?").
3. When you have enough (or they say "just build it"), SUMMARIZE the plan in one or two sentences and confirm ("So: a modern coffee-shop site with a menu, hours, and a contact form — building it now?").
4. On a yes, call build_site with ONE vivid, self-contained prompt built from THE PLAN YOU JUST CONFIRMED — purpose, audience, pages/sections, style, real content. Include only what the user actually asked for. Do NOT sweep in stray fragments: a half-sentence you couldn't place, something said to another person in the room, a TV or a passing remark. If a detail never came up in your interview and they never confirmed it, it does not belong in the build. When in doubt, leave it out and ask. Also pass a short title for their file list — use the business/brand name if you have it, otherwise a 2-4 word summary (never "Untitled"). If you don't have a name and it's not obvious, ask "what should I call this project?" in your confirm step. Then say it's generating and they'll watch it appear.
5. After it builds, offer to refine ("want to change anything?"). EVERY change to the existing site goes through the edit_site tool with JUST the change ("make the header navy", "add a contact form", "remove the pricing"). NEVER re-describe the whole site for an edit, and never call build_site again unless they explicitly want a brand-new, different site.

BUILD vs EDIT — this matters:
- No site yet, or they clearly want a fresh/different one → build_site (full prompt).
- A site is already on screen and they want a tweak → edit_site (only the change). When in doubt on an existing project, it's an edit.

PUBLISHING: to take it live, use edit_site with the change "publish the site"; quote the live link it returns. Once a site is live, any later edit updates that SAME link automatically — never tell the user to re-publish a tweak; just make the edit and it syncs.

SELLING: when the user wants to sell the site ("sell this", "list it for $X"), call list_for_sale with the price in DOLLARS. Confirm the price first if unclear. Max $500. After listing, tell them it goes live after a quick review, and that to actually get paid they need to finish Stripe payout setup in their profile. Don't promise instant payouts.

STATUS — you CANNOT see the screen:
- A build/edit runs in the background and takes a bit. You'll be told automatically when it finishes — then tell the user it's ready.
- NEVER guess "it's done" or "still cooking" from memory. If the user asks about progress (or you're unsure), call check_status and answer from what it returns.

STYLE:
- ALWAYS speak and write in ENGLISH. Never switch languages, even if a word is unclear — never output Chinese or any non-English text.
- If you hear silence, background noise, an echo of your own voice, or anything you can't clearly make out as the user speaking, STAY SILENT and wait. NEVER respond to non-speech, and NEVER say "bye", "goodbye", "thank you", "you're welcome", or any sign-off on your own. Only the user ends the conversation — keep going until they clearly say they're done.
- ASSUME A NOISY ROOM. People build from a phone with a TV on, in a shop, with other people talking nearby. Anything you pick up that isn't the user talking TO YOU is not part of the project: side conversation, someone answering a phone, a kid, a radio, an order being taken. Silently discard it. Never repeat it back, never treat it as an answer to your question, and never let it reach a build_site or edit_site prompt. If a stray line WOULD have changed the build, ask before acting on it — "did you want that in the site?" — rather than assuming.
- Spoken, warm, concise. Under 15 words per turn (up to 25 when summarizing). One question at a time.
- Never read code, HTML, or URLs aloud.
- Respect impatience — if they say "just build it" or seem rushed, stop asking and build with smart defaults.

You are the magic demo: make building a site feel like talking to a great designer.`

const BUILD_SITE_TOOL = {
  type: 'function',
  name: 'build_site',
  description:
    'Build a NEW website/app from scratch. Call this only AFTER you have consulted with the user and confirmed the plan (or they asked to just build it). Do NOT use this for changes to a site that already exists — use edit_site for that.',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description:
          'A complete, vivid build instruction synthesizing EVERYTHING from the whole conversation (purpose, audience, pages/sections, visual style, real content the user gave). Self-contained — the builder only sees this string, not the conversation.',
      },
      title: {
        type: 'string',
        description:
          "A short, human project name for the user's file list — ideally the business/brand name from the conversation (e.g. \"Maria's Coffee House\"), else a 2-4 word summary (\"Coffee Shop Site\"). NEVER \"Untitled\". Under ~40 chars.",
      },
    },
    required: ['prompt', 'title'],
  },
}

const EDIT_SITE_TOOL = {
  type: 'function',
  name: 'edit_site',
  description:
    'Change the site that already exists (the one you just built or the user is looking at). Use this for EVERY tweak, addition, removal, or restyle once a site is on screen — never re-describe the whole site for an edit.',
  parameters: {
    type: 'object',
    properties: {
      change: {
        type: 'string',
        description:
          'ONLY the specific change to make, phrased like a short instruction — e.g. "make the header navy", "add a contact form below the menu", "remove the pricing section", "use a bolder font for the headline". Do NOT restate the whole site.',
      },
    },
    required: ['change'],
  },
}

const CHECK_STATUS_TOOL = {
  type: 'function',
  name: 'check_status',
  description:
    "Check whether the current build/edit is still running or finished. You CANNOT see the screen — call this whenever the user asks if it's done/ready, or before you say anything about progress. Never guess the status.",
  parameters: { type: 'object', properties: {} },
}

const MAKE_VIDEO_TOOL = {
  type: 'function',
  name: 'make_video',
  description:
    'Generate a SHORT (up to ~8 second) AI video clip from a description — e.g. a promo clip, a hero background, a social teaser. Use when the user asks for a video, clip, animation, or "make a video of…". It generates in ~30 seconds and appears on screen. Not for editing the website — for a video the user wants to create.',
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description:
          'A vivid, self-contained description of the video to generate — the subject, action, setting, and mood. e.g. "a steaming bowl of stew on a rustic wooden table, warm candlelight, slow zoom".',
      },
    },
    required: ['description'],
  },
}

const MAKE_LOGO_TOOL = {
  type: 'function',
  name: 'make_logo',
  description:
    'Create a logo, icon, or image from a description (a real generated PNG image, e.g. a brand mark, app icon, or illustration). Use when the user says "make/create a logo", "design an icon", "make me an image of…". It generates in a few seconds and appears on screen, saved to their creations. This CREATES a standalone image — different from adding an existing image to a site.',
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description:
          'A vivid description of the logo/image — subject, style (flat/vector/3d/minimal), colors, and "transparent background" for a logo or icon. e.g. "a minimal flat logo icon of a coffee bean, warm brown, transparent background".',
      },
    },
    required: ['description'],
  },
}

const LIST_FOR_SALE_TOOL = {
  type: 'function',
  name: 'list_for_sale',
  description:
    'List the CURRENT site for sale in the Webstew community marketplace. Use when the user says "sell this", "put it up for sale", "list it for $X". There must already be a built site on screen.',
  parameters: {
    type: 'object',
    properties: {
      priceUsd: {
        type: 'number',
        description: 'Sale price in US DOLLARS (e.g. 200 means $200). Whole dollars. Max 500. Use 0 for a free listing.',
      },
      description: {
        type: 'string',
        description: 'A short one-sentence pitch for the listing — what it is and who it’s for. Derive it from the conversation.',
      },
    },
    required: ['priceUsd'],
  },
}

// ── Video Studio "chef" mode (same realtime voice, different job) ────────────
const VIDEO_INSTRUCTIONS = `You are the CHEF of Webstew's Video Studio — a warm, sharp video director who makes videos WITH the user, hands-free, by talking it through. Webstew's vibe is a stew: you gather the ingredients (their footage + what they want) and cook them into a video. Lean into the cooking touch LIGHTLY — never forced.

YOUR JOB: a CONVERSATION, not a command line. Collaborate like a great creative director — understand what they want FIRST, then do it. A richer conversation = a better video.

WHAT YOU CAN DO (offer these; don't promise beyond them):
- generate_clips: create 1–4 new AI video shots from vivid descriptions (subject + setting + one motion + camera move + look). Use when they need footage that doesn't exist yet.
- assemble_cut: take their timeline + a one-line brief and build the whole cut — sequence, B-roll, voiceover, music, a color look, and any on-screen text/contact info. Use when they have clips and you've agreed on a direction.
- render_film: produce the final file when the cut is staged and they say render/export/finish/done.

FLOW:
1. Greet warmly, ask what they're making.
2. When they're exploring ("what can we do with these?", "how would you set this up?"), react like a director — suggest an order, vibe, pacing, and what text/contact info to add. Ask ONE focused question at a time (length? mood? for social or an ad?). Usually 1–2 questions is plenty.
3. When you have a clear picture (or they say "just make it"), confirm the plan in one sentence, THEN call the tool.
4. After it runs, offer to tweak.
Prefer a short, warm exchange over ramming straight to a tool — but respect impatience: if they say "just do it", stop asking and act.

STYLE — READ CAREFULLY:
- ALWAYS speak and write in ENGLISH. Never switch languages.
- If you hear SILENCE, background noise, music, an echo of your OWN voice, or anything you can't clearly make out as the user speaking to you, STAY SILENT and wait. NEVER respond to non-speech. NEVER say "bye", "goodbye", "thanks", "you're welcome", or any sign-off on your own — ONLY the user ends the conversation. Do not fill pauses.
- Spoken, warm, concise — under 15 words per turn (up to 25 when summarizing). One question at a time. Never read code or URLs aloud.
- When you DO start a tool, say what you're doing in one short line ("on it — cooking up three shots…").`

const GENERATE_CLIPS_TOOL = {
  type: 'function', name: 'generate_clips',
  description: 'Generate 1–4 new AI video shots and add them to the timeline. Use when the user needs footage that does not exist yet.',
  parameters: { type: 'object', properties: {
    shots: { type: 'array', items: { type: 'string' }, description: '1–4 vivid shot prompts (subject + setting + motion + camera move + look), consistent style.' },
  }, required: ['shots'] },
}
const ASSEMBLE_CUT_TOOL = {
  type: 'function', name: 'assemble_cut',
  description: 'Assemble the whole cut from the clips already on the timeline: sequence, B-roll, voiceover, music, look, and any on-screen text. Use when they have clips and are ready.',
  parameters: { type: 'object', properties: {
    order: { type: 'string', description: 'One-line brief capturing the vibe, length, and any contact info/text to display (e.g. "A punchy 20s upbeat ad with our phone number on screen").' },
  }, required: ['order'] },
}
const RENDER_FILM_TOOL = {
  type: 'function', name: 'render_film',
  description: 'Render the final video file. Use when the cut is staged and the user wants the finished export.',
  parameters: { type: 'object', properties: {} },
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    // Realtime voice burns paid tokens fast — signed-in only.
    return NextResponse.json({ error: 'Sign in to use voice building.', requireAuth: true }, { status: 401 })
  }
  // Optional mode — 'video' swaps in the Video Studio chef; anything else (incl.
  // no body, the workspace call) is the unchanged website-builder chef.
  const mode = await request.json().then((b: any) => b?.mode).catch(() => undefined)
  const isVideo = mode === 'video'
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
          instructions: isVideo ? VIDEO_INSTRUCTIONS : INSTRUCTIONS,
          audio: {
            input: {
              // gpt-4o-mini-transcribe, NOT whisper-1: whisper hallucinates whole
              // paragraphs of garbage on silence/room-noise (it polluted the
              // on-screen transcript — the realtime model itself hears the audio
              // directly and ignored it, but the text thread filled with junk).
              // The 4o transcribers barely hallucinate on non-speech.
              transcription: { model: TRANSCRIBE_MODEL, language: 'en' },
              // Less trigger-happy VAD: a higher threshold + longer trailing
              // silence stops the model's own greeting echo / room noise / breath
              // from being detected as "speech" — which was interrupting the
              // intro and making her emit filler hallucinations ("bye", "thanks").
              //
              // The builder used to sit at 0.65/800 while video ran 0.78/1100
              // "because the Studio is used in noisier settings". That premise
              // was wrong: people build on a phone, in a shop, with a TV on and
              // other people talking. Reported symptom was room chatter getting
              // picked up and ending up IN the build. Both modes now run the
              // strict profile, and both are env-tunable so the threshold can be
              // dialled by ear against a real room without a deploy.
              turn_detection: {
                type: 'server_vad',
                threshold: vadThreshold,
                // Keep the leading padding short — a long prefix drags the tail
                // of whatever was happening before you spoke into the turn.
                prefix_padding_ms: 200,
                silence_duration_ms: vadSilenceMs,
                // DON'T let detected audio kill a reply in progress. server_vad
                // barges in by default: any sound crossing the threshold while
                // she's talking cancels the response, which is why she "doesn't
                // finish her sentence and it just drops" mid-conversation. In a
                // quiet room that's good UX; in a shop with a TV on, the thing
                // interrupting her is never the user. Her turns are capped at
                // ~15 words by the instructions, so waiting for her to land the
                // sentence costs a beat and buys a conversation that holds
                // together. The user's audio is still captured and still gets a
                // turn — create_response stays on — it just doesn't truncate
                // her mid-word.
                interrupt_response: false,
                create_response: true,
              },
            },
            output: { voice: VOICE },
          },
          tools: isVideo
            ? [GENERATE_CLIPS_TOOL, ASSEMBLE_CUT_TOOL, RENDER_FILM_TOOL]
            : [BUILD_SITE_TOOL, EDIT_SITE_TOOL, CHECK_STATUS_TOOL, MAKE_VIDEO_TOOL, MAKE_LOGO_TOOL, LIST_FOR_SALE_TOOL],
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
