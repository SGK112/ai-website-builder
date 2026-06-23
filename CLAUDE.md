# CLAUDE.md — AI Website Builder (webstew)

Orientation for AI sessions working in this repo. Keep this current when you change how the builder works.

## What this is
**webstew** — an AI website/app builder. Monorepo, npm workspaces + Turbo.
- `apps/web` — the only real app: Next.js 14 (app router), ~180 API routes. Everything below lives here unless noted.
- `packages/` — `database` (Mongoose models), `ai-agents`, `shared`, `deploy-utils`, `bridge`, `agent-tools`.
- `template-build/`, `templates/` — static template apps (not deployed). `microweber/` — empty/vestigial.
- **Deploy:** push to `origin/main` → GitHub Actions → Render. A local commit does NOT ship until pushed. Behind Cloudflare (≈100s request limit → 524 on a silent origin; stream long work).

## The builder generation pipeline (the heart)
`apps/web/src/app/api/builder/generate/route.ts` (~3.3k lines) — streamed website/app generation.

Flow: optional Stew Planner interview (`api/builder/clarify` — asks "what should it do?", produces an assembled prompt) → `pickBestModel()` routing → layered system prompt → streamed SSE → continuation passes → image handling → Owl validation → credit metering → `complete` event with the final HTML.

- **Model routing** (`pickBestModel`): vision/filter-prone → Grok 4.3; complex/heavy fresh build (store/app/dashboard) → Opus 4.8; simple fresh build → Sonnet 4.6; quick edits → Haiku 4.5. (Fresh builds are NOT Haiku — that traded away quality.)
- **Output cap:** 64K for Claude (Haiku/Sonnet) — the model ceiling, streamed so no HTTP timeout. Do not lower it (truncation).
- **Continuation:** the Claude loop continues when `stop_reason==='max_tokens'` **OR the HTML is structurally incomplete** (no `</body></html>`) — a dropped stream truncates under the cap. The Grok branch checks `finish_reason` and flags `truncated` too. The `complete` SSE event carries the post-processed `finalHtml` (markers replaced, fences stripped, owl-repaired); the client replaces streamed deltas with it.
- **On-demand prompt recipes** (appended only on intent, never bloating the base prompt): `lib/voice-build-recipe.ts` (voice in the build), `lib/mobile-app-recipe.ts` (PWA app-shell). Mirror this pattern for new capabilities.
- **Owl validator:** `lib/html-validator.ts` + `api/builder/owl-fix` (repairs broken HTML; aborts at 85s to dodge Cloudflare 524).
- **Edits** go through `api/builder/agent` (not generate). It also gets the voice/mobile recipes on intent.

## Build targets
- **website** — single-file HTML, rendered in a sandboxed srcDoc iframe; published at `webstew.net/s/<slug>`.
- **mobile app = PWA** — an installable web app generated through the WEBSITE pipeline (NOT Expo). `buildTarget: 'website'`; the mobile-app recipe adds an app shell (top bar + bottom tab nav, in-page tab switching, PWA manifest/meta). Phone preview = open the URL + Add to Home Screen. **Expo/React-Native is opt-in only** (explicit "react native"/"expo"/"native app") and runs in WebContainer with an Expo Snack QR.
- **react / nextjs / astro** — multi-file apps, run in WebContainer (browser-only preview), generated via `api/builder/{react,nextjs,astro}`.

## Images
Builder uses **stock photos**, not AI generation: `fetchStockImagesForPrompt` (Pixabay/Pexels markers) + `/api/media` (Pexels proxy, 302). Prefer Pixabay **`webformatURL`** (hotlink-safe) — `largeImageURL` is a download URL Pixabay 403s on (broken images). The AI-image routes (`api/ai/image` Replicate, `api/ai/dalle`, etc. — the "Video Studio") exist but the builder doesn't call them yet.

## Voice
- **`/api/ai/voice`** (`lib/voice.ts`): TTS + STT, providers OpenAI (`tts-1`/`whisper-1`) and Deepgram (Aura/Nova). The shared voice layer.
- **Talk to the builder** ("the chef"): `app/workspace/hooks/useVoiceChat.ts` + `components/VoiceControls.tsx` — mic in chat → STT → send; speaker toggle reads replies; voice picker. We did NOT port Aria — Aria is welded to VoiceNow; the build agent already exists, it just needed a voice.
- **Voice IN builds**: generated apps use the browser-native Web Speech API (no keys, works on the published site).

## Phone preview
`components/PhonePreview.tsx` — a "📱 Phone" button in the preview toolbar. Website/PWA → fresh `/api/preview` snapshot + camera-scan QR (re-mints each open). The shared preview page injects a localStorage shim (the sandbox has no `allow-same-origin`, so unshimmed sites crash).

## Auth / data / billing — IMPORTANT cross-product facts
- **Shared MongoDB with VoiceNow.** The default DB (`voiceflow-crm`) holds Users/Projects/Credits and is **shared with the VoiceNow CRM**, separated by an `app:'webstew'` tenant marker. A second DB `ai-website-builder` holds templates/marketplace/community. Touching user/project collections affects both products.
- **Shared Stripe account (Remodely LLC) with VoiceNow.** One account, on purpose. Both apps' webhooks receive every event. Each app stamps `metadata.app` and ignores the other's events (webstew also guards by its own price IDs). Don't split the account; don't weaken the isolation.
- **Anon funnel:** anyone can CREATE freely (~100 credits' worth, cookie-bounded). Publish/deploy/save/export require sign-up (server 401 + client signup-nudge). Keep that shape.
- Plans free/starter/pro/scale/enterprise; credits on `User.credits`; metering via `lib/credits.ts` (atomic, refundable).

## Conventions & gotchas
- **Keep `app/workspace/page.tsx` modular.** It's ~14k lines and the owner's linter ("OWL HAS CONCERNS · page.tsx") flags new logic added to it. New logic → hooks (`app/workspace/hooks/`) or components (`app/workspace/components/`); page.tsx gets only thin glue.
- **webstew only in this repo.** Don't edit/commit the `voiceNow-crm` repo from here (it's a separate prod app worked on elsewhere). Reading it for context is fine.
- **No secrets in committed docs.** Prod env lives in Render (a "Webstew ENV" env group). Don't hardcode keys or paste connection strings into the repo.
- End git commit messages with the Co-Authored-By trailer.

## Recent changes (2026-06, this line of work)
Builder reliability + voice + mobile, all shipped to `main`:
- Truncation/"half-baked": 64K cap, continue-on-incomplete, Grok `truncated` flag.
- Images: Pixabay hotlink fix (`webformatURL`).
- "View on phone": preview-page storage shim + the Phone-preview button.
- Voice: `/api/ai/voice`, the chef voice (mic + picker), Web-Speech voice in builds.
- **Mobile target → installable PWA** (was Expo/Snack).
- Stripe: shared-account isolation (metadata.app guard, both repos).
- Anon funnel: create-free, sign-up-to-use; export gated.
- Chat UI: stacked/grid input with inline send.

## Still open / next
- Files-tab resilience: the projects list strips `files.content` and there's no explicit `html` field — saved sites depend on a follow-up fetch (blank on failure). Adding a stored `html` field would make them render reliably. (Deferred.)
- Wiring AI image generation (Replicate/Grok from the Video Studio) into the builder.
