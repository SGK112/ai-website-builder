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
import { connectDB, User, trackUsage, getUserUsageThisMonth, PLAN_LIMITS, isAdminEmail } from '@ai-website-builder/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // give it real time for multi-step loops

const SYSTEM_PROMPT_BASE = `You are Webstew Agent — an expert web/app developer working inside a live project.

You have tools that let you READ and WRITE files, AND manage the project's CMS (content collections). Use them efficiently. You have a HARD LIMIT of ~14 tool turns per request — burn them like a credit card.

EFFICIENT WORKING STYLE:
- Call list_files() ONCE at the start, only if you don't already know the file layout. If the user names a specific file or you can infer one from the request, skip list_files.
- Read only the files you'll actually edit. Don't speculatively read every file.
- write_file overwrites the entire file — include the FULL final contents.
- One sentence of prose max before tool calls. No "let me start by…" preambles.
- The moment the visible task is done, call \`done\` IMMEDIATELY. Do NOT verify your own work by re-reading files you just wrote — trust the write succeeded.
- If you encounter the wrong file on a read, just read another one. Don't apologize.
- Edit only what the user asked for. Preserve unrelated code exactly.

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

THIRD-PARTY INTEGRATIONS — the user can connect Gmail, Slack, HubSpot, Notion, Sheets, etc. at /integrations. Use them when:
- The user says "send a Slack message about X", "email me when Y", "add this lead to my HubSpot", "save these to a Google Sheet".
- Flow: (1) list_integrations to see what's connected — if the service isn't in the result, tell the user to connect it first and stop. (2) list_integration_actions(toolkit) to see available verbs. (3) run_integration_action(action, args) to do the thing.
- NEVER guess action slugs. Always confirm with list_integration_actions first.
- Bad: "I'll email you" → run_integration_action(action: "send_email", ...). Good: list_integration_actions("gmail") → see GMAIL_SEND_EMAIL → run with the real slug.

OUTPUT FORMAT:
- Tools make the changes. Use them.
- Call \`done\` exactly ONCE at the end with a 1-sentence summary.
- After calling done, the loop terminates — no further work possible. So don't call done prematurely OR delay it.`

interface AgentRequest {
  prompt: string
  files?: Record<string, string>
  history?: Array<{ role: 'user' | 'assistant'; content: any }>
  model?: string
  apiKey?: string
  projectId?: string
  maxIterations?: number
  target?: 'website' | 'nextjs' | 'react' | 'astro' | 'expo'
}

function pickModel(name?: string): string {
  const lc = (name || '').toLowerCase()
  if (lc.includes('opus')) return 'claude-opus-4-7'
  if (lc.includes('haiku')) return 'claude-haiku-4-5-20251001'
  return 'claude-sonnet-4-6'
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
      const planKey = (PLAN_LIMITS[userDoc?.plan as keyof typeof PLAN_LIMITS] ? userDoc.plan : 'free') as keyof typeof PLAN_LIMITS
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
  const model = pickModel(body.model)
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
        persistHook = async (path, contents) => {
          await db.collection('projects').updateOne(
            { _id: oid },
            { $set: { [`files.${path}`]: contents, updatedAt: new Date() } }
          )
        }
        persistDeleteHook = async (path) => {
          await db.collection('projects').updateOne(
            { _id: oid },
            { $unset: { [`files.${path}`]: '' }, $set: { updatedAt: new Date() } }
          )
        }
      }
    } catch (e: any) {
      console.warn('[agent] Mongo persist hook unavailable:', e?.message)
    }
  }
  const vfs: AgentVfs = {
    files: vfsFiles,
    onWrite: persistHook,
    onDelete: persistDeleteHook,
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
  messages.push({ role: 'user', content: prompt })

  const systemPrompt =
    SYSTEM_PROMPT_BASE +
    (body.target ? `\n\nPROJECT TYPE: ${body.target}` : '') +
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
      // Safe close — controller throws "Invalid state" if already closed
      // (the client disconnect path). Swallow so it doesn't bubble into
      // the catch and produce a misleading "Loop failed" log.
      const safeClose = () => {
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

      // Token accumulator across all iterations of this turn — we trackUsage
      // once at the end with the full total instead of one record per loop
      // iteration. Reduces Mongo write amplification.
      let totalInputTokens = 0
      let totalOutputTokens = 0

      try {
        let iterations = 0
        let doneSummary: string | null = null

        while (iterations < maxIterations && doneSummary == null && !aborted) {
          iterations++

          const response: Anthropic.Messages.Message = await client.messages.create({
            model,
            // 16K covers a full-page HTML rewrite (typical generated sites are
            // 3-8K tokens). 8K caused max_tokens stops mid-write_file on
            // big SEO/auto-fix passes — the model would emit a partial
            // tool_use and stop_reason would flip to 'max_tokens', breaking
            // the loop without ever calling done(). Sonnet 4.6 supports up
            // to 64K output if we ever need more.
            max_tokens: 16000,
            system: systemPrompt,
            tools: TOOLS,
            messages,
          })
          // Accumulate usage — trackUsage is called once at end-of-stream.
          totalInputTokens  += response.usage?.input_tokens  || 0
          totalOutputTokens += response.usage?.output_tokens || 0

          // Emit any text blocks immediately
          const textPieces: string[] = []
          const toolUses: Array<{ id: string; name: string; input: any }> = []
          for (const block of response.content) {
            if (block.type === 'text') {
              textPieces.push(block.text)
              if (block.text.trim()) send('text', { text: block.text })
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
            } else if (result.ok && tu.name === 'delete_file') {
              send('file_delete', { path: (tu.input as any).path })
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
      }
    },
    cancel() {
      // Browser closed the EventSource — flip the flag so the loop above
      // stops enqueuing on the next iteration.
      aborted = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
