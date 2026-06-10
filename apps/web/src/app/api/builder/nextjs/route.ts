import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { generateJson, requireFiles, GenerateJsonError, streamJsonWithHeartbeats } from '@/lib/llm-json'
import { gateBuilderRequest, trackBuilderUsage } from '@/lib/builder-gate'
import { augmentPromptWithReference } from '@/lib/site-reference'

export const dynamic = 'force-dynamic'
// 300s matches /api/builder/generate. The previous 60s ceiling forced
// Cloudflare-edge 524s on big project generations.
export const maxDuration = 300

// Shape mirrors /api/builder/app so the workspace UI can reuse the same renderer.
interface NextjsGenerateRequest {
  prompt: string
  model?: string
  apiKey?: string
  appName?: string
  database?: 'mongodb' | 'postgres' | 'none'
  auth?: 'nextauth' | 'clerk' | 'none'
  // Optional URL — if provided, server scrapes the site for structure/palette/
  // copy and injects it as inspiration context before the LLM call.
  referenceUrl?: string
}

interface NextjsGenerateResponse {
  files: Record<string, string>
  name: string
  slug: string
  description: string
  instructions: string
  target: 'nextjs'
}

const NEXTJS_SYSTEM_PROMPT = `You are an expert Next.js 14 developer. Generate a COMPLETE, runnable Next.js App Router project as JSON.

## OUTPUT FORMAT (STRICT)

Return a single JSON object — no prose, no markdown fences. Schema:
{
  "name": "Human Readable Project Name",
  "slug": "kebab-case-slug",
  "description": "One-sentence description shown on README",
  "files": {
    "app/page.tsx": "...",
    "app/layout.tsx": "...",
    "app/globals.css": "...",
    "package.json": "...",
    "tsconfig.json": "...",
    "next.config.mjs": "...",
    "tailwind.config.ts": "...",
    "postcss.config.mjs": "...",
    "components/Hero.tsx": "...",
    "app/dashboard/page.tsx": "..."
  }
}

## REQUIRED FILES (always include)

1. **app/layout.tsx** — Root layout with html / body, Tailwind via globals.css import, font setup (Inter from next/font/google), proper metadata. Wrap in providers if needed.

2. **app/page.tsx** — Home page. Real content for the product, not lorem.

3. **app/globals.css** — Tailwind directives @tailwind base/components/utilities, CSS variables for theme colors (dark mode aware via .dark class).

4. **package.json** — Use these EXACT versions:
   {
     "name": "<slug>",
     "version": "0.1.0",
     "private": true,
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "next lint"
     },
     "dependencies": {
       "next": "14.2.18",
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "lucide-react": "^0.456.0",
       "clsx": "^2.1.1",
       "tailwind-merge": "^2.5.4"
     },
     "devDependencies": {
       "@types/node": "^22.9.0",
       "@types/react": "^18.3.12",
       "@types/react-dom": "^18.3.1",
       "autoprefixer": "^10.4.20",
       "eslint": "^8.57.1",
       "eslint-config-next": "14.2.18",
       "postcss": "^8.4.49",
       "tailwindcss": "^3.4.15",
       "typescript": "^5.6.3"
     }
   }

5. **tsconfig.json** — Standard Next.js TS config with paths { "@/*": ["./*"] }, strict true, jsx "preserve".

6. **next.config.mjs** — \`export default { images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] } }\` so any image domain works.

7. **tailwind.config.ts** — content scans \`./app/**/*.{ts,tsx}\`, \`./components/**/*.{ts,tsx}\`, dark mode "class", extend theme with brand colors.

8. **postcss.config.mjs** — \`export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\`

## DESIGN PRINCIPLES

- Server Components by default — only mark "use client" when interactivity demands it (useState, onClick, onChange)
- Tailwind utility-first with proper dark mode classes (dark:bg-*, dark:text-*)
- Polished, modern aesthetic: gradients, glassmorphism, rounded-2xl, subtle shadows
- Use lucide-react for icons (already in deps)
- Real images: https://images.unsplash.com/photo-<id>?w=<w>&q=80 OR https://picsum.photos/seed/<keyword>/<w>/<h>
- Mobile-first responsive (sm: md: lg: breakpoints)
- Accessible: proper semantic HTML, aria-label on icon-only buttons, focus rings

## STRUCTURE

- Components in /components — small, focused, prop-typed with TypeScript interfaces
- Multiple pages where the product warrants (app/dashboard/page.tsx, app/pricing/page.tsx, etc.)
- API routes only if the user asks for backend behavior — keep them in app/api/<name>/route.ts using Next.js Route Handlers
- Loading states with app/<route>/loading.tsx where async work happens
- Error states with app/<route>/error.tsx

## DO NOT

- Do not include node_modules
- Do not use pages/ router — App Router only
- Do not import from "../../../"; always use "@/" alias
- Do not include README.md (waste of tokens)
- Do not output assets/ binary files — point to URLs or generate SVGs inline
- Do not use packages outside the dependency list above unless the user's prompt requires it AND you also add it to package.json
- Do not use class components or legacy React patterns`

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'my-app'
}

