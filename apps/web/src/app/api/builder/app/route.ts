import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { generateJsonStreaming, requireFiles, GenerateJsonError, streamJsonWithHeartbeats } from '@/lib/llm-json'
import { augmentPromptWithReference } from '@/lib/site-reference'
import { gateBuilderRequest, trackBuilderUsage } from '@/lib/builder-gate'
import { MOBILE_APP_TEMPLATE } from '@/lib/templates/mobile-app'

export const dynamic = 'force-dynamic'
// 300s matches /api/builder/generate. The previous 60s ceiling forced
// Cloudflare-edge 524s on big Expo projects long before Render itself
// would have timed out.
export const maxDuration = 300

// ---------- Types ----------

interface AppGenerateRequest {
  prompt: string
  model?: string
  apiKey?: string
  appName?: string
  bundleId?: string
  referenceUrl?: string
  // Raw HTML of an existing website to rebuild as the app (the workspace's
  // "Convert to App" action). Reference context — NOT subject to the prompt
  // length cap, since it's the source material, not the instruction.
  sourceHtml?: string
}

interface AppGenerateResponse {
  files: Record<string, string>
  name: string
  slug: string
  description: string
  instructions: string
}

// ---------- System prompt ----------

const APP_SYSTEM_PROMPT = `You are an expert React Native / Expo developer. Generate a COMPLETE, runnable Expo app as JSON.

## OUTPUT FORMAT (STRICT)

Return a single JSON object — no prose, no markdown fences. Schema:
{
  "name": "Human Readable App Name",
  "slug": "kebab-case-slug",
  "description": "One-sentence description shown in the App Store",
  "files": {
    "App.tsx": "...full file contents...",
    "src/theme.ts": "...",
    "src/data.ts": "...",
    "src/components/TabBar.tsx": "...",
    "src/components/Card.tsx": "...",
    "src/screens/HomeScreen.tsx": "..."
  }
}

## RUNTIME — READ CAREFULLY

The build supplies package.json, app.json, tsconfig.json and the entry
file. DO NOT author any of them — anything you put there is discarded.

You may import ONLY from these packages — nothing else is installed:
  • react
  • react-native
  • expo-status-bar
  • expo-linear-gradient   — for gradient backgrounds (see BACKGROUNDS below)
There is NO navigation library and NO expo-router. Do NOT import
@react-navigation/*, expo-router, react-native-screens,
react-native-safe-area-context, or any other package — the app will fail to
build. Switch between screens with React useState, exactly like the
structure below.

## REQUIRED STRUCTURE (mirror this exactly)

- **App.tsx** — \`export default function App()\`. Holds the active-tab
  state with useState, conditionally renders the matching screen, and
  renders <TabBar/> below it. Import { StatusBar } from 'expo-status-bar'.
- **src/theme.ts** — exports EXACTLY ONE thing: \`export const theme\`. It
  is a single object holding every design token — bg, surface, text, muted,
  border, primary, primaryText, radius, gap, brand colours, AND \`gradients\`:
  a nested map of named gradients reached as \`theme.gradients.hero\`, each
  shaped \`{ colors: string[]; start?: {x:number;y:number}; end?: {x:number;y:number} }\`.
  Do NOT add a second export — \`gradients\` is a PROPERTY of \`theme\`, never
  its own export. Every value the app reads (colour, spacing, gradient) is
  accessed as \`theme.something\`; \`theme.gradients\` is always defined.
- **src/data.ts** — exports the app's content: app name + tagline, a
  \`TabKey\` union type, a \`tabs\` array of { key, label, icon }, and the
  data each screen renders. ALL copy lives here.
- **src/components/TabBar.tsx** — bottom tab bar. Props: { tabs, active, onChange }.
- **src/components/*.tsx** — small reusable components (Card, etc.).
- **src/screens/*.tsx** — one file per screen, 3-5 screens. Each is a
  NAMED export, reads from src/theme + src/data, wraps content in ScrollView.

## BACKGROUNDS & GRADIENTS

The source site's backgrounds and gradients ARE its visual identity —
carry them over, do not flatten them to a plain colour.
- Define every gradient on \`theme.gradients\` in \`theme.ts\` (colours from
  the "Gradients" / "Colour palette" context below, in source order).
- Render them with LinearGradient from 'expo-linear-gradient':
  \`import { LinearGradient } from 'expo-linear-gradient'\`, then
  \`<LinearGradient colors={theme.gradients.hero.colors} start={...} end={...} style={...}>\`.
- The hero / header and any section that is gradient-backed on the site
  should be gradient-backed in the app. A LinearGradient with
  \`StyleSheet.absoluteFill\`, or wrapping the screen, is the standard pattern.
- Match the source's gradient direction (a 135deg CSS gradient ≈ start
  {x:0,y:0} end {x:1,y:1}); solid section backgrounds come from theme colours.

## SCREEN DESIGN

- React Native StyleSheet.create — never inline literal style objects.
- Real, believable copy and data — no lorem ipsum, no TODO placeholders.
- Modern and polished: rounded cards, subtle borders, clear type hierarchy.
- Pressable (not TouchableOpacity) for taps.
- No <Image> with external URLs — use coloured Views, gradients, or emoji as visuals.
- TypeScript with a proper interface for every data shape.

## DO NOT

- Do not author package.json / app.json / tsconfig.json / babel.config.js / index.ts.
- Do not import any package other than react, react-native, expo-status-bar, expo-linear-gradient.
- Do not use a navigation library — switch screens with useState.
- Do not include node_modules, README.md, or native ios/ / android/ folders.`

