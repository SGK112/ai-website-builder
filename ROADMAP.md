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
- **IP / code protection (REQUIRED — sellers must control their work):**
  - **The only real protection is not shipping the source.** Anything rendered
    in a browser (live `srcDoc`, network tab, view-source, devtools) is
    copyable. Client-side "disable right-click / block devtools" is theater —
    we will not rely on it.
  - **Protected preview:** for any for-sale listing the public preview is a
    server-generated **screenshot / scroll-video** OR a **watermarked, sandboxed
    live demo** rendered on an isolated service — never the raw HTML. CURRENT
    LEAK to fix: `/listings/[id]` renders full `l.html` in an iframe `srcDoc`
    for free listings (premium already withholds html server-side).
  - **Entitlement-gated delivery:** real files/export are delivered only to a
    verified buyer (on-chain purchase → `marketplace_purchases`).
  - **Per-buyer fingerprint:** embed a hidden watermark in delivered code so a
    leaked copy is traceable to the buyer.
  - **Seller control:** pricing, public/unlisted, takedown, license terms,
    report-stolen-content / DMCA flow.
  - **License + provenance:** every sale records buyer + license terms on record
    (and the on-chain tx is itself proof of purchase).
- **Crypto payments — DECIDED: non-custodial wallet-to-wallet via an on-chain
  payment splitter. USDC on Base.**
  - Users connect their OWN wallet (Coinbase Wallet / MetaMask / WalletConnect)
    to both buy and sell. Webstew never holds funds or keys (non-custodial →
    stays out of money-transmitter territory).
  - A **payment-splitter contract** settles each sale in one tx: seller gets
    their share, Webstew treasury gets the platform fee — enforced on-chain, so
    "we get our cut" is guaranteed without custody.
  - Prefer an **audited splitter primitive (e.g. 0xSplits)** over custom Solidity
    to avoid a new audit.
  - Contract emits a purchase event → backend verifies the tx → unlocks the item
    via the existing `marketplace_purchases` entitlement.
  - Stack: wagmi + viem + WalletConnect; native USDC on Base.

  **Specs still to lock:**
  1. Platform fee % (default 10%)
  2. Instant settle (recommended for digital goods) vs escrow-with-confirm
  3. Audited splitter (0xSplits) vs custom contract — recommend audited
  4. Treasury wallet address for the platform cut

  **Custodial fallback if ever needed:** Coinbase Commerce hosted USDC checkout
  (lower effort, but loses the connect-your-own-wallet UX) — not the chosen path.

---

## Recommended sequence
1. **Tier 1:** Stop→Pause (1) → active-project binding (2) → +New (3)
2. **7a** persist chat/prompts (rides on #1's state work)
3. **Tier 2:** ZIP import (4a) → mobile app-feel (5) → Logo Studio (8) → GitHub import (4b)
4. **7b** prompt-improvement loop (needs 7a's data)
5. **Tier 3:** community + marketplace + crypto (6), once the 3 crypto questions are answered

Tier 1 + 7a need zero decisions — can run straight through.
