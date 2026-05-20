import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { generateJson, requireFiles, GenerateJsonError, streamJsonWithHeartbeats } from '@/lib/llm-json'
import { augmentPromptWithReference } from '@/lib/site-reference'
import { gateBuilderRequest, trackBuilderUsage } from '@/lib/builder-gate'

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

const APP_SYSTEM_PROMPT = `You are an expert React Native / Expo developer. Generate a COMPLETE, runnable Expo project as JSON.

## OUTPUT FORMAT (STRICT)

Return a single JSON object — no prose, no markdown fences. Schema:
{
  "name": "Human Readable App Name",
  "slug": "kebab-case-slug",
  "description": "One-sentence description shown in the App Store",
  "files": {
    "App.tsx": "...full file contents...",
    "package.json": "...",
    "app.json": "...",
    "babel.config.js": "...",
    "tsconfig.json": "...",
    "screens/HomeScreen.tsx": "...",
    "components/Button.tsx": "..."
  }
}

## REQUIRED FILES (always include these)

1. **App.tsx** — Main entry. Use NavigationContainer from @react-navigation/native with a Stack.Navigator. Wire up screens. SafeAreaProvider at root. StatusBar style="auto".

2. **package.json** — Use these EXACT dependency versions (latest Expo SDK 52 compatible):
   {
     "name": "<slug>",
     "version": "1.0.0",
     "main": "expo-router/entry",
     "scripts": {
       "start": "expo start",
       "android": "expo start --android",
       "ios": "expo start --ios",
       "web": "expo start --web"
     },
     "dependencies": {
       "expo": "~52.0.0",
       "expo-status-bar": "~2.0.0",
       "expo-router": "~4.0.0",
       "expo-constants": "~17.0.0",
       "expo-linking": "~7.0.0",
       "react": "18.3.1",
       "react-native": "0.76.5",
       "react-native-safe-area-context": "4.12.0",
       "react-native-screens": "~4.4.0",
       "@react-navigation/native": "^7.0.0",
       "@react-navigation/native-stack": "^7.0.0"
     },
     "devDependencies": {
       "@babel/core": "^7.25.2",
       "@types/react": "~18.3.12",
       "typescript": "^5.3.3"
     },
     "private": true
   }

3. **app.json** — Expo config. Fields: name, slug, version "1.0.0", orientation "portrait",
   icon "./assets/icon.png", scheme matching slug, userInterfaceStyle "automatic",
   splash { image "./assets/splash.png", resizeMode "contain", backgroundColor "#0f172a" },
   assetBundlePatterns ["**/*"], ios { supportsTablet true, bundleIdentifier "com.example.<slug>" },
   android { adaptiveIcon { foregroundImage "./assets/adaptive-icon.png", backgroundColor "#0f172a" }, package "com.example.<slug>" },
   web { favicon "./assets/favicon.png" }

4. **babel.config.js** — module.exports with presets ['babel-preset-expo']

5. **tsconfig.json** — extends "expo/tsconfig.base", strict true

## SCREEN DESIGN PRINCIPLES

- Use React Native StyleSheet.create — NOT inline styles
- Dark mode aware: read useColorScheme() from react-native, branch styles
- Modern, polished design — gradients (expo-linear-gradient if needed), rounded cards, shadows
- Real content: realistic copy, fake-but-believable data
- Navigation: bottom tabs OR stack with header — choose based on app type
- Accessibility: accessibilityLabel on interactive elements, accessible roles
- Use Pressable not TouchableOpacity (newer API)

## CONTENT RULES

- Generate ~3-5 screens minimum
- Each screen 60-200 lines, real interactivity (state, lists, inputs as appropriate)
- Use TypeScript with proper interfaces for data shapes
- No external image URLs that require auth — use https://picsum.photos/seed/<keyword>/<w>/<h> or solid color/gradient placeholders

## DO NOT

- Do not include node_modules
- Do not output README.md (waste of tokens — user knows how to run Expo)
- Do not generate prebuilt icons or images (instructions tell user to add)
- Do not use packages outside the dependency list above
- Do not include native code (ios/, android/ folders) — Expo Managed Workflow only`

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

  // Optional source website to convert. Not counted against the 5000-char
  // prompt cap — it's reference material, not the instruction.
  //
  // A raw AI-generated page is routinely 80k+ chars, but most of that is
  // inline <svg> icons, base64 data URIs and whitespace — noise that doesn't
  // port to React Native. Dumping all of it made the (non-streaming) two-pass
  // generation run long enough to drop the SSE connection mid-build
  // ("Stream ended before result arrived"). So we distil: pull the colour
  // palette out first, then strip the noise and cap hard. What remains is the
  // copy, navigation and section structure the converter actually needs.
  let sourceContext = ''
  if (typeof body.sourceHtml === 'string' && body.sourceHtml.trim()) {
    const raw = body.sourceHtml
    const palette = Array.from(
      new Set(raw.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]{1,40}\)/g) || []),
    ).slice(0, 24)
    const distilled = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/(["'(])data:[^"')]{20,}(["')])/gi, '$1data-uri$2')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30_000)
    sourceContext =
      `\n\n## SOURCE WEBSITE TO CONVERT\n` +
      `Rebuild THIS existing website as the app. Match its branding, copy, ` +
      `navigation, and section structure — translate each major section ` +
      `into a screen or component. Do not invent unrelated content.\n` +
      (palette.length ? `\nColour palette: ${palette.join(', ')}\n` : '') +
      `\nSource markup (distilled — SVG/scripts/styles stripped):\n` +
      '```html\n' + distilled + '\n```\n'
  }

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
      const r = await generateJson({
        client,
        model,
        systemPrompt: APP_SYSTEM_PROMPT,
        userMessage: userMsg,
        validate: (p) => requireFiles(p, ['App.tsx', 'package.json', 'app.json']),
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
