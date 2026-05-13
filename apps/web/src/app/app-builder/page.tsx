'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Smartphone, Loader2, FileCode, Download, Sparkles, AlertCircle, Globe, Code2, Boxes, FileText, Play, Eye, MessageSquare, Wrench, Rocket, ExternalLink } from 'lucide-react'

// WebContainer preview is client-only and pulls in the @webcontainer/api
// worker — dynamic() so it doesn't ship in SSR / initial bundle.
const WebContainerPreview = dynamic(
  () => import('@/components/WebContainerPreview').then((m) => m.WebContainerPreview),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading runtime…</div> }
)

// Agent chat panel — refinement loop with tool use. Also client-only.
const AgentChatPanel = dynamic(
  () => import('@/components/AgentChatPanel').then((m) => m.AgentChatPanel),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading agent…</div> }
)

// HtmlPreview — for the website target. No WebContainer needed, just iframe srcDoc.
const HtmlPreview = dynamic(
  () => import('@/components/HtmlPreview').then((m) => m.HtmlPreview),
  { ssr: false }
)

type Target = 'website' | 'expo' | 'nextjs' | 'react' | 'astro'

interface AppResult {
  files: Record<string, string>
  name: string
  slug: string
  description: string
  instructions: string
  target?: Target
}

const TARGETS: Record<Target, {
  label: string
  description: string
  apiPath: string
  icon: typeof Smartphone
  examples: string[]
  runHint: string
  // For static HTML the generate endpoint streams SSE deltas instead of
  // returning a JSON files object — submit() branches on this flag.
  isStreamingHtml?: boolean
}> = {
  website: {
    label: 'Website',
    description: 'Single-page static HTML with Tailwind. Instant preview, instant deploy. Best for landing pages, marketing sites, portfolios.',
    apiPath: '/api/builder/generate',
    icon: Globe,
    examples: [
      'A restaurant landing page with menu, reservations, hours, and chef bio',
      'A portfolio for a freelance designer with project case studies and contact',
      'A SaaS marketing page with hero, features, pricing tiers, and FAQ',
      'A photographer site with masonry gallery and booking form',
      'A coffee shop landing page with menu, location map, and Instagram feed',
      'An author landing page with book covers, reviews, and email signup',
    ],
    runHint: 'Open index.html in any browser, or deploy to Vercel/Netlify with one click.',
    isStreamingHtml: true,
  },
  expo: {
    label: 'Mobile App',
    description: 'React Native + Expo. Runs on iOS, Android, and web.',
    apiPath: '/api/builder/app',
    icon: Smartphone,
    examples: [
      'A fitness tracker with daily step counting, workout history, and weekly progress charts',
      'A recipe app with search, favorites, and step-by-step cooking timers',
      'A habit tracker with streak counts and weekly stats',
      'A meditation app with timers, ambient sounds, and a daily quote',
      'A pomodoro timer with task list and session history',
      'A weather app with 5-day forecast and saved locations',
    ],
    runHint: 'cd <slug> && npm install && npx expo start',
  },
  nextjs: {
    label: 'Next.js Web App',
    description: 'Next.js 14 App Router + Tailwind + TypeScript. Best for full-stack apps with API routes.',
    apiPath: '/api/builder/nextjs',
    icon: Globe,
    examples: [
      'A SaaS landing page with pricing tiers, testimonials, and a working signup form',
      'A blog with markdown posts, tag filtering, and an RSS feed',
      'A dashboard with sidebar nav, KPI cards, a sortable data table, and dark mode',
      'A documentation site with versioned docs, search, and code highlighting',
      'A portfolio with project case studies, animated transitions, and a contact form',
      'An e-commerce storefront with product grid, cart drawer, and Stripe checkout placeholder',
    ],
    runHint: 'cd <slug> && npm install && npm run dev',
  },
  react: {
    label: 'React SPA',
    description: 'Vite + React + TypeScript + Tailwind. Single-page app with React Router. Fast dev server.',
    apiPath: '/api/builder/react',
    icon: Boxes,
    examples: [
      'A kanban board with drag-and-drop columns, task cards, and local persistence',
      'A multi-page expense tracker with categories, charts, and CSV import/export',
      'A chat UI shell with sidebar conversations, message thread, and typing indicator',
      'A simple admin panel with sortable users table, role filter, and inline edit',
      'A markdown notes app with sidebar list, search, and live preview pane',
      'A photo gallery with masonry layout, lightbox, and tag filtering',
    ],
    runHint: 'cd <slug> && npm install && npm run dev',
  },
  astro: {
    label: 'Astro Site',
    description: 'Astro 4 + Tailwind. Ships near-zero JS. Best for marketing pages, blogs, docs.',
    apiPath: '/api/builder/astro',
    icon: FileText,
    examples: [
      'A startup marketing site with hero, features grid, customer logos, pricing, FAQ, and footer',
      'A personal blog with Astro Content Collections, tag pages, and an RSS feed',
      'A documentation site with sidebar nav, prose styling, and a search box',
      'A photography portfolio with full-bleed image grid and project case studies',
      'A landing page for a launch with countdown, waitlist email form, and social proof',
      'A restaurant site with menu, hours, location embed, and reservation CTA',
    ],
    runHint: 'cd <slug> && npm install && npm run dev',
  },
}

