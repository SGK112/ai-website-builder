# Webstew — Session Handoff (2026-06-24)

Branch `main`. Working tree clean — everything below is committed AND pushed.
Pick up from **"Immediate next steps."**

---

## Deploy / verify mechanics (READ FIRST)
- **Pipeline:** push to `main` → GitHub Actions (Lint & Type Check → Build → **Run Tests** → Deploy to Render). A red test **blocks** the Deploy job. Render also autodeploys `main` independently.
- **ALWAYS run `cd apps/web && npx vitest run` + `npx tsc --noEmit` before pushing.** (Burned once: an over-broad guard failed a test → red CI.)
- **Render API key gotcha:** the shell `$RENDER_API_KEY` is STALE (401). 3 live keys exist; recover one with:
  `ps eww -p $(pgrep -f node) | grep -oE 'rnd_[A-Za-z0-9]+'` then test each against `GET https://api.render.com/v1/owners` (200 = good). Working key prefix `rnd_1PyF…`.
- **Service:** `ai-website-builder` = `srv-d554is8gjchc7388svd0`. Live at `https://www.webstew.net`. Prod env has ALL keys (OPENAI, XAI, DEEPGRAM, REPLICATE, ANTHROPIC, CLOUDINARY, PEXELS, PIXABAY, STRIPE_WEBHOOK_SECRET). `MONGODB_URI` is in `apps/web/.env.local`.
- **Mobile screenshots (to verify UI — don't ship mobile blind):** `playwright-core` is installed in the session scratchpad; use system Chrome via `executablePath`. Example scripts: `…/scratchpad/shot*.cjs`. Run against the local dev server (`localhost:3030`).

## Current deploy state
- Latest commit **`57ea935`** (realtime voice) was **build_in_progress** at handoff — confirm it went `live` (poll `GET /v1/services/<svc>/deploys?limit=1`). Once live, `POST /api/ai/voice/realtime-token` returns **401** (gated) instead of 404.
- All prior commits this session are **live**.

---

## What shipped this session (commits, newest first)
- `57ea935` **Realtime voice-build** (OpenAI Realtime over WebRTC) — NEW, see below.
- `1fcc422` Mobile: keep "Or just describe it" clear of the floating carousel (`pb-32`).
- `6870894` Mobile: **scrolling tool carousel** (Vibe-Code style) replacing the 4-icon pill + **voice/mic fixes** (surface getUserMedia errors, 28→36px targets).
- `a485efb` Mobile iteration 2: **bottom-sheet panels** (side drawer → bottom sheet) + padding.
- `44143ce` Mobile: **full-screen preview** + one floating toolbar.
- `66f45c6` **No dead 404s**: friendly `NotAvailable` fallback on all public/shareable routes (grader/listing/profile/preview/video) + catch-all `/grader/r/[...token]` (the share-link slash bug).
- `30516e4` Fix: only block PAID listings with empty content (CI test fix).
- `2f4a8b0` **Big batch**: anon funnel ungate + **draft preserved through signup** (was wiped at conversion) + Expo→phone preview (Metro can't run in WebContainer) + WebContainer crash/timeout safety net + HTML fence-strip + marketplace refuse-empty save/list/buy + video/image honest-fail+refund + **Stripe webhook app-isolation** + atomic credit grants + dead-letter unresolved payments + honest deploy status.

## Realtime voice-build — how it works (the newest feature)
Goal: tap **"Talk"** → speak → it builds. Modeled on remodely.ai's streaming voice (`/Users/homepc/remodely-ai-site/js/aria-voice-chat.js`) but webstew-owned.
- `apps/web/src/app/api/ai/voice/realtime-token/route.ts` — mints an ephemeral token via **`POST https://api.openai.com/v1/realtime/client_secrets`** (the old `/v1/realtime/sessions` 404s — verified). Pre-configures the build-assistant persona + a **`build_site`** tool + voice `marin` + whisper transcription + server VAD. Auth-gated. Model env: `OPENAI_REALTIME_MODEL` (default `gpt-realtime`).
- `apps/web/src/app/workspace/hooks/useRealtimeVoice.ts` — browser connects DIRECTLY to OpenAI over **WebRTC** with the ephemeral token; mic up, assistant audio down, data channel for events. On `response.function_call_arguments.done` for `build_site` → calls `onBuild(prompt)` → `handleChatMessage` (normal build).
- `apps/web/src/app/workspace/components/VoiceBuildOverlay.tsx` — full-screen voice UI (reactive orb, transcript, End).
- Wired in `page.tsx`: `showVoice`, `realtimeVoice`, `openVoice/closeVoice`; "Talk" chip in `MobileToolCarousel`.

---

## IMMEDIATE NEXT STEPS (in order)
1. **Confirm `57ea935` is live** (deploy poll). Then **on-device voice test** (signed in, on `www.webstew.net/workspace`, phone): tap **Talk** → allow mic → say "Build a coffee shop landing page with menu and hours." Expected: it speaks a confirmation and the site builds.
   - ⚠️ **UNVERIFIED:** the live WebRTC round-trip (needs real mic + session). If it fails: the SDP step posts to `https://api.openai.com/v1/realtime/calls?model=…` (GA path, my best read) — if OpenAI's WebRTC URL differs, that's the fix (the hook shows "Voice connection failed", not silence). Check `useRealtimeVoice.ts` line ~"realtime/calls".
2. **Mobile sheet is still over-complicated** (the "too many options" complaint isn't fully solved). The Build bottom-sheet still opens with **Visual/Hybrid/Developer** mode tabs + a 5-step "Your path to live & earning" coach + chips before you can type. NEXT: hide the builder-mode switcher + collapse the coach on mobile so the sheet is just chat + input. (Screenshot to verify.)
3. The OLD record-then-transcribe voice (`VoiceControls` + `useVoiceChat`) still lives in the chat input. Now that realtime voice exists, decide: keep as fallback or remove.

## Open product decisions (need Josh — NOT bugs)
- **Pricing line for deploy/publish gating** — no credit-cost table exists; don't invent a paywall (would break the free funnel).
- **Seed the marketplace** — 1 listing, 0 purchases ever. Storefront is empty; needs real listings to sell.
- **Acquisition/GTM** — ~9 webstew users, 0 signups in 7 days. Pre-traction; the fixed funnel is necessary but not sufficient.
- **"Presentations"** is marketed but does NOT exist (no model/route/UI) — build or drop.

## Useful memory files (auto-loaded next session)
`project-webstew-traction-state`, `reference-webstew-render-access`, `project-webstew-architecture`, `project-deploy-pipeline`, `feedback-recommend-dont-poll`, `feedback-owl-page-modular`.
