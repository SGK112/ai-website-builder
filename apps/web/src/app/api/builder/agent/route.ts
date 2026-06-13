// POST /api/builder/agent — the agentic builder loop.
//
// Body shape:
//   {
//     prompt: string                            // user message this turn
//     files: Record<string, string>             // current VFS state from client
//     history?: { role: 'user'|'assistant', content: any }[]  // prior turns (optional, for multi-turn)
//     model?: string
//     apiKey?: string
//     projectId?: string                        // if set, also persist edits to Mongo
//     maxIterations?: number                    // default 8
//     target?: 'website' | 'nextjs' | 'react' | 'astro' | 'expo'  // context for system prompt
//   }
//
// Response: SSE stream. Event types emitted:
//   text          { text }                       — assistant prose chunk
//   tool_use      { id, name, input }            — model wants to call a tool
//   tool_result   { tool_use_id, ok, content }   — result of the call
//   file_update   { path, contents }             — client should refresh this file
//   file_delete   { path }                       — client should remove this file
//   done          { summary, iterations }        — agent finished cleanly
//   error         { message }                    — fatal error
//
// Loop:
//   1. send messages + tools to Claude
//   2. read content blocks; stream text immediately
//   3. for any tool_use blocks: execute them, build tool_results
//   4. push assistant message + tool_results into messages, loop
//   5. exit when Claude calls `done` or stop_reason !== 'tool_use'
//   6. cap at maxIterations to prevent infinite loops
//
// Differences from the legacy `/api/builder/converse`:
//   • Claude sees actual file contents (read_file) instead of a flattened HTML blob
//   • Edits target full file rewrites — no fragile substring matching
//   • Multi-step refinements work (read → edit → read another → edit again)
//   • Streaming UX: user watches the agent work

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TOOLS, executeTool, type AgentVfs } from '@/lib/agent-tools'
import { startBuild, completeBuild, failBuild, markBuildCancelled, isCancelled, type BuildFile } from '@/lib/builds-store'
import { sendMail } from '@/lib/mailer'
import { getRecentNegativeNotes } from '@/lib/feedback-store'
import { connectDB, User, trackUsage, getUserUsageThisMonth, PLAN_LIMITS, isAdminEmail } from '@ai-website-builder/database'
import mongoose from 'mongoose'
import { dispatchToBridge, getBridgeStatus } from '@/lib/bridge-store'

export const dynamic = 'force-dynamic'
// 300s matches the website + multi-target builders. Agent loops with up to
// 14 turns can run long on big files; the previous 120s was tight enough
// to trip Cloudflare's 100s edge timeout on heavy edits.
export const maxDuration = 300