// ---------- Helpers ----------

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'my-app'
}

function pickAnthropicModel(modelName: string | undefined): string {
  const lc = (modelName || '').toLowerCase()
  if (lc.includes('opus')) return 'claude-opus-4-7'
  if (lc.includes('sonnet')) return 'claude-sonnet-4-6'
  // Default to Haiku 4.5 — 3-5x faster than Sonnet on a full Expo project,
  // typically lands in 25-45s vs Sonnet's 90-180s (which was tripping the
  // Cloudflare 100s timeout = HTTP 524). Sonnet still selectable explicitly.
  return 'claude-haiku-4-5-20251001'
}

// Distil a source website into compact, signal-dense conversion context.
// A raw AI-generated page is routinely 80k+ chars, mostly inline <svg>,
// base64 data URIs and whitespace — noise that doesn't port to React Native
// and ran the generation long enough to drop the SSE connection. We pull the
// colour palette + CSS gradients out first (the <style> blocks that define
// them are about to be stripped), then strip the noise and cap hard. Returns
// the "## SOURCE WEBSITE" prompt block, or '' when there's no usable source.
function distillSourceWebsite(rawHtml: string): string {
  const raw = rawHtml.trim()
  if (!raw) return ''
  const palette = Array.from(
    new Set(raw.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]{1,40}\)/g) || []),
  ).slice(0, 24)
  // The inner alternation tolerates one level of nested parens (rgba() stops).
  const gradients = Array.from(
    new Set(raw.match(/(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/gi) || []),
  ).slice(0, 10)
  const distilled = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(["'(])data:[^"')]{20,}(["')])/gi, '$1data-uri$2')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30_000)
  return (
    `\n\n## SOURCE WEBSITE TO CONVERT\n` +
    `Rebuild THIS existing website as the app. Match its branding, copy, ` +
    `navigation, and section structure — translate each major section ` +
    `into a screen or component. Do not invent unrelated content.\n` +
    (palette.length ? `\nColour palette: ${palette.join(', ')}\n` : '') +
    (gradients.length
      ? `\nGradients — rebuild these as expo-linear-gradient backgrounds:\n${gradients.map((g) => `  - ${g}`).join('\n')}\n`
      : '') +
    `\nSource markup (distilled — SVG/scripts/styles stripped):\n` +
    '```html\n' + distilled + '\n```\n'
  )
}

// ---------- Route ----------

