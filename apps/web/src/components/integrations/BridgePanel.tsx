'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChefHat, Check, Copy, Loader2, Power, AlertCircle, RefreshCw } from 'lucide-react'

interface BridgeStatus {
  connected: boolean
  lastSeenAt?: string
  bridgeId?: string
  hostname?: string
  bridgeVersion?: string
  inFlightRequests: number
}

interface PairingCode {
  code: string
  expiresAt: number
  serverUrl: string
}

type Platform = 'mac' | 'windows' | 'linux'

const PROD_URL = 'https://webstew.net'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'mac'
  const p = navigator.platform.toLowerCase()
  const ua = navigator.userAgent.toLowerCase()
  if (p.includes('win') || ua.includes('windows')) return 'windows'
  if (p.includes('linux') && !ua.includes('android')) return 'linux'
  return 'mac'
}

function buildCommand(token: string | null, serverUrl: string, platform: Platform): string {
  const tok = token ?? '<TOKEN>'
  const needsOverride = serverUrl && serverUrl !== PROD_URL
  const base = needsOverride
    ? `WEBSTEW_SERVER_URL=${serverUrl} npx @webstew/bridge connect ${tok}`
    : `npx @webstew/bridge connect ${tok}`
  if (platform === 'windows' && needsOverride) {
    return `$env:WEBSTEW_SERVER_URL="${serverUrl}"; npx @webstew/bridge connect ${tok}`
  }
  return base
}

function buildResumeCommand(serverUrl?: string, platform: Platform = 'mac'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : PROD_URL
  const url = serverUrl || origin
  if (url === PROD_URL) return 'npx @webstew/bridge connect'
  if (platform === 'windows') return `$env:WEBSTEW_SERVER_URL="${url}"; npx @webstew/bridge connect`
  return `WEBSTEW_SERVER_URL=${url} npx @webstew/bridge connect`
}