// Extract the first http(s) URL from a string. Returns the URL and the
// prompt with that URL stripped out (and surrounding whitespace collapsed).
function extractReferenceUrl(text: string): { url: string | null; cleanedPrompt: string } {
  const m = text.match(/https?:\/\/[^\s<>"'`]+/i)
  if (!m) return { url: null, cleanedPrompt: text }
  const url = m[0].replace(/[.,;:!?)\]'"]+$/, '') // strip trailing punctuation
  const cleanedPrompt = text.replace(m[0], '').replace(/\s+/g, ' ').trim()
  return { url, cleanedPrompt }
}

export default function AppBuilderPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  // Default to 'website' — most common entry point + instant preview without
  // WebContainer boot. User can pick another target in the picker.
  const [target, setTarget] = useState<Target>('website')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AppResult | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const hasAutofiredRef = useRef(false)
  // Reference URL — either the user typed one in the prompt (auto-detected)
  // OR they pasted into the dedicated input. Detected URLs are stripped
  // from the prompt text so the LLM doesn't see the bare URL alongside the
  // server-injected structured context (would be confusing).
  const [referenceUrl, setReferenceUrl] = useState<string>('')

  // Auto-detect any URL pasted into the prompt and lift it into referenceUrl.
  // Runs when the prompt text changes via the change handler — see below.
  const handlePromptChange = (next: string) => {
    if (!referenceUrl) {
      const { url, cleanedPrompt } = extractReferenceUrl(next)
      if (url) {
        setReferenceUrl(url)
        setPrompt(cleanedPrompt)
        return
      }
    }
    setPrompt(next)
  }

  const submit = async (override?: { prompt?: string; target?: Target; referenceUrl?: string }) => {
    const finalPrompt = (override?.prompt ?? prompt).trim()
    const finalTarget = override?.target ?? target
    const finalRef = (override?.referenceUrl ?? referenceUrl).trim()
    if (!finalPrompt || isGenerating) return
    if (!session?.user) {
      const back = `/app-builder?prompt=${encodeURIComponent(finalPrompt)}&target=${finalTarget}${finalRef ? `&ref=${encodeURIComponent(finalRef)}` : ''}`
      router.push(`/signup?next=${encodeURIComponent(back)}`)
      return
    }
    setError(null)
    setIsGenerating(true)
    setResult(null)
    setActiveFile(null)

    const cfg = TARGETS[finalTarget]
    try {
      if (cfg.isStreamingHtml) {
        // Website target — legacy generate route streams HTML deltas via SSE.
        // Consume the stream, accumulate, then wrap as a files-shaped result so
        // the rest of the workspace (agent, file tree, code viewer) just works.
        const res = await fetch(cfg.apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            referenceUrl: finalRef || undefined,
            // Force fresh-build mode — no currentHtml = no precision-editor branch.
          }),
        })
        if (!res.ok || !res.body) {
          const errBody = await res.text().catch(() => '')
          setError(`Failed (HTTP ${res.status})${errBody ? `: ${errBody.slice(0, 200)}` : ''}`)
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let html = ''
        let buffer = ''
        // Show streaming progress to user via active file
        const showStreaming = (current: string) => {
          if (!current) return
          setResult((prev) => ({
            files: { 'index.html': current },
            name: prev?.name || 'Streaming…',
            slug: prev?.slug || 'streaming',
            description: prev?.description || '',
            instructions: prev?.instructions || '',
            target: finalTarget,
          }))
        }
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE = blocks separated by \n\n
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() || ''
          for (const chunk of chunks) {
            const dataLine = chunk.split('\n').find((l) => l.startsWith('data:'))
            if (!dataLine) continue
            const raw = dataLine.slice(5).trim()
            try {
              const ev = JSON.parse(raw)
              if (typeof ev.delta === 'string') {
                html += ev.delta
                showStreaming(html)
              } else if (typeof ev.html === 'string' && ev.replace) {
                html = ev.html
                showStreaming(html)
              }
            } catch {}
          }
        }
        // Strip markdown fences if present
        let cleanHtml = html.trim()
        if (cleanHtml.startsWith('```html')) cleanHtml = cleanHtml.slice(7).trim()
        if (cleanHtml.startsWith('```')) cleanHtml = cleanHtml.slice(3).trim()
        if (cleanHtml.endsWith('```')) cleanHtml = cleanHtml.slice(0, -3).trim()
        const slug = (finalPrompt.split(/\s+/).slice(0, 4).join('-') || 'site')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 40)
        setResult({
          files: { 'index.html': cleanHtml },
          name: 'Generated Site',
          slug: slug || 'site',
          description: 'Static HTML site generated from your prompt.',
          instructions: cfg.runHint,
          target: finalTarget,
        })
        setActiveFile('index.html')
      } else {
        // All other targets — JSON response with { files, name, slug, ... }
        const res = await fetch(cfg.apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            referenceUrl: finalRef || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || `Failed (HTTP ${res.status})`)
          return
        }
        setResult(data)
        const firstFile = data.files['App.tsx'] ? 'App.tsx' : Object.keys(data.files)[0]
        setActiveFile(firstFile || null)
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-fire generation when landing here from /?prompt=...&target=... — same
  // pattern as /workspace. Clears the URL on first fire so reload / back can't
  // re-trigger. Waits for session to load so we don't bounce a logged-in user
  // through /signup.
  useEffect(() => {
    if (hasAutofiredRef.current) return
    if (sessionStatus === 'loading') return
    const promptFromUrl = searchParams.get('prompt')
    const targetFromUrl = searchParams.get('target') as Target | null
    const refFromUrl = searchParams.get('ref')
    if (!promptFromUrl) {
      if (refFromUrl) setReferenceUrl(refFromUrl)
      return
    }
    hasAutofiredRef.current = true
    const t: Target = targetFromUrl && TARGETS[targetFromUrl] ? targetFromUrl : 'expo'
    setTarget(t)
    // Lift any URL out of the prompt text into referenceUrl (lets users
    // paste a Lovable-style "build similar to https://x.com/..." prompt and
    // have the URL auto-pulled out as the reference).
    const { url: detectedUrl, cleanedPrompt } = extractReferenceUrl(promptFromUrl)
    const finalRef = refFromUrl || detectedUrl || ''
    if (finalRef) setReferenceUrl(finalRef)
    setPrompt(cleanedPrompt)
    router.replace('/app-builder', { scroll: false })
    // Pass the reference URL through override since state isn't flushed yet.
    void submit({ prompt: cleanedPrompt, target: t, referenceUrl: finalRef })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, searchParams])

  const downloadZip = async () => {
    if (!result) return
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const folder = zip.folder(result.slug)
      if (!folder) return
      for (const [path, content] of Object.entries(result.files)) {
        folder.file(path, content)
      }
      // Also drop a quick README so users know what to do
      folder.file('SETUP.md', `# ${result.name}\n\n${result.description}\n\n## Run locally\n\n\`\`\`\nnpm install\nnpx expo start\n\`\`\`\n\n${result.instructions}\n`)
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.slug}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(`Download failed: ${e?.message || e}`)
    }
  }

  const fileList = result ? Object.keys(result.files).sort() : []

  // Preview tab state. Expo's Metro bundler doesn't fully run in WebContainer
  // yet, so we only offer live preview for the web targets.
  const [rightPane, setRightPane] = useState<'code' | 'preview'>('preview')
  const previewable = result && result.target !== 'expo'

  // Deploy state. Reuses /api/deploy which framework-detects from package.json:
  //   HTML       → static_site, publishPath '.'
  //   Vite/Astro → static_site w/ build step → dist
  //   Next.js    → web_service (Node)
  //   Expo       → static_site w/ `expo export --platform web` → dist
  //                (the app is shareable as a web URL — native iOS/Android
  //                builds go through EAS + App Store / Play, separate flow)
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)
  const deploySupported = !!result

  const handleDeploy = async () => {
    if (!result || !deploySupported) return
    setDeploying(true)
    setDeployError(null)
    setDeployUrl(null)
    try {
      const files = Object.entries(result.files).map(([path, content]) => ({ path, content }))
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: result.slug || result.name || 'webstew-site', files }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Deploy failed (HTTP ${res.status})`)
      setDeployUrl(data.url)
    } catch (e: any) {
      setDeployError(e?.message || 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-violet-400" />
            <span className="font-semibold">App Builder</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">beta</span>
          </div>
          <span className="text-sm text-slate-500">{result?.target || 'website'}</span>
        </div>
      </header>

      {/* Prompt */}
      {!result && (
        <section className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-violet-400 text-sm font-medium">AI-driven project builder</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                Describe the project you want to build
              </h1>
              <p className="text-slate-400 mb-6">
                {TARGETS[target].description}
              </p>
            </div>

            {/* Target picker */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(TARGETS) as Target[]).map((t) => {
                const cfg = TARGETS[t]
                const Icon = cfg.icon
                const active = target === t
                return (
                  <button
                    key={t}
                    onClick={() => setTarget(t)}
                    className={`p-3 rounded-xl border text-left transition ${
                      active
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-slate-400'}`} />
                      <span className={`font-medium text-sm ${active ? 'text-white' : 'text-slate-300'}`}>{cfg.label}</span>
                    </div>
                    <p className={`text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>{cfg.description}</p>
                  </button>
                )
              })}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-2">
              <textarea
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
                placeholder={`${TARGETS[target].examples[0]}\n\nTip: paste a URL (e.g. https://voguebistro.com/) anywhere in your prompt to use it as design + content inspiration.`}
                rows={4}
                className="w-full bg-transparent border-0 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none resize-none"
              />
              {/* Reference-URL chip — auto-set when a URL is detected in the
                  prompt, or pre-filled from ?ref= query param. Clickable X
                  drops the reference so the LLM uses the prompt alone. */}
              {referenceUrl && (
                <div className="mx-2 mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs text-violet-200 max-w-full">
                  <Globe className="w-3 h-3 shrink-0 text-violet-400" />
                  <span className="opacity-70 shrink-0">Reference:</span>
                  <a
                    href={referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono truncate hover:underline"
                    title={referenceUrl}
                  >
                    {referenceUrl.replace(/^https?:\/\//, '').slice(0, 60)}
                  </a>
                  <button
                    onClick={() => setReferenceUrl('')}
                    className="shrink-0 text-violet-300/70 hover:text-white px-1"
                    title="Remove reference"
                    aria-label="Remove reference"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-slate-500">⌘+Enter to submit</span>
                <button
                  onClick={() => submit()}
                  disabled={!prompt.trim() || isGenerating}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium transition flex items-center gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  ) : (
                    <>Generate <Code2 className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-red-400 text-sm font-medium">Generation failed</div>
                  <div className="text-red-400/80 text-xs mt-0.5 font-mono break-words">{error}</div>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TARGETS[target].examples.map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="text-xs text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Result */}
      {result && (
        <section className="flex-1 flex flex-col p-6 gap-4 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-2xl font-bold">{result.name}</h2>
              {result.description && <p className="text-slate-400 mt-1">{result.description}</p>}
              <p className="text-xs text-slate-500 mt-2 font-mono">slug: {result.slug} · {fileList.length} files</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => { setResult(null); setPrompt(''); setError(null); setDeployUrl(null); setDeployError(null) }}
                  className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition"
                >
                  New app
                </button>
                <button
                  onClick={downloadZip}
                  className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Zip
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!deploySupported || deploying}
                  title={
                    result?.target === 'expo'
                      ? 'Push to GitHub + deploy the Expo web export to Render (native App Store / Play Store still needs EAS)'
                      : 'Push to GitHub + deploy on Render (auto-detects framework)'
                  }
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition flex items-center gap-2 ${
                    deploySupported && !deploying
                      ? 'bg-violet-600 hover:bg-violet-500 text-white'
                      : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  {deploying
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Rocket className="w-4 h-4" />}
                  {deploying ? 'Deploying…' : 'Deploy'}
                </button>
              </div>
              {(deployUrl || deployError) && (
                <div className="text-xs">
                  {deployUrl && (
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                    >
                      Live: {deployUrl.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {deployError && <span className="text-rose-400">⚠ {deployError}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
            {/* Agent chat — left rail. This is the refinement loop.
                User types ("change the hero image"), agent reads files +
                writes new contents, file_update events bubble up via
                onFilesChanged which mutates result.files in place.
                `min-h-0 overflow-hidden` lets the chat panel scroll
                internally instead of pushing the grid taller as messages
                accumulate (the "stretching preview" bug). */}
            <div className="col-span-4 min-h-0 overflow-hidden">
              <AgentChatPanel
                files={result.files}
                onFilesChanged={(next) => {
                  setResult((prev) => prev ? { ...prev, files: next } : prev)
                  // If the active file got deleted, fall back to first.
                  if (activeFile && !(activeFile in next)) {
                    const first = Object.keys(next).sort()[0]
                    setActiveFile(first || null)
                  }
                }}
                target={result.target}
                model={undefined}
              />
            </div>

            {/* File tree */}
            <aside className="col-span-2 bg-white/[0.02] border border-white/10 rounded-xl overflow-y-auto min-h-0">
              <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wider text-slate-500 font-medium sticky top-0 bg-slate-950">
                Files
              </div>
              <ul className="p-1">
                {fileList.map((path) => (
                  <li key={path}>
                    <button
                      onClick={() => setActiveFile(path)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                        activeFile === path
                          ? 'bg-violet-500/15 text-violet-200'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <FileCode className="w-3 h-3 shrink-0" />
                      <span className="truncate">{path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Right pane — tabbed Code / Preview */}
            <div className="col-span-6 flex flex-col gap-2 min-h-0 overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/10 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setRightPane('code')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition ${
                    rightPane === 'code'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Code
                </button>
                <button
                  onClick={() => setRightPane('preview')}
                  disabled={!previewable}
                  title={
                    previewable
                      ? 'Run the generated app in a real Node sandbox'
                      : 'Live preview for mobile (Expo) is coming soon — use the download below to run locally'
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    rightPane === 'preview'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  Preview
                  <span className="ml-1 text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">live</span>
                </button>
              </div>

              {/* Pane content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {rightPane === 'code' && (
                  <div className="h-full bg-zinc-950 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                    <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">{activeFile || ''}</span>
                      {activeFile && (
                        <button
                          onClick={() => navigator.clipboard.writeText(result.files[activeFile] || '')}
                          className="text-xs text-slate-500 hover:text-white transition"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <pre className="flex-1 overflow-auto p-4 text-xs text-slate-300 font-mono leading-relaxed">
                      <code>{activeFile ? result.files[activeFile] || '' : 'Select a file to view its contents.'}</code>
                    </pre>
                  </div>
                )}

                {rightPane === 'preview' && previewable && (
                  result.target === 'website'
                    ? <HtmlPreview files={result.files} />
                    : <WebContainerPreview files={result.files} />
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-white/[0.02] border border-white/10 rounded-xl p-3 whitespace-pre-line">
            {result.instructions}
          </div>
        </section>
      )}
    </div>
  )
}