const SYSTEM_PROMPT_BASE = `You are Webstew Agent — an expert web/app developer working inside a live project.

You have tools that let you READ and WRITE files, AND manage the project's CMS (content collections). Use them efficiently. You have a HARD LIMIT of ~14 tool turns per request — burn them like a credit card.

SCOPE — THE MOST IMPORTANT RULE:
- Make the SMALLEST possible change that satisfies the literal request. Nothing more.
- When you write_file, the new contents MUST be byte-identical to the original EXCEPT for the specific change the user asked for. Same image URLs, same copy, same layout, same classes, same comments, same whitespace. If the user said "change the title", change the <title> tag (and h1 if clearly implied) and NOTHING ELSE.
- Do NOT improve, modernize, refactor, replace placeholders, swap images, fix typos, upgrade tailwind classes, or "while you're in there" anything. Every unrequested edit is a bug.
- If a section LOOKS bad to you but the user didn't mention it, leave it alone.
- Before write_file, mentally diff your new contents vs what you read. If the diff contains anything not directly required by the request, narrow it.

COLOR / THEME CHANGES — special rule (high-bug-rate area):
- "Change the theme colors" / "make it blue" / "warmer palette" means: change ONLY color tokens — color: values, background-color: values, text-/bg-/border-/from-/via-/to- Tailwind class color words, and CSS custom properties like --primary.
- DO NOT touch: background-image, src="...", url(...) references, srcset, og:image meta, or anything inside <picture>/<source>. The hero header bg-image breaks because the model rewrites the section and forgets the URL. Don't.
- Use edit_file for each color reference one at a time. Multiple small edit_file calls > one risky write_file.
- If the file has <style> with CSS variables, prefer editing the variables instead of every consumer site.

SELECTED-ELEMENT REQUESTS — when the user's prompt starts with "User has selected this element in the live preview:" followed by a code block, edit ONLY that exact node. Locate it by literal substring match (use edit_file with that outerHTML as old_string). Touch nothing outside it.

EFFICIENT WORKING STYLE:
- Call list_files() ONCE at the start, only if you don't already know the file layout. If the user names a specific file or you can infer one from the request, skip list_files.
- Read only the files you'll actually edit. Don't speculatively read every file.
- For NARROW changes (rename a heading, change one attribute, swap one class, edit one line of copy): use edit_file(path, old_string, new_string). 5x faster than write_file and physically cannot drift unrelated code. For multiple small changes in the same file, make multiple edit_file calls — DO NOT bundle into a write_file.
- write_file is ONLY for: creating a new file, OR rewriting >50% of an existing one. Defaulting to write_file for tiny edits is the #1 cause of slow responses and accidental over-editing.
- When using write_file (rare), include the FULL final contents — copy unchanged sections VERBATIM (see SCOPE above).
- ZERO PROSE between tool calls. No "let me read the file", "the file is very long", "I can see the issue", "I'll now fix...", "I need to look at...". The user sees the tool chips — they don't need narration.
- Your ONLY user-facing text is the \`done\` summary at the end (one sentence, under 120 chars: what you changed).
- The moment the visible task is done, call \`done\` IMMEDIATELY. Do NOT verify your own work by re-reading files you just wrote — trust the write succeeded.
- If you encounter the wrong file on a read, just read another one. No apology, no explanation.

REQUEST INTERPRETATION:
- For ambiguous edits ("change the hero image"), find the relevant section, identify the source — could be <img src>, style="background-image: url(...)", <meta og:image>, or schema.org JSON-LD — and update all of them consistently in ONE write_file call.
- NEVER respond with "I couldn't find it" — files are there; locate them.

GRADER — call grade_site when the user asks for an SEO audit, "how's my site doing", "score it", "what's missing", or before/after a major refactor. Returns scores (0-100 overall, plus SEO / technical / presence / AI-visibility buckets) + concrete issues. After grading, FIX the top 2-3 actionable issues yourself (add missing meta description, fix heading structure, add schema.org JSON-LD, etc.) — don't just paste the report back.

CMS — content collections owned by this project:
- The project has structured content stored separately from the code (blog posts, services, team members, etc.). Use the cms_* tools to read/write it.
- When the user asks about "posts", "services", "the blog", "our team", "products" etc., FIRST call list_cms_collections to see what exists. THEN list_cms_items on the relevant collection.
- Items have a stable shape: { slug, fields: {...schema-defined keys...}, status: 'draft'|'published' }.
- When the deployed site builds, every PUBLISHED item is baked into the repo as \`cms/<collection>.json\` (and \`src/content/<collection>/<slug>.md\` for Astro). The site can fetch \`/cms/<collection>.json\` at runtime or import it at build time.
- If the user asks "show my blog posts on the homepage", you should: (1) list_cms_collections to confirm 'posts' or 'blog-posts' exists, (2) list_cms_items to see the actual field names, (3) write code that fetches \`/cms/<slug>.json\` and renders the items using those exact field names.
- If the user gives content directly ("add 3 services about granite countertops"), use create_cms_item (status: 'published') instead of hardcoding content in HTML — this makes it editable in the CMS panel later. Create the collection first with create_cms_collection if it doesn't exist.

IMAGES — for any image you ADD to a generated site, ALWAYS use the /api/media proxy:
- Pattern: <img src="/api/media?q=DESCRIPTIVE+KEYWORDS&w=W&h=H">
- Backed by Pexels (real on-topic photos), Mongo-cached, falls back automatically
- DO NOT emit URLs to picsum.photos (rate-limits under parallel load),
  source.unsplash.com (deprecated June 2024), or loremflickr.com (broken).
- KEYWORDS must describe what should be in the image — "modern+office+desk"
  not "feature1". Use '+' between words. The query goes to Pexels search.
- Examples:
  - Hero: <img src="/api/media?q=modern+startup+team&w=1920&h=1080">
  - Avatar: keep i.pravatar.cc/150?img=N (not a search-driven service)
  - Product: <img src="/api/media?q=minimalist+leather+wallet&w=800&h=600">
When the user provides their OWN image URL they want stored permanently, call upload_image(sourceUrl) to copy it to Cloudinary; then use the returned URL. Skip upload_image for /api/media, pravatar, or already-cloudinary URLs.

LOGOS / BRAND GRAPHICS — when the user asks for a LOGO, brand mark, icon, favicon, or a custom illustration (not a stock photo), use generate_logo(prompt, shape) — NOT /api/media (that's stock photography). Write a rich prompt (business name as text if a wordmark, style, colors, 'transparent background' for logos). Then PLACE the returned url: swap the header text/logo for an <img>, and add a favicon <link rel="icon">. shape: 'square' for logos/icons/favicons, 'wide' for hero banners.

THIRD-PARTY INTEGRATIONS — the user can connect Gmail, Slack, HubSpot, Notion, Sheets, etc. at /integrations. Use them when:
- The user says "send a Slack message about X", "email me when Y", "add this lead to my HubSpot", "save these to a Google Sheet".
- Flow: (1) list_integrations to see what's connected — if the service isn't in the result, tell the user to connect it first and stop. (2) list_integration_actions(toolkit) to see available verbs. (3) run_integration_action(action, args) to do the thing.
- NEVER guess action slugs. Always confirm with list_integration_actions first.
- Bad: "I'll email you" → run_integration_action(action: "send_email", ...). Good: list_integration_actions("gmail") → see GMAIL_SEND_EMAIL → run with the real slug.

PUBLISHING — when the user says "publish", "go live", "make it live", "deploy", "put it online", or "share it", call publish_site. It takes the whole project live at https://<slug>.webstew.app in one shot (no list_files needed first). Then include the live URL in your done summary. Instant-publish is website-only; for app targets tell the user to use Deploy/Export.

OUTPUT FORMAT:
- Tools make the changes. Use them.
- Call \`done\` exactly ONCE at the end with a 1-sentence summary.
- After calling done, the loop terminates — no further work possible. So don't call done prematurely OR delay it.`

