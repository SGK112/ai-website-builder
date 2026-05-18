import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { generateJson, requireFiles, GenerateJsonError } from '@/lib/llm-json'
import { augmentPromptWithReference } from '@/lib/site-reference'

export const dynamic = 'force-dynamic'
// 300s matches /api/builder/generate. The previous 60s ceiling forced
// Cloudflare-edge 524s on big project generations.
export const maxDuration = 300

interface AstroGenerateRequest {
  prompt: string
  model?: string
  apiKey?: string
  referenceUrl?: string
}

interface AstroGenerateResponse {
  files: Record<string, string>
  name: string
  slug: string
  description: string
  instructions: string
  target: 'astro'
}

const ASTRO_SYSTEM_PROMPT = `You are an expert Astro developer. Generate a COMPLETE, runnable Astro 4 + Tailwind project as JSON. Astro is perfect for content-heavy sites — marketing pages, blogs, docs — that ship near-zero JS.

## OUTPUT FORMAT (STRICT)

Return a single JSON object — no prose, no markdown fences. Schema:
{
  "name": "Human Readable Name",
  "slug": "kebab-case-slug",
  "description": "One-sentence description",
  "files": {
    "src/pages/index.astro": "...",
    "src/layouts/Layout.astro": "...",
    "src/components/Hero.astro": "...",
    "src/styles/global.css": "...",
    "astro.config.mjs": "...",
    "package.json": "...",
    "tsconfig.json": "...",
    "tailwind.config.mjs": "..."
  }
}

## REQUIRED FILES (always include)

1. **src/pages/index.astro** — Home page. Uses Layout.astro. Real content.

2. **src/layouts/Layout.astro** — Root layout with html/body, slot for children, ViewTransitions enabled, proper <head> with title prop, meta, viewport, Tailwind CSS import.

3. **src/styles/global.css** — Tailwind @tailwind directives + CSS variables for theme.

4. **package.json** — Use these EXACT versions:
   {
     "name": "<slug>",
     "type": "module",
     "version": "0.0.1",
     "scripts": {
       "dev": "astro dev",
       "start": "astro dev",
       "build": "astro check && astro build",
       "preview": "astro preview",
       "astro": "astro"
     },
     "dependencies": {
       "astro": "^4.16.18",
       "@astrojs/tailwind": "^5.1.4",
       "@astrojs/check": "^0.9.4",
       "tailwindcss": "^3.4.15",
       "typescript": "^5.6.3"
     }
   }

5. **astro.config.mjs** — \`import { defineConfig } from 'astro/config'\` + \`import tailwind from '@astrojs/tailwind'\`. Export defineConfig({ integrations: [tailwind({ applyBaseStyles: false })] }) — applyBaseStyles false because we own global.css.

6. **tsconfig.json** — \`{ "extends": "astro/tsconfigs/strict" }\`

7. **tailwind.config.mjs** — content scans \`./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}\`. darkMode "class". Extend theme.

## DESIGN PRINCIPLES

- Astro components (.astro) for static content
- Use frontmatter (between --- fences) at top of .astro for any data fetching / props
- Tailwind for styling, dark mode aware
- Use Astro's <Image /> from astro:assets when working with local images, OR plain <img> for external URLs
- Polished aesthetic: gradients, rounded corners, hover transitions
- Mobile-first responsive
- Semantic HTML, accessibility
- Images: https://images.unsplash.com/photo-<id>?w=<w>&q=80 OR picsum.photos
- For ANY interactivity, add small <script> islands or use react/vue/svelte islands (but prefer no-JS first)

## STRUCTURE

- Pages in src/pages/ — files become routes (index.astro = /, blog.astro = /blog, blog/[slug].astro = /blog/:slug)
- Components in src/components/
- Layouts in src/layouts/
- Use Astro Content Collections (src/content/) for blog posts / docs if the prompt warrants
- Multiple pages where the product warrants (about.astro, pricing.astro, blog.astro, etc.)

## DO NOT

- Do not include node_modules
- Do not include README.md (waste of tokens)
- Do not add unused integrations (@astrojs/react, @astrojs/vue, etc.) unless the prompt needs them — and if you do, also add them to package.json
- Do not output binary assets — point to URLs or generate SVGs inline
- Do not use packages outside the dependency list above unless the prompt requires it AND you also add them to package.json`

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'my-app'
}

function pickAnthropicModel(modelName: string | undefined): string {
  const lc = (modelName || '').toLowerCase()
  if (lc.includes('opus')) return 'claude-opus-4-7'
  if (lc.includes('sonnet')) return 'claude-sonnet-4-6'
  // Haiku default — faster, fits Cloudflare's 100s edge timeout. Sonnet still
  // available via explicit selection in the workspace model picker.
  return 'claude-haiku-4-5-20251001'
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: AstroGenerateRequest
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const prompt = (body.prompt || '').trim()
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  if (prompt.length > 5000) return NextResponse.json({ error: 'Prompt too long (max 5000 chars)' }, { status: 400 })

  const anthropicKey = body.apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })

  const client = new Anthropic({ apiKey: anthropicKey })

  const baseMsg = `Build this Astro 4 + Tailwind project:\n\n${prompt}\n\nRespond with the JSON object only.`
  const { prompt: userMsg, warning: refWarning } = await augmentPromptWithReference(baseMsg, body.referenceUrl)
  if (refWarning) console.warn('[Astro Builder]', refWarning)

  let parsed: any
  let rawText: string
  let attempts: number
  try {
    const result = await generateJson({
      client,
      model: pickAnthropicModel(body.model),
      systemPrompt: ASTRO_SYSTEM_PROMPT,
      userMessage: userMsg,
      validate: (p) => requireFiles(p, ['src/pages/index.astro', 'package.json']),
    })
    parsed = result.parsed
    rawText = result.rawText
    attempts = result.attempts
  } catch (err: any) {
    if (err instanceof GenerateJsonError) {
      console.error('[Astro Builder] Generation failed after retry:', err.detail)
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[Astro Builder] Anthropic call failed:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 502 })
  }

  const name: string = typeof parsed.name === 'string' ? parsed.name : 'My Site'
  const slug = typeof parsed.slug === 'string' && parsed.slug ? makeSlug(parsed.slug) : makeSlug(name)
  const description: string = typeof parsed.description === 'string' ? parsed.description : ''

  const files: Record<string, string> = {}
  for (const [path, content] of Object.entries(parsed.files)) {
    if (typeof content === 'string' && content.length > 0 && content.length < 100_000) {
      files[path] = content
    }
  }

  const result: AstroGenerateResponse = {
    files, name, slug, description, target: 'astro',
    instructions: [
      `Save these files into "${slug}".`,
      `cd ${slug} && npm install && npm run dev`,
      `Open http://localhost:4321`,
      `Deploy: Cloudflare Pages / Netlify / Vercel — all run \`astro build\` and serve the static output.`,
    ].join('\n'),
  }

  console.log(`[Astro Builder] Generated "${name}" — ${Object.keys(files).length} files, ${Math.round(rawText.length / 1024)}KB raw, ${attempts} attempt(s)`)
  return NextResponse.json(result)
}