export async function POST(req: NextRequest) {
  let body: AppGenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Auth + plan + monthly-credit gate — parity with /api/builder/generate.
  // Before this, multi-target builders had ZERO metering; signed-in free
  // users could burn unmetered Anthropic credits on Expo/Next/Astro/React.
  const gate = await gateBuilderRequest(body.model)
  if (!gate.ok) return gate.response

  const prompt = (body.prompt || '').trim()
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }
  if (prompt.length > 5000) {
    return NextResponse.json({ error: 'Prompt too long (max 5000 chars)' }, { status: 400 })
  }

  const anthropicKey = body.apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({
      error: 'AI generation is not available on this instance — ANTHROPIC_API_KEY is not configured. Add your own key in Settings or contact support.',
      feature: 'anthropic',
      reason: 'anthropic_unconfigured',
    }, { status: 503 })
  }

  const model = pickAnthropicModel(body.model)
  const client = new Anthropic({ apiKey: anthropicKey })

  // Optional source website to convert (the workspace's "Convert to App").
  // Distilled, not raw — see distillSourceWebsite. Not counted against the
  // 5000-char prompt cap: it's reference material, not the instruction.
  const sourceContext =
    typeof body.sourceHtml === 'string' ? distillSourceWebsite(body.sourceHtml) : ''

  const baseMsg = `Build this Expo / React Native app:\n\n${prompt}\n${sourceContext}\n${body.appName ? `App name: ${body.appName}\n` : ''}${body.bundleId ? `Bundle ID: ${body.bundleId}\n` : ''}\nRespond with the JSON object only.`
  const { prompt: userMsg, warning: refWarning } = await augmentPromptWithReference(baseMsg, body.referenceUrl)
  if (refWarning) console.warn('[App Builder]', refWarning)

  // Wrap the long-running Anthropic call in an SSE stream so Cloudflare's
  // 100s edge timeout doesn't 524 the user. Heartbeats every 15s keep the
  // connection alive; the final result lands as a single `result` event.
  return streamJsonWithHeartbeats(async () => {
    let parsed: any
    let rawText: string
    let attempts: number
    try {
      const r = await generateJsonStreaming({
        client,
        model,
        systemPrompt: APP_SYSTEM_PROMPT,
        userMessage: userMsg,
        validate: (p) => requireFiles(p, ['App.tsx']),
      })
      parsed = r.parsed
      rawText = r.rawText
      attempts = r.attempts
    } catch (err: any) {
      if (err instanceof GenerateJsonError) {
        console.error('[App Builder] Generation failed after retry:', err.detail)
        throw err // streamJsonWithHeartbeats forwards GenerateJsonError shape
      }
      console.error('[App Builder] Anthropic call failed:', err?.message || err)
      throw new GenerateJsonError(err?.message || 'Generation failed', 502)
    }

    const name: string = typeof parsed.name === 'string' ? parsed.name : 'My App'
    const slug = typeof parsed.slug === 'string' && parsed.slug ? makeSlug(parsed.slug) : makeSlug(name)
    const description: string = typeof parsed.description === 'string' ? parsed.description : ''

    // Trim any non-string file values defensively
    const files: Record<string, string> = {}
    for (const [path, content] of Object.entries(parsed.files)) {
      if (typeof content === 'string' && content.length > 0 && content.length < 100_000) {
        files[path] = content
      }
    }

    // Force the scaffolding files to the verified Expo-template versions.
    // The model only authors components; when it picked its own dependency
    // versions it produced unresolvable sets that broke `npm install` in the
    // WebContainer preview ("npm install failed (exit 1)"). These exact files
    // are known to install and run `expo start --web`. Any package.json /
    // app.json / config the model emitted is discarded here.
    const scaffold = MOBILE_APP_TEMPLATE.files as Record<string, string>
    files['package.json'] = scaffold['package.json']
    files['tsconfig.json'] = scaffold['tsconfig.json']
    files['index.ts'] = scaffold['index.ts']
    delete files['babel.config.js']
    delete files['index.js']
    delete files['App.js']
    try {
      const appJson = JSON.parse(scaffold['app.json'])
      if (appJson.expo) {
        appJson.expo.name = name
        appJson.expo.slug = slug
      }
      files['app.json'] = JSON.stringify(appJson, null, 2) + '\n'
    } catch {
      files['app.json'] = scaffold['app.json']
    }

    const result: AppGenerateResponse = {
      files,
      name,
      slug,
      description,
      instructions: [
        `Download / save these files into a folder named "${slug}".`,
        `Run "npx create-expo-app@latest <slug> --template blank-typescript" first if you want a clean starting point with prebuilt assets.`,
        `Then "cd ${slug} && npm install && npx expo start".`,
        `Press i (iOS), a (Android), or w (web) in the Expo CLI to launch.`,
        `To ship to TestFlight: configure EAS (eas.json), then "eas build -p ios --profile production".`,
      ].join('\n'),
    }

    console.info(`[App Builder] Generated "${name}" — ${Object.keys(files).length} files, ${Math.round(rawText.length / 1024)}KB raw, ${attempts} attempt(s)`)

    // Persist so user can close the tab and resume on return. Fire-and-forget.
    try {
      const { recordCompletedBuild } = await import('@/lib/pending-builds')
      await recordCompletedBuild({
        userId: gate.userId,
        kind: 'expo',
        prompt,
        model,
        files,
        name,
        slug,
        description,
      })
      // Track usage so admin analytics + plan-limit counters reflect
      // multi-target builds (was a billing blind spot before this gate).
      await trackBuilderUsage({
        userId: gate.userId,
        kind: 'expo',
        model,
        rawSize: rawText.length,
        prompt,
      })
    } catch (e: any) {
      console.warn('[App Builder] pending_builds upsert failed:', e?.message || e)
    }

    return result
  })
}