function pickAnthropicModel(modelName: string | undefined): string {
  const lc = (modelName || '').toLowerCase()
  if (lc.includes('fable')) return 'claude-fable-5'
  if (lc.includes('opus')) return 'claude-opus-4-8'
  if (lc.includes('sonnet')) return 'claude-sonnet-4-6'
  // Haiku default — fits Cloudflare's 100s edge timeout. Sonnet still
  // available via explicit selection in the workspace model picker.
  return 'claude-haiku-4-5-20251001'
}

export async function POST(req: NextRequest) {
  let body: NextjsGenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Auth + plan + monthly-credit gate — parity with /api/builder/generate.
  const gate = await gateBuilderRequest(body.model)
  if (!gate.ok) return gate.response

  const prompt = (body.prompt || '').trim()
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  if (prompt.length > 5000) return NextResponse.json({ error: 'Prompt too long (max 5000 chars)' }, { status: 400 })

  const anthropicKey = body.apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return NextResponse.json({
    error: 'AI generation is not available on this instance — ANTHROPIC_API_KEY is not configured.',
    feature: 'anthropic',
    reason: 'anthropic_unconfigured',
  }, { status: 503 })

  const model = pickAnthropicModel(body.model)
  const client = new Anthropic({ apiKey: anthropicKey })

  const baseMsg = [
    `Build this Next.js 14 App Router project:\n\n${prompt}`,
    body.appName ? `Project name: ${body.appName}` : '',
    body.database && body.database !== 'none' ? `Database: ${body.database} (assume the connection string lives in process.env.DATABASE_URL; do NOT hardcode credentials)` : '',
    body.auth && body.auth !== 'none' ? `Auth: ${body.auth}` : '',
    'Respond with the JSON object only.',
  ].filter(Boolean).join('\n\n')

  // If a reference URL was provided (either explicitly or extracted from
  // the prompt text by the client), scrape it and append the structured
  // context as inspiration.
  const { prompt: userMsg, warning: refWarning } = await augmentPromptWithReference(baseMsg, body.referenceUrl)
  if (refWarning) console.warn('[Next.js Builder]', refWarning)

  // SSE wrap — heartbeats every 15s defeat Cloudflare's 100s edge timeout
  // on long generations. Result lands as a single `result` event.
  return streamJsonWithHeartbeats(async () => {
    let parsed: any, rawText: string, attempts: number, usage = { inputTokens: 0, outputTokens: 0 }
    try {
      const r = await generateJson({
        client,
        model,
        systemPrompt: NEXTJS_SYSTEM_PROMPT,
        userMessage: userMsg,
        validate: (p) => requireFiles(p, ['app/page.tsx', 'app/layout.tsx', 'package.json']),
      })
      parsed = r.parsed; rawText = r.rawText; attempts = r.attempts; usage = r.usage
    } catch (err: any) {
      if (err instanceof GenerateJsonError) {
        console.error('[Next.js Builder] Generation failed after retry:', err.detail)
        throw err
      }
      console.error('[Next.js Builder] Anthropic call failed:', err?.message || err)
      throw new GenerateJsonError(err?.message || 'Generation failed', 502)
    }

    const name: string = typeof parsed.name === 'string' ? parsed.name : 'My App'
    const slug = typeof parsed.slug === 'string' && parsed.slug ? makeSlug(parsed.slug) : makeSlug(name)
    const description: string = typeof parsed.description === 'string' ? parsed.description : ''

    const files: Record<string, string> = {}
    for (const [path, content] of Object.entries(parsed.files)) {
      if (typeof content === 'string' && content.length > 0 && content.length < 100_000) {
        files[path] = content
      }
    }

    const result: NextjsGenerateResponse = {
      files,
      name,
      slug,
      description,
      target: 'nextjs',
      instructions: [
        `Download / save these files into a folder named "${slug}".`,
        `Run "cd ${slug} && npm install && npm run dev".`,
        `Open http://localhost:3000 to see your app.`,
        `To deploy: push to GitHub, then import the repo in Vercel (or Render). Deploy is one-click.`,
      ].join('\n'),
    }

    console.info(`[Next.js Builder] Generated "${name}" — ${Object.keys(files).length} files, ${Math.round(rawText.length / 1024)}KB raw, ${attempts} attempt(s)`)

    try {
      const { recordCompletedBuild } = await import('@/lib/pending-builds')
      await recordCompletedBuild({
        userId: gate.userId, kind: 'nextjs', prompt,
        model, files, name, slug, description,
      })
    } catch (e: any) {
      console.warn('[Next.js Builder] pending_builds upsert failed:', e?.message || e)
    }

    // Meter separately — a shared try meant a pending_builds hiccup
    // silently skipped billing. Skipped for BYOK (user paid Anthropic).
    if (!body.apiKey) {
      try {
        await trackBuilderUsage({
          userId: gate.userId, kind: 'nextjs', model,
          inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, prompt,
        })
      } catch (e: any) {
        console.warn('[Next.js Builder] trackBuilderUsage failed:', e?.message || e)
      }
    }

    return result
  })
}
