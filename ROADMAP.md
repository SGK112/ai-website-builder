# Webstew Roadmap

Living plan. Each item notes current code state, the build/fix, effort (S/M/L),
the journey stage it serves, and any decisions needed. Sequence is at the bottom.

---

## ⭐ North Star — Easy as 1‑2‑3 (mobile-first)

The whole product is ONE obvious linear path. No dead ends, one primary action
per screen, and an always-visible "where am I / what's next" spine. This is the
lens every item below is scoped through — **especially on mobile**, where the
journey must feel like a guided app, not a website you scroll.

**1) BUILD** — Start (prompt / template / import) → chat with AI → iterate
**2) SHIP** — Preview → connect pages → logo + favicon → deploy → custom domain
**3) SELL** — Publish to marketplace → set price → sell for crypto (non-custodial)

(Aligns with the existing learning path `build → live → domain → share → sell`,
shipped in f3db7e8. 1‑2‑3 = Build / Ship / Sell.)

### 9. The 1‑2‑3 journey spine  (NEW — threads through everything)
**State:** `WhatsNextCoach` is live but advisory; there's no persistent, mobile-
first progress spine. Surfaces (build / preview / pages / deploy / sell) feel
separate, not like steps of one flow.
**Build:**
- A persistent **Build → Ship → Sell stepper** that's always visible (top on
  desktop, fixed bottom bar on mobile) showing the current stage + the single
  next action.
- Each stage has ONE clear primary CTA; completing it advances the spine.
- **Mobile-first:** every screen has one obvious next tap; no two-finger hunting,
  no full-page scroll to find the action. Reuse the bottom action bar from #5.
- Wire `WhatsNextCoach` logic into the spine so guidance and progress are the
  same object.
**Effort:** M · `page.tsx`, new `JourneySpine` component, reuse WhatsNextCoach
**Serves:** ALL — this is the connective tissue that makes 1‑2‑3 real.

---

## ✅ Shipped recently
- **Tier 1 #1** — Stop button → graceful Pause/save/continue (keeps partial work
  + streamed text, resumes same project with full history)
- **Tier 1 #2** — AI bound to the previewed project (no project switch mid-build)
- **Tier 1 #3** — "+New" does a full reset to a fresh draft (was leaving the old
  site in the preview)
- Dead "stew is cooked" email link (`localhost:5001` → canonical public origin)
- Grader limit tiered by plan (free 3 · starter 25 · pro 100 · scale 500 ·
  enterprise/admin ∞); widget shows "Unlimited" for enterprise
- Agent "write restriction" — files persist to the `files[]` array correctly
- Preview multi-page nav — `/services#plumbing` dropdown links now connect
- Chat auto-scroll on long threads (intent-pin + instant jump)
- Mobile drawer no longer auto-opens over the build-start canvas
- SEO clamps on dynamic pages (listings / profiles / showcase)

---

## Tier 1 — Daily-friction fixes  ✅ DONE (shipped)  · stage: BUILD

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

## Tier 2 — Features

### 7a. Persist & restore chat history + prompts  ⭐ (pairs with #1) · BUILD
**State:** chat history is NOT persisted anywhere. Project schema has
`generationPrompts: []` / `generationHistory: []` (`projects/route.ts:99`) but they
are never populated. Reload loses everything.
**Build:** save `chatMessages` per project (populate `generationHistory`) and
restore on load; capture every prompt + its outcome into `generationPrompts`; add
a per-user **Saved Prompts** library (star / reuse / "run again").
**Effort:** M · `page.tsx`, `/api/projects/[id]`, new prompts-library UI + route

### 4. Import / upload existing projects · BUILD (start)
**State:** no import flow (`/api/upload` is media only).
**Build:**
- **4a. ZIP / folder upload** → unzip → map to `files[]` → create project → load.
  Start here (no auth needed). Guardrails: size/file-count caps, binary handling,
  static-vs-app target detection.
- **4b. GitHub import** → reuse existing GitHub OAuth (`/api/github/connect`,
  `/api/deploy/github`) → list repos → pull a branch → same import pipeline.
**Effort:** M + M · new `ProjectImport` UI, `/api/projects/import`, repo-list route

### 5. Mobile "workspace app, not website" · serves the 1‑2‑3 spine
**State:** step 1 shipped (drawer no longer auto-opens). Manifest exists
(`manifest.ts`).
**Build:** fixed **bottom action bar** (Build · Preview · Pages · Chat) — also the
home for the #9 journey stepper; full-height drawers with body-scroll locked;
preview as the home surface + floating "＋ Ask the chef"; PWA install prompt +
standalone display. **This is the backbone of the mobile 1‑2‑3 experience.**
**Effort:** M

### 8. Logo + favicon builder · SHIP
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

