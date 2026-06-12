# Webstew Roadmap

Living plan. Each item notes current code state, the fix/build, effort (S/M/L),
and any decisions needed. Sequence is at the bottom.

---

## ✅ Shipped recently
- Dead "stew is cooked" email link (`localhost:5001` → canonical public origin)
- Grader free limit 25 → 3/day + footer Support link
- Agent "write restriction" — files persist to the `files[]` array correctly
- Preview multi-page nav — `/services#plumbing` dropdown links now connect
- Chat auto-scroll on long threads (intent-pin + instant jump)
- Mobile drawer no longer auto-opens over the build-start canvas
- SEO clamps on dynamic pages (listings / profiles / showcase)

---

## Tier 1 — Daily-friction fixes (no decisions; start now)

### 1. Stop button → graceful Pause / steer / continue  ⭐
**State:** `page.tsx:stopAgent` is wired (aborts fetch + POSTs `/api/builder/cancel`)
but it's a hard kill — thread ends, work feels lost, user must restart.
**Build:** reframe as **Pause** — abort the in-flight turn, KEEP the partial work
(already persisted server-side + in `files[]`), keep the input live, and have the
next message re-dispatch the agent with full prior history + partial files + the
new instruction on the **same projectId**, so it continues the same path. Add a
"paused" chip on the last bubble.
**Effort:** M · `page.tsx`, `BuildChatPanel.tsx`

### 2. Bind the AI to the active preview project
**State:** agent turn sends `body.projectId`; can drift from the visible project
after interrupt / multi-page follow-up / project switch.
**Build:** dispatch reads the currently-active project id at send time (single
source of truth); block sends during a project switch; stamp each turn with the
project it's bound to. "Whatever is in the preview is the only thing the AI edits."
**Effort:** S–M · `page.tsx`

### 3. "+New" button (Files tab → saved projects)
**State:** `page.tsx:newProject` resets some state but NOT `pages`, `vfsFiles`,
`activePageId`, `chatMessages`, `previewHtml` — so the old site lingers and it
reads as "nothing happened." No blank project record created.
**Build:** full clean reset + create a blank persisted project so the agent has a
`projectId` to build into immediately.
**Effort:** S · `page.tsx`

---

## Tier 2 — Features (mostly no decisions)

### 7a. Persist & restore chat history + prompts  ⭐ (pairs with #1)
**State:** chat history is NOT persisted anywhere. Project schema has
`generationPrompts: []` / `generationHistory: []` (`projects/route.ts:99`) but they
are never populated. Reload loses everything.
**Build:** save `chatMessages` per project (populate `generationHistory`) and
restore on load; capture every prompt + its outcome into `generationPrompts`; add
a per-user **Saved Prompts** library (star / reuse / "run again").
**Effort:** M · `page.tsx`, `/api/projects/[id]`, new prompts-library UI + route

### 4. Import / upload existing projects
**State:** no import flow (`/api/upload` is media only).
**Build:**
- **4a. ZIP / folder upload** → unzip → map to `files[]` → create project → load.
  Start here (no auth needed). Guardrails: size/file-count caps, binary handling,
  static-vs-app target detection.
- **4b. GitHub import** → reuse existing GitHub OAuth (`/api/github/connect`,
  `/api/deploy/github`) → list repos → pull a branch → same import pipeline.
**Effort:** M + M · new `ProjectImport` UI, `/api/projects/import`, repo-list route

### 5. Mobile "workspace app, not website"
**State:** step 1 shipped (drawer no longer auto-opens). Manifest exists
(`manifest.ts`).
**Build:** fixed bottom action bar (Build · Preview · Pages · Chat); full-height
drawers with body-scroll locked; preview as the home surface + floating
"＋ Ask the chef"; PWA install prompt + standalone display.
**Effort:** M

### 8. Logo + favicon builder
**State:** image-gen infra exists (`/api/ai/generate-image`, `/api/ai/image`,
`/api/ai/dalle`, runpod, smart-image-service, Cloudinary). Favicon convention
exists (`apple-icon.tsx`). No logo/favicon generator.
**Build:** a dedicated **Logo Studio** — AI generates logo concepts (logo-tuned
prompts: brand, style, mark vs wordmark), outputs a transparent **PNG**, then
derives the full **favicon set** (16/32/180 + `.ico` + manifest icons + the HTML
`<link>` tags) and wires them into the active site (favicon, `og:image`, wordmark).
Needs transparent-bg generation or background removal.
**Effort:** M · new Logo Studio panel + `/api/ai/logo` + favicon-set generator

---

## Tier 3 — Big initiatives

### 7b. Prompt-improvement loop ("better and better")
**State:** the "Stew Planner" clarifying agent already exists
(`lib/types/stew-planner.ts`, `/api/builder/clarify`, `/api/builder/converse`,
`!isRichPrompt` trigger) — a one-shot prompt crafter, not a learning loop.
**Build (needs 7a's data):** pre-send coaching (Stew Planner proposes a sharper
prompt before spending a build); post-build 👍/👎 ties prompt → outcome; surface
the user's own highest-yield prompt patterns; design-quality nudges learned from
the designs they keep.
**Effort:** M–L

### 6. Community + marketplace + sell-for-crypto
**State (reviewed):** working credit + Stripe marketplace —
`marketplace/buy` (credits, atomic, entitlement), `marketplace/checkout` (Stripe
Connect + webhook), `marketplace/payout` (real `stripe.transfers.create`),
`marketplace/earnings`, `/seller`, `/community`, `/listings/[id]`,
`community_posts` (`isPremium`, `price_credits`), `marketplace_purchases`.
**Gaps:** no crypto; build→publish→sell funnel split across /library + /seller +
/community; "apps & more" not sellable; no listing reviews/curation.
**Build:**
- **Unify the funnel:** one clear **Build → Publish → Price → Sell** flow surfaced
  in-workspace and in `/community`.
- **Sell more than sites:** templates, full sites, app projects (Expo/backend),
  components.
- **Crypto payments** — three architectures:

  | Option | Custody / risk | Effort |
  |---|---|---|
  | **A. Coinbase Commerce (USDC, hosted)** ⭐ rec | non-custodial, lowest legal exposure | Low |
  | B. Wallet-connect + USDC on Base | possible MSB exposure if funds pooled | Med-High |
  | C. Smart-contract escrow / splitter | truly non-custodial, needs audit | High |

  **Recommendation:** Option A for MVP (USDC on Base) — slots into the existing
  checkout + earnings flow, you never hold a key.

**Decisions needed before crypto build:**
1. Buy-side only, or sellers **withdraw** in crypto too?
2. Chain + token — OK with **USDC on Base**?
3. Confirm **non-custodial** (stay out of money-transmitter territory)?

---

## Recommended sequence
1. **Tier 1:** Stop→Pause (1) → active-project binding (2) → +New (3)
2. **7a** persist chat/prompts (rides on #1's state work)
3. **Tier 2:** ZIP import (4a) → mobile app-feel (5) → Logo Studio (8) → GitHub import (4b)
4. **7b** prompt-improvement loop (needs 7a's data)
5. **Tier 3:** community + marketplace + crypto (6), once the 3 crypto questions are answered

Tier 1 + 7a need zero decisions — can run straight through.
