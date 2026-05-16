'use client'

// Live preview powered by WebContainers. Mounts the generated VFS, runs
// `npm install` and `npm run dev`, then streams the dev-server URL into an
// iframe so the user sees their generated app actually executing.
//
// Lifecycle:
//   1. boot WC (or reuse existing)
//   2. mount files
//   3. spawn `npm install`, stream logs, wait for exit
//   4. spawn dev command, wait for `server-ready` event
//   5. show iframe pointing at the dev URL
//
// Cancellation: if the component unmounts mid-install we set `cancelled`
// and kill any in-flight processes so we don't leak workers.

import { useEffect, useRef, useState } from 'react'
import { Loader2, Terminal, AlertCircle, RefreshCw, Play, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react'
import { getWebContainer, buildFileTree, isWebContainerSupported } from '@/lib/webcontainer'

type Phase = 'idle' | 'booting' | 'mounting' | 'installing' | 'starting' | 'running' | 'error'

interface Props {
  files: Record<string, string>
  // Override the dev command. Defaults to `npm run dev`. Use `['start']` for
  // Expo-style projects (though Expo Metro doesn't fully run in WC yet).
  devCommand?: string[]
  // Install command. Defaults to `npm install`.
  installCommand?: string[]
}

const PREVIEW_SIZES = {
  desktop: { label: 'Desktop', icon: Monitor, width: '100%', maxWidth: 'none' },
  tablet:  { label: 'Tablet',  icon: Tablet,  width: '768px',  maxWidth: '768px' },
  mobile:  { label: 'Mobile',  icon: Smartphone, width: '390px', maxWidth: '390px' },
} as const

type PreviewSize = keyof typeof PREVIEW_SIZES

export function WebContainerPreview({
  files,
  devCommand = ['run', 'dev'],
  // --ignore-scripts: skip native postinstall scripts. WebContainer runs Node
  //   in WASM and most postinstall steps (sharp's gyp build, esbuild's binary
  //   download, etc.) either OOM the worker or fail to find native toolchains.
  //   Astro / Vite / Tailwind all work fine without their postinstalls
  //   because the dev server falls back to JS paths.
  // --no-audit --no-fund: cut network round-trips that don't change install
  //   success. Halves install time on a fresh package.
  // --prefer-offline: when retrying, reuse the WC filesystem cache instead of
  //   re-fetching everything.
  installCommand = ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--prefer-offline'],
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop')
  const [bumpKey, setBumpKey] = useState(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom on new content
  useEffect(() => {
    if (logsOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [logs, logsOpen])

  useEffect(() => {
    // Bail early if the browser doesn't support WebContainers — surface
    // a clear error rather than booting and silently failing.
    if (!isWebContainerSupported()) {
      setPhase('error')
      setError(
        'WebContainers requires cross-origin isolation (COOP/COEP headers) and SharedArrayBuffer. ' +
          'Try a Chromium-based browser, or run this page over HTTPS.'
      )
      return
    }

    let cancelled = false
    let installProc: any = null
    let devProc: any = null

    const append = (s: string) => {
      if (cancelled) return
      // Split on newlines so the log viewer renders each line separately.
      setLogs((prev) => [...prev, ...s.split(/\r?\n/).filter(Boolean)])
    }

    async function boot() {
      try {
        setError(null)
        setLogs([])
        setServerUrl(null)
        setPhase('booting')
        const wc = await getWebContainer()
        if (cancelled) return

        setPhase('mounting')
        const tree = buildFileTree(files)
        await wc.mount(tree)
        if (cancelled) return

        // Listen for the dev server coming online. WebContainer's
        // `server-ready` fires with (port, url). We jump phases to
        // `running` as soon as we have a URL.
        const handleServerReady = (_port: number, url: string) => {
          if (cancelled) return
          setServerUrl(url)
          setPhase('running')
        }
        wc.on('server-ready', handleServerReady)

        // Install
        setPhase('installing')
        append('$ npm ' + installCommand.join(' '))
        installProc = await wc.spawn('npm', installCommand)
        installProc.output.pipeTo(
          new WritableStream({
            write(chunk: string) {
              append(chunk)
            },
          })
        )
        const installExit = await installProc.exit
        if (cancelled) return
        if (installExit !== 0) {
          // Auto-open the logs drawer so the user immediately sees what failed
          // — manually clicking "Show full logs" while looking at exit code
          // 4294967294 (OOM) gives no information.
          setLogsOpen(true)
          const hint = installExit === 4294967294 || installExit < 0
            ? ' Exit code suggests an out-of-memory kill — common when native postinstall scripts run. We pass --ignore-scripts; if your generated package.json still has heavy native deps (sharp, canvas, puppeteer), edit them out before retrying.'
            : ''
          throw new Error(`npm install failed (exit ${installExit}).${hint}`)
        }

        // Dev server
        setPhase('starting')
        append('$ npm ' + devCommand.join(' '))
        devProc = await wc.spawn('npm', devCommand)
        devProc.output.pipeTo(
          new WritableStream({
            write(chunk: string) {
              append(chunk)
            },
          })
        )
        // `server-ready` will flip phase to 'running' when the dev server
        // emits its first listen event. We don't await `devProc.exit` here —
        // dev servers run forever.
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || String(e))
        setPhase('error')
      }
    }

    boot()

    return () => {
      cancelled = true
      try { installProc?.kill?.() } catch {}
      try { devProc?.kill?.() } catch {}
    }
    // bumpKey lets the user manually retry by changing the dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, bumpKey])

  const phaseLabel: Record<Phase, string> = {
    idle:       'Idle',
    booting:    'Booting WebContainer',
    mounting:   'Mounting files',
    installing: 'Installing dependencies',
    starting:   'Starting dev server',
    running:    'Live',
    error:      'Error',
  }

  const sizeCfg = PREVIEW_SIZES[previewSize]
  const SizeIcon = sizeCfg.icon

  return (
    <div className="relative flex flex-col h-full min-h-[500px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-zinc-900/60">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`relative flex h-2 w-2 rounded-full ${
              phase === 'running' ? 'bg-emerald-400' : phase === 'error' ? 'bg-red-400' : 'bg-amber-400'
            }`}
          >
            {phase !== 'running' && phase !== 'error' && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 animate-ping opacity-75" />
            )}
          </span>
          <span className="font-mono text-slate-300">{phaseLabel[phase]}</span>
          {serverUrl && (
            <a
              href={serverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-violet-300 hover:text-violet-200 flex items-center gap-1"
            >
              <span className="font-mono text-[10px] opacity-70">{new URL(serverUrl).host}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Expo web-only disclaimer */}
        {phase === 'running' && devCommand.join(' ') === 'run web' && (
          <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            <span className="text-[11px] text-amber-300/80">Web preview only — camera, push notifications, and other native APIs won&apos;t work here. Use Expo Go on your device to test the full app.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Device-size switcher — only meaningful once running */}
          {phase === 'running' && (
            <div className="flex items-center gap-1 mr-1 bg-zinc-800 rounded-lg p-0.5">
              {(Object.keys(PREVIEW_SIZES) as PreviewSize[]).map((s) => {
                const c = PREVIEW_SIZES[s]
                const Icon = c.icon
                const active = previewSize === s
                return (
                  <button
                    key={s}
                    onClick={() => setPreviewSize(s)}
                    title={c.label}
                    aria-label={c.label}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
                      active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          )}
          <button
            onClick={() => setLogsOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition"
          >
            <Terminal className="w-3 h-3" />
            Logs ({logs.length})
          </button>
          <button
            onClick={() => setBumpKey((k) => k + 1)}
            title="Restart"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading state — anything not yet `running` and not in error */}
        {phase !== 'running' && phase !== 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 gap-3 px-6">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <div className="font-mono text-xs">{phaseLabel[phase]}…</div>
            <div className="text-[11px] text-slate-500 max-w-md">
              First-run install can take 30–60 s while Node modules unpack inside the browser.
              Subsequent runs reuse the boot.
            </div>
            {logs.length > 0 && (
              <div className="mt-2 max-w-md w-full text-left bg-black/40 border border-white/5 rounded-lg p-2 max-h-32 overflow-y-auto">
                <pre className="font-mono text-[10px] text-slate-500 whitespace-pre-wrap">
                  {logs.slice(-6).join('\n')}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
            <AlertCircle className="w-7 h-7 text-red-400" />
            <div className="text-red-400 font-medium">Preview failed to start</div>
            <div className="text-xs text-slate-400 max-w-md font-mono">{error}</div>
            {/* The "single instance" error means an orphan WebContainer
                from a previous module-load is still alive in this tab.
                Only a hard reload kills the worker. "Try again" can't fix
                it because the orphan is below the JS layer. */}
            {/single (WebContainer )?instance/i.test(error || '') ? (
              <>
                <div className="text-xs text-amber-300 max-w-md leading-relaxed">
                  An orphaned WebContainer worker is still alive in this tab.
                  <span className="block mt-1 text-slate-400">A soft reload doesn't kill the worker — Chrome keeps it cached. You need a HARD reload.</span>
                </div>
                <div className="flex flex-col items-center gap-2 mt-2">
                  <button
                    onClick={async () => {
                      // Try to teardown our own tracked instance first.
                      try {
                        const w = window as any
                        if (w.__webstewBootInstance?.teardown) await w.__webstewBootInstance.teardown()
                      } catch {}
                      try {
                        delete (window as any).__webstewBootInstance
                        delete (window as any).__webstewBootPromise
                      } catch {}
                      // Force a true reload by mutating the URL with a
                      // cache-buster. `location.reload()` alone can be
                      // served from disk cache; replacing the URL forces
                      // a fresh document fetch + new worker.
                      const url = window.location.href.split('#')[0]
                      const sep = url.includes('?') ? '&' : '?'
                      window.location.replace(url + sep + '_wc=' + Date.now())
                    }}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" /> Force reload (kill worker)
                  </button>
                  <div className="text-[10px] text-slate-500">
                    Still stuck? <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">Cmd+Shift+R</kbd> or close this tab and reopen.
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={() => setBumpKey((k) => k + 1)}
                className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2"
              >
                <Play className="w-3 h-3" /> Try again
              </button>
            )}
            <button
              onClick={() => setLogsOpen(true)}
              className="text-xs text-slate-500 hover:text-white underline"
            >
              Show full logs
            </button>
          </div>
        )}

        {/* Running — iframe to the dev server. Wrapped in a centered
            container so the device-size switcher can constrain width
            without distorting the iframe. */}
        {phase === 'running' && serverUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-4">
            <div
              className="bg-white rounded-lg shadow-2xl shadow-violet-500/10 overflow-hidden transition-all duration-300 h-full"
              style={{ width: sizeCfg.width, maxWidth: sizeCfg.maxWidth }}
            >
              <iframe
                src={serverUrl}
                className="w-full h-full border-0"
                title="Live preview"
                // Allow standard web APIs inside the preview. WC's preview URL
                // is same-origin to the WC proxy, so we don't need to relax
                // sandbox further.
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logs drawer */}
      {logsOpen && (
        <div className="border-t border-white/10 bg-black/80 max-h-64 overflow-y-auto">
          <div className="sticky top-0 px-3 py-1.5 bg-black/95 border-b border-white/5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span className="font-semibold">Output</span>
            <button onClick={() => setLogs([])} className="hover:text-white">clear</button>
          </div>
          <pre className="px-3 py-2 font-mono text-[11px] text-slate-300 whitespace-pre-wrap break-all">
            {logs.join('\n') || <span className="text-slate-600">No output yet…</span>}
          </pre>
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}
