import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { generateJson, requireFiles, GenerateJsonError } from '@/lib/llm-json'
import { augmentPromptWithReference } from '@/lib/site-reference'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ReactGenerateRequest {
  prompt: string
  model?: string
  apiKey?: string
  referenceUrl?: string
}

interface ReactGenerateResponse {
  files: Record<string, string>
  name: string
  slug: string
  description: string
  instructions: string
  target: 'react'
}

const REACT_SYSTEM_PROMPT = `You are an expert React developer. Generate a COMPLETE, runnable Vite + React + TypeScript + Tailwind project as JSON.

## OUTPUT FORMAT (STRICT)

Return a single JSON object — no prose, no markdown fences. Schema:
{
  "name": "Human Readable Name",
  "slug": "kebab-case-slug",
  "description": "One-sentence description",
  "files": {
    "src/App.tsx": "...",
    "src/main.tsx": "...",
    "src/index.css": "...",
    "index.html": "...",
    "package.json": "...",
    "vite.config.ts": "...",
    "tsconfig.json": "...",
    "tsconfig.node.json": "...",
    "tailwind.config.ts": "...",
    "postcss.config.js": "..."
  }
}

## REQUIRED FILES (always include)

1. **index.html** — Vite entry. <!DOCTYPE html>, root div with id="root", script tag pointing to /src/main.tsx, proper meta tags + title.

2. **src/main.tsx** — Renders <App /> into #root with React 18 createRoot + StrictMode. Imports './index.css'.

3. **src/App.tsx** — Main component. Real content for the product, not lorem.

4. **src/index.css** — Tailwind @tailwind directives + any custom CSS vars for theme.

5. **package.json** — Use these EXACT versions:
   {
     "name": "<slug>",
     "private": true,
     "version": "0.0.1",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "react-router-dom": "^6.28.0",
       "lucide-react": "^0.456.0",
       "clsx": "^2.1.1"
     },
     "devDependencies": {
       "@types/react": "^18.3.12",
       "@types/react-dom": "^18.3.1",
       "@vitejs/plugin-react": "^4.3.3",
       "autoprefixer": "^10.4.20",
       "postcss": "^8.4.49",
       "tailwindcss": "^3.4.15",
       "typescript": "^5.6.3",
       "vite": "^5.4.11"
     }
   }

6. **vite.config.ts** — \`import { defineConfig } from 'vite'\` + \`@vitejs/plugin-react\`. Default port 5173. Export default defineConfig({ plugins: [react()] }).

7. **tsconfig.json** — Standard Vite React TS config with strict true, jsx "react-jsx", paths { "@/*": ["./src/*"] }, references to tsconfig.node.json.

8. **tsconfig.node.json** — For vite.config.ts. composite true, skipLibCheck, module "ESNext", moduleResolution "bundler".

9. **tailwind.config.ts** — content scans \`./index.html\`, \`./src/**/*.{ts,tsx}\`. darkMode "class". Extend theme with brand colors.

10. **postcss.config.js** — \`export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\`

## DESIGN PRINCIPLES

- Functional components with hooks. No class components.
- TypeScript everywhere. Proper interfaces / types for props and state.
- Tailwind utility-first with dark mode (dark:bg-* dark:text-*)
- Polished aesthetic: gradients, glassmorphism, rounded corners, subtle shadows
- Use lucide-react for icons (already in deps)
- React Router (react-router-dom) for multi-page apps. Use <BrowserRouter>, <Routes>, <Route>. Keep page components in src/pages/.
- Mobile-first responsive
- Accessible: semantic HTML, aria-labels, focus rings
- Images via https://images.unsplash.com/photo-<id>?w=<w>&q=80 OR picsum.photos

## STRUCTURE

- Components in src/components/, pages in src/pages/, hooks in src/hooks/, utils in src/lib/
- Use '@/' alias for imports — NOT '../../../'
- Generate at least 2-3 pages if the product warrants navigation

## DO NOT

- Do not include node_modules
- Do not use Create React App / craco — Vite only
- Do not include README.md (waste of tokens)
- Do not output binary assets — point to URLs or generate SVGs inline
- Do not use packages outside the dependency list above unless the prompt requires it AND you add them to package.json`

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'my-app'
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

  let body: ReactGenerateRequest
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const prompt = (body.prompt || '').trim()
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  if (prompt.length > 5000) return NextResponse.json({ error: 'Prompt too long (max 5000 chars)' }, { status: 400 })

  const anthropicKey = body.apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })

  const client = new Anthropic({ apiKey: anthropicKey })

  const baseMsg = `Build this Vite + React + TS + Tailwind project:\n\n${prompt}\n\nRespond with the JSON object only.`
  const { prompt: userMsg, warning: refWarning } = await augmentPromptWithReference(baseMsg, body.referenceUrl)
  if (refWarning) console.warn('[React Builder]', refWarning)

  let parsed: any
  let rawText: string
  let attempts: number
  try {
    const result = await generateJson({
      client,
      model: pickAnthropicModel(body.model),
      systemPrompt: REACT_SYSTEM_PROMPT,
      userMessage: userMsg,
      validate: (p) => requireFiles(p, ['src/App.tsx', 'src/main.tsx', 'index.html', 'package.json']),
    })
    parsed = result.parsed
    rawText = result.rawText
    attempts = result.attempts
  } catch (err: any) {
    if (err instanceof GenerateJsonError) {
      console.error('[React Builder] Generation failed after retry:', err.detail)
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[React Builder] Anthropic call failed:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 502 })
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

  const result: ReactGenerateResponse = {
    files, name, slug, description, target: 'react',
    instructions: [
      `Save these files into "${slug}".`,
      `cd ${slug} && npm install && npm run dev`,
      `Open http://localhost:5173`,
      `Deploy: push to GitHub, import in Vercel / Netlify / Cloudflare Pages — works on all of them.`,
    ].join('\n'),
  }

  console.log(`[React Builder] Generated "${name}" — ${Object.keys(files).length} files, ${Math.round(rawText.length / 1024)}KB raw, ${attempts} attempt(s)`)
  return NextResponse.json(result)
}
