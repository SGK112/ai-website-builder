'use client'

// BridgePanel — onboarding + status for the local @webstew/bridge.
//
// States:
//   unpaired   → step-by-step setup flow, pairing code auto-generated on mount
//   offline    → paired but process not running; shows reconnect command
//   connected  → green status with hostname/version/in-flight count
//
// The pairing code is generated automatically so the user never has to
// click "get code" before they can copy the command. The downloadable
// setup script bundles Node.js check + install + connect in one file.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChefHat, Check, Copy, Loader2, Power, Terminal, Download, AlertCircle, ExternalLink } from 'lucide-react'

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

const PROD_URL = 'https://webstew.net'

function buildConnectCommand(code: string, serverUrl: string): string {
  const needsOverride = serverUrl && serverUrl !== PROD_URL
  return needsOverride
    ? `WEBSTEW_SERVER_URL=${serverUrl} npx @webstew/bridge connect ${code}`
    : `npx @webstew/bridge connect ${code}`
}

function buildResumeCommand(serverUrl?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : PROD_URL
  const url = serverUrl || origin
  return url !== PROD_URL
    ? `WEBSTEW_SERVER_URL=${url} npx @webstew/bridge connect`
    : 'npx @webstew/bridge connect'
}

function downloadScript(command: string): void {
  const isWindows = typeof navigator !== 'undefined' && /win/i.test(navigator.platform)
  let content: string
  let filename: string
  let type: string

  if (isWindows) {
    content = [
      '@echo off',
      'echo Webstew Chef Setup',
      'echo.',
      'node --version >nul 2>&1 || (echo Node.js not found. Download at https://nodejs.org && pause && exit /b 1)',
      `echo Running: ${command}`,
      command,
      'echo.',
      'echo Chef is running! Keep this window open.',
      'pause',
    ].join('\r\n')
    filename = 'webstew-bridge-connect.bat'
    type = 'text/plain'
  } else {
    content = [
      '#!/bin/sh',
      'echo "Webstew Chef Setup"',
      'echo ""',
      'if ! command -v node >/dev/null 2>&1; then',
      '  echo "Node.js not found. Download at https://nodejs.org"',
      '  exit 1',
      'fi',
      `echo "Running: ${command}"`,
      command,
    ].join('\n')
    filename = 'webstew-bridge-connect.sh'
    type = 'text/x-sh'
  }

  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function BridgePanel() {
  const [status, setStatus] = useState<BridgeStatus | null>(null)
  const [pairing, setPairing] = useState<PairingCode | null>(null)
  const [loadingPairing, setLoadingPairing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasAutoFetched = useRef(false)

  const isPaired = !!status?.bridgeId
  const isConnected = !!status?.connected

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bridge/status', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json() as BridgeStatus
      setStatus(data)
      if (data.connected && pairing) setPairing(null)
    } catch {}
  }, [pairing])

  // Auto-generate pairing code on mount for unpaired users so the command
  // is ready to copy immediately — no extra click needed.
  const initPairing = useCallback(async () => {
    if (loadingPairing || pairing) return
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
      setError(e?.message || 'Failed to generate pairing code')
    } finally {
      setLoadingPairing(false)
    }
  }, [loadingPairing, pairing])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, pairing ? 2000 : 5000)
    intervalRef.current = interval
    return () => clearInterval(interval)
  }, [fetchStatus, pairing])

  // Auto-init pairing when status loads and user is unpaired.
  useEffect(() => {
    if (hasAutoFetched.current) return
    if (status !== null && !isPaired && !pairing) {
      hasAutoFetched.current = true
      initPairing()
    }
  }, [status, isPaired, pairing, initPairing])

  const disconnect = async () => {
    setBusy(true); setError(null)
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

  const connectCmd = pairing ? buildConnectCommand(pairing.code, pairing.serverUrl) : ''
  const resumeCmd = buildResumeCommand()

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.06] to-amber-500/[0.04] p-5 mb-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Local Bridge</h2>
            <StatusBadge connected={isConnected} paired={isPaired} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Run AI on your own Claude Code subscription — no Webstew credits used.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── CONNECTED ── */}
      {isConnected && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Field label="Machine" value={status?.hostname || 'unknown'} />
            <Field label="Version" value={status?.bridgeVersion || '—'} />
            <Field label="In flight" value={String(status?.inFlightRequests ?? 0)} />
          </div>
          <p className="text-[11px] text-zinc-500">
            Every workspace chat now runs on your Claude Pro/Max subscription. Credits stay on the shelf.
          </p>
          <div className="flex items-center gap-2">
            <button onClick={disconnect} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium transition disabled:opacity-60">
              <Power className="w-3 h-3" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* ── OFFLINE (was paired, process not running) ── */}
      {!isConnected && isPaired && (
        <div className="space-y-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Your chef is off shift. Run this in your terminal to bring them back — no new code needed:
          </p>
          <CommandBlock
            command={resumeCmd}
            copied={copied === 'resume'}
            onCopy={() => copyText(resumeCmd, 'resume')}
            onDownload={() => downloadScript(resumeCmd)}
          />
          <button onClick={() => { hasAutoFetched.current = false; initPairing() }} disabled={loadingPairing}
            className="text-xs text-orange-500 hover:text-orange-400 transition underline underline-offset-2">
            {loadingPairing ? 'Generating…' : 'Generate a new pairing code instead'}
          </button>
          {pairing && (
            <div className="pt-1">
              <p className="text-[11px] text-zinc-500 mb-2">New pairing command:</p>
              <CommandBlock
                command={connectCmd}
                copied={copied === 'new'}
                onCopy={() => copyText(connectCmd, 'new')}
                onDownload={() => downloadScript(connectCmd)}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={disconnect} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium transition disabled:opacity-60">
              <Power className="w-3 h-3" />
              Forget this bridge
            </button>
          </div>
        </div>
      )}

      {/* ── UNPAIRED (first-time setup) ── */}
      {!isConnected && !isPaired && (
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <StepDot n={1} done={false} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white mb-1">
                Install Claude Code{' '}
                <span className="font-normal text-zinc-400">(free, needs Pro/Max subscription)</span>
              </p>
              <a href="https://claude.ai/download" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 transition">
                <ExternalLink className="w-3 h-3" />
                Download Claude Code → claude.ai/download
              </a>
              <p className="text-[11px] text-zinc-500 mt-1">
                Already installed? Skip to step 2. Also requires{' '}
                <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="underline">Node.js 18+</a>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <StepDot n={2} done={false} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white mb-2">
                Run this command in your terminal
              </p>
              {loadingPairing ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating your connection key…
                </div>
              ) : pairing ? (
                <div className="space-y-2">
                  <CommandBlock
                    command={connectCmd}
                    copied={copied === 'connect'}
                    onCopy={() => copyText(connectCmd, 'connect')}
                    onDownload={() => downloadScript(connectCmd)}
                  />
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                    Waiting for chef to clock in…
                    <span className="ml-auto tabular-nums">
                      Key expires in {Math.max(0, Math.floor((pairing.expiresAt - Date.now()) / 60_000))}m
                    </span>
                  </div>
                  <button onClick={initPairing} disabled={loadingPairing}
                    className="text-[11px] text-zinc-500 hover:text-white underline underline-offset-2 transition">
                    Refresh key
                  </button>
                </div>
              ) : (
                <button onClick={initPairing} disabled={loadingPairing}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-xs font-medium transition">
                  <Terminal className="w-3.5 h-3.5" />
                  Generate connection key
                </button>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 opacity-50">
            <StepDot n={3} done={false} />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">Come back here</p>
              <p className="text-[11px] text-zinc-500">This panel will turn green automatically once connected.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CommandBlock({
  command, copied, onCopy, onDownload,
}: {
  command: string
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  return (
    <div className="rounded-xl bg-black/60 border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/60" />
          <span className="w-2 h-2 rounded-full bg-amber-500/60" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">Terminal</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onDownload} title="Download as script file"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] transition">
            <Download className="w-2.5 h-2.5" />
            .sh / .bat
          </button>
          <button onClick={onCopy} title="Copy to clipboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[10px] font-medium transition">
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="px-3 py-3 overflow-x-auto">
        <code className="text-sm font-mono text-orange-300 whitespace-nowrap select-all">{command}</code>
      </div>
    </div>
  )
}

function StepDot({ n }: { n: number; done: boolean }) {
  return (
    <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-[10px] font-bold text-orange-400">{n}</span>
    </div>
  )
}

function StatusBadge({ connected, paired }: { connected: boolean; paired: boolean }) {
  if (connected) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Connected
    </span>
  )
  if (paired) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Offline
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-zinc-500 border border-white/10">
      Not connected
    </span>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">{label}</div>
      <div className="text-xs text-slate-200 font-mono truncate">{value}</div>
    </div>
  )
}
