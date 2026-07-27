'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check, ChevronDown, Copy, ExternalLink, Loader2,
  QrCode, Share2, X, FileText, Eye,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useModalA11y } from '@/hooks/useModalA11y'

interface Props {
  open: boolean
  onClose: () => void
  html: string
  projectName: string
  isDark?: boolean
  userEmail?: string
}

type ShareType = 'preview' | 'proposal'
type TTL = 7 | 30 | 60 | 90

export function ShareProposalModal({ open, onClose, html, projectName, isDark = true, userEmail }: Props) {
  const [shareType, setShareType] = useState<ShareType>('proposal')
  const [ttl, setTtl] = useState<TTL>(90)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const panelRef = useModalA11y<HTMLDivElement>(open, onClose)

  // Reset when re-opened for a different project
  useEffect(() => {
    if (open) { setResult(null); setQrDataUrl(null); setError(null) }
  }, [open, html])

  async function generate() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          name: projectName,
          type: shareType,
          ttlDays: ttl,
          ownerEmail: userEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult({ url: data.url, expiresAt: data.expiresAt })
      // Generate QR
      const qr = await QRCode.toDataURL(data.url, {
        width: 280,
        margin: 2,
        color: { dark: isDark ? '#ffffff' : '#1a1a2e', light: isDark ? '#18181b' : '#ffffff' },
      })
      setQrDataUrl(qr)
    } catch (e: any) {
      setError(e?.message || 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!result) return
    await navigator.clipboard.writeText(result.url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQr() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    a.click()
  }

  if (!open) return null

  const expireLabel = result
    ? new Date(result.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-proposal-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[85dvh] rounded-2xl border shadow-2xl flex flex-col overflow-y-auto ${
          isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-3.5 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Share2 className={`w-4.5 h-4.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
            <span id="share-proposal-title" className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Share</span>
          </div>
          <button onClick={onClose} aria-label="Close" className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type selector */}
          {!result && (
            <>
              <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-100 border-slate-200'}`}>
                {([
                  { id: 'proposal', icon: FileText, label: 'Proposal', sub: 'Accept button + view tracking' },
                  { id: 'preview', icon: Eye, label: 'Preview', sub: 'View only, 7 days' },
                ] as const).map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => { setShareType(id); if (id === 'preview') setTtl(7) }}
                    className={`flex flex-col items-start gap-0.5 p-3 rounded-lg text-left transition-all ${
                      shareType === id
                        ? isDark ? 'bg-violet-500/20 border border-violet-500/30 text-white' : 'bg-white border border-violet-300 shadow-sm text-violet-900'
                        : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <span className="text-[10px] opacity-70">{sub}</span>
                  </button>
                ))}
              </div>

              {shareType === 'proposal' && (
                <div>
                  <div className={`text-[10px] mb-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Link expires in</div>
                  <div className="flex gap-1.5">
                    {([30, 60, 90] as TTL[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setTtl(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          ttl === d
                            ? isDark ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-violet-100 border-violet-300 text-violet-700'
                            : isDark ? 'border-white/[0.06] text-zinc-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                {loading ? 'Creating link…' : `Generate ${shareType === 'proposal' ? 'Proposal' : 'Preview'} Link`}
              </button>
            </>
          )}

          {/* Result */}
          {result && (
            <>
              {/* QR */}
              {qrDataUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img src={qrDataUrl} alt="QR code" className="w-44 h-44 rounded-xl" />
                  <button
                    onClick={downloadQr}
                    className={`text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <ChevronDown className="w-3 h-3" /> Download QR
                  </button>
                </div>
              )}

              {/* URL copy */}
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`flex-1 text-xs truncate font-mono ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {result.url.replace(/^https?:\/\//, '')}
                </span>
                <button
                  onClick={copy}
                  className={`shrink-0 p-1.5 rounded-lg transition-all ${
                    copied
                      ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'
                  }`}
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`shrink-0 p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'}`}
                  title="Open link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Meta */}
              <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                <span>
                  {shareType === 'proposal' ? '📋 Proposal' : '👁 Preview'} · expires {expireLabel}
                </span>
                <button
                  onClick={() => { setResult(null); setQrDataUrl(null) }}
                  className={isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}
                >
                  New link
                </button>
              </div>

              {shareType === 'proposal' && (
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Client can click <strong>Accept Proposal</strong> on the page — you'll get an email when they do.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
