'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Smartphone, Loader2, FileCode, Download, Sparkles, AlertCircle, Globe, Code2 } from 'lucide-react'

type Target = 'expo' | 'nextjs'

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
}> = {
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
    description: 'Next.js 14 App Router + Tailwind + TypeScript. Deploy to Vercel in one click.',
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
}

export default function AppBuilderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [target, setTarget] = useState<Target>('expo')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AppResult | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)

  const submit = async () => {
    if (!prompt.trim() || isGenerating) return
    if (!session?.user) {
      router.push(`/login?next=${encodeURIComponent('/app-builder')}`)
      return
    }
    setError(null)
    setIsGenerating(true)
    setResult(null)
    setActiveFile(null)
    try {
      const res = await fetch(TARGETS[target].apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Failed (HTTP ${res.status})`)
        return
      }
      setResult(data)
      // Auto-select App.tsx if present, else first file
      const firstFile = data.files['App.tsx'] ? 'App.tsx' : Object.keys(data.files)[0]
      setActiveFile(firstFile || null)
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setIsGenerating(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
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
          <Link href="/workspace" className="text-sm text-slate-400 hover:text-white transition">
            Website Builder →
          </Link>
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
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
                placeholder={TARGETS[target].examples[0]}
                rows={4}
                className="w-full bg-transparent border-0 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-slate-500">⌘+Enter to submit</span>
                <button
                  onClick={submit}
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
        <section className="flex-1 flex flex-col p-6 gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{result.name}</h2>
              {result.description && <p className="text-slate-400 mt-1">{result.description}</p>}
              <p className="text-xs text-slate-500 mt-2 font-mono">slug: {result.slug} · {fileList.length} files</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setResult(null); setPrompt(''); setError(null) }}
                className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition"
              >
                New app
              </button>
              <button
                onClick={downloadZip}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download zip
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-3 min-h-[500px]">
            {/* File tree */}
            <aside className="col-span-3 bg-white/[0.02] border border-white/10 rounded-xl overflow-y-auto">
              <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wider text-slate-500 font-medium">
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

            {/* Code viewer */}
            <div className="col-span-9 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden flex flex-col">
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
          </div>

          <div className="text-xs text-slate-500 bg-white/[0.02] border border-white/10 rounded-xl p-3 whitespace-pre-line">
            {result.instructions}
          </div>
        </section>
      )}
    </div>
  )
}