// Appended only for the static website target. Teaches the agent the
// one-file-per-page model the workspace reconciles back into page tabs.
const WEBSITE_MULTIPAGE_GUIDE = `

MULTI-PAGE WEBSITES (this project's target is "website"):
- This is a static multi-page site. EACH .html file is ONE PAGE.
  • index.html  = the home page
  • <slug>.html = every other page (about.html, services.html, contact.html, …)
- ADD a page: write_file('<slug>.html', <a COMPLETE standalone HTML document>). Derive <slug> from the page name — lowercase, words joined by hyphens (e.g. "Our Team" → team.html).
- EDIT a page: edit/write the matching file (index.html for home, <slug>.html otherwise).
- DELETE a page: delete_file('<slug>.html'). You cannot delete index.html (the home page).
- Each .html file is served independently, so it MUST be a full document: <!doctype html> … <head> … </head> … <body> … </body></html>. Repeat the shared <style>/CDN <link>/nav markup in every page so they look consistent.
- NAVIGATION — critical: every page shares the same nav, and links point to siblings by PRETTY path WITHOUT the .html extension:
  • home → href="/"
  • other → href="/<slug>"   (e.g. href="/about", href="/services")
  The host serves "/about" from about.html automatically. When you ADD or REMOVE a page, update the nav on EVERY page so the menu stays in sync.
- ZERO-CONFIG: every page must run with NO API keys. NEVER add Google Maps or any <script src> needing a key, and NEVER leave undefined globals (YOUR_LAT, YOUR_API_KEY, etc.). For a map use a keyless OpenStreetMap iframe or a static map image (/api/media?q=CITY+map).
- When the user asks for a multi-page site ("add an about page", "make a 4-page site for a dentist"), create ALL the pages as separate .html files and wire the nav across them before calling done. Don't stop after one page.
- PACING (important): there's a per-response output limit. Do NOT try to emit every page in a single response — write 2-3 pages per turn with separate write_file calls, let the turn end, then continue with the next pages on the following turn. The loop keeps going until you call done(), so building 5 pages over 2-3 turns is normal and correct. Trying to write them all at once truncates mid-file and loses work.`

interface AgentRequest {
  prompt: string
  // Image URLs the user attached this turn (screenshots / references). Sent to
  // the model as vision content blocks alongside the prompt.
  images?: string[]
  files?: Record<string, string>
  history?: Array<{ role: 'user' | 'assistant'; content: any }>
  model?: string
  apiKey?: string
  projectId?: string
  projectName?: string
  maxIterations?: number
  target?: 'website' | 'nextjs' | 'react' | 'astro' | 'expo'
  // 'no-code' | 'low-code' | 'full-stack' — controls prose verbosity.
  // Developer Mode (full-stack) gets Claude's full reasoning; Creator/Builder
  // get terse tool-only output so the chat panel doesn't fill with monologue.
  skillLevel?: 'no-code' | 'low-code' | 'full-stack'
  // If true, route this turn through the user's local @webstew/bridge
  // (their installed Claude Code → Pro/Max subscription) instead of
  // calling Anthropic with the server's API key. Errors with 503 if
  // the bridge is offline so billing surprises don't happen silently.
  useBridge?: boolean
}

// Persist agent file writes into a project's `files` ARRAY of
// { path, content, type } — NOT a { [path]: contents } map. A prior version
// wrote a dotted key (`files.about.html`), which Mongo tries to set INTO the
// array element and rejects, so every agent write to a saved project threw and
// the agent surfaced it as a bogus "write restriction". These hooks
// replace-or-append the element by path in one atomic pipeline update.
// Persistence is best-effort: a sync failure must never block the in-memory
// write that drives the build/preview (the client snapshot + build store still
// hold the file).
function makeFilePersistence(db: any, oid: any) {
  const fileType = (p: string): string => {
    const ext = p.split('.').pop()?.toLowerCase()
    if (ext === 'html' || ext === 'htm') return 'html'
    if (ext === 'css') return 'css'
    if (ext === 'js' || ext === 'jsx' || ext === 'mjs') return 'javascript'
    if (ext === 'ts' || ext === 'tsx') return 'typescript'
    if (ext === 'json') return 'json'
    if (ext === 'md') return 'markdown'
    return 'other'
  }
  const write = async (path: string, contents: string) => {
    try {
      await db.collection('projects').updateOne({ _id: oid }, [
        {
          $set: {
            files: {
              $concatArrays: [
                {
                  $filter: {
                    input: { $cond: [{ $isArray: '$files' }, '$files', []] },
                    cond: { $ne: ['$$this.path', path] },
                  },
                },
                [{ path, content: contents, type: fileType(path), lastModified: '$$NOW' }],
              ],
            },
            updatedAt: '$$NOW',
          },
        },
      ])
    } catch (e: any) {
      console.warn(`[agent] persist write failed for ${path}:`, e?.message)
    }
  }
  const del = async (path: string) => {
    try {
      await db.collection('projects').updateOne({ _id: oid }, [
        {
          $set: {
            files: {
              $filter: {
                input: { $cond: [{ $isArray: '$files' }, '$files', []] },
                cond: { $ne: ['$$this.path', path] },
              },
            },
            updatedAt: '$$NOW',
          },
        },
      ])
    } catch (e: any) {
      console.warn(`[agent] persist delete failed for ${path}:`, e?.message)
    }
  }
  return { write, del }
}

