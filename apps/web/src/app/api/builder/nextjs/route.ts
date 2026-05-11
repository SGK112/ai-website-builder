import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Shape mirrors /api/builder/app so the workspace UI can reuse the same renderer.
interface NextjsGenerateRequest {
  prompt: string
  model?: string
  apiKey?: string
  appName?: string
  database?: 'mongodb' | 'postgres' | 'none'
  auth?: 'nextauth' | 'clerk' | 'none'
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

function safeJsonParse(text: string): any | null {
  let s = text.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim()
  }
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first < 0 || last <= first) return null
  const slice = s.slice(first, last + 1)
  try { return JSON.parse(slice) } catch {}
  try { return JSON.parse(slice.replace(/,(\s*[}\]])/g, '$1')) } catch {}
  return null
}

function pickAnthropicModel(modelName: string | undefined): string {
  const lc = (modelName || '').toLowerCase()
  if (lc.includes('opus')) return 'claude-opus-4-7'
  if (lc.includes('haiku')) return 'claude-haiku-4-5-20251001'
  return 'claude-sonnet-4-6'
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: NextjsGenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prompt = (body.prompt || '').trim()
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  if (prompt.length > 5000) return NextResponse.json({ error: 'Prompt too long (max 5000 chars)' }, { status: 400 })

  const anthropicKey = body.apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })

  const model = pickAnthropicModel(body.model)
  const client = new Anthropic({ apiKey: anthropicKey })

  const userMsg = [
    `Build this Next.js 14 App Router project:\n\n${prompt}`,
    body.appName ? `Project name: ${body.appName}` : '',
    body.database && body.database !== 'none' ? `Database: ${body.database} (assume the connection string lives in process.env.DATABASE_URL; do NOT hardcode credentials)` : '',
    body.auth && body.auth !== 'none' ? `Auth: ${body.auth}` : '',
    'Respond with the JSON object only.',
  ].filter(Boolean).join('\n\n')

  let rawText: string
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      system: NEXTJS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    })
    const block = response.content.find(b => b.type === 'text')
    rawText = block && block.type === 'text' ? block.text : ''
  } catch (err: any) {
    console.error('[Next.js Builder] Anthropic call failed:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 502 })
  }

  const parsed = safeJsonParse(rawText)
  if (!parsed || typeof parsed !== 'object' || !parsed.files || typeof parsed.files !== 'object') {
    console.error('[Next.js Builder] Could not parse response. First 300 chars:', rawText.slice(0, 300))
    return NextResponse.json({ error: 'Model output was not valid JSON. Try a more specific prompt.' }, { status: 502 })
  }

  const name: string = typeof parsed.name === 'string' ? parsed.name : 'My App'
  const slug = typeof parsed.slug === 'string' && parsed.slug ? makeSlug(parsed.slug) : makeSlug(name)
  const description: string = typeof parsed.description === 'string' ? parsed.description : ''

  const required = ['app/page.tsx', 'app/layout.tsx', 'package.json']
  const missing = required.filter(f => !parsed.files[f])
  if (missing.length > 0) console.warn('[Next.js Builder] Missing required files:', missing.join(', '))

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

  console.log(`[Next.js Builder] Generated "${name}" — ${Object.keys(files).length} files, ${Math.round(rawText.length / 1024)}KB raw`)
  return NextResponse.json(result)
}
