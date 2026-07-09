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
import { Loader2, Terminal, AlertCircle, RefreshCw, Play, ExternalLink, Monitor, Tablet, Smartphone, X, Copy, Check, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { getWebContainer, buildFileTree, isWebContainerSupported } from '@/lib/webcontainer'

type Phase = 'idle' | 'booting' | 'mounting' | 'installing' | 'starting' | 'running' | 'error'

interface Props {
  files: Record<string, string>
  // Override the dev command. Defaults to `npm run dev`. Use `['start']` for
  // Expo-style projects (though Expo Metro doesn't fully run in WC yet).
  devCommand?: string[]
  // Install command. Defaults to `npm install`.
  installCommand?: string[]
  // For Expo projects, lets us hand a nicer name/slug/description to Snack
  // when the user clicks "Open in Expo Go". `userPlan` flips on auto-publish
  // + the prominent CTA for paid plans (and shows the paywall hint to free
  // users before they click). Optional.
  projectMeta?: { name?: string; slug?: string; description?: string; userPlan?: string }
}

interface SnackResult {
  url: string
  embedUrl: string
  expoGoUrl: string
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
  projectMeta,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop')
  const [bumpKey, setBumpKey] = useState(0)
  const [showQr, setShowQr] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const isExpoWeb = devCommand.join(' ') === 'run web'

  // Snack publishing — Expo target only. For paid users we auto-publish the
  // moment the WC build reaches `running` so the QR is ready without a
  // click; for free users we hold off and show a paywall hint instead.
  const [snackPhase, setSnackPhase] = useState<'idle' | 'saving' | 'ready' | 'error' | 'upgrade'>('idle')
  const [snackResult, setSnackResult] = useState<SnackResult | null>(null)
  const [snackQr, setSnackQr] = useState<string | null>(null)
  const [snackError, setSnackError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [snackPublishedAt, setSnackPublishedAt] = useState<number | null>(null)

  // App-icon picker state — emoji char + the corresponding 1024px PNG URL
  // (Cloudinary-hosted, generated on selection). Default emoji is picked
  // from a tiny menu of category-agnostic glyphs so each project has an
  // identity even before the user touches the picker.
  const [iconEmoji, setIconEmoji] = useState<string>(() =>
    pickDefaultEmoji(projectMeta?.name || ''),
  )
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [iconUploading, setIconUploading] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  // Cache the file hash of the last successful publish so quick re-opens of
  // the popover (or auto-publish re-runs) don't burn a round-trip to Snack
  // when nothing has changed.
  const lastPublishedHashRef = useRef<string | null>(null)
  const autoRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // userPlan can be 'free' / 'starter' / 'pro' / 'scale' / 'enterprise' — we
  // treat anything that isn't free/empty/demo as paid. Server still enforces
  // the gate; this is just the UI hint.
  const planRaw = (projectMeta?.userPlan || 'free').toLowerCase()
  const isPaidUser = planRaw !== 'free' && planRaw !== 'demo' && planRaw !== ''

  // Stable hash of the current Expo VFS. Browsers ship SubtleCrypto; we
  // hash the sorted "path:length:contents" stream so equivalent file sets
  // produce the same digest regardless of key ordering.
  async function hashFiles(filesMap: Record<string, string>): Promise<string> {
    const paths = Object.keys(filesMap).sort()
    const blob = paths.map((p) => `${p}:${filesMap[p].length}:${filesMap[p]}`).join('\n')
    const enc = new TextEncoder().encode(blob)
    const digest = await crypto.subtle.digest('SHA-1', enc)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // When files swap (new build / agent edit), only blow away the cached
  // result if the HASH actually changed. The previous version reset on
  // every render that handed us a new object reference even when the
  // contents matched — that meant every parent re-render flashed the popover
  // back to the idle CTA mid-scan.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isExpoWeb) return
      try {
        const h = await hashFiles(files)
        if (cancelled) return
        if (lastPublishedHashRef.current && lastPublishedHashRef.current !== h) {
          // Real change while we held a result. If the popover is open and
          // a result is showing, silently auto-refresh after a short debounce
          // so the user always scans the live build; otherwise just clear.
          if (showQr && snackResult && isPaidUser) {
            if (autoRefreshTimerRef.current) clearTimeout(autoRefreshTimerRef.current)
            autoRefreshTimerRef.current = setTimeout(() => {
              publishToSnack({ silent: true })
            }, 1500)
          } else {
            setSnackPhase('idle')
            setSnackResult(null)
            setSnackQr(null)
            setSnackError(null)
            lastPublishedHashRef.current = null
          }
        }
      } catch {
        // Hashing failure (no subtle crypto, e.g. non-secure context): just
        // fall back to the old behaviour — invalidate on any prop change.
        setSnackPhase('idle')
        setSnackResult(null)
        setSnackQr(null)
        setSnackError(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [files, isExpoWeb])

  async function publishToSnack(opts: { silent?: boolean } = {}) {
    if (!opts.silent) {
      setSnackPhase('saving')
      setSnackError(null)
    }
    try {
      const fileHash = await hashFiles(files).catch(() => '')
      // Cache hit — same hash as last successful publish, reuse the result
      // without a round-trip. Saves 3-5s on repeat opens.
      if (
        fileHash &&
        snackResult &&
        snackQr &&
        lastPublishedHashRef.current === fileHash &&
        snackPhase === 'ready'
      ) {
        return
      }
      const r = await fetch('/api/builder/snack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          name: projectMeta?.name,
          slug: projectMeta?.slug,
          description: projectMeta?.description,
          iconUrl: iconUrl || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        // 402 = paid-only feature. Surface a dedicated upgrade state so
        // the popover can link to /upgrade instead of a dead error.
        if (r.status === 402 || data?.upgrade) {
          setSnackError(data?.error || 'Running your app on a real phone is a Pro feature.')
          setSnackPhase('upgrade')
          return
        }
        throw new Error(data?.error || `Snack save failed (${r.status})`)
      }
      const result: SnackResult = {
        url: data.url,
        embedUrl: data.embedUrl,
        expoGoUrl: data.expoGoUrl,
      }
      // QR encodes the https Snack URL — Expo Go's built-in scanner opens
      // it as a Snack, and the iPhone/Android camera apps open it in a
      // browser where Snack offers a one-tap "Open in Expo Go" button. An
      // exp:// link would skip the redirect for Expo Go's scanner but
      // fails for camera-app scanners that only follow https.
      const qr = await QRCode.toDataURL(result.url, {
        width: 240,
        margin: 1,
        color: { dark: '#18181b', light: '#ffffff' },
      })
      setSnackResult(result)
      setSnackQr(qr)
      setSnackPhase('ready')
      setSnackPublishedAt(Date.now())
      if (fileHash) lastPublishedHashRef.current = fileHash
    } catch (e: any) {
      // Silent auto-refresh failures should NOT clobber a still-valid QR
      // already on screen — surface only when the user explicitly asked.
      if (!opts.silent) {
        setSnackError(e?.message || 'Snack save failed')
        setSnackPhase('error')
      }
    }
  }

  // Free users get a pre-emptive paywall instead of clicking through to the
  // 402. Paid users get the real publish flow.
  function onPrimaryAction() {
    if (!isPaidUser) {
      setSnackPhase('upgrade')
      setSnackError('Running your app on a real phone is part of the Pro plan.')
      return
    }
    publishToSnack()
  }

  // Auto-publish when the WC build first reaches `running` on Expo, but
  // only for paid users — free users would hit the 402 anyway, and we'd be
  // burning Snack API + their attention. We never auto-publish twice for the
  // same file hash (hashFiles cache short-circuits inside publishToSnack).
  useEffect(() => {
    if (!isExpoWeb) return
    if (phase !== 'running') return
    if (!isPaidUser) return
    if (snackPhase === 'saving' || snackPhase === 'ready') return
    // Defer slightly so we don't race the WC `server-ready` flush.
    const t = setTimeout(() => {
      publishToSnack({ silent: true })
    }, 600)
    return () => clearTimeout(t)
    // intentionally narrow deps — re-run on phase / target / plan changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isExpoWeb, isPaidUser])

  // Render an emoji to a 1024×1024 PNG with a soft gradient background
  // (rounded squircle is left to the system — iOS/Android both clip app
  // icons to their platform mask automatically). Returns a PNG data URL.
  function emojiToPng(emoji: string, size = 1024): string {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not available')
    // Background — deterministic gradient seeded by the emoji codepoint so
    // every icon has a brand-feel ground, not a flat white square.
    const code = emoji.codePointAt(0) || 0
    const palette = [
      ['#7c3aed', '#db2777'],
      ['#0ea5e9', '#6366f1'],
      ['#10b981', '#06b6d4'],
      ['#f59e0b', '#ef4444'],
      ['#e11d48', '#db2777'],
      ['#14b8a6', '#10b981'],
    ]
    const [a, b] = palette[code % palette.length]
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, a)
    grad.addColorStop(1, b)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    ctx.font = `${Math.floor(size * 0.68)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.04)
    return canvas.toDataURL('image/png')
  }

  // Upload the rendered icon PNG to our Cloudinary bucket via /api/upload.
  // We host the asset ourselves because Snack/Expo Go needs a stable https
  // URL to fetch — random data URIs aren't fetched from Expo Go.
  async function uploadIcon(emoji: string): Promise<string> {
    const dataUrl = emojiToPng(emoji)
    const blob = await fetch(dataUrl).then((r) => r.blob())
    const file = new File([blob], 'icon.png', { type: 'image/png' })
    const form = new FormData()
    form.append('file', file)
    const r = await fetch('/api/upload', { method: 'POST', body: form })
    if (!r.ok) throw new Error(`Icon upload failed (${r.status})`)
    const data = await r.json()
    const url = data.url || data.secure_url
    if (!url) throw new Error('Icon upload returned no URL')
    return url
  }

  async function selectIconEmoji(emoji: string) {
    setIconEmoji(emoji)
    setIconPickerOpen(false)
    setIconUploading(true)
    try {
      const url = await uploadIcon(emoji)
      setIconUrl(url)
      // If we already have a published Snack and the user changes the icon,
      // republish so the next scan reflects the new icon. Cache short-circuit
      // doesn't fire because iconUrl is part of the publish body.
      if (snackPhase === 'ready' && isPaidUser) {
        lastPublishedHashRef.current = null
        publishToSnack({ silent: true })
      }
    } catch (e) {
      console.warn('[icon] upload failed:', e)
    } finally {
      setIconUploading(false)
    }
  }

  async function copySnackLink() {
    if (!snackResult) return
    try {
      await navigator.clipboard.writeText(snackResult.url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    } catch {}
  }

  // Auto-scroll logs to bottom on new content
  useEffect(() => {
    if (logsOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [logs, logsOpen])

  useEffect(() => {
    // Phones don't benefit from the WC web preview — it's a desktop-shape
    // render of a mobile app inside a phone, and iOS Safari often can't
    // boot WC at all (cross-origin isolation gaps). For Expo on touch
    // devices we skip the boot entirely and let the publish flow (the QR
    // / "Open on this phone" path) be the canonical preview.
    // Expo / React-Native apps run on a device, not in a browser — Metro does
    // NOT run inside WebContainer (on ANY device). Attempting `expo start --web`
    // here just hangs on a blank "starting…" screen forever. So for every Expo
    // build we skip the WC boot entirely and route to the phone/QR preview
    // (publish → scan → open on phone), which IS the canonical Expo preview.
    if (isExpoWeb) {
      setPhase('error')
      setError('PHONE_SKIP_WC')
      return
    }
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
    let devReadyTimer: any = null
    let serverReadyFired = false

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
          serverReadyFired = true
          if (devReadyTimer) { clearTimeout(devReadyTimer); devReadyTimer = null }
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
        //
        // Silent-blank guards. Without these the preview sits on "starting…"
        // (a blank iframe with a green "Live" dot) indefinitely whenever the
        // dev server crashes on boot or never binds a port. Surface a real,
        // actionable error instead:
        //  1) the process exits before serving, or
        //  2) no `server-ready` within the window.
        devProc.exit
          .then((code: number) => {
            if (cancelled || serverReadyFired) return
            setLogsOpen(true)
            setError(
              `The dev server exited before it could serve a preview (exit ${code}). ` +
                `The generated project likely has a build or runtime error — see the logs above.`
            )
            setPhase('error')
          })
          .catch(() => {})
        devReadyTimer = setTimeout(() => {
          if (cancelled || serverReadyFired) return
          setLogsOpen(true)
          setError(
            `The preview didn't come online within 90 seconds. The generated project may have a ` +
              `build error, or its dev server never bound a port — check the logs above and try again.`
          )
          setPhase('error')
        }, 90_000)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || String(e))
        setPhase('error')
      }
    }

    boot()

    return () => {
      cancelled = true
      if (devReadyTimer) { clearTimeout(devReadyTimer); devReadyTimer = null }
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
          <span className={`relative flex h-2 w-2 rounded-full ${
            phase === 'running' ? 'bg-emerald-400' : phase === 'error' ? 'bg-red-400' : 'bg-amber-400'
          }`}>
            {phase !== 'running' && phase !== 'error' && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 animate-ping opacity-75" />
            )}
          </span>
          <span className="font-mono text-slate-300">{phaseLabel[phase]}</span>
          {/* Debug-only link to the in-browser WebContainer URL. Hidden
              on mobile/tablet (it ate the "Try on Phone" button) and on
              Expo at any width (the WC URL isn't reachable from a phone
              anyway — the QR is the real path). Devs on desktop with a
              web target still get the click-out. */}
          {serverUrl && !isExpoWeb && (
            <a href={serverUrl} target="_blank" rel="noopener noreferrer"
              className="ml-2 hidden lg:flex text-violet-300 hover:text-violet-200 items-center gap-1">
              <span className="font-mono text-[10px] opacity-70">{new URL(serverUrl).host}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* For Expo (mobile app) builds the device-size switcher makes no
              sense — the canonical preview is the phone, not desktop/tablet
              shapes of a web rendering. Hide it for Expo, keep it for the
              web targets where it's still useful. */}
          {phase === 'running' && !isExpoWeb && (
            <div className="flex items-center gap-0.5 mr-1 bg-zinc-800 rounded-lg p-0.5">
              {(Object.keys(PREVIEW_SIZES) as PreviewSize[]).map((s) => {
                const c = PREVIEW_SIZES[s]; const Icon = c.icon; const active = previewSize === s
                return (
                  <button key={s} onClick={() => setPreviewSize(s)} title={c.label}
                    aria-label={c.label} aria-pressed={active}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition ${active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          )}
          {/* Primary CTA for Expo: "Try on Phone" pill. Labelled, not just an
              icon — this is the action customers actually want, and burying
              it inside a tiny smartphone glyph (like web targets do) sent
              them straight to the amber warning instead. */}
          {phase === 'running' && isExpoWeb && (
            <button onClick={() => setShowQr(v => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition ${showQr ? 'bg-violet-600 text-white' : 'bg-violet-500/15 text-violet-200 hover:bg-violet-500/25'}`}>
              <Smartphone className="w-3 h-3" />
              <span>Try on Phone</span>
            </button>
          )}
          {phase === 'running' && serverUrl && !isExpoWeb && (
            <button onClick={() => setShowQr(v => !v)} title="Test on a device"
              aria-label="Test on a device" aria-pressed={showQr}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${showQr ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Smartphone className="w-3 h-3" />
            </button>
          )}
          <button onClick={() => setLogsOpen((v) => !v)} title="Logs"
            aria-label="Logs" aria-pressed={logsOpen}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition">
            <Terminal className="w-3 h-3" />
          </button>
          <button onClick={() => setBumpKey((k) => k + 1)} title="Restart"
            aria-label="Restart"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Phone-preview surface. Expo gets a full centered modal (premium
          feel — backdrop blur, phone-frame mock, icon picker). Web targets
          keep the lightweight top-right popover (their version just
          explains the in-browser sandbox; no real device target). */}
      {showQr && isExpoWeb && (
        <PhonePreviewModal
          onClose={() => setShowQr(false)}
          name={projectMeta?.name || 'Your app'}
          iconEmoji={iconEmoji}
          iconUploading={iconUploading}
          iconPickerOpen={iconPickerOpen}
          setIconPickerOpen={setIconPickerOpen}
          selectIconEmoji={selectIconEmoji}
          snackPhase={snackPhase}
          snackResult={snackResult}
          snackQr={snackQr}
          snackError={snackError}
          snackPublishedAt={snackPublishedAt}
          isPaidUser={isPaidUser}
          linkCopied={linkCopied}
          copySnackLink={copySnackLink}
          publishToSnack={() => publishToSnack()}
          onPrimaryAction={onPrimaryAction}
        />
      )}
      {showQr && !isExpoWeb && (
        <div className="absolute top-10 right-2 z-20 bg-zinc-900 border border-white/15 rounded-xl p-4 shadow-2xl w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Test on a device</span>
            <button onClick={() => setShowQr(false)} className="text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            This preview runs inside your browser&apos;s sandbox — a phone can&apos;t
            connect to it. To run this on a real device:
          </p>
          <ol className="text-[11px] text-zinc-400 leading-relaxed mt-2 flex flex-col gap-1 list-decimal pl-4">
            <li>Download the project — <span className="text-zinc-300">Export</span> in the workspace toolbar.</li>
            <li>Run <code className="px-1 rounded bg-white/10 text-zinc-200 font-mono">npm run dev</code> in the folder.</li>
            <li>Open the dev server URL in your phone&apos;s browser on the same Wi-Fi.</li>
          </ol>
        </div>
      )}

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

        {/* Phone-skip state — not an error, just a different path. On a
            phone we don't try to render a tiny desktop preview of a
            mobile app inside the phone; we point them at the publish
            flow which IS the canonical preview on this device. */}
        {phase === 'error' && error === 'PHONE_SKIP_WC' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
            <Smartphone className="w-10 h-10 text-violet-400" />
            <div className="text-white font-semibold">Mobile apps preview on a phone</div>
            <div className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              React Native / Expo apps run on a device, not in a browser, so there's
              no in-browser preview. Publish this build and scan the QR with your phone
              to open it live.
              <span className="block mt-2 text-zinc-500">
                Want a preview right here? Build it as a <span className="text-violet-300">Web</span> app
                instead — it runs as an installable mobile web app (PWA) in the browser.
              </span>
            </div>
            <button
              onClick={() => setShowQr(true)}
              className="mt-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-violet-900/50"
            >
              <QrCode className="w-4 h-4" />
              Show QR code
            </button>
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && error !== 'PHONE_SKIP_WC' && (
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
                onClick={() => {
                  // Clear the error screen the instant it's clicked — the
                  // boot effect re-runs off bumpKey and resets phase itself,
                  // but a retry that fails again fast would otherwise look
                  // like the button did nothing.
                  setError(null)
                  setLogs([])
                  setPhase('booting')
                  setBumpKey((k) => k + 1)
                }}
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

// Small, deterministic letter-avatar — pick a gradient from the project
// name's first character so each app gets a stable, distinct look without
// needing the user to upload an icon. The picker (#7 in the suggestions
// queue) will replace this with the real chosen icon.
const AVATAR_GRADIENTS = [
  ['from-violet-500', 'to-fuchsia-500'],
  ['from-sky-500', 'to-indigo-500'],
  ['from-emerald-500', 'to-cyan-500'],
  ['from-amber-500', 'to-rose-500'],
  ['from-rose-500', 'to-pink-500'],
  ['from-teal-500', 'to-emerald-500'],
] as const

function AppIconAvatar({ name }: { name: string }) {
  const ch = (name.trim()[0] || 'W').toUpperCase()
  const idx = ch.charCodeAt(0) % AVATAR_GRADIENTS.length
  const [from, to] = AVATAR_GRADIENTS[idx]
  return (
    <div
      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-bold text-sm shadow-md shadow-black/30 shrink-0`}
    >
      {ch}
    </div>
  )
}

// Tiny relative-time pill — re-renders itself every 30s so a stale popover
// doesn't keep showing "just now" five minutes later.
function RelativeTime({ ts }: { ts: number }) {
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])
  const diffSec = Math.round((Date.now() - ts) / 1000)
  if (diffSec < 10) return <span>Updated just now</span>
  if (diffSec < 60) return <span>Updated {diffSec}s ago</span>
  const m = Math.round(diffSec / 60)
  if (m < 60) return <span>Updated {m} min ago</span>
  const h = Math.round(m / 60)
  return <span>Updated {h} h ago</span>
}

// A curated, intentionally short list. Bigger picker = decision paralysis;
// this fits in one row of the modal and covers the common app categories.
// The first one is "auto" — a brand-neutral default seeded from the name.
const EMOJI_CHOICES = [
  '⭐', '🚀', '🍔', '💪', '🛒', '📅', '🎵', '📚',
  '💼', '📷', '🏠', '✈️', '🎯', '💡', '❤️', '🐶',
  '🌱', '⚡', '🔥', '🎨', '☕', '🧘', '🎮', '💰',
]

// When the user hasn't picked anything, seed an emoji from the project
// name so each app starts with its own identity. Deterministic — same
// name always picks the same default.
function pickDefaultEmoji(name: string): string {
  const seed = name.toLowerCase()
  if (/finance|money|bank|wallet|crypto/.test(seed)) return '💰'
  if (/food|restaurant|menu|recipe/.test(seed)) return '🍔'
  if (/fitness|workout|gym|health/.test(seed)) return '💪'
  if (/shop|store|cart|commerce/.test(seed)) return '🛒'
  if (/booking|calendar|schedule|appointment/.test(seed)) return '📅'
  if (/photo|gallery|camera/.test(seed)) return '📷'
  if (/music|audio|playlist/.test(seed)) return '🎵'
  if (/learn|course|study|book/.test(seed)) return '📚'
  if (/travel|trip|flight/.test(seed)) return '✈️'
  if (/home|house|real.?estate/.test(seed)) return '🏠'
  if (/dog|pet|cat/.test(seed)) return '🐶'
  if (/garden|plant|nature/.test(seed)) return '🌱'
  const charCode = seed.charCodeAt(0) || 0
  return EMOJI_CHOICES[charCode % EMOJI_CHOICES.length]
}

// The premium modal — replaces the legacy popover for Expo. Two-column on
// desktop (phone-frame mock on the left, QR + sharing on the right);
// stacks on narrow screens. The container has its own backdrop + close
// behavior, so the parent only needs to mount it conditionally.
interface PhonePreviewModalProps {
  onClose: () => void
  name: string
  iconEmoji: string
  iconUploading: boolean
  iconPickerOpen: boolean
  setIconPickerOpen: (v: boolean) => void
  selectIconEmoji: (emoji: string) => void
  snackPhase: 'idle' | 'saving' | 'ready' | 'error' | 'upgrade'
  snackResult: SnackResult | null
  snackQr: string | null
  snackError: string | null
  snackPublishedAt: number | null
  isPaidUser: boolean
  linkCopied: boolean
  copySnackLink: () => void
  publishToSnack: () => void
  onPrimaryAction: () => void
}

function PhonePreviewModal(props: PhonePreviewModalProps) {
  const {
    onClose, name, iconEmoji, iconUploading, iconPickerOpen, setIconPickerOpen,
    selectIconEmoji, snackPhase, snackResult, snackQr, snackError,
    snackPublishedAt, isPaidUser, linkCopied, copySnackLink, publishToSnack,
    onPrimaryAction,
  } = props

  // Close on Escape — modal pattern users expect.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Same-device flow: when the user is ALREADY on a phone, scanning their
  // own screen is impossible — so the primary CTA becomes "Open on this
  // phone" (universal-link that hands off to Expo Go) and the QR drops to
  // a secondary "Or share with another device" affordance.
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const phone =
      window.matchMedia?.('(max-width: 767px)').matches &&
      ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0)
    setIsPhone(!!phone)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/40 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Header — the avatar button OPENS the icon picker drawer below.
            We surface that with a labelled "Change icon" pill so users
            don't have to guess what the tile-tap does. */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <button
            onClick={() => setIconPickerOpen(!iconPickerOpen)}
            className="relative group shrink-0"
            title="Change app icon"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center text-3xl shadow-lg shadow-violet-900/40 group-hover:scale-105 transition">
              {iconUploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : iconEmoji}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-600 border-2 border-zinc-900 flex items-center justify-center text-[9px] text-white transition">
              ✎
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-base font-semibold text-white truncate">{name}</div>
              <button
                onClick={() => setIconPickerOpen(!iconPickerOpen)}
                className={`hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full transition ${iconPickerOpen ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
              >
                {iconPickerOpen ? 'Done' : 'Change icon'}
              </button>
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              {snackPhase === 'ready' && snackPublishedAt ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <RelativeTime ts={snackPublishedAt} />
                  <button onClick={publishToSnack} title="Refresh now" className="text-zinc-500 hover:text-violet-300 transition ml-1">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <span>Running on your phone</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon picker drawer */}
        {iconPickerOpen && (
          <div className="px-5 py-3 border-b border-white/5 bg-black/20">
            <div className="text-[11px] text-zinc-400 mb-2 font-medium uppercase tracking-wider">Choose an icon</div>
            <div className="grid grid-cols-12 gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => selectIconEmoji(e)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xl transition ${e === iconEmoji ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              AI-generated icons + upload coming soon.
            </div>
          </div>
        )}

        {/* Body */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left — phone frame mock */}
          <div className="hidden md:flex items-center justify-center p-6 bg-gradient-to-br from-black/40 to-violet-950/20 border-r border-white/5">
            <PhoneFrame iconEmoji={iconEmoji} name={name} />
          </div>

          {/* Right — QR + actions */}
          <div className="p-6 flex flex-col items-center justify-center min-h-[340px]">
            {snackPhase === 'idle' && (
              <div className="text-center w-full">
                <QrCode className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Run on your phone</h3>
                <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">
                  {isPaidUser
                    ? 'We’ll generate a one-time QR you can scan with the Webstew Preview app. Your phone mirrors this build live.'
                    : 'See your app on a real device. Scan a QR with the Webstew Preview app and your phone runs the build live.'}
                </p>
                <button
                  onClick={onPrimaryAction}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-violet-900/50"
                >
                  <QrCode className="w-4 h-4" />
                  {isPaidUser ? 'Get my QR code' : 'Unlock phone preview'}
                </button>
                <p className="text-[10px] text-zinc-500 mt-3">
                  Don&apos;t have it yet?{' '}
                  <a href="https://apps.apple.com/app/expo-go/id982107779" target="_blank" rel="noopener noreferrer" className="text-violet-300 underline underline-offset-2">iPhone</a>{' · '}
                  <a href="https://play.google.com/store/apps/details?id=host.exp.exponent" target="_blank" rel="noopener noreferrer" className="text-violet-300 underline underline-offset-2">Android</a>
                </p>
              </div>
            )}

            {snackPhase === 'saving' && (
              <div className="flex flex-col items-center gap-3 text-zinc-300">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                <span className="text-sm">Preparing your phone preview…</span>
              </div>
            )}

            {snackPhase === 'ready' && snackResult && snackQr && (
              <div className="w-full flex flex-col items-center">
                {isPhone ? (
                  <>
                    {/* Same-device path — the user is on their phone, no
                        QR scanning needed. PRIMARY is the exp:// deep link,
                        which hands the build straight to Webstew Preview /
                        Expo Go in one tap (no Snack web page in between).
                        The https URL is the fallback for when the app isn't
                        installed yet — it shows Snack's install prompt. */}
                    <Smartphone className="w-10 h-10 text-violet-400 mb-3" />
                    <h3 className="text-white font-semibold text-center mb-1">Open right here</h3>
                    <p className="text-[12px] text-zinc-400 leading-relaxed mb-4 text-center max-w-xs">
                      One tap launches your build in
                      <span className="text-white font-medium"> Webstew Preview</span>.
                    </p>
                    <a
                      href={snackResult.expoGoUrl}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-violet-900/50"
                    >
                      <Smartphone className="w-4 h-4" />
                      Open in Webstew Preview
                    </a>
                    <a
                      href={snackResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full bg-white/5 hover:bg-white/10 text-zinc-200 text-[12px] font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in browser instead
                    </a>
                    <button
                      onClick={copySnackLink}
                      className="mt-2 text-[11px] text-zinc-500 hover:text-violet-300 flex items-center justify-center gap-1.5 transition"
                    >
                      {linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {linkCopied ? 'Link copied' : 'Or send to someone'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Desktop path — show the QR for scanning with a
                        second device. Copy-link is the share fallback. */}
                    <div className="bg-white rounded-2xl p-4 shadow-xl shadow-black/30">
                      <img src={snackQr} alt="Phone preview QR" className="w-52 h-52" />
                    </div>
                    <p className="text-[12px] text-zinc-400 leading-relaxed mt-3 text-center max-w-xs">
                      Scan with your phone camera, then tap to open in
                      <span className="text-white font-medium"> Webstew Preview</span>.
                    </p>
                    <button
                      onClick={copySnackLink}
                      className="mt-4 w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {linkCopied ? 'Link copied' : 'Copy share link'}
                    </button>
                  </>
                )}
              </div>
            )}

            {snackPhase === 'error' && (
              <div className="w-full">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-red-300 font-medium">Something went wrong</div>
                    <div className="text-[11px] text-red-300/70 mt-1 break-words">{snackError}</div>
                  </div>
                </div>
                <button
                  onClick={publishToSnack}
                  className="mt-3 w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  Try again
                </button>
              </div>
            )}

            {snackPhase === 'upgrade' && (
              <div className="w-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-violet-900/40">
                  ✨
                </div>
                <h3 className="text-white font-semibold mb-1">Pro feature</h3>
                <p className="text-[12px] text-zinc-400 leading-relaxed mb-4 max-w-xs mx-auto">
                  Running your app on a real phone is part of the Pro plan. Upgrade and your QR is ready in seconds.
                </p>
                <a
                  href="/upgrade"
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  Upgrade to Pro
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stylized iPhone-shape mock with the user's app icon + name centered. Pure
// CSS — no image asset needed. Used in the left column of the phone-preview
// modal to give the abstract "QR for your app" some visual grounding.
function PhoneFrame({ iconEmoji, name }: { iconEmoji: string; name: string }) {
  return (
    <div className="relative w-[220px] h-[440px] flex-col items-center">
      {/* Bezel */}
      <div className="absolute inset-0 rounded-[44px] bg-zinc-800 border-2 border-zinc-700 shadow-2xl shadow-black/60" />
      {/* Screen */}
      <div className="absolute inset-[6px] rounded-[38px] overflow-hidden bg-gradient-to-b from-violet-900 to-zinc-950 flex flex-col">
        {/* Dynamic island */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-20 h-5 rounded-full bg-black" />
        </div>
        {/* Status bar (decorative) */}
        <div className="px-5 flex items-center justify-between text-[9px] text-white/80 font-medium">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>
        {/* App icon stage */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <div className="w-20 h-20 rounded-2xl bg-violet-500 flex items-center justify-center text-5xl shadow-2xl shadow-violet-900/50">
            {iconEmoji}
          </div>
          <div className="text-white text-sm font-semibold text-center truncate max-w-full">{name}</div>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center pb-2.5 shrink-0">
          <div className="w-28 h-1 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  )
}
