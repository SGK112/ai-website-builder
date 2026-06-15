'use client'

// HtmlPreview — preview for the `website` target (single-page static HTML).
// No WebContainer needed — just iframe srcDoc, instant render.
//
// Same toolbar layout as WebContainerPreview (desktop/tablet/mobile size
// switcher, refresh) so the user experience is consistent across targets.
// Sandbox tightened to drop allow-same-origin → prompt-injected HTML can't
// read the parent origin's localStorage.

import { useMemo, useRef, useState } from 'react'
import {
  RefreshCw, ExternalLink, Monitor, Tablet, Smartphone, Code2, Eye,
} from 'lucide-react'

interface Props {
  // For the website target there will be one entry — 'index.html' — but we
  // accept the whole VFS in case future multi-page HTML projects need this.
  files: Record<string, string>
}

const PREVIEW_SIZES = {
  desktop: { label: 'Desktop', icon: Monitor,    width: '100%',  maxWidth: 'none' },
  tablet:  { label: 'Tablet',  icon: Tablet,     width: '768px', maxWidth: '768px' },
  mobile:  { label: 'Mobile',  icon: Smartphone, width: '390px', maxWidth: '390px' },
} as const

type PreviewSize = keyof typeof PREVIEW_SIZES

export function HtmlPreview({ files }: Props) {
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop')
  const [bumpKey, setBumpKey] = useState(0)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Pick the main HTML file. Prefer index.html; fall back to the first .html.
  const html = useMemo(() => {
    if (files['index.html']) return files['index.html']
    const firstHtml = Object.keys(files).find((p) => p.endsWith('.html'))
    return firstHtml ? files[firstHtml] : ''
  }, [files])

  const sizeCfg = PREVIEW_SIZES[previewSize]
  const SizeIcon = sizeCfg.icon

  // Open in new tab — turn the HTML into a blob URL so the user gets a real
  // full-window preview (useful for sharing, screen-sharing, dev-tools).
  const openInNewTab = () => {
    setPopupBlocked(false)
    try {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank', 'noopener')
      // window.open returns null when a popup blocker silently blocks it —
      // tell the user instead of failing invisibly.
      if (!win) {
        setPopupBlocked(true)
        URL.revokeObjectURL(url)
        return
      }
      // Don't immediately revoke — the new tab needs to fetch.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setPopupBlocked(true)
    }
  }

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2 rounded-full bg-emerald-400">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
          <span className="font-mono text-slate-300">Live</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-[10px] text-slate-500">{(html?.length || 0).toLocaleString()} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
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
          <button
            onClick={() => setBumpKey((k) => k + 1)}
            title="Refresh"
            aria-label="Refresh preview"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={openInNewTab}
            title="Open in new tab"
            aria-label="Open preview in new tab"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {popupBlocked && (
        <div role="alert" className="px-4 py-2 text-xs text-amber-300 bg-amber-500/10 border-b border-amber-500/20">
          Your browser blocked the popup. Allow popups for this site to open the preview in a new tab.
        </div>
      )}

      {/* Iframe stage */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-4 overflow-hidden">
        {html ? (
          <div
            className="bg-white rounded-lg shadow-2xl shadow-violet-500/10 overflow-hidden transition-all duration-300 h-full"
            style={{ width: sizeCfg.width, maxWidth: sizeCfg.maxWidth }}
          >
            <iframe
              key={bumpKey}
              ref={iframeRef}
              srcDoc={html}
              className="w-full h-full border-0"
              title="Live preview"
              // Drop allow-same-origin to keep prompt-injected HTML from reading
              // the parent origin's localStorage. The generated site doesn't
              // need same-origin to function.
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
            />
          </div>
        ) : (
          <div className="text-slate-500 text-sm">No HTML to preview yet.</div>
        )}
      </div>
    </div>
  )
}
