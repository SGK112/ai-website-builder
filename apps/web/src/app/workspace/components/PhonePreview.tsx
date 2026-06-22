// "Try it on your phone" — a one-tap QR for the CURRENT build, right in the
// preview toolbar (not buried in the deploy/proposal modal). Does the right
// thing per build type:
//   • website  → mints a fresh /preview/<token> snapshot of the live HTML;
//                scan with the phone camera to open it.
//   • app (expo/…) → publishes the project to Expo Snack and shows the Expo Go
//                QR so the real app runs on the phone (needs sign-in).
// Re-mints on every open, so the phone view always reflects the latest build.
'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { Smartphone, Loader2, Copy, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhonePreviewProps {
  isDark: boolean
  buildTarget: string
  projectName: string
  getHtml: () => string
  vfsFiles: Record<string, string>
  isLoggedIn: boolean
}

interface PhoneResult { url: string; qr: string; kind: 'web' | 'app' }

export function PhonePreview({ isDark, buildTarget, projectName, getHtml, vfsFiles, isLoggedIn }: PhonePreviewProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PhoneResult | null>(null)
  const [copied, setCopied] = useState(false)
  const reqIdRef = useRef(0)

  const isApp = buildTarget !== 'website'

  const mint = async () => {
    const myReq = ++reqIdRef.current
    setLoading(true); setError(null); setResult(null); setCopied(false)
    try {
      let url: string
      let qrTarget: string
      let kind: 'web' | 'app'

      if (!isApp) {
        const html = getHtml()
        if (!html.trim()) { setError('Build something first, then try it on your phone.'); return }
        const r = await fetch('/api/preview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, name: projectName }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Could not create a phone link')
        url = d.url; qrTarget = d.url; kind = 'web'
      } else {
        if (!isLoggedIn) { setError('__signin__'); return }
        if (!vfsFiles || Object.keys(vfsFiles).length === 0) { setError('Build the app first, then try it on your phone.'); return }
        const r = await fetch('/api/builder/snack', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: vfsFiles, name: projectName }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Could not publish to Expo Snack')
        url = d.url
        // Expo Go opens the exp:// deep link directly when scanned.
        qrTarget = d.expoGoUrl || d.url; kind = 'app'
      }

      const qr = await QRCode.toDataURL(qrTarget, { width: 240, margin: 1 })
      if (myReq === reqIdRef.current) setResult({ url, qr, kind })
    } catch (e: any) {
      if (myReq === reqIdRef.current) setError(e?.message || 'Could not create a phone link')
    } finally {
      if (myReq === reqIdRef.current) setLoading(false)
    }
  }

  // Mint fresh each time the popover opens.
  useEffect(() => {
    if (open) void mint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const copy = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(result.url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Try it on your phone"
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-all',
          open
            ? 'bg-violet-500/20 text-violet-300'
            : isDark ? 'bg-white/[0.03] border border-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                     : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200',
        )}
      >
        <Smartphone className="w-4 h-4" />
        <span className="hidden sm:inline">Phone</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute top-full right-0 mt-2 z-50 w-72 rounded-xl border shadow-2xl p-4',
              isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200',
            )}
          >
            <div className={cn('text-sm font-semibold mb-1', isDark ? 'text-white' : 'text-slate-900')}>
              Try it on your phone
            </div>
            <p className={cn('text-[11px] mb-3', isDark ? 'text-zinc-400' : 'text-slate-500')}>
              {isApp
                ? 'Runs your app on your phone through the free Expo Go app.'
                : 'Opens this exact build on your phone — point your camera at the code.'}
            </p>

            {loading && (
              <div className={cn('flex flex-col items-center justify-center gap-2 h-48', isDark ? 'text-zinc-400' : 'text-slate-500')}>
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                <span className="text-xs">{isApp ? 'Publishing to Expo…' : 'Creating phone link…'}</span>
              </div>
            )}

            {!loading && error === '__signin__' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className={cn('text-xs', isDark ? 'text-zinc-300' : 'text-slate-600')}>
                  Running an app on your phone needs a free account (we publish it to Expo for you).
                </p>
                <a href="/signup" className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-medium transition">
                  Sign up free
                </a>
              </div>
            )}

            {!loading && error && error !== '__signin__' && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <p className={cn('text-xs', isDark ? 'text-red-300' : 'text-red-600')}>{error}</p>
                <button onClick={() => void mint()} className={cn('text-xs underline', isDark ? 'text-zinc-400' : 'text-slate-500')}>Try again</button>
              </div>
            )}

            {!loading && !error && result && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-2 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.qr} alt="QR code" className="w-40 h-40" />
                </div>
                <div className="flex items-center gap-1.5 w-full">
                  <code className={cn('flex-1 min-w-0 truncate text-[10px] px-2 py-1.5 rounded-md', isDark ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500')}>
                    {result.url.replace(/^https?:\/\//, '')}
                  </code>
                  <button onClick={copy} title="Copy link"
                    className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition', isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a href={result.url} target="_blank" rel="noopener noreferrer" title="Open"
                    className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition', isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className={cn('text-[10px] text-center', isDark ? 'text-zinc-500' : 'text-slate-400')}>
                  {isApp
                    ? 'Open Expo Go on your phone and scan this.'
                    : 'Re-open this after edits to refresh the phone view.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