### 7b. Prompt-improvement loop ("better and better") · BUILD
**State:** the "Stew Planner" clarifying agent already exists
(`lib/types/stew-planner.ts`, `/api/builder/clarify`, `/api/builder/converse`,
`!isRichPrompt` trigger) — a one-shot prompt crafter, not a learning loop.
**Build (needs 7a's data):** pre-send coaching (Stew Planner proposes a sharper
prompt before spending a build); post-build 👍/👎 ties prompt → outcome; surface
the user's own highest-yield prompt patterns; design-quality nudges learned from
the designs they keep.
**Effort:** M–L

### 6. Community + marketplace + sell-for-crypto · SELL
**State (reviewed):** working credit + Stripe marketplace —
`marketplace/buy` (credits, atomic, entitlement), `marketplace/checkout` (Stripe
Connect + webhook), `marketplace/payout` (real `stripe.transfers.create`),
`marketplace/earnings`, `/seller`, `/community`, `/listings/[id]`,
`community_posts` (`isPremium`, `price_credits`), `marketplace_purchases`.
**Gaps:** no crypto; build→publish→sell funnel split across /library + /seller +
/community; "apps & more" not sellable; no listing reviews/curation.

**Build:**
- **Unify the funnel into step 3 (SELL):** one clear **Publish → Price → Sell**
  flow inside the workspace + `/community`, reached from the journey spine (#9).
- **Sell more than sites:** templates, full sites, app projects (Expo/backend),
  components.

- **IP / code protection (REQUIRED — sellers must control their work):**
  - **The only real protection is not shipping the source.** Anything a browser
    renders (live `srcDoc`, network tab, view-source, devtools) is copyable.
    Client-side "disable right-click / block devtools" is theater — not relied on.
  - **Protected preview:** for any for-sale listing the public preview is a
    server-generated **screenshot / scroll-video** OR a **watermarked, sandboxed
    live demo** on an isolated service — never the raw HTML. CURRENT LEAK to fix:
    `/listings/[id]` renders full `l.html` in an iframe `srcDoc` for free listings
    (premium already withholds html server-side).
  - **Entitlement-gated delivery:** real files/export delivered only to a verified
    buyer (on-chain purchase → `marketplace_purchases`).
  - **Per-buyer fingerprint:** hidden watermark in delivered code so a leak is
    traceable to the buyer.
  - **Seller control:** pricing, public/unlisted, takedown, license terms,
    report-stolen-content / DMCA flow.
  - **License + provenance:** every sale records buyer + license (the on-chain tx
    is itself proof of purchase).

- **Crypto payments — PRIMARY: non-custodial wallet-to-wallet via an on-chain
  payment splitter. USDC on Base.**
  - Users connect their OWN wallet (Coinbase Wallet / MetaMask / WalletConnect)
    to buy + sell. Webstew never holds funds or keys (non-custodial → out of
    money-transmitter / MSB territory).
  - A **payment-splitter contract** settles each sale in one tx: seller gets their
    share, Webstew treasury gets the platform fee — enforced on-chain, so "we get
    our cut" is guaranteed WITHOUT custody (custody would add legal risk and zero
    extra revenue).
  - Prefer an **audited splitter primitive (0xSplits)** over custom Solidity.
  - Contract emits a purchase event → backend verifies the tx → unlocks the item
    via `marketplace_purchases`.
  - Stack: wagmi + viem + WalletConnect; native USDC on Base.
  - **Secondary (hybrid) option:** a "Pay with crypto" button via **Coinbase
    Commerce** for users who'd rather not connect a wallet — Coinbase is the
    licensed custodian, so Webstew still stays non-custodial. Splitter is primary;
    this is an add-on, not the path.

  **Specs still to lock (only blockers for the crypto build):**
  1. Platform fee % (default 10%)
  2. Instant settle (recommended for digital goods) vs escrow-with-confirm
  3. Audited splitter (0xSplits) vs custom contract — recommend audited
  4. Treasury wallet address for the platform cut

---

## Recommended sequence
1. ~~**Tier 1 (BUILD friction):** Stop→Pause (1) → active-project binding (2) → +New (3)~~ ✅ DONE
2. **7a** persist chat/prompts (rides on #1's state work) ← NEXT
3. **#9 journey spine + #5 mobile** together — this is what makes the app feel
   "1‑2‑3," especially on mobile; do them as one pass
4. **Tier 2 rest:** ZIP import (4a) → Logo Studio (8) → GitHub import (4b)
5. **7b** prompt-improvement loop (needs 7a's data)
6. **Tier 3 SELL:** marketplace IP protection + non-custodial crypto (6), once the
   4 crypto specs are set (fee %, settle model, splitter choice, treasury wallet)

Tier 1 + 7a + the mobile/journey work need zero external decisions — can run
straight through. Only the crypto build waits on the 4 specs above.