// The agent loop uses Anthropic's tool-use protocol — non-Anthropic IDs
// (gpt-*, gemini-*, grok-*, llama-*, qwen-*, deepseek-*) can't be honored here.
// Returns the chosen model AND a note if we had to substitute, so the route
// can surface that to the client instead of silently routing to Sonnet.
function pickModel(name?: string): { model: string; substituted?: string } {
  const lc = (name || '').toLowerCase().trim()
  if (!lc || lc === 'auto' || lc === 'best') return { model: 'claude-sonnet-4-6' }
  if (lc.startsWith('claude') || lc.includes('fable') || lc.includes('opus') || lc.includes('sonnet') || lc.includes('haiku')) {
    if (lc.includes('fable')) return { model: 'claude-fable-5' }
    if (lc.includes('opus')) return { model: 'claude-opus-4-8' }
    if (lc.includes('haiku')) return { model: 'claude-haiku-4-5-20251001' }
    return { model: 'claude-sonnet-4-6' }
  }
  // Non-Anthropic model — agent tool-use loop can't run against it.
  return { model: 'claude-sonnet-4-6', substituted: name }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: AgentRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = (body.prompt || '').trim()
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Bridge dispatch ────────────────────────────────────────────────
  // If the user explicitly opted in (useBridge=true), route the request
  // through their local @webstew/bridge process — their Claude Code
  // subscription handles the call. Server's Anthropic key is not used
  // for this turn; no monthlyCredits decrement; no BYOK gate.
  // Errors with 503 if no bridge is connected so billing surprises
  // don't happen silently (we never fall back to direct Anthropic
  // without an explicit opt-out).
  if (body.useBridge === true) {
    const status = await getBridgeStatus(session.user.id)
    if (!status.connected) {
      return new Response(
        JSON.stringify({
          error:
            'Your chef is off the line. Run `webstew-bridge connect` ' +
            'in your terminal to clock back in (no new code needed if already paired).',
          bridge: { connected: false },
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }
    // Stable workspace ID for the bridge. Real projects → use the
    // projectId so Claude Code's CLAUDE.md memory namespaces correctly
    // (~/.webstew/workspaces/<projectId>/). Drafts (no saved project)
    // → use a per-user "draft-<userid>" id so each user still gets
    // their own workspace dir + memory namespace instead of every
    // anon turn dumping into the shared _unscoped_ workspace. Mongo
    // persist hooks only fire when body.projectId is the real value,
    // so the synthesized draft id never tries to write to a
    // nonexistent project doc.
    const bridgeWorkspaceId = body.projectId || `draft-${session.user.id}`
    // Feedback parity with the direct path — pass this user's recent
    // thumbs-down notes so the bridge's CLAUDE.md can fold them in.
    let bridgeFeedbackNotes: string[] = []
    try { bridgeFeedbackNotes = await getRecentNegativeNotes(session.user.id) } catch (e: any) { console.warn('[agent-bridge] feedback fetch failed:', e?.message) }
    const dispatched = dispatchToBridge(session.user.id, {
      prompt,
      files: body.files || {},
      history: body.history,
      model: body.model,
      target: body.target,
      projectId: bridgeWorkspaceId,
      maxIterations: body.maxIterations,
      feedbackNotes: bridgeFeedbackNotes,
    })
    const { stream, cancel: cancelDispatch } = dispatched

    // Mirror file_update / file_delete events into Mongo so bridge edits
    // survive a page refresh, same as the direct-Anthropic path's
    // persistHook/persistDeleteHook. No-op when projectId is absent
    // (anon / draft workflows that haven't saved a project).
    let persistUpdate: ((path: string, contents: string) => Promise<void>) | null = null
    let persistDelete: ((path: string) => Promise<void>) | null = null
    if (body.projectId) {
      try {
        const m = await connectDB()
        const db = m.connection.db
        if (db) {
          const { ObjectId } = await import('mongodb')
          let oid: any
          try { oid = new ObjectId(body.projectId) } catch { oid = body.projectId }
          const fp = makeFilePersistence(db, oid)
          persistUpdate = fp.write
          persistDelete = fp.del
        }
      } catch (e: any) {
        console.warn('[agent-bridge] Mongo persist hook unavailable:', e?.message)
      }
    }

    const encoder = new TextEncoder()
    // Hoisted so cancel() (browser closed the fetch) can also stop the
    // heartbeat — otherwise it keeps ticking after a disconnect.
    let bridgeHeartbeat: ReturnType<typeof setInterval> | null = null
    const stopHeartbeat = () => { if (bridgeHeartbeat) { clearInterval(bridgeHeartbeat); bridgeHeartbeat = null } }
    const sse = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          } catch {}
        }
        try { controller.enqueue(encoder.encode(`: connected\n\n`)) } catch {}
        // Heartbeat — the bridge can now run a build up to ~270s, and Claude
        // Code can go quiet between turns. Flush an SSE comment every 15s so
        // Cloudflare / Render's edge doesn't idle-kill the response body during
        // a long-but-healthy build (matches the direct branch's heartbeat).
        bridgeHeartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode(`: ping\n\n`)) } catch { stopHeartbeat() }
        }, 15000)
        try {
          for await (const chunk of stream) {
            // Persist BEFORE forwarding so even if the SSE client
            // disconnects mid-stream, the file is saved.
            if (chunk.kind === 'file_update' && persistUpdate) {
              try {
                await persistUpdate(chunk.data.path, chunk.data.contents)
              } catch (e: any) {
                console.warn('[agent-bridge] persist update failed:', e?.message)
              }
            } else if (chunk.kind === 'file_delete' && persistDelete) {
              try {
                await persistDelete(chunk.data.path)
              } catch (e: any) {
                console.warn('[agent-bridge] persist delete failed:', e?.message)
              }
            }
            send(chunk.kind, chunk.data)
          }
        } catch (e: any) {
          send('error', { message: e?.message || 'Bridge stream failed' })
        } finally {
          stopHeartbeat()
          try { controller.close() } catch {}
        }
      },
      cancel() {
        // Browser closed the fetch. Stop the heartbeat and clean up dispatcher
        // state so the bridge sees BridgeCancelled on its next POST and stops
        // the claude child (see runtime.ts).
        stopHeartbeat()
        try { cancelDispatch() } catch {}
      },
    })
    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Alt-Svc': 'clear',
      },
    })
  }

  const anthropicKey = body.apiKey || process.env.ANTHROPIC_API_KEY
  const usingBYOK = !!body.apiKey
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Usage gate — only enforce when the call is on OUR Anthropic key. If the
  // user is BYOK they pay Anthropic directly, so the plan's monthlyCredits
  // limit doesn't apply. Admin emails are also exempt. Agent turns count as
  // 1 credit each against monthlyCredits.
  if (!usingBYOK) {
    try {
      await connectDB()
      const userDoc: any = mongoose.Types.ObjectId.isValid(session.user.id)
        ? await User.findById(session.user.id).select('plan email').lean()
        : await User.findOne({ email: session.user.email }).select('plan email').lean()
      const userEmail = userDoc?.email || session.user.email || ''
      const rawPlanKey = userDoc?.plan === 'custom' ? 'enterprise' : (userDoc?.plan || 'free')
      const planKey = (PLAN_LIMITS[rawPlanKey as keyof typeof PLAN_LIMITS] ? rawPlanKey : 'free') as keyof typeof PLAN_LIMITS
      const limits = PLAN_LIMITS[planKey]
      if (!isAdminEmail(userEmail) && limits.monthlyCredits !== -1) {
        const monthUsage = await getUserUsageThisMonth(session.user.id)
        if (monthUsage.credits >= limits.monthlyCredits) {
          return new Response(JSON.stringify({
            error: `Monthly limit reached (${limits.monthlyCredits} credits on the ${planKey} plan). Upgrade, or paste your own Anthropic API key in Settings → Deploy credentials.`,
            limit: limits.monthlyCredits,
            used: monthUsage.credits,
            plan: planKey,
            upgrade: true,
          }), { status: 429, headers: { 'Content-Type': 'application/json' } })
        }
      }
    } catch (e: any) {
      // Soft-fail the limit check rather than block the call — if Mongo's
      // down we still let the user work and let the deploy/save layer raise.
      console.warn('[agent] Usage gate check failed (soft-allow):', e?.message)
    }
  }

  const client = new Anthropic({ apiKey: anthropicKey })
  const picked = pickModel(body.model)
  const model = picked.model
  // Bumped from 8 → 14 default. Multi-file refinements ("replace the
  // Google iframe with a static map", "make the menu responsive") need to
  // list_files + read 3-4 files + write 2-3 files + done — easily 6-8
  // turns, leaving no headroom for a recovery turn if Claude makes a typo.
  const maxIterations = Math.min(body.maxIterations ?? 14, 20)

  // VFS: start from the client's snapshot. If projectId is provided we also
  // persist writes to Mongo so the saved project stays in sync.
  const vfsFiles: Record<string, string> = { ...(body.files || {}) }
  let persistHook: AgentVfs['onWrite'] | undefined
  let persistDeleteHook: AgentVfs['onDelete'] | undefined
  if (body.projectId) {
    try {
      const mongoose = await connectDB()
      const db = mongoose.connection.db
      if (db) {
        const { ObjectId } = await import('mongodb')
        let oid: any
        try { oid = new ObjectId(body.projectId) } catch { oid = body.projectId }
        // `files` is an ARRAY of { path, content, type } — see makeFilePersistence.
        const fp = makeFilePersistence(db, oid)
        persistHook = fp.write
        persistDeleteHook = fp.del
      }
    } catch (e: any) {
      console.warn('[agent] Mongo persist hook unavailable:', e?.message)
    }
  }
  const vfs: AgentVfs = {
    files: vfsFiles,
    onWrite: persistHook,
    onDelete: persistDeleteHook,
    // Owner — set unconditionally (unlike `cms`, which needs a saved project)
    // so publish_site works on unsaved drafts too.
    userId: session.user.id,
    projectName: body.projectName ? String(body.projectName) : undefined,
    // CMS context — only enabled when projectId is supplied. Lets the agent
    // call cms_* tools to read collections + write items. Ownership check
    // happens inside cms-store via the userId.
    cms: body.projectId ? { projectId: body.projectId, userId: session.user.id } : undefined,
  }

  // Build the messages array. History (prior turns) + current user prompt.
  // Each element in history is already in Anthropic message format; for the
  // current turn we just push the new user message.
  const messages: Anthropic.Messages.MessageParam[] = []
  if (body.history && Array.isArray(body.history)) {
    for (const h of body.history) {
      if (h?.role && h?.content) messages.push(h as Anthropic.Messages.MessageParam)
    }
  }
  // Attach any images the user shared as vision blocks before the prompt, so
  // "make this purple / match this screenshot" works. Capped + URL-validated.
  const imageBlocks = (Array.isArray(body.images) ? body.images : [])
    .filter((u): u is string => typeof u === 'string' && /^https?:\/\//i.test(u))
    .slice(0, 4)
    .map((url) => ({ type: 'image' as const, source: { type: 'url' as const, url } }))
  messages.push({
    role: 'user',
    content: imageBlocks.length
      ? [...imageBlocks, { type: 'text' as const, text: prompt }]
      : prompt,
  })

  // Developer Mode wants to see Claude's reasoning; default modes want terse.
  // The base prompt already says ZERO PROSE — override that for full-stack.
  const isDeveloperMode = body.skillLevel === 'full-stack'
  const verbosityOverride = isDeveloperMode
    ? `\n\nVERBOSITY OVERRIDE (Developer Mode):\nThe user is a developer and wants to see your reasoning. Disregard the ZERO PROSE rule above. Narrate your plan briefly before tool calls (1-2 sentences: what you're about to do and why), explain non-obvious choices, and call out anything risky. Keep tool chips clean — the prose is for context, not duplicating what the chip already shows.`
    : ''

  // Feedback loop — fold this user's recent thumbs-down corrections into the
  // prompt so the agent stops repeating mistakes they've already flagged.
  // Best-effort; a feedback-store hiccup must never block a build.
  let feedbackGuide = ''
  try {
    const notes = await getRecentNegativeNotes(session.user.id)
    if (notes.length > 0) {
      feedbackGuide =
        `\n\nLEARN FROM THIS USER'S FEEDBACK — they previously flagged these problems on past builds. Do NOT repeat them:\n` +
        notes.map((n) => `- ${n}`).join('\n')
    }
  } catch (e: any) { console.warn('[agent] feedback fetch failed (non-fatal):', e?.message) }

  const systemPrompt =
    SYSTEM_PROMPT_BASE +
    verbosityOverride +
    feedbackGuide +
    (body.target ? `\n\nPROJECT TYPE: ${body.target}` : '') +
    (body.target === 'website' ? WEBSITE_MULTIPAGE_GUIDE : '') +
    (Object.keys(vfsFiles).length > 0
      ? `\n\nCURRENT FILE COUNT: ${Object.keys(vfsFiles).length} files. Call list_files() to see them.`
      : '\n\nNOTE: project has NO files yet. You may need to call write_file to create them from scratch.')

  // SSE stream setup
  const encoder = new TextEncoder()
  // Track client-disconnect so the agent loop can bail early instead of
  // continuing to enqueue into a closed controller. cancel() fires when
  // the browser drops the connection; req.signal.aborted covers Render's
  // edge dropping us. Either way, set `aborted` and stop the loop on the
  // next iteration boundary.
  let aborted = false
  if (req.signal) {
    req.signal.addEventListener('abort', () => { aborted = true })
  }
  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat — flushes a tiny SSE comment every 15s so Cloudflare /
      // Render's HTTP/3 edge doesn't idle-timeout the response body during
      // long Claude turns. The first call to Anthropic on a complex prompt
      // can take 20-40s; without bytes flowing, the edge kills the QUIC
      // stream and the browser reports ERR_QUIC_PROTOCOL_ERROR + fetch
      // rejects with TypeError: network error. Comment lines start with `:`
      // and are ignored by EventSource clients, so they don't surface in
      // the UI.
      let heartbeat: ReturnType<typeof setInterval> | null = null
      const stopHeartbeat = () => {
        if (heartbeat) { clearInterval(heartbeat); heartbeat = null }
      }
      // Safe close — controller throws "Invalid state" if already closed
      // (the client disconnect path). Swallow so it doesn't bubble into
      // the catch and produce a misleading "Loop failed" log.
      const safeClose = () => {
        stopHeartbeat()
        try { controller.close() } catch {}
      }
      const send = (event: string, data: any) => {
        if (aborted) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          aborted = true
        }
      }
      // Send an immediate first byte so the edge starts streaming the
      // response right away (not after Claude's first reply). EventSource
      // ignores `:` comment lines.
      try { controller.enqueue(encoder.encode(`: connected\n\n`)) } catch {}

      // If the user picked a non-Anthropic model, tell them up-front that
      // we substituted Sonnet — the agent tool-use loop is Anthropic-only.
      if (picked.substituted) {
        send('notice', {
          kind: 'model_substituted',
          requested: picked.substituted,
          using: model,
          message: `Agent edits use Claude (${model}). "${picked.substituted}" was your generation model — it's not supported for the tool-use loop yet.`,
        })
      }

      heartbeat = setInterval(() => {
        if (aborted) { stopHeartbeat(); return }
        try { controller.enqueue(encoder.encode(`: ping\n\n`)) } catch { aborted = true; stopHeartbeat() }
      }, 15000)

      // Token accumulator across all iterations of this turn — we trackUsage
      // once at the end with the full total instead of one record per loop
      // iteration. Reduces Mongo write amplification.
      let totalInputTokens = 0
      let totalOutputTokens = 0

      // Server-side build record — lets the build survive the client closing
      // the tab (the loop continues below on a mere disconnect) and lets us
      // email + restore it afterward. Best-effort.
      let buildId: string | null = null
      let cancelledByUser = false
      try {
        buildId = await startBuild({ userId: session.user.id, projectId: body.projectId, prompt, target: body.target || 'website' })
        send('build', { buildId })
      } catch (e: any) { console.warn('[agent] startBuild failed (non-fatal):', e?.message) }

      try {
        let iterations = 0
        let doneSummary: string | null = null

        while (iterations < maxIterations && doneSummary == null) {
          // Stop ONLY on an explicit user cancel (Stop button → /api/builder/
          // cancel). A mere disconnect (tab closed) does NOT stop the loop —
          // the build finishes in the background and we email the user.
          if (buildId && isCancelled(buildId)) { cancelledByUser = true; break }
          if (!buildId && aborted) break  // no persistence → fall back to old "stop on disconnect"
          iterations++

          // Use the streaming API (.stream().finalMessage()) rather than a
          // blocking create(): at max_tokens=32K the SDK refuses a non-stream
          // call ("Streaming is required for operations that may take longer
          // than 10 minutes"). finalMessage() still resolves to the complete
          // Message, so the loop below is unchanged.
          const response: Anthropic.Messages.Message = await client.messages.stream({
            model,
            // 32K output budget. 16K was too tight for multi-page builds:
            // writing several full HTML pages in one turn blew the cap
            // mid-write_file, flipping stop_reason to 'max_tokens' and bailing
            // with "output token cap hit" before any page landed. A single
            // page is 3-8K tokens, so 32K comfortably fits 3-4 pages/turn and
            // the loop finishes the rest across iterations. Sonnet/Opus 4.x
            // support up to 64K if we ever need more.
            max_tokens: 32000,
            system: systemPrompt,
            tools: TOOLS,
            messages,
          }).finalMessage()
          // Accumulate usage — trackUsage is called once at end-of-stream.
          totalInputTokens  += response.usage?.input_tokens  || 0
          totalOutputTokens += response.usage?.output_tokens || 0

          // Developer Mode: stream the prose so the user can follow reasoning.
          // Default modes: collect text but don't stream — Claude's intermediate
          // narration is internal thinking, not user-facing communication.
          // Final `done` summary / no-tools terminal text reaches the user via
          // the doneSummary path below regardless.
          const textPieces: string[] = []
          const toolUses: Array<{ id: string; name: string; input: any }> = []
          for (const block of response.content) {
            if (block.type === 'text') {
              textPieces.push(block.text)
              if (isDeveloperMode && block.text.trim()) {
                send('text', { text: block.text })
              }
            } else if (block.type === 'tool_use') {
              toolUses.push({ id: block.id, name: block.name, input: block.input })
              send('tool_use', { id: block.id, name: block.name, input: block.input })
            }
          }

          // Add the assistant turn to the conversation BEFORE we add tool_results
          messages.push({ role: 'assistant', content: response.content })

          // If the model didn't call any tools, we're done — no further work needed.
          if (toolUses.length === 0) {
            if (textPieces.length === 0) {
              send('error', { message: 'Model returned no content and no tool calls.' })
            }
            doneSummary = textPieces.join('\n').trim() || 'Done.'
            break
          }

          // Execute each tool call, collect tool_result blocks
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
          for (const tu of toolUses) {
            const result = await executeTool(tu.name, tu.input, vfs)
            send('tool_result', { tool_use_id: tu.id, ok: result.ok, content: result.content.slice(0, 4000) })
            // For file mutations, emit a separate event so the client can update its view
            if (result.ok && tu.name === 'write_file') {
              send('file_update', { path: (tu.input as any).path, contents: (tu.input as any).contents })
            } else if (result.ok && tu.name === 'edit_file') {
              // edit_file mutates by replacement — we look up the post-edit contents
              // from the vfs (executeTool already wrote it back) and ship the full
              // updated file so the client iframe + editor state stay in sync.
              const path = (tu.input as any).path
              const contents = vfs.files[path]
              if (contents != null) send('file_update', { path, contents })
            } else if (result.ok && tu.name === 'delete_file') {
              send('file_delete', { path: (tu.input as any).path })
            } else if (result.ok && tu.name === 'publish_site') {
              // Surface the live URL to the client so the workspace can light
              // up its "Live at …" state without re-fetching /api/publish.
              try { send('published', JSON.parse(result.content)) } catch {}
            }
            // If the model called `done`, capture the summary and end the loop.
            if (tu.name === 'done') {
              doneSummary = String((tu.input as any).summary || 'Done.')
            }
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: result.content.slice(0, 60_000),
              is_error: !result.ok,
            })
          }

          // Push the tool_results as a single user turn (Anthropic's required shape).
          messages.push({ role: 'user', content: toolResults })

          // If the model ended its turn naturally, we're done. But surface
          // a specific message when stop_reason was `max_tokens` — that
          // means the model ran out of output budget mid-tool_use, which
          // looks identical to "iteration cap hit" but is a different bug
          // (model needs more headroom, not more iterations).
          if (response.stop_reason === 'max_tokens') {
            send('error', {
              message: 'Output token cap hit mid-edit. The file may be too large for a single rewrite. Try splitting the request, or ask for narrower changes.',
            })
            doneSummary = `Stopped: output token cap hit at iteration ${iterations}.`
            break
          }
          if (response.stop_reason !== 'tool_use') break
        }

        if (!doneSummary) {
          // Loop cap hit without explicit done()
          send('error', {
            message: `Agent hit iteration cap (${iterations}/${maxIterations}) without calling done(). Partial changes have been applied.`,
          })
          doneSummary = `Stopped after ${iterations} iterations.`
        }

        send('done', { summary: doneSummary, iterations })
        safeClose()

        // ── Server-side build persistence + notify ──────────────────────────
        // Save the result so it survives a disconnect, and if the user walked
        // away mid-build (aborted = tab closed / connection dropped), email
        // them it's ready. Explicit Stop → cancelled, no email.
        if (buildId) {
          try {
            if (cancelledByUser) {
              await markBuildCancelled(buildId)
            } else {
              const files: BuildFile[] = Object.entries(vfs.files).map(([path, content]) => ({ path, content: String(content ?? '') }))
              await completeBuild(buildId, { files, summary: doneSummary || undefined, disconnected: aborted })
              if (aborted && session.user.email) {
                // Behind Cloudflare→Render, req.nextUrl.origin is the internal
                // bind (https://localhost:5001) — that made the emailed link a
                // dead page. Prefer the canonical public origin (same
                // precedence as the integrations OAuth + notify routes).
                const origin = (
                  process.env.NEXTAUTH_URL ||
                  process.env.NEXT_PUBLIC_SITE_URL ||
                  req.nextUrl.origin
                ).replace(/\/+$/, '')
                const link = `${origin}/workspace?resumeBuild=${buildId}`
                await sendMail({
                  to: session.user.email, kind: 'noreply',
                  subject: `🍲 Your stew is cooked — it's ready`,
                  text: `Your Webstew build finished while you were away.\n\nView it: ${link}\n\n— Webstew`,
                  html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto"><h2 style="margin:0 0 8px">🍲 Your stew is cooked</h2><p style="color:#444;margin:0 0 16px">Your build finished while you were away.</p><p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">View your build →</a></p></div>`,
                }).catch(() => {})
              }
            }
          } catch (e: any) { console.warn('[agent] build persist failed:', e?.message) }
        }

        // Fire-and-forget usage tracking. We only meter calls that used OUR
        // Anthropic key — BYOK users pay Anthropic directly. 1 credit per
        // turn keeps the math simple for the monthlyCredits cap.
        if (!usingBYOK) {
          try {
            await trackUsage(session.user.id, {
              type: 'chat',
              provider: 'anthropic',
              model,
              tokensUsed: totalInputTokens + totalOutputTokens,
              creditsUsed: 1,
              metadata: {
                projectId: body.projectId,
                duration: iterations,
                success: !!doneSummary && !doneSummary.startsWith('Stopped'),
              },
            })
          } catch (e: any) {
            console.warn('[agent] trackUsage failed (non-fatal):', e?.message)
          }
        }
      } catch (e: any) {
        const msg = e?.message || String(e)
        // Distinguish client-disconnect from real errors. The first is
        // common (user navigated away mid-stream); we silently swallow
        // rather than log every cancelled stream.
        if (!aborted && !/already closed|Invalid state/i.test(msg)) {
          console.error('[agent] Loop failed:', msg)
          send('error', { message: msg })
        }
        safeClose()
        if (buildId) { try { await failBuild(buildId, msg) } catch {} }
      }
    },
    cancel() {
      // Browser closed the EventSource — flip the disconnect flag. The build
      // loop keeps running (server-side persistence); only an explicit Stop
      // (/api/builder/cancel) halts it.
      aborted = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      // Tell Chrome to stop using HTTP/3 for this origin. QUIC dropping
      // long SSE streams was producing ERR_QUIC_PROTOCOL_ERROR before the
      // first byte arrived. HTTP/2 doesn't have the same edge idle
      // behavior on Render and proves more reliable for the agent loop.
      'Alt-Svc': 'clear',
    },
  })
}