// Code block — always dark bg so it's readable in both light and dark mode
function CodeBlock({ command, copyKey, copied, onCopy }: {
  command: string
  copyKey: string
  copied: string | null
  onCopy: (text: string, key: string) => void
}) {
  const isCopied = copied === copyKey
  return (
    <div className="rounded-lg overflow-hidden border border-slate-700" style={{ background: '#1e1e2e' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]" style={{ background: '#16161e' }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <button
          onClick={() => onCopy(command, copyKey)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
          style={{
            background: isCopied ? 'rgba(40, 200, 64, 0.2)' : 'rgba(255,255,255,0.08)',
            color: isCopied ? '#28c840' : '#a0a0b0',
          }}
        >
          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="px-4 py-3 overflow-x-auto">
        <code className="text-sm font-mono whitespace-nowrap select-all" style={{ color: '#cdd6f4' }}>
          {command}
        </code>
      </div>
    </div>
  )
}

export function BridgePanel() {
  const [status, setStatus] = useState<BridgeStatus | null>(null)
  const [pairing, setPairing] = useState<PairingCode | null>(null)
  const [loadingPairing, setLoadingPairing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('mac')
  const hasAutoFetched = useRef(false)

  const isPaired = !!status?.bridgeId
  const isConnected = !!status?.connected

  useEffect(() => {
    setPlatform(detectPlatform())
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bridge/status', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json() as BridgeStatus
      setStatus(data)
      if (data.connected && pairing) setPairing(null)
    } catch {}
  }, [pairing])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, pairing ? 2000 : 5000)
    return () => clearInterval(interval)
  }, [fetchStatus, pairing])

  const generateToken = useCallback(async () => {
    if (loadingPairing) return
    setPairing(null)
    setLoadingPairing(true)
    setError(null)
    try {
      const res = await fetch('/api/bridge/pair-init', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json() as { code: string; expiresInSec: number; serverUrl: string }
      setPairing({ code: data.code, expiresAt: Date.now() + data.expiresInSec * 1000, serverUrl: data.serverUrl })
    } catch (e: any) {
      setError(e?.message || 'Failed to generate token')
    } finally {
      setLoadingPairing(false)
    }
  }, [loadingPairing])

  // Auto-generate on first load when unpaired
  useEffect(() => {
    if (hasAutoFetched.current) return
    if (status !== null && !isPaired && !pairing) {
      hasAutoFetched.current = true
      generateToken()
    }
  }, [status, isPaired, pairing, generateToken])

  const disconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await fetch('/api/bridge/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeId: status?.bridgeId }),
      })
      setStatus({ connected: false, inFlightRequests: 0 })
      setPairing(null)
      hasAutoFetched.current = false
    } catch (e: any) {
      setError(e?.message || 'Failed to disconnect')
    } finally {
      setBusy(false)
    }
  }

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  const serverUrl = pairing?.serverUrl ?? PROD_URL
  const connectCmd = buildCommand(pairing?.code ?? null, serverUrl, platform)
  const resumeCmd = buildResumeCommand(undefined, platform)

  const PLATFORMS: { id: Platform; label: string }[] = [
    { id: 'mac', label: 'macOS' },
    { id: 'windows', label: 'Windows' },
    { id: 'linux', label: 'Linux' },
  ]

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.06] to-amber-500/[0.04] p-5 mb-8">

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
          <ChefHat className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Local Bridge</h2>
            <StatusBadge connected={isConnected} paired={isPaired} />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Run workspace AI on your Claude Code subscription — zero Webstew credits.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── CONNECTED ── */}
      {isConnected && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Machine" value={status?.hostname || 'unknown'} />
            <StatBox label="Version" value={status?.bridgeVersion || '—'} />
            <StatBox label="In flight" value={String(status?.inFlightRequests ?? 0)} />
          </div>
          <button onClick={disconnect} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50">
            <Power className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      )}

      {/* ── OFFLINE ── */}
      {!isConnected && isPaired && (
        <div className="space-y-3">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Bridge offline — run to reconnect (no new token needed):
          </p>

          {/* Platform tabs */}
          <PlatformTabs platform={platform} onChange={setPlatform} />

          <CodeBlock
            command={resumeCmd}
            copyKey="resume"
            copied={copied}
            onCopy={copyText}
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => { hasAutoFetched.current = false; generateToken() }}
              disabled={loadingPairing}
              className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline transition disabled:opacity-50"
            >
              Generate new token instead
            </button>
            <button onClick={disconnect} disabled={busy}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition disabled:opacity-50">
              <Power className="w-3 h-3" />
              Forget
            </button>
          </div>

          {pairing && (
            <div className="pt-1 space-y-1.5">
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">New token command:</p>
              <CodeBlock command={buildCommand(pairing.code, pairing.serverUrl, platform)} copyKey="new" copied={copied} onCopy={copyText} />
            </div>
          )}
        </div>
      )}

      {/* ── UNPAIRED ── */}
      {!isConnected && !isPaired && (
        <div className="space-y-4">

          {/* Platform selector */}
          <PlatformTabs platform={platform} onChange={setPlatform} />

          {/* Command */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Command</span>
              {platform === 'windows' && (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Run in PowerShell</span>
              )}
            </div>
            <CodeBlock
              command={connectCmd}
              copyKey="connect"
              copied={copied}
              onCopy={copyText}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
            <span className="text-[10px] text-slate-400 dark:text-zinc-600 uppercase tracking-wider">Token</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
          </div>

          {/* Token box */}
          <div className="space-y-2">
            {loadingPairing ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                Generating…
              </div>
            ) : pairing ? (
              <div className="space-y-2">
                {/* Token display */}
                <div className="rounded-lg overflow-hidden border border-slate-700" style={{ background: '#1e1e2e' }}>
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]" style={{ background: '#16161e' }}>
                    <span className="text-[10px] font-mono" style={{ color: '#6c7086' }}>token · expires in {Math.max(0, Math.floor((pairing.expiresAt - Date.now()) / 60_000))}m</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={generateToken}
                        disabled={loadingPairing}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#6c7086' }}
                        title="Regenerate token"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        New
                      </button>
                      <button
                        onClick={() => copyText(pairing.code, 'token')}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition"
                        style={{
                          background: copied === 'token' ? 'rgba(40,200,64,0.2)' : 'rgba(255,255,255,0.08)',
                          color: copied === 'token' ? '#28c840' : '#a0a0b0',
                        }}
                      >
                        {copied === 'token' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        {copied === 'token' ? 'Copied' : 'Copy token'}
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <code className="text-sm font-mono select-all" style={{ color: '#f38ba8' }}>
                      {pairing.code}
                    </code>
                  </div>
                </div>

                {/* Waiting */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin text-orange-500 shrink-0" />
                  Waiting for connection — panel turns green automatically.
                </div>
              </div>
            ) : (
              <button
                onClick={generateToken}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition shadow-md"
                style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}
              >
                Generate token
              </button>
            )}
          </div>

          {/* Prereqs */}
          <p className="text-[10px] text-slate-400 dark:text-zinc-600">
            Requires{' '}
            <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="underline hover:text-slate-600 dark:hover:text-zinc-400">Node.js 18+</a>
            {' and '}
            <a href="https://claude.ai/download" target="_blank" rel="noreferrer" className="underline hover:text-slate-600 dark:hover:text-zinc-400">Claude Code</a>
          </p>
        </div>
      )}
    </div>
  )
}

function PlatformTabs({ platform, onChange }: { platform: Platform; onChange: (p: Platform) => void }) {
  const tabs: { id: Platform; label: string }[] = [
    { id: 'mac', label: 'macOS' },
    { id: 'windows', label: 'Windows' },
    { id: 'linux', label: 'Linux' },
  ]
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] w-fit">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-3 py-1 rounded-md text-xs font-medium transition-all"
          style={platform === t.id ? {
            background: 'white',
            color: '#0f172a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          } : {
            color: platform === t.id ? '#0f172a' : undefined,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function StatusBadge({ connected, paired }: { connected: boolean; paired: boolean }) {
  if (connected) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Connected
    </span>
  )
  if (paired) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Offline
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10">
      Not connected
    </span>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold mb-0.5">{label}</div>
      <div className="text-xs text-slate-800 dark:text-slate-200 font-mono truncate">{value}</div>
    </div>
  )
}
